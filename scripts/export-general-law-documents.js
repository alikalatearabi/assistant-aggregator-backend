const { MongoClient } = require('mongodb');
const fs = require('fs');

async function exportGeneralLawDocuments() {
  const uri = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    // Get all documents that start with "5" (General Law documents)
    const generalLawDocuments = await collection.find({
      objectKey: { $exists: true, $ne: null },
      filename: { $regex: /^5/ }
    }).toArray();

    console.log(`Found ${generalLawDocuments.length} General Law documents`);

    // Create the custom JSON format with filename, id, MinIO path, and dataset_id
    const customFormat = generalLawDocuments.map(doc => ({
      filename: doc.filename,
      id: doc._id.toString(),
      minioPath: `/documents/${doc._id.toString()}/${doc.filename.replace(/\s+/g, '_')}`,
      dataset_id: '68fa953c7a5728a95624fe7a' // general_law dataset ID
    }));

    // Write to JSON file
    const jsonOutput = JSON.stringify(customFormat, null, 2);
    fs.writeFileSync('general-law-documents-export.json', jsonOutput);
    console.log('Exported to general-law-documents-export.json');

    // Also log a summary
    console.log('\nSummary:');
    customFormat.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.filename} (ID: ${doc.id})`);
    });

    return customFormat;

  } finally {
    await client.close();
  }
}

exportGeneralLawDocuments().catch(console.error);