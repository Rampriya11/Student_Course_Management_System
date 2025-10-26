require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./src/models/Student');

const seedStudent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management');

    // Check if student already exists
    const existingStudent = await Student.findOne({ studentId: 'STU001' });
    if (existingStudent) {
      console.log('Student already exists');
      process.exit(0);
    }

    // Generate default password: StudentID + DOB (YYYYMMDD)
    const dob = new Date('2000-01-01');
    const dobStr = dob.toISOString().split('T')[0].replace(/-/g, '');
    const defaultPassword = 'STU001' + dobStr;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create student
    const student = new Student({
      studentId: 'STU001',
      name: 'Test Student',
      dob: dob,
      contact: '0987654321',
      email: 'student@example.com',
      fatherName: 'Test Father',
      motherName: 'Test Mother',
      parentContact: '0987654322',
      address: 'Test Address',
      department: 'Computer Science Engineering',
      program: 'B.Tech',
      admissionYear: 2020,
      semester: 1,
      regulation: 2020,
      status: 'Active',
      password: hashedPassword,
      isFirstLogin: true
    });

    await student.save();
    console.log('Student created successfully');
    console.log('Student ID: STU001');
    console.log('Default Password:', defaultPassword);

  } catch (error) {
    console.error('Error seeding student:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedStudent();
