#!/usr/bin/env node
/*
  Seed documents from JSON export files.
  
  Usage:
    MONGO_URI="mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin" \
    MINIO_ENDPOINT=127.0.0.1 \
    MINIO_PORT=9000 \
    MINIO_USE_SSL=false \
    BUCKET=assistant-aggregator \
    node scripts/seed-documents.js

  This script:
  - Reads general-law-documents-export.json and vezarat-documents-export.json
  - Upserts documents into MongoDB based on their _id
  - Converts minioPath to fileUrl format
  - Extracts file extension from filename
  - Maps dataset_id to dataset ObjectId reference
  
  The script is idempotent - running it multiple times will update existing documents.
*/

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const {
  MONGO_URI = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin',
  MINIO_ENDPOINT = '127.0.0.1',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false',
  BUCKET = 'assistant-aggregator',
} = process.env;

const useSSL = String(MINIO_USE_SSL).toLowerCase() === 'true';

// Paths to JSON export files
const GENERAL_LAW_FILE = path.join(__dirname, '../files/general-law-documents-export.json');
const VEZARAT_FILE = path.join(__dirname, '../files/vezarat-documents-export.json');

/**
 * Build public URL from minioPath
 */
function buildFileUrl(minioPath) {
  // Remove leading slash if present
  const objectKey = minioPath.startsWith('/') ? minioPath.slice(1) : minioPath;
  
  // Encode each segment of the path
  const segments = objectKey.split('/').map(seg => encodeURIComponent(seg));
  
  // Build the full URL
  const protocol = useSSL ? 'https' : 'http';
  return `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}/${encodeURIComponent(BUCKET)}/${segments.join('/')}`;
}

/**
 * Extract file extension from filename
 */
function getExtension(filename) {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'pdf'; // default to pdf
}

/**
 * Transform JSON document data to MongoDB document format
 */
function transformDocument(docData) {
  const docId = ObjectId.isValid(docData.id) ? new ObjectId(docData.id) : null;
  const datasetId = ObjectId.isValid(docData.dataset_id) ? new ObjectId(docData.dataset_id) : null;

  if (!docId) {
    throw new Error(`Invalid document ID: ${docData.id}`);
  }

  const transformed = {
    _id: docId,
    filename: docData.filename,
    fileUrl: buildFileUrl(docData.minioPath),
    extension: getExtension(docData.filename),
    ocrStatus: 'pending',
  };

  if (datasetId) {
    transformed.dataset = datasetId;
  }

  return transformed;
}

/**
 * Load and parse JSON file
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Seed documents from JSON file
 */
async function seedDocuments() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    // Check if JSON files exist
    if (!fs.existsSync(GENERAL_LAW_FILE)) {
      console.error(`❌ File not found: ${GENERAL_LAW_FILE}`);
      process.exit(1);
    }

    if (!fs.existsSync(VEZARAT_FILE)) {
      console.error(`❌ File not found: ${VEZARAT_FILE}`);
      process.exit(1);
    }

    // Load JSON data
    console.log('📂 Loading JSON files...');
    const generalLawDocs = loadJsonFile(GENERAL_LAW_FILE);
    const vezaratDocs = loadJsonFile(VEZARAT_FILE);

    console.log(`   - General Law: ${generalLawDocs.length} documents`);
    console.log(`   - Vezarat: ${vezaratDocs.length} documents`);
    console.log(`   - Total: ${generalLawDocs.length + vezaratDocs.length} documents\n`);

    // Combine all documents
    const allDocs = [...generalLawDocs, ...vezaratDocs];
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Process each document
    for (const docData of allDocs) {
      try {
        const transformed = transformDocument(docData);
        
        // Check if document exists
        const existing = await collection.findOne({ _id: transformed._id });
        
        if (existing) {
          // Update existing document
          const updateResult = await collection.updateOne(
            { _id: transformed._id },
            { 
              $set: {
                filename: transformed.filename,
                fileUrl: transformed.fileUrl,
                extension: transformed.extension,
                dataset: transformed.dataset,
                updatedAt: new Date(),
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            updatedCount++;
            console.log(`🔄 Updated: ${transformed.filename} (${transformed._id})`);
          }
        } else {
          // Insert new document
          const insertDoc = {
            ...transformed,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await collection.insertOne(insertDoc);
          createdCount++;
          console.log(`✅ Created: ${transformed.filename} (${transformed._id})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${docData.filename || docData.id}:`, error.message);
      }
    }

    // Summary
    console.log(`\n🎉 Seeding completed!`);
    console.log(`   - Created: ${createdCount} documents`);
    console.log(`   - Updated: ${updatedCount} documents`);
    console.log(`   - Errors: ${errorCount} documents`);
    console.log(`   - Total processed: ${allDocs.length} documents`);

  } catch (error) {
    console.error('❌ Error seeding documents:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed script
if (require.main === module) {
  seedDocuments();
}

module.exports = { seedDocuments };

