const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Minio = require('minio');
const { MongoClient, ObjectId } = require('mongodb');
const mime = require('mime-types');

const {
  MINIO_ENDPOINT = '127.0.0.1',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false',
  MINIO_ACCESS_KEY = 'minioadmin',
  MINIO_SECRET_KEY = 'minioadmin',
  BUCKET = 'assistant-aggregator',
  FILE_DIR = '../files/General_Law_PDFs',
  MONGO_URI = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin',
  ID_MAP_PATH = path.resolve('../files/vezarat-documents-export.json'), 
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

  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db();
  const docs = db.collection('documents');

  const dir = path.resolve(FILE_DIR);
  if (!fs.existsSync(dir)) {
    console.error(`❌ File directory not found: ${dir}`);
    process.exit(1);
  }

  await ensureBucket(minio, BUCKET);

  for (const entry of idMap) {
    const { filename, id, dataset_id } = entry;
    const filePath = path.join(dir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }

    const extension = path.extname(filename).slice(1).toLowerCase();
    const mimeType = mime.lookup(filename) || 'application/pdf';
    const checksum = await sha256File(filePath);

    const objectKey = `documents/${id}/${safeFilename(filename)}`;
    const fileUrl = buildPublicUrl(MINIO_ENDPOINT, MINIO_PORT, BUCKET, objectKey);

    console.log(`⬆️ Uploading ${filename} → ${objectKey}`);

    // 🗑️ Remove old file if exists
    try {
      await minio.removeObject(BUCKET, objectKey);
    } catch (_) {}

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
  }

  console.log('🏁 Finished uploading all predefined documents.');
  await mongo.close();
})();
