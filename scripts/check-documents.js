const { MongoClient } = require('mongodb');

async function checkDocuments() {
  const uri = process.env.MONGO_URI || 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('documents');

    const documents = await collection.find({}).sort({ _id: -1 }).limit(5).toArray();
    console.log('Latest 5 documents:');
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc._id}, Filename: ${doc.filename}, ObjectKey: ${doc.objectKey}, FileUrl: ${doc.fileUrl}`);
    });

    const total = await collection.countDocuments();
    console.log(`\nTotal documents: ${total}`);
  } finally {
    await client.close();
  }
}

checkDocuments().catch(console.error);