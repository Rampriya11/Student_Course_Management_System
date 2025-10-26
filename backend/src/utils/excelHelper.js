const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const departments = [
  'Information Technology',
  'Computer Science Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Artificial Intelligence and Data Science',
  'Science & Humanities'
];

const programs = ['B.E', 'B.Tech', 'M.E', 'M.Tech'];
const courseTypes = ['Core', 'Elective', 'NPTEL', 'Lab', 'Project'];

const parseExcel = (filePath) => {
  try {
    console.log('Parsing Excel file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      defval: ''
    });

    // Ensure no null values in data
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        if (row[key] == null) {
          row[key] = '';
        }
      });
    });

    console.log(`Parsed ${data.length} rows from Excel`);
    return data;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Error parsing Excel file: ${error.message}`);
  }
};

const exportToExcel = (data, fileName) => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const filePath = path.join(uploadsDir, fileName);
    XLSX.writeFile(workbook, filePath);
    
    console.log('Excel file exported to:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Error exporting to Excel: ${error.message}`);
  }
};

const validateStaffData = (data) => {
  const requiredFields = ['StaffID', 'StaffName', 'Department', 'DOB', 'Email'];
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('No data found in Excel file');
    return errors;
  }

  data.forEach((row, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Row ${index + 2}: Missing or empty ${field}`);
      }
    });

    // Validate department
    if (row.Department) {
      const dept = row.Department.toString().trim();
      const matchedDept = departments.find(d => d.toLowerCase() === dept.toLowerCase());
      if (!matchedDept) {
        errors.push(`Row ${index + 2}: Invalid department "${row.Department}". Must be one of: ${departments.join(', ')}`);
      }
    }

    // Validate email format
    if (row.Email && !isValidEmail(row.Email.toString().trim())) {
      errors.push(`Row ${index + 2}: Invalid email format`);
    }

    // Validate date format
    if (row.DOB) {
      const dateResult = isValidDate(row.DOB);
      if (!dateResult.valid) {
        errors.push(`Row ${index + 2}: ${dateResult.error} for DOB`);
      }
    }
  });
  
  return errors;
};

const validateCourseData = (data) => {
  const requiredFields = ['CourseCode', 'CourseName', 'Credits', 'Type', 'Semester', 'Regulation', 'Department', 'Instructor'];
  const errors = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push('No data found in Excel file');
    return errors;
  }

  data.forEach((row, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Row ${index + 2}: Missing or empty ${field}`);
      }
    });

    // Validate department (comma-separated)
    if (row.Department) {
      const deptString = row.Department.toString().trim();
      const deptArray = deptString.split(',').map(d => d.trim()).filter(d => d);
      deptArray.forEach(dept => {
        const matchedDept = departments.find(d => d.toLowerCase() === dept.toLowerCase());
        if (!matchedDept) {
          errors.push(`Row ${index + 2}: Invalid department "${dept}". Must be one of: ${departments.join(', ')}`);
        }
      });
    }

    // Validate instructor (comma-separated, just check presence)
    if (row.Instructor) {
      const instructorString = row.Instructor.toString().trim();
      const instructorArray = instructorString.split(',').map(i => i.trim()).filter(i => i);
      if (instructorArray.length === 0) {
        errors.push(`Row ${index + 2}: Instructor field is required and cannot be empty`);
      }
    }

    // Validate course type
    if (row.Type) {
      const type = row.Type.toString().trim();
      const matchedType = courseTypes.find(t => t.toLowerCase() === type.toLowerCase());
      if (!matchedType) {
        errors.push(`Row ${index + 2}: Invalid course type "${row.Type}". Must be one of: ${courseTypes.join(', ')}`);
      }
    }

    // Validate credits
    if (row.Credits) {
      const credits = parseFloat(row.Credits);
      if (isNaN(credits) || credits < 1) {
        errors.push(`Row ${index + 2}: Credits must be a positive number`);
      }
    }

    // Validate semester
    if (row.Semester) {
      const semester = parseInt(row.Semester);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        errors.push(`Row ${index + 2}: Semester must be between 1 and 8`);
      }
    }

    // Validate regulation
    if (row.Regulation) {
      const regulation = parseInt(row.Regulation);
      if (isNaN(regulation) || regulation < 2000 || regulation > 2030) {
        errors.push(`Row ${index + 2}: Invalid regulation year`);
      }
    }
  });
  
  return errors;
};

const validateStudentData = (data) => {
  const requiredFields = [
    'StudentID', 'Name', 'DOB',
    'Department', 'Program', 'AdmissionYear', 'Regulation'
  ];
  const errors = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push('No data found in Excel file');
    return errors;
  }

  data.forEach((row, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Row ${index + 2}: Missing or empty ${field}`);
      }
    });

    // Validate department
    if (row.Department) {
      const dept = row.Department.toString().trim();
      const matchedDept = departments.find(d => d.toLowerCase() === dept.toLowerCase());
      if (!matchedDept) {
        errors.push(`Row ${index + 2}: Invalid department "${row.Department}". Must be one of: ${departments.join(', ')}`);
      }
    }

    // Validate program
    if (row.Program) {
      const program = row.Program.toString().trim();
      const matchedProgram = programs.find(p => p.toLowerCase() === program.toLowerCase());
      if (!matchedProgram) {
        errors.push(`Row ${index + 2}: Invalid program "${row.Program}". Must be one of: ${programs.join(', ')}`);
      }
    }

    // Validate email format
    if (row.Email && !isValidEmail(row.Email.toString().trim())) {
      errors.push(`Row ${index + 2}: Invalid email format`);
    }

    // Validate date format
    if (row.DOB) {
      const dateResult = isValidDate(row.DOB);
      if (!dateResult.valid) {
        errors.push(`Row ${index + 2}: ${dateResult.error} for DOB`);
      }
    }

    // Validate semester if present
    if (row.Semester) {
      const semester = parseInt(row.Semester);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        errors.push(`Row ${index + 2}: Semester must be between 1 and 8`);
      }
    }

    // Validate admission year
    if (row.AdmissionYear) {
      const year = parseInt(row.AdmissionYear);
      if (isNaN(year) || year < 2000 || year > 2030) {
        errors.push(`Row ${index + 2}: Admission year must be between 2000 and 2030`);
      }
    }

    // Validate regulation
    if (row.Regulation) {
      const regulation = parseInt(row.Regulation);
      if (isNaN(regulation) || regulation < 2000 || regulation > 2030) {
        errors.push(`Row ${index + 2}: Invalid regulation year`);
      }
    }

    // Validate contact numbers
    if (row.Contact && !isValidPhone(row.Contact.toString().trim())) {
      errors.push(`Row ${index + 2}: Invalid contact number format. Must be exactly 10 digits.`);
    }

    if (row.ParentContact && !isValidPhone(row.ParentContact.toString().trim())) {
      errors.push(`Row ${index + 2}: Invalid parent contact number format. Must be exactly 10 digits.`);
    }
  });

  return errors;
};

// Helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (dateString) => {
  if (!dateString) return { valid: false, error: 'Date is required' };

  let year, month, day;
  const trimmed = dateString.toString().trim();

  // Try YYYY-MM-DD format
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    year = parseInt(ymdMatch[1], 10);
    month = parseInt(ymdMatch[2], 10);
    day = parseInt(ymdMatch[3], 10);
  } else {
    // Try DD/MM/YYYY format
    const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      year = parseInt(dmyMatch[3], 10);
    } else {
      return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY' };
    }
  }

  // Validate ranges
  if (year < 1900 || year > 2100) {
    return { valid: false, error: `Invalid year ${year}. Must be between 1900 and 2100` };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: `Invalid month ${month}. Must be between 1 and 12` };
  }

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))) {
    daysInMonth[1] = 29; // Leap year
  }

  if (day < 1 || day > daysInMonth[month - 1]) {
    return { valid: false, error: `Invalid day ${day} for ${month}/${year}. Max days: ${daysInMonth[month - 1]}` };
  }

  // Final validation with Date constructor
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return { valid: false, error: 'Invalid date components' };
  }

  return { valid: true, error: '' };
};

const isValidPhone = (phone) => {
  // Must be exactly 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

module.exports = {
  parseExcel,
  exportToExcel,
  validateStaffData,
  validateCourseData,
  validateStudentData,
  isValidPhone
};
