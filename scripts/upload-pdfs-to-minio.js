const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Minio = require('minio');
const { MongoClient, ObjectId } = require('mongodb');
const mime = require('mime-types');

const {
  MINIO_ENDPOINT = '185.149.192.130',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false',
  MINIO_ACCESS_KEY = 'minioadmin',
  MINIO_SECRET_KEY = 'minioadmin123',
  BUCKET = 'assistant-aggregator',
  FILE_DIR = '../files/Vezarat_olom_PDFs',
  MONGODB_URI = 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin',
  ID_MAP_PATH = path.resolve('../files/vezarat-documents-export.json'),
  EXPORT_OUTPUT_PATH = path.resolve('../files/vezarat-documents-export.json'),
} = process.env;

const useSSL = String(MINIO_USE_SSL).toLowerCase() === 'true';

function safeFilename(name) {
  return String(name)
    .normalize('NFC')
    .replace(/[?#%<>*|":\\]+/g, '_')
    .replace(/\s+/g, '_')
    .trim();
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function buildPublicUrl(endpoint, port, bucket, objectKey) {
  return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${bucket}/${objectKey}`;
}

async function ensureBucket(client, bucket) {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, 'us-east-1');
    console.log(`✅ Created bucket: ${bucket}`);
  }
}

(async () => {
  // 🔹 Load ID map
  if (!fs.existsSync(ID_MAP_PATH)) {
    console.error(`❌ ID map file not found: ${ID_MAP_PATH}`);
    process.exit(1);
  }
  const idMap = JSON.parse(fs.readFileSync(ID_MAP_PATH, 'utf8'));
  
  const minio = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: parseInt(MINIO_PORT, 10),
    useSSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });

  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db();
  const docs = db.collection('documents');

  const dir = path.resolve(FILE_DIR);
  if (!fs.existsSync(dir)) {
    console.error(`❌ File directory not found: ${dir}`);
    process.exit(1);
  }

  await ensureBucket(minio, BUCKET);
  
  const exportData = [];
  const idMapByFilename = new Map(idMap.map(entry => [entry.filename, entry]));
  
  // 📁 Get all PDF files from directory
  const allFiles = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`\n📂 Found ${allFiles.length} PDF files in directory`);
  console.log(`📋 Found ${idMap.length} entries in ID map`);
  
  // 🔍 First, process files that are in the ID map
  let processedCount = 0;
  for (const entry of idMap) {
    const { filename, id, dataset_id } = entry;
    const filePath = path.join(dir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      continue;
    }

    const extension = path.extname(filename).slice(1).toLowerCase();
    const mimeType = mime.lookup(filename) || 'application/pdf';
    const checksum = await sha256File(filePath);

    const objectKey = `documents/${id}/${safeFilename(filename)}`;
    const fileUrl = buildPublicUrl(MINIO_ENDPOINT, MINIO_PORT, BUCKET, objectKey);

    console.log(`⬆️  Uploading ${filename} → ${objectKey}`);

    // 🗑️ Remove old file if exists
    try {
      await minio.removeObject(BUCKET, objectKey);
      console.log(`🗑️  Removed existing file: ${objectKey}`);
    } catch (err) {
      // File doesn't exist, which is fine
    }

    // ⬆️ Upload file
    await new Promise((resolve, reject) => {
      minio.fPutObject(BUCKET, objectKey, filePath, { 'Content-Type': mimeType }, err => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 💾 Upsert MongoDB document
    await docs.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          _id: new ObjectId(id),
          filename,
          extension,
          mimeType,
          checksum,
          objectKey,
          fileUrl,
          dataset: dataset_id ? new ObjectId(dataset_id) : null,
          ocrStatus: 'pending',
          uploadStatus: 'uploaded',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`✅ Uploaded ${filename} with _id=${id}`);
    processedCount++;
    
    // 📝 Add to export data
    exportData.push({
      filename,
      id,
      minioPath: `/${objectKey}`,
      dataset_id,
    });
  }
  
  // 🔍 Now, check for files NOT in the ID map
  const missingFiles = allFiles.filter(f => !idMapByFilename.has(f));
  console.log(`\n🔍 Found ${missingFiles.length} files not in ID map`);
  
  if (missingFiles.length > 0) {
    console.log('🔎 Checking if these files already exist in MongoDB...');
    const datasetId = idMap.length > 0 && idMap[0].dataset_id ? new ObjectId(idMap[0].dataset_id) : null;
    
    for (const filename of missingFiles) {
      // Check if document already exists in MongoDB by filename
      const existingDoc = await docs.findOne({ filename });
      
      let id;
      if (existingDoc) {
        // Use existing ID
        id = existingDoc._id.toString();
        console.log(`📌 Found existing MongoDB document for ${filename} with _id=${id}`);
      } else {
        // Create new document
        const newDoc = {
          filename,
          extension: path.extname(filename).slice(1).toLowerCase(),
          mimeType: mime.lookup(filename) || 'application/pdf',
          dataset: datasetId,
          ocrStatus: 'pending',
          uploadStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await docs.insertOne(newDoc);
        id = result.insertedId.toString();
        console.log(`✨ Created new MongoDB document for ${filename} with _id=${id}`);
      }
      
      // Now upload the file
      const filePath = path.join(dir, filename);
      const extension = path.extname(filename).slice(1).toLowerCase();
      const mimeType = mime.lookup(filename) || 'application/pdf';
      const checksum = await sha256File(filePath);
      const objectKey = `documents/${id}/${safeFilename(filename)}`;
      const fileUrl = buildPublicUrl(MINIO_ENDPOINT, MINIO_PORT, BUCKET, objectKey);

      console.log(`⬆️  Uploading ${filename} → ${objectKey}`);

      // 🗑️ Remove old file if exists
      try {
        await minio.removeObject(BUCKET, objectKey);
        console.log(`🗑️  Removed existing file: ${objectKey}`);
      } catch (err) {
        // File doesn't exist, which is fine
      }

      // ⬆️ Upload file
      await new Promise((resolve, reject) => {
        minio.fPutObject(BUCKET, objectKey, filePath, { 'Content-Type': mimeType }, err => {
          if (err) return reject(err);
          resolve();
        });
      });

      // 💾 Update MongoDB document
      await docs.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            filename,
            extension,
            mimeType,
            checksum,
            objectKey,
            fileUrl,
            dataset: datasetId,
            ocrStatus: 'pending',
            uploadStatus: 'uploaded',
            updatedAt: new Date(),
          },
        }
      );

      console.log(`✅ Uploaded ${filename} with _id=${id}`);
      processedCount++;
      
      // 📝 Add to export data
      exportData.push({
        filename,
        id,
        minioPath: `/${objectKey}`,
        dataset_id: datasetId ? datasetId.toString() : undefined,
      });
    }
  }

  // 💾 Export MongoDB IDs to JSON file
  const jsonOutput = JSON.stringify(exportData, null, 2);
  fs.writeFileSync(EXPORT_OUTPUT_PATH, jsonOutput);
  console.log(`\n📄 Exported ${exportData.length} document IDs to: ${EXPORT_OUTPUT_PATH}`);
  console.log(`📊 Processed ${processedCount} files total`);

  console.log('\n🏁 Finished uploading all predefined documents.');
  await mongo.close();
})();
