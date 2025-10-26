const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const nptelController = require('../controllers/nptelController');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// All routes require authentication and student role
router.use(authenticateToken);
router.use(checkRole('student'));

// Profile
router.get('/profile', studentController.getProfile);

// Courses
router.get('/courses/available', studentController.getAvailableCourses);
router.post('/courses/enroll', studentController.enrollCourses);
router.post('/courses/drop', studentController.dropCourses);
router.get('/courses/enrolled', studentController.getEnrolledCourses);

// NPTEL Courses
router.get('/nptel/courses', nptelController.fetchNptelCourses);
router.post('/nptel/enroll', nptelController.enrollNptelCourse);
router.get('/nptel/enrolled', nptelController.getEnrolledNptelCourses);
router.delete('/nptel/courses/:courseId', nptelController.dropNptelCourse);
router.put('/nptel/courses/:courseId/access', nptelController.updateNptelAccess);

// Grades
router.get('/grades', studentController.getGrades);

module.exports = router;
