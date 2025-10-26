require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./src/models/Admin');

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');

    // Force create database by creating a dummy collection
    await mongoose.connection.db.admin().ping();
    console.log('Database ping successful');

    // Check if admin exists
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('Admin user not found, creating...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new Admin({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Admin user created');
      return;
    }

    console.log('Admin user found:', admin.username, admin.email);

    // Test password
    const isMatch = await bcrypt.compare('admin123', admin.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match, recreating admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin.password = hashedPassword;
      await admin.save();
      console.log('Admin password updated');
    }

    // Test JWT generation
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin._id, role: admin.role, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('JWT token generated successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

testLogin();
