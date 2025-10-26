const Student = require('../models/Student');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const StudentCourse = require('../models/StudentCourse');
const { calculateCGPA } = require('../utils/gpaCalculator');

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    let responseData = student.toObject();
    try {
      responseData.cgpa = await calculateCGPA(student._id);
    } catch (calcError) {
      console.error('Error calculating CGPA:', calcError);
      // Fallback to stored cgpa
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Get available courses
exports.getAvailableCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get current semester courses not enrolled
    const enrolledCourseIds = (await StudentCourse.find({ student: req.user.id }).select('course')).map(sc => sc.course);

    // Get courses for student's semester and regulation
    const allCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      isActive: true,
      semester: student.semester,
      regulation: student.regulation
    });

    // Filter courses based on department visibility rules
    const currentSemesterCourses = allCourses.filter(course => {
      // If course has "Science & Humanities" department, it's visible to all departments
      if (course.departments && course.departments.includes('Science & Humanities')) {
        return true;
      }
      // For NPTEL courses, make them visible to all departments
      if (course.type === 'NPTEL') {
        return true;
      }
      // For other courses, check if student's department matches any of the course departments
      return course.departments && course.departments.includes(student.department);
    }).map(course => ({
      ...course.toObject(),
      isBacklog: false
    }));

    // Get backlog courses
    const backlogStudentCourses = await StudentCourse.find({
      student: req.user.id,
      status: 'backlog'
    }).populate('course');

    const backlogCourses = backlogStudentCourses.map(sc => ({
      ...sc.course.toObject(),
      isBacklog: true,
      attempts: sc.attempts
    }));

    res.json({
      success: true,
      count: currentSemesterCourses.length + backlogCourses.length,
      data: {
        currentAvailableCourses: currentSemesterCourses,
        backlogCourses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available courses',
      error: error.message
    });
  }
};

// Enroll in courses
exports.enrollCourses = async (req, res) => {
  try {
    const { courseIds, selectedStaff } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course IDs to enroll'
      });
    }

    const student = await Student.findById(req.user.id);

    // Calculate current non-backlog credits for current semester
    const currentEnrollments = await StudentCourse.find({
      student: student._id,
      status: { $ne: 'backlog' }
    }).populate('course');

    let currentCredits = 0;
    for (const sc of currentEnrollments) {
      if (sc.course.semester === student.semester) {
        currentCredits += sc.course.credits;
      }
    }

    // Check if already enrolled (status 'enrolled') via StudentCourse
    const existingEnrollments = await StudentCourse.find({
      student: student._id,
      course: { $in: courseIds },
      status: 'enrolled'
    });
    const alreadyEnrolled = existingEnrollments.map(e => e.course.toString());
    if (alreadyEnrolled.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in some courses',
        alreadyEnrolled
      });
    }

    // Calculate new credits and validate
    let newCredits = 0; // Only for new enrollments, not backlogs
    const validCourseIds = [];
    const backlogUpdates = [];
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) continue;

      // Check if it's a backlog
      const existingBacklog = await StudentCourse.findOne({
        student: student._id,
        course: courseId,
        status: 'backlog'
      });

      if (existingBacklog) {
        // Re-enroll in backlog, credits don't count towards limit
        backlogUpdates.push(existingBacklog);
      } else {
        // New enrollment, must be current semester
        if (course.semester !== student.semester) {
          return res.status(400).json({
            success: false,
            message: `Course ${course.courseCode} is not for current semester`
          });
        }
        newCredits += course.credits;
        validCourseIds.push(courseId);
      }
    }

    const totalCredits = currentCredits + newCredits;

    if (totalCredits < 12 || totalCredits > 36) {
      return res.status(400).json({
        success: false,
        message: `Total credits must be between 12 and 36. Current credits: ${currentCredits}, new credits: ${newCredits}, total: ${totalCredits}`
      });
    }

    // Update backlog StudentCourse records
    const updatedBacklogs = [];
    for (const backlog of backlogUpdates) {
      backlog.status = 'enrolled';
      backlog.attempts += 1;
      await backlog.save();
      updatedBacklogs.push(backlog);
    }

    // Create new StudentCourse records
    const newEnrollments = [];
    for (const courseId of validCourseIds) {
      const course = await Course.findById(courseId);
      if (!course) continue;

      // Use selected staff if provided, otherwise fallback to default
      const staff = selectedStaff && selectedStaff[courseId] ? selectedStaff[courseId] : (course.instructor || (course.instructors && course.instructors.length > 0 ? course.instructors[0] : ''));

      const studentCourse = new StudentCourse({
        student: student._id,
        course: courseId,
        staff: staff,
        originalSemester: student.semester,
        attempts: 1,
        status: 'enrolled'
      });
      await studentCourse.save();
      newEnrollments.push(studentCourse);
    }

    const allEnrollments = [...updatedBacklogs, ...newEnrollments];

    res.json({
      success: true,
      message: 'Enrolled in courses successfully',
      enrolledCourses: allEnrollments.map(e => e.course)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enrolling in courses',
      error: error.message
    });
  }
};

// Get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentCourses = await StudentCourse.find({ student: req.user.id }).populate('course');
    const allCourses = studentCourses.map(sc => ({
      ...sc.course.toObject(),
      staff: sc.staff,
      status: sc.status,
      attempts: sc.attempts,
      clearedSemester: sc.clearedSemester,
      gradeEarned: sc.gradeEarned,
      creditPoints: sc.creditPoints
    }));

    const currentCourses = allCourses.filter(course => course.status === 'enrolled');
    const backlogCourses = allCourses.filter(course => course.status === 'backlog');
    const droppedCourses = allCourses.filter(course => course.status === 'dropped');
    const completedCourses = allCourses.filter(course => course.status === 'completed');

    res.json({
      success: true,
      count: allCourses.length,
      data: {
        currentCourses,
        backlogCourses,
        droppedCourses,
        completedCourses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

// Drop courses
exports.dropCourses = async (req, res) => {
  try {
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course IDs to drop'
      });
    }

    const student = await Student.findById(req.user.id);

    // Find enrolled courses that can be dropped
    const enrolledCourses = await StudentCourse.find({
      student: student._id,
      course: { $in: courseIds },
      status: 'enrolled'
    }).populate('course');

    if (enrolledCourses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No enrolled courses found to drop'
      });
    }

    // Validate that only NPTEL courses can be dropped and they are current semester
    const validDrops = [];
    const invalidDrops = [];

    for (const sc of enrolledCourses) {
      if (sc.course.type === 'NPTEL' && sc.course.semester === student.semester) {
        validDrops.push(sc);
      } else {
        invalidDrops.push(sc.course.courseCode);
      }
    }

    if (validDrops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid NPTEL courses found to drop. Only current semester NPTEL courses can be dropped.',
        invalidCourses: invalidDrops
      });
    }

    // Update status to dropped
    const droppedCourses = [];
    for (const sc of validDrops) {
      sc.status = 'dropped';
      await sc.save();
      droppedCourses.push(sc.course._id);
    }

    res.json({
      success: true,
      message: `Successfully dropped ${droppedCourses.length} NPTEL course(s)`,
      droppedCourses,
      invalidCourses: invalidDrops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error dropping courses',
      error: error.message
    });
  }
};

// Get grades
exports.getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user.id }).populate('course');

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
