import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const ViewGrades = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/staff/students');
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchGrades = async (studentId) => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/staff/students/${studentId}/grades`);
      setGrades(response.data.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    if (studentId) {
      fetchGrades(studentId);
    } else {
      setGrades([]);
    }
  };

  const selectedStudentData = students.find(s => s._id === selectedStudent);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">View Grades</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.studentId} - {student.name} ({student.department})
                </option>
              ))}
            </select>
          </div>

          {selectedStudentData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Student Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-semibold">{selectedStudentData.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{selectedStudentData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold">{selectedStudentData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GPA</p>
                  <p className="font-semibold">{selectedStudentData.gpa || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CGPA</p>
                  <p className="font-semibold text-blue-600">{selectedStudentData.cgpa || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : grades.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(
                grades.reduce((acc, grade) => {
                  const semester = grade.semester;
                  if (!acc[semester]) acc[semester] = [];
                  acc[semester].push(grade);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort semesters descending
                .map(([semester, semesterGrades]) => (
                  <div key={semester} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b">
                      <h2 className="text-lg font-semibold text-gray-800">Semester {semester} Grades</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Total Courses: {semesterGrades.length} |
                        GPA: {(semesterGrades.reduce((sum, grade) => sum + grade.gradePoints, 0) / semesterGrades.length || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Course Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Course Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Credits
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Grade Points
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Letter Grade
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {semesterGrades.map((grade) => (
                            <tr key={grade._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {grade.course?.courseCode || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {grade.course?.courseName || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.credits}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.gradePoints}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  grade.letterGrade === 'O' || grade.letterGrade === 'A+' ? 'bg-green-100 text-green-800' :
                                  grade.letterGrade === 'A' || grade.letterGrade === 'B+' ? 'bg-blue-100 text-blue-800' :
                                  grade.letterGrade === 'B' || grade.letterGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {grade.letterGrade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ) : selectedStudent ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No grades found for this student</p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default ViewGrades;