#!/usr/bin/env node
/*
  Upload PDFs to MinIO and create Mongo documents using the Mongo _id as objectKey prefix.

  Usage example:

  MINIO_ENDPOINT=185.149.192.130 MINIO_PORT=9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin \
  MONGO_URI="mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin" \
  BUCKET=assistant-aggregator FILE_DIR="./General_Law_PDFs" node scripts/upload-pdfs-to-minio.js

  Behavior:
  - For each .pdf in FILE_DIR:
    1. Compute checksum and basic metadata
    2. Insert a Mongo document (minimal) to obtain _id
    3. Build objectKey: `${documentId}/${safeFilename}`
    4. Upload file to MinIO at that objectKey
    5. Verify upload and update Mongo document with objectKey, fileUrl, size, checksum, uploadStatus
    6. On failure, mark document uploadStatus='failed' and store error

  Notes:
  - The script stores both `objectKey` and `fileUrl` in Mongo. If bucket is private, use `objectKey`+presigned URL generation later.
  - The script is idempotent in that it looks for existing documents by checksum and will skip re-uploading if found (configurable).
*/

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
  FILE_DIR = './General_Law_PDFs',
  MONGO_URI = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin',
  SKIP_IF_CHECKSUM_EXISTS = 'true', // set to 'false' to always upload
} = process.env;

const useSSL = String(MINIO_USE_SSL).toLowerCase() === 'true';

function safeFilename(name) {
  return String(name).replace(/\s+/g, '_');
}

function buildPublicUrl(endpoint, port, bucket, objectKey) {
  const segments = objectKey.split('/').map(seg => encodeURIComponent(seg));
  return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${encodeURIComponent(bucket)}/${segments.join('/')}`;
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(filePath);
    rs.on('error', reject);
    rs.on('data', chunk => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}

async function ensureBucket(minioClient, bucket) {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
      console.log(`Created bucket: ${bucket}`);
    }
  } catch (err) {
    // bucketExists throws on some clients if unreachable - rethrow
    throw err;
  }
}

(async () => {
  const minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: Number(MINIO_PORT),
    useSSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });

  const mongo = new MongoClient(MONGO_URI, { useUnifiedTopology: true });

  try {
    await mongo.connect();
    const db = mongo.db();
    const docs = db.collection('documents');

    // Prepare directory
    const dir = path.resolve(FILE_DIR);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      console.error(`FILE_DIR not found or not a directory: ${dir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(dir).filter(f => path.extname(f).toLowerCase() === '.pdf');
    console.log(`Found ${files.length} PDF(s) in ${dir}`);

    // Ensure bucket
    await ensureBucket(minioClient, BUCKET);

    for (const filename of files) {
      const filePath = path.join(dir, filename);
      try {
        const stats = fs.statSync(filePath);
        const size = stats.size;
        const extension = path.extname(filename).slice(1).toLowerCase();
        const mimeType = mime.lookup(filename) || 'application/pdf';

        // compute checksum
        const checksum = await sha256File(filePath);

        // If configured, skip if checksum exists
        if (SKIP_IF_CHECKSUM_EXISTS === 'true') {
          const existing = await docs.findOne({ checksum });
          if (existing) {
            console.log(`Skipping ${filename} - checksum already exists in DB (_id=${existing._id})`);
            continue;
          }
        }

        // Insert placeholder doc to get an _id
        const placeholder = {
          filename,
          extension,
          mimeType,
          size,
          checksum,
          isPageDocument: false,
          ocrStatus: 'pending',
          uploadStatus: 'uploading',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertRes = await docs.insertOne(placeholder);
        const docId = insertRes.insertedId;
        console.log(`Created DB record ${docId} for ${filename}`);

        // Build objectKey using document id as prefix
        const objectKey = `${docId.toString()}/${safeFilename(filename)}`;

        // Upload
        console.log(`Uploading ${filename} -> ${BUCKET}/${objectKey}`);
        await new Promise((resolve, reject) => {
          minioClient.fPutObject(BUCKET, objectKey, filePath, { 'Content-Type': mimeType }, (err, etag) => {
            if (err) return reject(err);
            resolve(etag);
          });
        });

        // Verify by stat
        const stat = await minioClient.statObject(BUCKET, objectKey);

        // Build fileUrl (encoded)
        const fileUrl = buildPublicUrl(MINIO_ENDPOINT, MINIO_PORT, BUCKET, objectKey);

        // Update document with final metadata
        const update = {
          $set: {
            objectKey,
            fileUrl,
            size,
            checksum,
            mimeType,
            uploadStatus: 'uploaded',
            updatedAt: new Date(),
          }
        };

        await docs.updateOne({ _id: docId }, update);
        console.log(`Uploaded and updated DB for ${filename} (objectKey=${objectKey})`);

      } catch (err) {
        console.error(`Error processing ${filename}: ${err.message}`);
        // mark failed if we have a checksum match or a partial doc
        try {
          // try to find document by checksum
          const existing = await docs.findOne({ checksum });
          if (existing) {
            await docs.updateOne({ _id: existing._id }, { $set: { uploadStatus: 'failed', uploadError: err.message, updatedAt: new Date() } });
            console.log(`Marked DB record ${existing._id} as failed`);
          }
        } catch (uerr) {
          console.error(`Failed to mark failed status in DB: ${uerr.message}`);
        }
      }
    }

    console.log('Finished processing files.');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exitCode = 1;
  } finally {
    await mongo.close().catch(() => {});
  }
})();
