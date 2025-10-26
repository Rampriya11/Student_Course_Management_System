const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
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

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(checkRole('admin'));

// Staff management
router.post('/upload-staff', upload.single('file'), adminController.uploadStaff);
router.post('/staff', adminController.addStaff);
router.get('/staff', adminController.getAllStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);

// Course management
router.post('/upload-courses', upload.single('file'), adminController.uploadCourses);
router.post('/courses', adminController.addCourse);
router.get('/courses', adminController.getAllCourses);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Regulation management
router.post('/regulations', adminController.addRegulation);
router.get('/regulations', adminController.getAllRegulations);
router.put('/regulations/:id', adminController.updateRegulation);

// Student management
router.get('/students', adminController.getStudents);
router.get('/students/export', adminController.exportStudents);

// Instructor management
router.get('/instructors', adminController.getInstructors);

module.exports = router;