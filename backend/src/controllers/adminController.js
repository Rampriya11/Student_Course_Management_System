const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Regulation = require('../models/Regulation');
const path = require('path');
const { parseExcel, exportToExcel, validateStaffData, validateCourseData, isValidPhone } = require('../utils/excelHelper');

// Upload Staff via Excel
exports.uploadStaff = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    // Resolve absolute path for uploaded file
    const filePath = path.resolve(req.file.path);
    const data = parseExcel(filePath);
    const errors = validateStaffData(data);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    const staffList = [];

    for (const row of data) {
      try {
        // Generate default password: StaffID + DOB (YYYYMMDD)
        const dobStr = new Date(row.DOB).toISOString().split('T')[0].replace(/-/g, '');
        const defaultPassword = row.StaffID + dobStr;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const staffData = {
          staffId: row.StaffID,
          staffName: row.StaffName,
          department: row.Department,
          dob: new Date(row.DOB),
          email: row.Email,
          contact: row.Contact || '',
          password: hashedPassword,
          isFirstLogin: true
        };

        // Check if staff already exists
        const existingStaff = await Staff.findOne({ staffId: row.StaffID });
        if (existingStaff) {
          await Staff.findByIdAndUpdate(existingStaff._id, staffData);
          staffList.push({ ...staffData, status: 'updated' });
        } else {
          await Staff.create(staffData);
          staffList.push({ ...staffData, status: 'created' });
        }
      } catch (rowError) {
        console.error(`Error processing row for staff ${row.StaffID}:`, rowError);
      }
    }

    res.json({
      success: true,
      message: `${staffList.length} staff members processed`,
      data: staffList
    });
  } catch (error) {
    console.error('Error uploading staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading staff',
      error: error.message
    });
  }
};

// Upload Courses via Excel
exports.uploadCourses = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    // Resolve absolute path for uploaded file
    const filePath = path.resolve(req.file.path);
    const data = parseExcel(filePath);
    const errors = validateCourseData(data);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    const courseList = [];

    for (const row of data) {
      try {
        const courseData = {
          courseCode: row.CourseCode.toUpperCase(),
          courseName: row.CourseName,
          credits: row.Credits,
          type: row.Type,
          instructors: row.Instructor ? row.Instructor.split(',').map(i => i.trim()) : [],
          semester: parseInt(row.Semester),
          regulation: row.Regulation,
          departments: row.Department ? row.Department.split(',').map(d => d.trim()) : [],
          isActive: true
        };

        const existingCourse = await Course.findOne({ courseCode: courseData.courseCode });
        if (existingCourse) {
          await Course.findByIdAndUpdate(existingCourse._id, courseData);
          courseList.push({ ...courseData, status: 'updated' });
        } else {
          await Course.create(courseData);
          courseList.push({ ...courseData, status: 'created' });
        }
      } catch (rowError) {
        console.error(`Error processing row for course ${row.CourseCode}:`, rowError);
      }
    }

    res.json({
      success: true,
      message: `${courseList.length} courses processed`,
      data: courseList
    });
  } catch (error) {
    console.error('Error uploading courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading courses',
      error: error.message
    });
  }
};

// Add Staff manually
exports.addStaff = async (req, res) => {
  try {
    const { staffId, staffName, department, dob, email, contact } = req.body;

    console.log('Received staff data:', req.body);

    if (!staffId || !staffName || !department || !dob || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        missingFields: {
          staffId: !staffId,
          staffName: !staffName,
          department: !department,
          dob: !dob,
          email: !email
        }
      });
    }

    // Validate contact number if provided
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact number format. Must be exactly 10 digits.'
      });
    }

    const existingStaff = await Staff.findOne({ staffId });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID already exists'
      });
    }

    const dobStr = new Date(dob).toISOString().split('T')[0].replace(/-/g, '');
    const defaultPassword = staffId + dobStr;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const staff = await Staff.create({
      staffId,
      staffName,
      department,
      dob: new Date(dob),
      email,
      contact: contact || '',
      password: hashedPassword,
      isFirstLogin: true
    });

    res.status(201).json({
      success: true,
      message: 'Staff added successfully',
      data: staff
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding staff',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select('-password');

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove password from update if present
    delete updateData.password;

    const staff = await Staff.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating staff',
      error: error.message
    });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting staff',
      error: error.message
    });
  }
};

// Add Course manually
exports.addCourse = async (req, res) => {
  try {
    console.log('Received addCourse request body:', req.body);

    let { courseCode, courseName, credits, type, instructor, semester, regulation, department } = req.body;

    // Validate required fields
    if (!courseCode || !courseName || !credits || !type || !semester || !regulation || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        missingFields: {
          courseCode: !courseCode,
          courseName: !courseName,
          credits: !credits,
          type: !type,
          semester: !semester,
          regulation: !regulation,
          department: !department
        }
      });
    }

    // Validate numeric fields
    const creditsNum = parseInt(credits);
    const semesterNum = parseInt(semester);
    const regulationNum = parseInt(regulation);

    if (isNaN(creditsNum) || creditsNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Credits must be a non-negative number'
      });
    }

    if (isNaN(semesterNum) || semesterNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be a positive number'
      });
    }

    if (isNaN(regulationNum) || regulationNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Regulation must be a positive number'
      });
    }

    // Normalize courseCode
    courseCode = courseCode.toString().trim().toUpperCase();

    // Normalize type to match enum
    if (type) {
      if (type.toLowerCase() === 'nptel') {
        type = 'NPTEL';
      } else {
        type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      }
    }

    // Validate type against allowed enum values
    const allowedTypes = ['Core', 'Elective', 'NPTEL'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid course type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    // Normalize department to match enum
    const departmentEnum = [
      'Information Technology',
      'Computer Science Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electronics and Communication Engineering',
      'Electrical and Electronics Engineering',
      'Artificial Intelligence and Data Science',
      'Science & Humanities'
    ];

    if (department) {
      const matchedDept = departmentEnum.find(d => d.toLowerCase() === department.toLowerCase());
      if (matchedDept) {
        department = matchedDept;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid department. Must be one of: ${departmentEnum.join(', ')}`
        });
      }
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // Create course
    const course = await Course.create({
      courseCode,
      courseName,
      credits: parseInt(credits),
      type,
      instructors: instructor ? instructor.split(',').map(i => i.trim()).filter(i => i) : [],
      semester: parseInt(semester),
      regulation: parseInt(regulation),
      departments: department ? department.split(',').map(d => d.trim()).filter(d => d) : [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      data: course
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding course',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const { regulation, semester, type, department } = req.query;
    const filter = {};

    if (regulation) filter.regulation = parseInt(regulation);
    if (semester) filter.semester = parseInt(semester);
    if (type) filter.type = type;
    if (department) filter.departments = { $in: [department] };

    const courses = await Course.find(filter);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('Updating course with ID:', id);
    console.log('Update data:', updateData);

    // Validate numeric fields if provided
    if (updateData.credits !== undefined) {
      const creditsNum = parseInt(updateData.credits);
      if (isNaN(creditsNum) || creditsNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Credits must be a non-negative number'
        });
      }
      updateData.credits = creditsNum;
    }

    if (updateData.semester !== undefined) {
      const semesterNum = parseInt(updateData.semester);
      if (isNaN(semesterNum) || semesterNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Semester must be a positive number'
        });
      }
      updateData.semester = semesterNum;
    }

    if (updateData.regulation !== undefined) {
      const regulationNum = parseInt(updateData.regulation);
      if (isNaN(regulationNum) || regulationNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Regulation must be a positive number'
        });
      }
      updateData.regulation = regulationNum;
    }

    // Normalize course code
    if (updateData.courseCode) {
      updateData.courseCode = updateData.courseCode.toString().trim().toUpperCase();

      // Check if new course code already exists (excluding current course)
      const existingCourse = await Course.findOne({
        courseCode: updateData.courseCode,
        _id: { $ne: id }
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    // Normalize type
    if (updateData.type) {
      if (updateData.type.toLowerCase() === 'nptel') {
        updateData.type = 'NPTEL';
      } else {
        updateData.type = updateData.type.charAt(0).toUpperCase() + updateData.type.slice(1).toLowerCase();
      }
    }

    // Validate type against allowed enum values
    if (updateData.type) {
      const allowedTypes = ['Core', 'Elective', 'NPTEL'];
      if (!allowedTypes.includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid course type. Must be one of: ${allowedTypes.join(', ')}`
        });
      }
    }

    // Handle instructors array
    if (updateData.instructor !== undefined) {
      updateData.instructors = updateData.instructor ? updateData.instructor.split(',').map(i => i.trim()).filter(i => i) : [];
      delete updateData.instructor; // Remove the old field
    }

    // Handle departments array
    if (updateData.department !== undefined) {
      const departmentEnum = [
        'Information Technology',
        'Computer Science Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Artificial Intelligence and Data Science',
        'Science & Humanities'
      ];

      // Split by comma and validate each department
      const deptArray = updateData.department ? updateData.department.split(',').map(d => d.trim()).filter(d => d) : [];
      const validatedDepts = deptArray.map(dept => {
        const matchedDept = departmentEnum.find(d => d.toLowerCase() === dept.toLowerCase());
        return matchedDept || dept; // Keep original if not found, or use matched
      });

      updateData.departments = validatedDepts;
      delete updateData.department; // Remove the old field
    }

    // Convert numeric fields
    if (updateData.credits) updateData.credits = parseInt(updateData.credits);
    if (updateData.semester) updateData.semester = parseInt(updateData.semester);
    if (updateData.regulation) updateData.regulation = parseInt(updateData.regulation);

    // Update timestamp
    updateData.updatedAt = Date.now();

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// Add Regulation
exports.addRegulation = async (req, res) => {
  try {
    const { year, name, description } = req.body;

    if (!year || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide year and name'
      });
    }

    const existingRegulation = await Regulation.findOne({ year });
    if (existingRegulation) {
      return res.status(400).json({
        success: false,
        message: 'Regulation year already exists'
      });
    }

    const regulation = await Regulation.create({
      year: parseInt(year),
      name,
      description,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Regulation added successfully',
      data: regulation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding regulation',
      error: error.message
    });
  }
};

// Get all regulations
exports.getAllRegulations = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const regulations = await Regulation.find(filter).sort({ year: -1 });

    res.json({
      success: true,
      count: regulations.length,
      data: regulations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching regulations',
      error: error.message
    });
  }
};

// Update regulation (toggle active status)
exports.updateRegulation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const regulation = await Regulation.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!regulation) {
      return res.status(404).json({
        success: false,
        message: 'Regulation not found'
      });
    }

    res.json({
      success: true,
      message: `Regulation ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: regulation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating regulation',
      error: error.message
    });
  }
};

// Get students with filters
exports.getStudents = async (req, res) => {
  try {
    const { completedCourses, ongoingCourses, semester, regulation, department, course, status } = req.query;
    let filter = {};

    if (semester) filter.semester = parseInt(semester);
    if (regulation) filter.regulation = parseInt(regulation);
    if (department) filter.department = department;

    let courseIds = [];

    // Collect course IDs from completedCourses and ongoingCourses
    if (completedCourses) {
      const completedIds = completedCourses.split(',').filter(id => id).map(id => id.trim());
      courseIds.push(...completedIds);
    }
    if (ongoingCourses) {
      const ongoingIds = ongoingCourses.split(',').filter(id => id).map(id => id.trim());
      courseIds.push(...ongoingIds);
    }

    // Add course filter if provided
    if (course) {
      courseIds.push(course);
    }

    // Remove duplicates
    courseIds = [...new Set(courseIds)];

    // Always filter to students with enrollments
    const StudentCourse = require('../models/StudentCourse');
    let enrolledStudents;

    if (courseIds.length > 0) {
      // Build filter for StudentCourse
      let studentCourseFilter = {
        course: { $in: courseIds },
        status: { $in: ['enrolled', 'completed', 'backlog'] }
      };

      // Add status filter if provided
      if (status) {
        studentCourseFilter.status = status;
      }

      // Filter to students enrolled in the specified courses
      enrolledStudents = await StudentCourse.find(studentCourseFilter).distinct('student');
    } else {
      // Filter to all students with any enrollment
      enrolledStudents = await StudentCourse.find({
        status: { $in: ['enrolled', 'completed', 'backlog'] }
      }).distinct('student');
    }

    filter._id = { $in: enrolledStudents };

    let students = await Student.find(filter).select('-password');

    // If course is selected, populate the course status for each student
    if (course) {
      const studentCourses = await StudentCourse.find({
        student: { $in: students.map(s => s._id) },
        course: course
      }).select('student status');

      // Create a map of student ID to course status
      const statusMap = {};
      studentCourses.forEach(sc => {
        statusMap[sc.student.toString()] = sc.status;
      });

      // Add courseStatus to each student
      students = students.map(student => ({
        ...student.toObject(),
        courseStatus: statusMap[student._id.toString()] || 'N/A'
      }));
    }

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Export students to Excel
exports.exportStudents = async (req, res) => {
  try {
    const { completedCourses, ongoingCourses, semester, regulation, department, course, status } = req.query;
    let filter = {};

    if (semester) filter.semester = parseInt(semester);
    if (regulation) filter.regulation = parseInt(regulation);
    if (department) filter.department = department;

    let courseIds = [];

    // Collect course IDs from completedCourses and ongoingCourses
    if (completedCourses) {
      const completedIds = completedCourses.split(',').filter(id => id).map(id => id.trim());
      courseIds.push(...completedIds);
    }
    if (ongoingCourses) {
      const ongoingIds = ongoingCourses.split(',').filter(id => id).map(id => id.trim());
      courseIds.push(...ongoingIds);
    }

    // Add course filter if provided
    if (course) {
      courseIds.push(course);
    }

    // Remove duplicates
    courseIds = [...new Set(courseIds)];

    // If course filter is provided, find students enrolled in that course via StudentCourse
    if (courseIds.length > 0) {
      const StudentCourse = require('../models/StudentCourse');
      let studentCourseFilter = {
        course: { $in: courseIds },
        status: { $in: ['enrolled', 'completed', 'backlog'] }
      };

      // Add status filter if provided
      if (status) {
        studentCourseFilter.status = status;
      }

      const enrolledStudents = await StudentCourse.find(studentCourseFilter).distinct('student');

      filter._id = { $in: enrolledStudents };
    }

    const students = await Student.find(filter).select('-password -__v');

    let exportData;

    if (course) {
      // When course is selected, export only Name, Roll No, Email, Department
      exportData = students.map(s => ({
        Name: s.name,
        'Roll No': s.studentId,
        Email: s.email,
        Department: s.department
      }));
    } else {
      // Default export with all fields
      exportData = students.map(s => ({
        StudentID: s.studentId,
        Name: s.name,
        DOB: s.dob.toISOString().split('T')[0],
        Contact: s.contact,
        Email: s.email,
        FatherName: s.fatherName,
        MotherName: s.motherName,
        ParentContact: s.parentContact,
        Department: s.department,
        Program: s.program,
        Semester: s.semester,
        Regulation: s.regulation,
        GPA: s.gpa,
        CGPA: s.cgpa
      }));
    }

    const fileName = `students_${Date.now()}.xlsx`;
    const filePath = exportToExcel(exportData, fileName);

    res.json({
      success: true,
      message: 'Students exported successfully',
      filePath: `/uploads/${fileName}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting students',
      error: error.message
    });
  }
};

// Get instructors
exports.getInstructors = async (req, res) => {
  try {
    const instructors = await Course.distinct('instructors', { instructors: { $ne: [] } });

    res.json({
      success: true,
      count: instructors.length,
      data: instructors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching instructors',
      error: error.message
    });
  }
};
