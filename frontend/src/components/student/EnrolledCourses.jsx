import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const EnrolledCourses = () => {
  const [currentCourses, setCurrentCourses] = useState([]);
  const [backlogCourses, setBacklogCourses] = useState([]);
  const [droppedCourses, setDroppedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get('/student/courses/enrolled');
      const { currentCourses: curr, backlogCourses: back, droppedCourses: drop } = response.data.data;
      setCurrentCourses(curr || []);
      setBacklogCourses(back || []);
      setDroppedCourses(drop || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this NPTEL course?')) {
      return;
    }

    setDropping(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/student/courses/drop', {
        courseIds: [courseId]
      });

      setMessage({ type: 'success', text: 'Successfully dropped the NPTEL course!' });
      fetchEnrolledCourses(); // Refresh the list
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to drop course'
      });
    } finally {
      setDropping(false);
    }
  };

  const currentTotalCredits = currentCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const currentCompletedCredits = currentCourses.reduce((sum, course) => {
    if (course.status === 'completed') {
      return sum + (course.credits || 0);
    }
    return sum;
  }, 0);

  const backlogTotalCredits = backlogCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const droppedTotalCredits = droppedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

  const renderCourseList = (courses, title, totalCredits, completedCredits = 0) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      {courses.length > 0 ? (
        <div className="mb-4 space-y-1">
          <p className="text-gray-600">
            Total: {courses.length} courses | {totalCredits} credits
          </p>
          {completedCredits > 0 && (
            <p className="text-gray-600">
              Completed: {completedCredits} credits
            </p>
          )}
        </div>
      ) : null}
      <div className="space-y-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {course.courseCode}
                </h3>
                <h4 className="text-lg text-gray-700">{course.courseName}</h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  course.type === 'Core'
                    ? 'bg-blue-100 text-blue-800'
                    : course.type === 'Elective'
                    ? 'bg-green-100 text-green-800'
                    : course.type === 'Lab'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {course.type}
              </span>
            </div>

            {/* Status Badge */}
            {course.status && (
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    course.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : course.status === 'enrolled'
                      ? 'bg-blue-100 text-blue-800'
                      : course.status === 'backlog'
                      ? 'bg-red-100 text-red-800'
                      : course.status === 'dropped'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Status: {course.status}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Credits</p>
                <p className="font-semibold text-gray-800">{course.credits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Original Semester</p>
                <p className="font-semibold text-gray-800">{course.originalSemester || course.semester}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Regulation</p>
                <p className="font-semibold text-gray-800">{course.regulation}</p>
              </div>
              {course.department && (
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-gray-800">{course.department}</p>
                </div>
              )}
            </div>

            {/* Grade and Progress Info */}
            {(course.gradeEarned || course.creditPoints || (course.attempts && course.attempts > 1) || course.clearedSemester) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {course.gradeEarned && (
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-semibold text-gray-800">{course.gradeEarned}</p>
                  </div>
                )}
                {course.creditPoints !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Credit Points</p>
                    <p className="font-semibold text-gray-800">{course.creditPoints}</p>
                  </div>
                )}
                {course.attempts && course.attempts > 1 && (
                  <div>
                    <p className="text-sm text-gray-600">Attempts</p>
                    <p className="font-semibold text-gray-800">{course.attempts}</p>
                  </div>
                )}
                {course.clearedSemester && (
                  <div>
                    <p className="text-sm text-gray-600">Cleared Semester</p>
                    <p className="font-semibold text-gray-800">{course.clearedSemester}</p>
                  </div>
                )}
              </div>
            )}

            {course.staff && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Instructor(s)</p>
                <p className="font-medium text-gray-800">{course.staff}</p>
              </div>
            )}

            {/* Drop button for NPTEL courses */}
            {course.type === 'NPTEL' && course.status === 'enrolled' && (
              <div className="pt-4 border-t">
                <button
                  onClick={() => handleDropCourse(course._id)}
                  disabled={dropping}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-sm"
                >
                  {dropping ? 'Dropping...' : 'Drop Course'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
          </div>

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

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {renderCourseList(currentCourses, 'Current Courses', currentTotalCredits, currentCompletedCredits)}
              {renderCourseList(backlogCourses, 'Backlog Courses', backlogTotalCredits)}
              {renderCourseList(droppedCourses, 'Dropped Courses', droppedTotalCredits)}
              {currentCourses.length === 0 && backlogCourses.length === 0 && droppedCourses.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
                  <a
                    href="/student/available-courses"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Browse Available Courses
                  </a>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnrolledCourses;
