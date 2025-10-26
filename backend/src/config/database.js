const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Drop invalid index if exists
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({name: 'courses'}).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('courses').indexes();
        const invalidIndex = indexes.find(i => i.name === 'course_code_1');
        if (invalidIndex) {
          await db.collection('courses').dropIndex('course_code_1');
          console.log('Dropped invalid index: course_code_1');
        }
      }
    } catch (indexError) {
      console.log('No invalid index to drop or error dropping index:', indexError.message);
    }

    // Drop invalid student index if exists
    try {
      const db = mongoose.connection.db;
      const studentCollections = await db.listCollections({name: 'students'}).toArray();
      if (studentCollections.length > 0) {
        const studentIndexes = await db.collection('students').indexes();
        const invalidStudentIndex = studentIndexes.find(i => i.name === 'student_id_1');
        if (invalidStudentIndex) {
          await db.collection('students').dropIndex('student_id_1');
          console.log('Dropped invalid student index: student_id_1');
        }
      }
    } catch (studentIndexError) {
      console.log('No invalid student index to drop or error dropping index:', studentIndexError.message);
    }
    
    // Create default admin after connection
    await createDefaultAdmin();
    await createDefaultRegulations();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const Admin = require('../models/Admin');
    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin'
      });
      console.log('Default admin created: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
};

// Create default regulations
const createDefaultRegulations = async () => {
  try {
    const Regulation = require('../models/Regulation');
    const regulations = [
      { year: 2019, name: 'R2019', isActive: true },
      { year: 2023, name: 'R2023', isActive: true }
    ];
    
    for (const reg of regulations) {
      const exists = await Regulation.findOne({ year: reg.year });
      if (!exists) {
        await Regulation.create(reg);
        console.log(`Default regulation created: ${reg.name}`);
      }
    }
  } catch (error) {
    console.error('Error creating default regulations:', error.message);
  }
};

module.exports = connectDB;