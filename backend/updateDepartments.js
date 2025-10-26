require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Staff = require('./src/models/Staff');
const Student = require('./src/models/Student');

const departmentMapping = {
  'Computer Science': 'Computer Science Engineering',
  'AI&DS': 'Artificial Intelligence and Data Science',
  'ECE': 'Electronics and Communication Engineering',
  'EEE': 'Electrical and Electronics Engineering',
  'Civil': 'Civil Engineering',
  'Mech': 'Mechanical Engineering',
  // 'Information Technology' remains the same
};

const updateDepartments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');

    let totalUpdated = 0;

    // Update Courses
    for (const [oldDept, newDept] of Object.entries(departmentMapping)) {
      const updatedCourses = await Course.updateMany(
        { department: oldDept },
        { department: newDept }
      );
      totalUpdated += updatedCourses.modifiedCount;
      console.log(`Updated ${updatedCourses.modifiedCount} courses from '${oldDept}' to '${newDept}'`);
    }

    // Update Staff
    for (const [oldDept, newDept] of Object.entries(departmentMapping)) {
      const updatedStaff = await Staff.updateMany(
        { department: oldDept },
        { department: newDept }
      );
      totalUpdated += updatedStaff.modifiedCount;
      console.log(`Updated ${updatedStaff.modifiedCount} staff from '${oldDept}' to '${newDept}'`);
    }

    // Update Students
    for (const [oldDept, newDept] of Object.entries(departmentMapping)) {
      const updatedStudents = await Student.updateMany(
        { department: oldDept },
        { department: newDept }
      );
      totalUpdated += updatedStudents.modifiedCount;
      console.log(`Updated ${updatedStudents.modifiedCount} students from '${oldDept}' to '${newDept}'`);
    }

    console.log(`Total records updated: ${totalUpdated}`);
    console.log('Department update completed successfully');

  } catch (error) {
    console.error('Error updating departments:', error);
  } finally {
    mongoose.connection.close();
  }
};

updateDepartments();
