// Utility script to generate bcrypt password hash
// Run this to generate your ADMIN_PASSWORD_HASH for .env file

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generatePasswordHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

async function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function setup() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🔐 PASSWORD HASH GENERATOR                    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Generate hash for password: 420admin
  const password = '420admin';
  const hash = await generatePasswordHash(password);
  const jwtSecret = await generateJWTSecret();

  console.log('✅ Password hash generated successfully!\n');
  console.log('📋 Copy these values to your .env file:\n');
  console.log('─────────────────────────────────────────────────');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log('─────────────────────────────────────────────────\n');
  console.log('💡 Your admin login credentials will be:');
  console.log('   Username: Admin');
  console.log('   Password: 420admin\n');
  console.log('⚠️  Make sure to add .env to .gitignore!\n');
}

setup().catch(console.error);
