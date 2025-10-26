const Grade = require('../models/Grade');

const calculateGPA = async (studentId, semester) => {
  try {
    const grades = await Grade.find({ student: studentId, semester }).populate('course');
    const Student = require('../models/Student');
    const student = await Student.findById(studentId);

    if (!student) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    // Include regular grades
    grades.forEach(grade => {
      // Exclude courses where includeInGPA is false
      if (grade.includeInGPA !== false) {
        totalPoints += grade.gradePoints * grade.credits;
        totalCredits += grade.credits;
      }
    });

    // Include NPTEL courses graded in this semester
    student.enrolledNptelCourses.forEach(course => {
      if (course.semester === semester && !course.dropped && course.gradePoints !== undefined && course.includeInGPA !== false) {
        const credits = course.credits || 3;
        totalPoints += course.gradePoints * credits;
        totalCredits += credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    return parseFloat(gpa);
  } catch (error) {
    throw new Error(`Error calculating GPA: ${error.message}`);
  }
};

const calculateCGPA = async (studentId) => {
  try {
    const grades = await Grade.find({ student: studentId }).populate('course');
    const Student = require('../models/Student');
    const student = await Student.findById(studentId);

    if (!student) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    // Include regular grades (excluding NPTEL courses from Grade collection)
    grades.forEach(grade => {
      // Exclude courses where includeInGPA is false
      if (grade.includeInGPA !== false) {
        totalPoints += grade.gradePoints * grade.credits;
        totalCredits += grade.credits;
      }
    });

    // Include all graded NPTEL courses (across all semesters)
    student.enrolledNptelCourses.forEach(course => {
      if (!course.dropped && course.gradePoints !== undefined && course.includeInGPA !== false) {
        const credits = course.credits || 3;
        totalPoints += course.gradePoints * credits;
        totalCredits += credits;
      }
    });

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    return parseFloat(cgpa);
  } catch (error) {
    throw new Error(`Error calculating CGPA: ${error.message}`);
  }
};

const updateStudentGPACGPA = async (studentId, semester) => {
  try {
    const Student = require('../models/Student');
    
    const gpa = await calculateGPA(studentId, semester);
    const cgpa = await calculateCGPA(studentId);
    
    await Student.findByIdAndUpdate(studentId, { gpa, cgpa });
    
    return { gpa, cgpa };
  } catch (error) {
    throw new Error(`Error updating student GPA/CGPA: ${error.message}`);
  }
};

const getLetterGrade = (gradePoints) => {
  switch (gradePoints) {
    case 10: return 'O';
    case 9: return 'A+';
    case 8: return 'A';
    case 7: return 'B+';
    case 6: return 'B';
    case 5: return 'C';
    default: return 'F';
  }
};

const getGradePoints = (letterGrade) => {
  const grade = letterGrade.toString().toUpperCase().trim();
  switch (grade) {
    case 'O': return 10;
    case 'A+': return 9;
    case 'A': return 8;
    case 'B+': return 7;
    case 'B': return 6;
    case 'C': return 5;
    case 'F': return 0;
    default: return 0;
  }
};

const updateStudentSemester = async (studentId, currentSemester) => {
  try {
    const Student = require('../models/Student');
    const StudentCourse = require('../models/StudentCourse');

    const student = await Student.findById(studentId);
    if (!student) return;

    // Check if no courses for the current semester are still enrolled (all graded)
    const enrolledCourses = await StudentCourse.find({
      student: studentId,
      originalSemester: currentSemester,
      status: 'enrolled'
    });

    if (enrolledCourses.length === 0 && student.semester === currentSemester) {
      // Update semester
      await Student.findByIdAndUpdate(studentId, { semester: currentSemester + 1 });
    }
  } catch (error) {
    console.error('Error updating student semester:', error);
  }
};

module.exports = {
  calculateGPA,
  calculateCGPA,
  updateStudentGPACGPA,
  getLetterGrade,
  getGradePoints,
  updateStudentSemester
};
