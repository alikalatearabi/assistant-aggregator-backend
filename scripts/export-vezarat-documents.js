const { MongoClient } = require('mongodb');
const fs = require('fs');

async function exportVezaratDocuments() {
  const uri = 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDocuments = await collection.find({
      objectKey: { $exists: true, $ne: null },
      createdAt: { $gte: today }
    }).toArray();

    console.log(`Found ${allDocuments.length} documents uploaded today`);

    const customFormat = allDocuments.map(doc => ({
      filename: doc.filename,
      id: doc._id.toString(),
      minioPath: `/documents/${doc._id.toString()}/${doc.filename.replace(/\s+/g, '_')}`
    }));

    const jsonOutput = JSON.stringify(customFormat, null, 2);
    fs.writeFileSync('vezarat-documents-export.json', jsonOutput);
    console.log('Exported to vezarat-documents-export.json');

    console.log('\nSummary:');
    customFormat.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.filename} (ID: ${doc.id})`);
      console.log(`MinIO Path: ${doc.minioPath}`);
    });

    return customFormat;

  } finally {
    await client.close();
  }
}

exportVezaratDocuments().catch(console.error);
