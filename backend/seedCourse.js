require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');

const seedCourse = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management');

    // Check if course already exists
    const existingCourse = await Course.findOne({ courseCode: 'CS101' });
    if (existingCourse) {
      console.log('Course already exists');
      process.exit(0);
    }

    // Create course
    const course = new Course({
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      credits: 4,
      department: 'Computer Science Engineering',
      semester: 1,
      regulation: 2020,
      isActive: true,
      instructor: 'STAFF001'
    });

    await course.save();
    console.log('Course created successfully');
    console.log('Course Code: CS101');

  } catch (error) {
    console.error('Error seeding course:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedCourse();
