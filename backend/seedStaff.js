require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Staff = require('./src/models/Staff');

const seedStaff = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management');

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ staffId: 'STAFF001' });
    if (existingStaff) {
      console.log('Staff user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('staff123', 10);

    // Create staff user
    const staff = new Staff({
      staffId: 'STAFF001',
      staffName: 'Test Staff',
      department: 'Computer Science Engineering',
      dob: new Date('1980-01-01'),
      email: 'staff@example.com',
      contact: '1234567890',
      password: hashedPassword,
      role: 'staff'
    });

    await staff.save();
    console.log('Staff user created successfully');
    console.log('Staff ID: STAFF001');
    console.log('Password: staff123');

  } catch (error) {
    console.error('Error seeding staff:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedStaff();
