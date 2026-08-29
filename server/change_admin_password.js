const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ganeshotsava';

const run = async () => {
  // Read arguments from command line
  const args = process.argv.slice(2);
  const email = args[0] || process.env.INITIAL_ADMIN_EMAIL || 'admin@ganeshotsava.com';
  const newPassword = args[1];

  if (!newPassword) {
    console.error('Error: Please specify the new password.');
    console.log('Usage: node change_admin_password.js <email> <new_password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database to update password...');

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update in database
    const AdminSchema = new mongoose.Schema({
      email: { type: String, required: true },
      passwordHash: { type: String, required: true }
    });
    
    // Explicitly target the 'admins' collection
    const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema, 'admins');

    const result = await Admin.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { passwordHash },
      { new: true }
    );

    if (!result) {
      console.log(`\nAdmin account with email "${email}" not found.`);
      console.log('Creating a new admin account with this password instead...');
      await Admin.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true
      });
      console.log(`Success! Created new admin account with email "${email}".`);
    } else {
      console.log(`\nSuccess! Password updated for admin account: ${email}`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
};

run();
