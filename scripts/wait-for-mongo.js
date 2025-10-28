#!/usr/bin/env node
/**
 * Wait for MongoDB to be ready before running seed scripts
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin';
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

async function waitForMongo() {
  console.log('⏳ Waiting for MongoDB to be ready...');
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const client = new MongoClient(MONGO_URI);
    
    try {
      await client.connect();
      // Try a simple operation to verify the connection works
      await client.db('admin').command({ ping: 1 });
      await client.close();
      console.log('✅ MongoDB is ready!');
      return true;
    } catch (error) {
      await client.close().catch(() => {});
      if (i < MAX_RETRIES - 1) {
        console.log(`   Retrying... (${i + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('❌ MongoDB failed to start after maximum retries');
        throw error;
      }
    }
  }
}

if (require.main === module) {
  waitForMongo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error waiting for MongoDB:', error);
      process.exit(1);
    });
}

module.exports = { waitForMongo };

