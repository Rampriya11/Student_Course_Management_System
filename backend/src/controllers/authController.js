const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Student = require('../models/Student');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      username: user.username || user.staffId || user.studentId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and role'
      });
    }

    let user;
    let isMatch = false;

    // Admin login
    if (role === 'admin') {
      user = await Admin.findOne({ username });
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }
    
    // Staff login
    else if (role === 'staff') {
      user = await Staff.findOne({ staffId: username });
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }
    
    // Student login
    else if (role === 'student') {
      user = await Student.findOne({ studentId: username });
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }
    
    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username || user.staffId || user.studentId,
        role: user.role,
        isFirstLogin: user.isFirstLogin || false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide old and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    let user;
    
    if (userRole === 'admin') {
      user = await Admin.findById(userId);
    } else if (userRole === 'staff') {
      user = await Staff.findById(userId);
    } else if (userRole === 'student') {
      user = await Student.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};