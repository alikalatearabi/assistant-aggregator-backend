const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configuration for the user to seed with API key
const userToSeed = {
  firstname: 'API',
  lastname: 'User',
  nationalcode: '3333333333', // Unique national code
  personalcode: 'API001',      // Unique personal code
  email: 'api@company.com',    // API user email
  organizationLevel: 'senior',
  password: 'ApiUser123!',     // Plain text password - will be hashed
  isActive: true,
  role: 'user'
};

async function seedUserWithApiKey() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('users');

    // Check if user already exists
    const existingUser = await collection.findOne({
      $or: [
        { email: userToSeed.email },
        { nationalcode: userToSeed.nationalcode },
        { personalcode: userToSeed.personalcode }
      ]
    });

    if (existingUser) {
      console.log('API user already exists:');
      console.log(`- Email: ${existingUser.email}`);
      console.log(`- National Code: ${existingUser.nationalcode}`);
      console.log(`- Personal Code: ${existingUser.personalcode}`);
      console.log(`- Role: ${existingUser.role}`);
      if (existingUser.apiKey) {
        console.log(`- API Key: ${existingUser.apiKey}`);
      } else {
        console.log('- No API key assigned yet');
      }
      return;
    }

    // Hash the password
    console.log('Creating API user...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userToSeed.password, saltRounds);

    // Generate API key (same format as createApiKeyForUser)
    const apiKey = 'sk_9c30f5fd1bd5b69db561a4de84ca2b64bed7f89e2b1894da'

    // Create the user with API key
    const userDoc = {
      ...userToSeed,
      password: hashedPassword,
      apiKey: apiKey,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(userDoc);

    console.log('✅ API user created successfully!');
    console.log(`- ID: ${result.insertedId}`);
    console.log(`- Email: ${userToSeed.email}`);
    console.log(`- Password: ${userToSeed.password} (remember to change this!)`);
    console.log(`- Role: ${userToSeed.role}`);
    console.log(`- Organization Level: ${userToSeed.organizationLevel}`);
    console.log(`- API Key: ${apiKey}`);
    console.log('\n📋 Use this API key in your requests:');
    console.log(`Authorization: Bearer ${apiKey}`);
    console.log(`Or: Authorization: Api-Key ${apiKey}`);
    console.log(`Or header: x-api-key: ${apiKey}`);

  } catch (error) {
    console.error('Error seeding API user:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedUserWithApiKey();
}

module.exports = { seedUserWithApiKey };