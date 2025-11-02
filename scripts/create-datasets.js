const { MongoClient } = require('mongodb');

async function createDatasets() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@185.149.192.130:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('assistant_aggregator');
    const collection = database.collection('datasets');

    // Check if datasets already exist
    const existingDatasets = await collection.find({}).toArray();
    console.log('Existing datasets:', existingDatasets);

    // Create the three datasets
    const datasets = [
      {
        dataset_id: 'general_law',
        dataset_name: 'General Law Documents',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dataset_id: 'vezarat_olom',
        dataset_name: 'Ministry of Science, Research and Technology Documents',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dataset_id: 'vezarat_varzeh',
        dataset_name: 'Ministry of Youth and Sports Documents',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const results = [];
    for (const dataset of datasets) {
      try {
        // Check if dataset already exists
        const existing = await collection.findOne({ dataset_id: dataset.dataset_id });
        if (existing) {
          console.log(`Dataset ${dataset.dataset_id} already exists with ID: ${existing._id}`);
          results.push(existing);
        } else {
          const result = await collection.insertOne(dataset);
          console.log(`Created dataset ${dataset.dataset_id} with ID: ${result.insertedId}`);
          results.push({ ...dataset, _id: result.insertedId });
        }
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
