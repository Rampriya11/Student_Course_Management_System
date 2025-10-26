const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  contact: {
    type: String,
    trim: true
  },
  parentContact: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    required: true,
    trim: true
  },
  admissionYear: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    default: 1
  },
  regulation: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'Active'
  },
  gpa: {
    type: Number,
    default: 0
  },
  cgpa: {
    type: Number,
    default: 0
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  enrolledNptelCourses: [{
    courseId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    thumbnailUrl: {
      type: String
    },
    videoUrl: {
      type: String
    },
    instructor: {
      type: String
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    dropped: {
      type: Boolean,
      default: false
    },
    gradePoints: {
      type: Number,
      min: 0,
      max: 10
    },
    letterGrade: {
      type: String,
      trim: true
    },
    semester: {
      type: Number
    },
    credits: {
      type: Number,
      min: 0,
      default: 3 // Default credits for NPTEL courses
    },
    includeInGPA: {
      type: Boolean,
      default: true
    },
    gradedAt: {
      type: Date
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'student'
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);