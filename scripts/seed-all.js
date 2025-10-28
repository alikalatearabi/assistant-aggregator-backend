#!/usr/bin/env node
/**
 * Run all seed scripts in order
 */

const { execSync } = require('child_process');
const path = require('path');

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  const seeds = [
    { name: 'Users', script: 'seed-users.js' },
    { name: 'Documents', script: 'seed-documents.js' },
  ];

  for (const seed of seeds) {
    console.log(`📦 Seeding ${seed.name}...`);
    try {
      const scriptPath = path.join(__dirname, seed.script);
      execSync(`node ${scriptPath}`, { stdio: 'inherit', cwd: __dirname });
      console.log(`✅ ${seed.name} seeding completed\n`);
    } catch (error) {
      console.error(`❌ Error seeding ${seed.name}:`, error.message);
      // Continue with other seeds even if one fails
    }
  }

  console.log('🎉 All seeding operations completed!');
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error during seeding:', error);
      process.exit(1);
    });
}

module.exports = { runSeeds };

