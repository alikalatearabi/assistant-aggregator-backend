const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Seed data for initial users
const usersToSeed = [
  {
    firstname: 'Admin',
    lastname: 'User',
    nationalcode: '0000000000',
    personalcode: 'ADMIN001',
    email: 'admin@company.com',
    organizationLevel: 'executive',
    password: 'Admin123!',
    isActive: true,
    role: 'admin'
  },
  {
    firstname: 'Manager',
    lastname: 'User',
    nationalcode: '1111111111',
    personalcode: 'MGR001',
    email: 'manager@company.com',
    organizationLevel: 'manager',
    password: 'Manager123!',
    isActive: true,
    role: 'manager'
  },
  {
    firstname: 'Regular',
    lastname: 'User',
    nationalcode: '2222222222',
    personalcode: 'USR001',
    email: 'user@company.com',
    organizationLevel: 'senior',
    password: 'User123!',
    isActive: true,
    role: 'user'
  }
];

async function seedUsers() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('users');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of usersToSeed) {
      // Check if user already exists
      const existingUser = await collection.findOne({
        $or: [
          { email: userData.email },
          { nationalcode: userData.nationalcode },
          { personalcode: userData.personalcode }
        ]
      });

      if (existingUser) {
        console.log(`⏭️  Skipping existing user: ${userData.email} (${userData.role})`);
        skippedCount++;
        continue;
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create the user
      const userDoc = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await collection.insertOne(userDoc);
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      createdCount++;
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`- Created: ${createdCount} users`);
    console.log(`- Skipped: ${skippedCount} existing users`);
    console.log(`\n📋 Default login credentials:`);

    usersToSeed.forEach(user => {
      console.log(`- ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Clean up function to remove seeded users (for development/testing)
async function cleanupSeedUsers() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('assistant_aggregator');
    const collection = database.collection('users');

    // Remove only the seeded users
    const seedEmails = usersToSeed.map(u => u.email);
    const result = await collection.deleteMany({ email: { $in: seedEmails } });

    console.log(`🗑️  Removed ${result.deletedCount} seeded users`);

  } catch (error) {
    console.error('Error cleaning up seed users:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Command line interface
const command = process.argv[2];

if (require.main === module) {
  if (command === 'cleanup') {
    cleanupSeedUsers();
  } else {
    seedUsers();
  }
}

module.exports = { seedUsers, cleanupSeedUsers, usersToSeed };