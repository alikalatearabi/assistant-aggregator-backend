const { MongoClient } = require('mongodb');
const fs = require('fs');

async function exportVezaratDocuments() {
  const uri = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    // Get all documents uploaded today (both General_Law_PDFs and Vezarat_olom_PDFs)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDocuments = await collection.find({
      objectKey: { $exists: true, $ne: null },
      createdAt: { $gte: today }
    }).toArray();

    console.log(`Found ${allDocuments.length} documents uploaded today`);

    // Create the custom JSON format with filename, id, and MinIO path
    const customFormat = allDocuments.map(doc => ({
      filename: doc.filename,
      id: doc._id.toString(),
      minioPath: `/documents/${doc._id.toString()}/${doc.filename.replace(/\s+/g, '_')}`
    }));

    // Write to JSON file
    const jsonOutput = JSON.stringify(customFormat, null, 2);
    fs.writeFileSync('vezarat-documents-export.json', jsonOutput);
    console.log('Exported to vezarat-documents-export.json');

    // Also log a summary
    console.log('\nSummary:');
    customFormat.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.filename} (ID: ${doc.id})`);
      console.log(`   MinIO Path: ${doc.minioPath}`);
    });

    return customFormat;

  } finally {
    await client.close();
  }
}

exportVezaratDocuments().catch(console.error);
