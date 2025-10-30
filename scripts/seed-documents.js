const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

/* ------------------- Configuration ------------------- */

const {
  MONGO_URI = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin',
  MINIO_ENDPOINT = '127.0.0.1',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false',
  BUCKET = 'assistant-aggregator',
} = process.env;

const useSSL = String(MINIO_USE_SSL).toLowerCase() === 'true';

const GENERAL_LAW_FILE = path.resolve(__dirname, '../files/general-law-documents-export.json');
const VEZARAT_FILE = path.resolve(__dirname, '../files/vezarat-documents-export.json');

/* ------------------- Helper Functions ------------------- */

function buildFileUrl(minioPath) {
  if (!minioPath) throw new Error('Missing minioPath for document');
  const cleanPath = minioPath.startsWith('/') ? minioPath.slice(1) : minioPath;
  const encodedSegments = cleanPath.split('/').map(seg => encodeURIComponent(seg));
  const protocol = useSSL ? 'https' : 'http';
  return `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}/${BUCKET}/${encodedSegments.join('/')}`;
}

function getExtension(filename) {
  const ext = path.extname(filename || '').toLowerCase().replace('.', '');
  return ext || 'pdf';
}

function transformDocument(docData) {
  if (!docData || !docData.id || !docData.filename || !docData.minioPath) {
    throw new Error(`Invalid document data: missing required fields (id, filename, minioPath)`);
  }

  const docId = ObjectId.isValid(docData.id) ? new ObjectId(docData.id) : null;
  const datasetId = ObjectId.isValid(docData.dataset_id) ? new ObjectId(docData.dataset_id) : undefined;

  if (!docId) {
    throw new Error(`Invalid Mongo ObjectId: ${docData.id}`);
  }

  const transformed = {
    _id: docId,
    filename: docData.filename,
    fileUrl: buildFileUrl(docData.minioPath),
    extension: getExtension(docData.filename),
    ocrStatus: 'pending',
    updatedAt: new Date(),
  };

  if (datasetId) transformed.dataset = datasetId;
  return transformed;
}

function loadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('JSON content is not an array');
    return parsed;
  } catch (err) {
    console.error(`❌ Failed to load JSON file (${filePath}): ${err.message}`);
    throw err;
  }
}

/* ------------------- Main Seeder ------------------- */

async function seedDocuments() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  console.log('✅ Connected to MongoDB');
  const db = client.db('assistant_aggregator');
  const collection = db.collection('documents');

  try {
    console.log('📂 Loading JSON export files...');
    const generalLawDocs = loadJsonFile(GENERAL_LAW_FILE);
    const vezaratDocs = loadJsonFile(VEZARAT_FILE);
    const allDocs = [...generalLawDocs, ...vezaratDocs];

    console.log(`   - General Law: ${generalLawDocs.length}`);
    console.log(`   - Vezarat: ${vezaratDocs.length}`);
    console.log(`   - Total: ${allDocs.length} documents\n`);

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const docData of allDocs) {
      try {
        const transformed = transformDocument(docData);
        const existing = await collection.findOne({ _id: transformed._id });

        if (existing) {
          const update = {
            $set: {
              filename: transformed.filename,
              fileUrl: transformed.fileUrl,
              extension: transformed.extension,
              dataset: transformed.dataset,
              updatedAt: new Date(),
            },
          };
          const res = await collection.updateOne({ _id: transformed._id }, update);
          if (res.modifiedCount > 0) {
            updated++;
            console.log(`🔄 Updated: ${transformed.filename} (${transformed._id})`);
          }
        } else {
          const insertDoc = {
            ...transformed,
            createdAt: new Date(),
          };
          await collection.insertOne(insertDoc);
          created++;
          console.log(`✅ Created: ${transformed.filename} (${transformed._id})`);
        }
      } catch (err) {
        failed++;
        console.error(`❌ Error for ${docData.filename || docData.id}: ${err.message}`);
      }
    }

    console.log('\n🎉 Seeding Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total processed: ${allDocs.length}`);

  } catch (err) {
    console.error('🚨 Fatal error during seeding:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed.');
  }
}

/* ------------------- Execute If Run Directly ------------------- */

if (require.main === module) {
  seedDocuments();
}

module.exports = { seedDocuments };
