const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedAdminUser() {
  // Configuration - Update these values as needed
  const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const adminUser = {
    firstname: 'Admin',
    lastname: 'User',
    nationalcode: '0000000000', // Unique national code
    personalcode: 'ADMIN001',    // Unique personal code
    email: 'admin@company.com',  // Admin email
    organizationLevel: 'executive',
    password: 'Admin123!',       // Plain text password - will be hashed
    isActive: true,
    role: 'admin'
  };

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('users');

    // Check if admin user already exists
    const existingUser = await collection.findOne({
      $or: [
        { email: adminUser.email },
        { nationalcode: adminUser.nationalcode },
        { personalcode: adminUser.personalcode }
      ]
    });

    if (existingUser) {
      console.log('Admin user already exists:');
      console.log(`- Email: ${existingUser.email}`);
      console.log(`- National Code: ${existingUser.nationalcode}`);
      console.log(`- Personal Code: ${existingUser.personalcode}`);
      console.log(`- Role: ${existingUser.role}`);
      return;
    }

    // Hash the password
    console.log('Creating admin user...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminUser.password, saltRounds);

    // Create the admin user
    const userDoc = {
      ...adminUser,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(userDoc);

    console.log('✅ Admin user created successfully!');
    console.log(`- ID: ${result.insertedId}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Password: ${adminUser.password} (remember to change this!)`);
    console.log(`- Role: ${adminUser.role}`);
    console.log(`- Organization Level: ${adminUser.organizationLevel}`);

  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedAdminUser();
}

module.exports = { seedAdminUser };