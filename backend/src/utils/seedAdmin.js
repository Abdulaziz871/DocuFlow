// One-off script: node src/utils/seedAdmin.js
// Creates a default Company + System Admin user so you can log in on first run.
require('dotenv').config();
const connectDB = require('../config/db');
const Company = require('../models/Company');
const User = require('../models/User');

(async () => {
  await connectDB();

  let company = await Company.findOne({ name: 'DocuFlow HQ' });
  if (!company) {
    company = await Company.create({ name: 'DocuFlow HQ', plan: 'enterprise' });
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@docuflow.ai';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: 'System Admin',
    email,
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'system_admin',
    company: company._id,
  });

  console.log(`Seeded admin -> email: ${email}`);
  process.exit(0);
})();
