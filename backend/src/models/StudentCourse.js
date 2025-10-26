const mongoose = require('mongoose');

const studentCourseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  staff: {
    type: String,
    trim: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'backlog', 'dropped'],
    default: 'enrolled'
  },
  originalSemester: {
    type: Number,
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  clearedSemester: {
    type: Number
  },
  gradeEarned: {
    type: String,
    trim: true
  },
  creditPoints: {
    type: Number
  }
});

// Compound index to prevent duplicate enrollments
studentCourseSchema.index({ student: 1, course: 1 }, { unique: true });

// Update timestamp on save
studentCourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentCourse', studentCourseSchema);
