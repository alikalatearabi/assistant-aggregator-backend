const { MongoClient } = require('mongodb');
const fs = require('fs');

async function exportNewDocuments() {
  const uri = 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    // Filter for newly uploaded documents (those with objectKey set, uploaded today)
    const newDocuments = await collection.find({
      objectKey: { $exists: true, $ne: null },
      createdAt: { $gte: new Date('2025-10-21T00:00:00Z') }
    }).toArray();

    console.log(`Found ${newDocuments.length} new documents to export`);

    // Add download instructions for each document
    const exportData = newDocuments.map(doc => ({
      _id: doc._id.toString(),
      filename: doc.filename,
      objectKey: doc.objectKey,
      bucket: 'assistant-aggregator', // Assuming same bucket
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType || 'application/pdf',
      size: doc.size,
      checksum: doc.checksum,
      extension: doc.extension,
      ocrStatus: doc.ocrStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      downloadInstructions: {
        method: 'presigned-url',
        endpoint: 'GET /documents/{document_id}/presigned-url',
        example: `curl "http://your-backend-url/documents/${doc._id}/presigned-url?expires=3600"`,
        description: 'Use your backend endpoint to generate a temporary download URL. Replace {document_id} with this document\'s _id.',
        manualConstruction: {
          baseUrl: 'http://your-company-minio-endpoint:port',
          bucket: 'assistant-aggregator',
          objectKey: doc.objectKey,
          note: 'If you have MinIO credentials, you can generate presigned URLs manually using the MinIO SDK or AWS SDK.'
        }
      }
    }));

    // Write to JSON file
    const jsonOutput = JSON.stringify(exportData, null, 2);
    fs.writeFileSync('new-documents-export.json', jsonOutput);
    console.log('Exported to new-documents-export.json');

    // Also log a summary
    console.log('\nSummary:');
    exportData.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.filename} (ID: ${doc._id})`);
    });

  } finally {
    await client.close();
  }
}

exportNewDocuments().catch(console.error);