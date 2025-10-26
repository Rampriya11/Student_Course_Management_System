import * as XLSX from 'xlsx';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (data, filename = 'export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
};

export const downloadTemplate = (type) => {
  const templates = {
    staff: [
      {
        StaffID: 'S001',
        StaffName: 'John Doe',
        Department: 'Computer Science Engineering',
        DOB: '1990-01-01',
        Email: 'john@example.com',
        Contact: '9876543210'
      }
    ],
    students: [
      {
        StudentID: 'ST001',
        Name: 'Jane Smith',
        DOB: '2002-05-15',
        Contact: '9876543210',
        Email: 'jane@example.com',
        FatherName: 'John Smith',
        MotherName: 'Mary Smith',
        ParentContact: '9876543211',
        Address: '123 Main St, City',
        Department: 'Computer Science Engineering',
        Program: 'B.Tech',
        AdmissionYear: 2023,
        Semester: 1,
        Regulation: 2023
      }
    ],
    courses: [
      {
        CourseCode: 'CS101',
        CourseName: 'Introduction to Programming',
        Credits: 4,
        Type: 'Core',
        Instructor: 'Dr. Smith, Prof. Johnson',
        Semester: 1,
        Regulation: 2023,
        Department: 'Computer Science Engineering, Information Technology'
      }
    ]
  };

  const data = templates[type] || [];
  exportToExcel(data, `${type}_template.xlsx`);
};