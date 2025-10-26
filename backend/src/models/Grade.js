const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
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
  semester: {
    type: Number,
    required: true
  },
  gradePoints: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  letterGrade: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 0
  },
  gpa: {
    type: Number
  },
  cgpa: {
    type: Number
  },
  remarks: {
    type: String,
    trim: true
  },
  includeInGPA: {
    type: Boolean,
    default: true
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  attempt: {
    type: Number,
    default: 1
  },
  originalSemester: {
    type: Number,
    required: true
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

// Compound index to ensure one grade per student per course
gradeSchema.index({ student: 1, course: 1 }, { unique: true });

// Calculate letter grade based on grade points
gradeSchema.pre('save', function(next) {
  const gp = this.gradePoints;
  switch (gp) {
    case 10: this.letterGrade = 'O'; break;
    case 9: this.letterGrade = 'A+'; break;
    case 8: this.letterGrade = 'A'; break;
    case 7: this.letterGrade = 'B+'; break;
    case 6: this.letterGrade = 'B'; break;
    case 5: this.letterGrade = 'C'; break;
    default: this.letterGrade = 'F';
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);