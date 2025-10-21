const mongoose = require('mongoose');
const { UserSchema } = require('../src/schemas/user.schema');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assistant';

async function run() {
  const argv = require('yargs').argv;
  const identifier = argv._[0] || argv.email || argv.id;
  if (!identifier) {
    console.error('Usage: node create-api-key-for-user.js --email user@example.com OR node create-api-key-for-user.js <userId>');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', UserSchema);

  let user;
  if (identifier.includes('@')) {
    user = await User.findOne({ email: identifier });
  } else {
    user = await User.findById(identifier);
  }

  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
  user.apiKey = apiKey;
  await user.save();

  console.log('API key created for user:', user.email);
  console.log('API key:', apiKey);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
