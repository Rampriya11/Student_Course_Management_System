const axios = require('axios');
const Student = require('../models/Student');

// Fetch NPTEL courses from YouTube Data API
exports.fetchNptelCourses = async (req, res) => {
  try {
    const { query = 'NPTEL', maxResults = 20 } = req.query;

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'YouTube API key not configured'
      });
    }

    const searchQuery = `${query} NPTEL`;
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=playlist&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`;

    const response = await axios.get(apiUrl);

    if (!response.data.items) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Transform YouTube data to our format
    const courses = response.data.items.map(item => ({
      courseId: item.id.playlistId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      videoUrl: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
      instructor: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching NPTEL courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NPTEL courses',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Enroll in NPTEL course
exports.enrollNptelCourse = async (req, res) => {
  try {
    const { courseId, title, description, thumbnailUrl, videoUrl, instructor } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and title are required'
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledNptelCourses.some(course => course.courseId === courseId);
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this NPTEL course'
      });
    }

    // Add to enrolled courses
    student.enrolledNptelCourses.push({
      courseId,
      title,
      description,
      thumbnailUrl,
      videoUrl,
      instructor
    });

    await student.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in NPTEL course',
      enrolledCourse: student.enrolledNptelCourses[student.enrolledNptelCourses.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enrolling in NPTEL course',
      error: error.message
    });
  }
};

// Get enrolled NPTEL courses
exports.getEnrolledNptelCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('enrolledNptelCourses');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      count: student.enrolledNptelCourses.length,
      data: student.enrolledNptelCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled NPTEL courses',
      error: error.message
    });
  }
};

// Drop NPTEL course
exports.dropNptelCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find and mark the course as dropped
    const course = student.enrolledNptelCourses.find(course => course.courseId === courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'NPTEL course not found in enrolled courses'
      });
    }

    if (course.dropped) {
      return res.status(400).json({
        success: false,
        message: 'NPTEL course is already dropped'
      });
    }

    course.dropped = true;
    await student.save();

    res.json({
      success: true,
      message: 'Successfully dropped NPTEL course',
      droppedCourse: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error dropping NPTEL course',
      error: error.message
    });
  }
};

// Update last accessed time for NPTEL course
exports.updateNptelAccess = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find and update the course
    const course = student.enrolledNptelCourses.find(course => course.courseId === courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'NPTEL course not found in enrolled courses'
      });
    }

    course.lastAccessedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Access time updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating access time',
      error: error.message
    });
  }
};
