const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Minio = require('minio');
const { MongoClient } = require('mongodb');
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
  SKIP_IF_CHECKSUM_EXISTS = 'true',
} = process.env;

const useSSL = String(MINIO_USE_SSL).toLowerCase() === 'true';

// ✅ Normalize filenames: remove problematic chars but keep Persian letters
function safeFilename(name) {
  return String(name)
    .normalize('NFC') // normalize Unicode
    .replace(/[?#%<>*|":\\]+/g, '_') // forbidden in S3 object keys
    .replace(/\s+/g, '_')
    .trim();
}

// ✅ Do NOT encode key again when building URL
function buildPublicUrl(endpoint, port, bucket, objectKey) {
  return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${bucket}/${objectKey}`;
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

async function ensureBucket(client, bucket) {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, 'us-east-1');
    console.log(`✅ Created bucket: ${bucket}`);
  }
}

(async () => {
  const minio = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: parseInt(MINIO_PORT, 10),
    useSSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });

  const mongo = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await mongo.connect();
  const db = mongo.db();
  const docs = db.collection('documents');

  const dir = path.resolve(FILE_DIR);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`❌ FILE_DIR not found or not a directory: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => path.extname(f).toLowerCase() === '.pdf');
  console.log(`📂 Found ${files.length} PDF(s) in ${dir}`);
  if (!files.length) process.exit(0);

  await ensureBucket(minio, BUCKET);

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const extension = path.extname(filename).slice(1).toLowerCase();
    const mimeType = mime.lookup(filename) || 'application/pdf';

    try {
      const checksum = await sha256File(filePath);

      if (SKIP_IF_CHECKSUM_EXISTS === 'true') {
        const existing = await docs.findOne({ checksum });
        if (existing) {
          console.log(`⏭️ Skipping ${filename} — already exists in DB (_id=${existing._id})`);
          continue;
        }
      }

      // Insert DB record first (get _id early)
      const placeholder = {
        filename,
        extension,
        mimeType,
        checksum,
        ocrStatus: 'pending',
        uploadStatus: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { insertedId } = await docs.insertOne(placeholder);
      const objectKey = `${insertedId.toString()}/${safeFilename(filename)}`;

      console.log(`⬆️ Uploading ${filename} → ${BUCKET}/${objectKey}`);

      await new Promise((resolve, reject) => {
        minio.fPutObject(BUCKET, objectKey, filePath, { 'Content-Type': mimeType }, err => {
          if (err) return reject(err);
          resolve();
        });
      });

      const fileUrl = buildPublicUrl(MINIO_ENDPOINT, MINIO_PORT, BUCKET, objectKey);

      await docs.updateOne(
        { _id: insertedId },
        {
          $set: {
            objectKey,
            fileUrl,
            uploadStatus: 'uploaded',
            updatedAt: new Date(),
          },
        }
      );

      console.log(`✅ Uploaded ${filename} (${insertedId})`);
    } catch (err) {
      console.error(`❌ Error processing ${filename}: ${err.message}`);
      await docs.updateOne(
        { filename },
        {
          $set: {
            uploadStatus: 'failed',
            uploadError: err.message,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  console.log('🏁 Finished processing all files.');
  await mongo.close();
})();
