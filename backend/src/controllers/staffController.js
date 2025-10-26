const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const StudentCourse = require('../models/StudentCourse');
const path = require('path');
const { parseExcel, exportToExcel, validateStudentData } = require('../utils/excelHelper');
const { updateStudentGPACGPA, updateStudentSemester, getGradePoints } = require('../utils/gpaCalculator');

// Upload Students via Excel
exports.uploadStudents = async (req, res) => {
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
    const errors = validateStudentData(data);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    const studentList = [];

    for (const row of data) {
      try {
        // Explicit check for missing StudentID to prevent null inserts
        if (!row.StudentID || row.StudentID.toString().trim() === '') {
          errors.push(`Row ${data.indexOf(row) + 2}: Missing or empty StudentID`);
          continue;
        }

        const parsedAdmissionYear = parseInt(row.AdmissionYear);
        const parsedRegulation = parseInt(row.Regulation);
        const parsedSemester = row.Semester ? parseInt(row.Semester) : 1;

        if (isNaN(parsedAdmissionYear) || parsedAdmissionYear < 2000 || parsedAdmissionYear > 2030) {
          errors.push(`Invalid admission year for ${row.StudentID}: Must be a number between 2000 and 2030.`);
          continue;
        }

        if (isNaN(parsedRegulation) || parsedRegulation < 2000 || parsedRegulation > 2030) {
          errors.push(`Invalid regulation for ${row.StudentID}: Must be a number between 2000 and 2030.`);
          continue;
        }

        if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
          errors.push(`Invalid semester for ${row.StudentID}: Must be a number between 1 and 8.`);
          continue;
        }

        // Generate default password: StudentID + DOB (YYYYMMDD)
        const dobStr = new Date(row.DOB).toISOString().split('T')[0].replace(/-/g, '');
        const defaultPassword = row.StudentID + dobStr;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const studentData = {
          studentId: row.StudentID.toString().trim(),
          name: row.Name,
          dob: new Date(row.DOB),
          contact: row.Contact || '',
          email: row.Email || '',
          fatherName: row.FatherName || '',
          motherName: row.MotherName || '',
          parentContact: row.ParentContact || '',
          address: row.Address || '',
          department: row.Department,
          program: row.Program,
          admissionYear: parsedAdmissionYear,
          semester: parsedSemester,
          regulation: parsedRegulation,
          status: row.Status || 'Active',
          password: hashedPassword,
          created_by: req.user.id,
          isFirstLogin: true
        };

        // Check if student already exists
        const existingStudent = await Student.findOne({ studentId: studentData.studentId });
        if (existingStudent) {
          const updateData = { ...studentData };
          delete updateData.studentId; // Prevent updating the unique studentId field
          await Student.findByIdAndUpdate(existingStudent._id, updateData);
          studentList.push({ ...studentData, status: 'updated' });
        } else {
          await Student.create(studentData);
          studentList.push({ ...studentData, status: 'created' });
        }
      } catch (rowError) {
        console.error(`Error processing row for student ${row.StudentID || 'unknown'}:`, rowError);
        errors.push(`Error processing ${row.StudentID || 'unknown'}: ${rowError.message}`);
      }
    }

    res.json({
      success: true,
      message: `${studentList.length} students processed`,
      data: studentList,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading students',
      error: error.message
    });
  }
};

// Add Student manually
exports.addStudent = async (req, res) => {
  try {
    const {
      studentId,
      name,
      dob,
      contact,
      email,
      fatherName,
      motherName,
      parentContact,
      address,
      department,
      program,
      admissionYear,
      regulation,
      semester
    } = req.body;

    console.log('Received student data:', req.body);

    if (
      !studentId ||
      !name ||
      !dob ||
      !department ||
      !program ||
      !admissionYear ||
      !regulation
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        missingFields: {
          studentId: !studentId,
          name: !name,
          dob: !dob,
          department: !department,
          program: !program,
          admissionYear: !admissionYear,
          regulation: !regulation
        }
      });
    }

    const parsedAdmissionYear = parseInt(admissionYear);
    const parsedRegulation = parseInt(regulation);
    const parsedSemester = semester ? parseInt(semester) : 1;

    if (isNaN(parsedAdmissionYear) || parsedAdmissionYear < 2000 || parsedAdmissionYear > 2030) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admission year. Must be a number between 2000 and 2030.'
      });
    }

    if (isNaN(parsedRegulation) || parsedRegulation < 2000 || parsedRegulation > 2030) {
      return res.status(400).json({
        success: false,
        message: 'Invalid regulation. Must be a number between 2000 and 2030.'
      });
    }

    if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Must be a number between 1 and 8.'
      });
    }

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    const dobStr = new Date(dob).toISOString().split('T')[0].replace(/-/g, '');
    const defaultPassword = studentId + dobStr;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const student = await Student.create({
      studentId,
      name,
      dob: new Date(dob),
      contact: contact || '',
      email: email || '',
      fatherName: fatherName || '',
      motherName: motherName || '',
      parentContact: parentContact || '',
      address: address || '',
      department,
      program,
      admissionYear: parsedAdmissionYear,
      regulation: parsedRegulation,
      semester: parsedSemester,
      password: hashedPassword,
      created_by: req.user.id,
      isFirstLogin: true
    });

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding student',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ created_by: req.user.id }).select('-password');

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

// Search students by name or studentId
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const regex = new RegExp(query.trim(), 'i'); // Case-insensitive search

    const students = await Student.find({
      created_by: req.user.id,
      $or: [
        { name: regex },
        { studentId: regex }
      ]
    }).select('-password').limit(10); // Limit to 10 results for autocomplete

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching students',
      error: error.message
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this student'
      });
    }

    // Remove password from update if present
    delete updateData.password;

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this student'
      });
    }

    await Student.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

// Enter grades with automatic GPA/CGPA and semester update
exports.enterGrades = async (req, res) => {
  try {
    const { studentId, courseId, grade, semester } = req.body;

    if (!studentId || !courseId || !grade || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (studentId, courseId, grade, semester)'
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check ownership
    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to enter grades for this student'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Convert letter grade to grade points
    const gradePoints = getGradePoints(grade);

    // Check if grade already exists for this student and course
    const existingGrade = await Grade.findOne({
      student: student._id,
      course: courseId
    });

    let gradeEntry;
    if (existingGrade) {
      // Update existing grade
      existingGrade.gradePoints = gradePoints;
      existingGrade.credits = course.credits;
      existingGrade.semester = semester;
      existingGrade.enteredBy = req.user.id;
      existingGrade.attempt = (existingGrade.attempt || 0) + 1;
      gradeEntry = await existingGrade.save();
    } else {
      // Create new grade entry
      gradeEntry = await Grade.create({
        student: student._id,
        course: courseId,
        gradePoints: gradePoints,
        credits: course.credits,
        semester: semester,
        regulation: student.regulation,
        enteredBy: req.user.id,
        attempt: 1,
        originalSemester: semester
      });
    }

    // Update or create StudentCourse record
    let studentCourse = await StudentCourse.findOne({
      student: student._id,
      course: courseId
    });
    if (studentCourse) {
      studentCourse.attempts += 1;
      studentCourse.gradeEarned = grade;
      studentCourse.creditPoints = gradePoints;
      if (gradePoints > 0) {
        studentCourse.status = 'completed';
        studentCourse.clearedSemester = semester;
      } else {
        studentCourse.status = 'backlog';
        studentCourse.clearedSemester = null;
      }
      await studentCourse.save();
    } else {
      const staff = course.instructor || (course.instructors && course.instructors.length > 0 ? course.instructors[0] : '');
      const status = gradePoints > 0 ? 'completed' : 'backlog';
      const clearedSemester = gradePoints > 0 ? semester : null;
      studentCourse = await StudentCourse.create({
        student: student._id,
        course: courseId,
        staff: staff,
        originalSemester: semester,
        attempts: 1,
        status: status,
        clearedSemester: clearedSemester,
        gradeEarned: grade,
        creditPoints: gradePoints
      });
    }

    // Update GPA and CGPA
    await updateStudentGPACGPA(student._id, semester);

    // Update semester if needed
    await updateStudentSemester(student._id, semester);

    res.status(201).json({
      success: true,
      message: 'Grade entered successfully',
      data: gradeEntry
    });
  } catch (error) {
    console.error('Error entering grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error entering grade',
      error: error.message
    });
  }
};

// Submit batch grades for a student
exports.submitGradesBatch = async (req, res) => {
  try {
    const { studentId, semester, grades } = req.body;

    if (!studentId || !semester || !grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, semester, and grades array'
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check ownership
    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to enter grades for this student'
      });
    }

    const gradeEntries = [];

    for (const gradeData of grades) {
      const { courseId, grade, includeInGPA } = gradeData;

      if (!courseId || !grade) {
        return res.status(400).json({
          success: false,
          message: 'Each grade must have courseId and grade'
        });
      }

      // Check if this is an NPTEL course (starts with NPTEL-)
      const isNptelCourse = courseId.startsWith('NPTEL-');
      let course = null;
      let nptelCourse = null;

      if (isNptelCourse) {
        // Handle NPTEL course grading
        const actualCourseId = courseId.replace('NPTEL-', '');
        nptelCourse = student.enrolledNptelCourses.find(c => c.courseId === actualCourseId && !c.dropped);
        if (!nptelCourse) {
          return res.status(404).json({
            success: false,
            message: `NPTEL course not found: ${courseId}`
          });
        }
      } else {
        // Handle regular course grading
        course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({
            success: false,
            message: `Course not found: ${courseId}`
          });
        }
      }

      // Convert letter grade to grade points
      const gradePoints = getGradePoints(grade);

      if (isNptelCourse) {
        // Update NPTEL course in student record
        nptelCourse.gradePoints = gradePoints;
        nptelCourse.letterGrade = grade;
        nptelCourse.semester = semester;
        nptelCourse.gradedAt = new Date();
        nptelCourse.gradedBy = req.user.id;
        nptelCourse.includeInGPA = includeInGPA !== false;

        // Create a mock grade entry for consistency
        const gradeEntry = {
          student: student._id,
          course: courseId,
          gradePoints: gradePoints,
          letterGrade: grade,
          credits: nptelCourse.credits || 3,
          semester: semester,
          regulation: student.regulation,
          enteredBy: req.user.id,
          attempt: 1,
          originalSemester: semester,
          includeInGPA: nptelCourse.includeInGPA,
          isNptel: true
        };
        gradeEntries.push(gradeEntry);
      } else {
        // Handle regular course grading
        // Check if grade already exists for this student and course
        const existingGrade = await Grade.findOne({
          student: student._id,
          course: courseId
        });

        let gradeEntry;
        if (existingGrade) {
          // Update existing grade
          existingGrade.gradePoints = gradePoints;
          existingGrade.credits = course.credits;
          existingGrade.semester = semester;
          existingGrade.enteredBy = req.user.id;
          existingGrade.attempt = (existingGrade.attempt || 0) + 1;
          gradeEntry = await existingGrade.save();
        } else {
          // Create new grade entry
          gradeEntry = await Grade.create({
            student: student._id,
            course: courseId,
            gradePoints: gradePoints,
            credits: course.credits,
            semester: semester,
            regulation: student.regulation,
            enteredBy: req.user.id,
            attempt: 1,
            originalSemester: semester,
            includeInGPA: true
          });
        }

        // Update or create StudentCourse record
        let studentCourse = await StudentCourse.findOne({
          student: student._id,
          course: courseId
        });
        if (studentCourse) {
          studentCourse.attempts += 1;
          studentCourse.gradeEarned = grade;
          studentCourse.creditPoints = gradePoints;
          if (gradePoints > 0) {
            studentCourse.status = 'completed';
            studentCourse.clearedSemester = semester;
          } else {
            studentCourse.status = 'backlog';
            studentCourse.clearedSemester = null;
          }
          await studentCourse.save();
        } else {
          const staff = course.instructor || (course.instructors && course.instructors.length > 0 ? course.instructors[0] : '');
          const status = gradePoints > 0 ? 'completed' : 'backlog';
          const clearedSemester = gradePoints > 0 ? semester : null;
          studentCourse = await StudentCourse.create({
            student: student._id,
            course: courseId,
            staff: staff,
            originalSemester: semester,
            attempts: 1,
            status: status,
            clearedSemester: clearedSemester,
            gradeEarned: grade,
            creditPoints: gradePoints
          });
        }

        gradeEntries.push(gradeEntry);
      }
    }

    // Save student record if NPTEL courses were updated
    await student.save();

    // Update GPA and CGPA after all grades are entered
    await updateStudentGPACGPA(student._id, semester);

    // Update semester if needed
    await updateStudentSemester(student._id, semester);

    res.status(201).json({
      success: true,
      message: 'Grades entered successfully',
      data: gradeEntries
    });
  } catch (error) {
    console.error('Error submitting batch grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting batch grades',
      error: error.message
    });
  }
};

// Get student grades
exports.getStudentGrades = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view grades for this student'
      });
    }

    const grades = await Grade.find({ student: id }).populate('course');

    res.json({
      success: true,
      count: grades.length,
      data: grades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grades',
      error: error.message
    });
  }
};

// Get all courses for staff
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });

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

// Get enrolled courses for a specific student
exports.getEnrolledCoursesForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check ownership
    if (student.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view enrolled courses for this student'
      });
    }

    const enrolledCourses = await StudentCourse.find({
      student: student._id,
      status: { $in: ['enrolled', 'backlog'] }
    }).populate('course');

    const courses = enrolledCourses
      .filter(ec => ec.course) // Filter out entries where course is null due to populate match
      .map(ec => ({
        ...ec.course.toObject(),
        status: ec.status,
        attempts: ec.attempts,
        originalSemester: ec.originalSemester
      }));

    // Add non-dropped NPTEL courses to the grading list (only if not dropped)
    const nptelCourses = student.enrolledNptelCourses
      .filter(course => !course.dropped)
      .map(course => ({
        _id: course.courseId,
        courseCode: `NPTEL-${course.courseId.slice(-6)}`, // Generate a course code for NPTEL
        courseName: course.title,
        credits: course.credits || 3,
        type: 'NPTEL',
        instructor: course.instructor,
        semester: course.semester || student.semester,
        regulation: student.regulation,
        department: student.department,
        status: 'enrolled',
        attempts: 1,
        originalSemester: course.semester || student.semester,
        isNptel: true
      }));

    const allCourses = [...courses, ...nptelCourses];

    res.json({
      success: true,
      count: allCourses.length,
      data: allCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

// Export students to Excel
exports.exportStudents = async (req, res) => {
  try {
    const students = await Student.find({ created_by: req.user.id }).select('-password -__v');

    const exportData = students.map(s => ({
      StudentID: s.studentId,
      Name: s.name,
      DOB: s.dob.toISOString().split('T')[0],
      Contact: s.contact,
      Email: s.email,
      FatherName: s.fatherName,
      MotherName: s.motherName,
      ParentContact: s.parentContact,
      Address: s.address,
      Department: s.department,
      Program: s.program,
      AdmissionYear: s.admissionYear,
      Semester: s.semester,
      Regulation: s.regulation,
      Status: s.status,
      GPA: s.gpa,
      CGPA: s.cgpa
    }));

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

// Update staff profile
exports.updateStaffProfile = async (req, res) => {
  try {
    const { staffName, dob, email, contact } = req.body;

    if (!staffName || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Please provide staffName and dob'
      });
    }

    const staff = await Staff.findByIdAndUpdate(
      req.user.id,
      {
        staffName,
        dob: new Date(dob),
        email: email || '',
        contact: contact || ''
      },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get staff profile
exports.getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};
