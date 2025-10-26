import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const GradeSheet = () => {
  const [grades, setGrades] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState('all');

  useEffect(() => {
    fetchGrades();
    fetchProfile();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await api.get('/student/grades');
      setGrades(response.data.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };



  const getLetterGrade = (gradePoints) => {
    switch (gradePoints) {
      case 10: return 'O';
      case 9: return 'A+';
      case 8: return 'A';
      case 7: return 'B+';
      case 6: return 'B';
      case 5: return 'C';
      default: return 'F';
    }
  };

  const calculateSemesterStats = (sem) => {
    const semGrades = grades.filter(g => g.semester === sem);
    const totalCredits = semGrades.reduce((sum, g) => sum + g.credits, 0);
    const totalPoints = semGrades.reduce((sum, g) => sum + (g.gradePoints * g.credits), 0);
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    return { totalCredits, gpa };
  };

  const semesters = [...new Set(grades.map(g => g.semester))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Grade Sheet</h1>

          {profile && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-semibold">{profile.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Semester</p>
                  <p className="font-semibold">{profile.semester}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CGPA</p>
                  <p className="font-semibold text-2xl text-purple-600">
                    {profile.cgpa || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Semester
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : grades.length > 0 ? (
            <>
              {semesters.map(semester => {
                const semGrades = semesterFilter === 'all' 
                  ? grades.filter(g => g.semester === semester)
                  : semesterFilter === semester.toString() 
                    ? grades.filter(g => g.semester === semester)
                    : [];

                if (semGrades.length === 0) return null;

                const stats = calculateSemesterStats(semester);

                return (
                  <div key={semester} className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                      <div className="flex justify-between items-center text-white">
                        <h3 className="text-lg font-bold">Semester {semester}</h3>
                        <div className="text-right">
                          <p className="text-sm">Credits: {stats.totalCredits}</p>
                          <p className="text-lg font-bold">GPA: {stats.gpa}</p>
                        </div>
                      </div>
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
                          {semGrades.map((grade) => (
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
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                  (grade.letterGrade === 'O' || grade.letterGrade === 'A+' || getLetterGrade(grade.gradePoints) === 'O' || getLetterGrade(grade.gradePoints) === 'A+') 
                                    ? 'bg-green-100 text-green-800'
                                    : (grade.letterGrade === 'A' || grade.letterGrade === 'B+' || getLetterGrade(grade.gradePoints) === 'A' || getLetterGrade(grade.gradePoints) === 'B+') 
                                    ? 'bg-blue-100 text-blue-800'
                                    : (grade.letterGrade === 'B' || grade.letterGrade === 'C' || getLetterGrade(grade.gradePoints) === 'B' || getLetterGrade(grade.gradePoints) === 'C') 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {grade.letterGrade || getLetterGrade(grade.gradePoints)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No grades available yet</p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">Grading Scale</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
              <div>O: 10 (Outstanding)</div>
              <div>A+: 9 (Excellent)</div>
              <div>A: 8 (Very Good)</div>
              <div>B+: 7 (Good)</div>
              <div>B: 6 (Above Average)</div>
              <div>C: 5 (Average)</div>
              <div>F: 0-4 (Fail)</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GradeSheet;