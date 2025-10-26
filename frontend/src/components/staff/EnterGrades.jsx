import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const EnterGrades = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const searchRef = useRef(null);

  const gradeOptions = [
    { value: 'O', label: 'O (Outstanding - 10)', points: 10 },
    { value: 'A+', label: 'A+ (Excellent - 9)', points: 9 },
    { value: 'A', label: 'A (Very Good - 8)', points: 8 },
    { value: 'B+', label: 'B+ (Good - 7)', points: 7 },
    { value: 'B', label: 'B (Above Average - 6)', points: 6 },
    { value: 'C', label: 'C (Average - 5)', points: 5 },
    { value: 'F', label: 'F (Fail - 0)', points: 0 }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStudents = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await api.get(`/staff/students/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchStudents(query);
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.studentId} - ${student.name}`);
    setShowDropdown(false);
    setGrades({});

    // Fetch enrolled courses for the selected student
    try {
      const response = await api.get(`/staff/students/${student.studentId}/enrolled-courses`);
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setCourses([]);
      setMessage({ type: 'error', text: 'Failed to load enrolled courses' });
    }
  };

  const handleGradeChange = (courseId, grade) => {
    setGrades(prev => ({
      ...prev,
      [courseId]: grade
    }));
  };



  const validateGrades = () => {
    if (!selectedStudent) {
      setMessage({ type: 'error', text: 'Please select a student' });
      return false;
    }

    if (courses.length === 0) {
      setMessage({ type: 'error', text: 'No enrolled courses found for this student' });
      return false;
    }

    // Check grades for all regular courses (grades are always required for regular courses)
    const regularCourses = courses.filter(course => course.type !== 'NPTEL');
    const missingGrades = regularCourses.filter(course => !grades[course._id]);
    if (missingGrades.length > 0) {
      setMessage({ type: 'error', text: 'Please select grades for all regular courses' });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateGrades()) return;
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    setShowConfirmModal(false);

    try {
      const gradesArray = courses.map(course => {
        const gradeValue = grades[course._id];

        return {
          courseId: course._id,
          grade: gradeValue,
          includeInGPA: true // All graded courses are included in GPA calculation
        };
      });

      await api.post('/staff/grades/submit', {
        studentId: selectedStudent.studentId,
        semester: selectedStudent.semester,
        grades: gradesArray
      });

      setMessage({ type: 'success', text: 'Grades entered successfully' });

      // Reset form
      setSelectedStudent(null);
      setSearchQuery('');
      setCourses([]);
      setGrades({});
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to enter grades'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setCourses([]);
    setGrades({});
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Enter Grades</h1>

            {message.text && (
              <div
                className={`mb-4 p-4 rounded ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-400'
                    : 'bg-red-100 text-red-700 border border-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Student *
                </label>
                <div className="relative" ref={searchRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Type student ID or name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((student) => (
                        <div
                          key={student._id}
                          onClick={() => selectStudent(student)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{student.studentId} - {student.name}</div>
                          <div className="text-sm text-gray-500">
                            Semester: {student.semester} | Department: {student.department}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedStudent && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <h3 className="font-medium text-blue-900">Selected Student</h3>
                  <p className="text-blue-700">
                    {selectedStudent.studentId} - {selectedStudent.name}
                  </p>
                  <p className="text-sm text-blue-600">
                    Semester: {selectedStudent.semester} | Department: {selectedStudent.department}
                  </p>
                </div>
              )}

              {courses.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course Code
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade *
                        </th>


                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course._id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {course.courseCode}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {course.courseName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {course.credits}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <select
                              value={grades[course._id] || ''}
                              onChange={(e) => handleGradeChange(course._id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select Grade</option>
                              {gradeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>


                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedStudent || courses.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Grades'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Grading Scale:</strong> O = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5, F = 0
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Select grades for all enrolled courses and submit them together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Grade Submission</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Student:</strong> {selectedStudent?.studentId} - {selectedStudent?.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Semester:</strong> {selectedStudent?.semester}
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-gray-700 mb-2">Grades to be submitted:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {courses.map(course => (
                      <li key={course._id}>
                        {course.courseCode}: {grades[course._id]} ({gradeOptions.find(g => g.value === grades[course._id])?.points} points)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={confirmSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterGrades;
