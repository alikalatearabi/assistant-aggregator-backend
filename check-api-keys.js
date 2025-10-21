const { MongoClient } = require('mongodb');

async function findUsersWithApiKey() {
  const mongoUri = 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('users');

    const usersWithApiKey = await collection.find(
      { apiKey: { $exists: true } },
      { projection: { firstname: 1, lastname: 1, email: 1, role: 1, apiKey: 1 } }
    ).toArray();

    if (usersWithApiKey.length === 0) {
      console.log('No users found with API key.');
    } else {
      console.log('Users with API key:');
      usersWithApiKey.forEach(user => {
        console.log(`- Name: ${user.firstname} ${user.lastname}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- API Key: ${user.apiKey}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

findUsersWithApiKey();