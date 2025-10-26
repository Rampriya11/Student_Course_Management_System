const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const staffController = require('../controllers/staffController');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// All routes require authentication and staff role
router.use(authenticateToken);
router.use(checkRole('staff'));

// Student management
router.post('/upload-students', upload.single('file'), staffController.uploadStudents);
router.post('/students', staffController.addStudent);
router.get('/students', staffController.getAllStudents);
router.get('/students/search', staffController.searchStudents);
router.put('/students/:id', staffController.updateStudent);
router.delete('/students/:id', staffController.deleteStudent);

// Grade management
router.post('/grades', staffController.enterGrades);
router.post('/grades/submit', staffController.submitGradesBatch);
router.get('/students/:id/grades', staffController.getStudentGrades);

// Course management
router.get('/courses', staffController.getAllCourses);
router.get('/students/:studentId/enrolled-courses', staffController.getEnrolledCoursesForStudent);

// Export
router.get('/students/export', staffController.exportStudents);

// Profile
router.get('/profile', staffController.getStaffProfile);
router.put('/profile', staffController.updateStaffProfile);

module.exports = router;
