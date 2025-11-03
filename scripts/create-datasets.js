const { MongoClient, ObjectId } = require('mongodb');

async function createDatasets() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('datasets');

    const existingDatasets = await collection.find({}).toArray();
    console.log('Existing datasets:', existingDatasets);

    const datasets = [
      {
        _id: new ObjectId('507f1f77bcf86cd799439011'), 
        dataset_id: 'general_law',
        dataset_name: 'دادگان  قوانین عمومی',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId('507f1f77bcf86cd799439012'), 
        dataset_id: 'vezarat_olom',
        dataset_name: 'دادگان وزارت علوم، تحقیقات و فناوری',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        dataset_id: 'vezarat_varzeh',
        dataset_name: 'دادگان وزارت ورزش و جوانان',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const results = [];
    for (const dataset of datasets) {
      try {
        const existing = await collection.findOne({ dataset_id: dataset.dataset_id });
        if (existing) {
          console.log(`Dataset ${dataset.dataset_id} already exists with ID: ${existing._id}`);
          console.log(`🗑️  Removing existing dataset ${dataset.dataset_id}...`);
          await collection.deleteOne({ dataset_id: dataset.dataset_id });
        }
        const result = await collection.insertOne(dataset);
        console.log(`✅ Created dataset ${dataset.dataset_id} with ID: ${result.insertedId}`);
        results.push({ ...dataset, _id: result.insertedId });
      } catch (error) {
        console.error(`Error creating dataset ${dataset.dataset_id}:`, error.message);
      }
    }

    return results;

  } finally {
    await client.close();
  }
}

createDatasets().catch(console.error);