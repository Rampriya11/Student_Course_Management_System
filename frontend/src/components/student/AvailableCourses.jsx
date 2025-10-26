import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const AvailableCourses = () => {
  const [currentCourses, setCurrentCourses] = useState([]);
  const [backlogCourses, setBacklogCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      const response = await api.get('/student/courses/available');
      const { currentAvailableCourses, backlogCourses: backlogs } = response.data.data;
      setCurrentCourses(currentAvailableCourses || []);
      setBacklogCourses(backlogs || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one course' });
      return;
    }

    setEnrolling(true);
    setMessage({ type: '', text: '' });

    try {
      const enrollData = {
        courseIds: selectedCourses,
        selectedStaff: selectedStaff
      };
      await api.post('/student/courses/enroll', enrollData);
      setMessage({ type: 'success', text: 'Successfully enrolled in selected courses!' });
      setSelectedCourses([]);
      setSelectedStaff({});

      setTimeout(() => {
        fetchAvailableCourses();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to enroll in courses'
      });
    } finally {
      setEnrolling(false);
    }
  };

  const selectedCurrentCredits = selectedCourses.reduce((sum, courseId) => {
    const course = currentCourses.find(c => c._id === courseId);
    return sum + (course?.credits || 0);
  }, 0);

  const selectedBacklogCredits = selectedCourses.reduce((sum, courseId) => {
    const course = backlogCourses.find(c => c._id === courseId);
    return sum + (course?.credits || 0);
  }, 0);



  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Available Courses</h1>
            {selectedCourses.length > 0 && (
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected: {selectedCourses.length} courses | New Credits: {selectedCurrentCredits} (Backlogs: {selectedBacklogCredits} - not counted in limit)
                </p>
              </div>
            )}
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
          ) : currentCourses.length + backlogCourses.length > 0 ? (
            <>
              {/* Current Courses Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Courses (New Enrollments)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCourses.map((course) => (
                    <div
                      key={course._id}
                      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition ${
                        selectedCourses.includes(course._id)
                          ? 'border-2 border-blue-500 bg-blue-50'
                          : 'border-2 border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectCourse(course._id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          {course.courseCode}
                        </h3>
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course._id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600"
                        />
                      </div>
                      
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        {course.courseName}
                      </h4>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Credits:</span>
                          <span className="font-semibold">{course.credits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-semibold">{course.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Semester:</span>
                          <span className="font-semibold">{course.semester}</span>
                        </div>
                        {course.instructors && course.instructors.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-2">Select Instructor</p>
                            <div className="space-y-1">
                              {course.instructors.map((instructor, index) => (
                                <label key={index} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`instructor-${course._id}-radio`}
                                    value={instructor.trim()}
                                    checked={selectedStaff[course._id] === instructor.trim()}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, [course._id]: e.target.value })}
                                    disabled={!selectedCourses.includes(course._id)}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm text-gray-700">{instructor.trim()}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backlog Courses Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Backlog Courses (Re-enrollments)</h2>
                <p className="text-sm text-gray-600 mb-4">These courses can be re-enrolled without counting towards your credit limit.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {backlogCourses.map((course) => (
                    <div
                      key={course._id}
                      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition ${
                        selectedCourses.includes(course._id)
                          ? 'border-2 border-blue-500 bg-blue-50'
                          : 'border-2 border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectCourse(course._id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          {course.courseCode}
                        </h3>
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course._id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600"
                        />
                      </div>
                      
                      <div className="mb-2">
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mb-2">
                          Re-enroll (Attempt {course.attempts})
                        </span>
                      </div>
                      
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        {course.courseName}
                      </h4>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Credits:</span>
                          <span className="font-semibold text-gray-500">Not counted in limit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-semibold">{course.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Original Semester:</span>
                          <span className="font-semibold">{course.semester}</span>
                        </div>
                        {course.instructors && course.instructors.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-2">Select Instructor</p>
                            <div className="space-y-1">
                              {course.instructors.map((instructor, index) => (
                                <label key={index} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`instructor-${course._id}-radio`}
                                    value={instructor.trim()}
                                    checked={selectedStaff[course._id] === instructor.trim()}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, [course._id]: e.target.value })}
                                    disabled={!selectedCourses.includes(course._id)}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm text-gray-700">{instructor.trim()}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCourses.length > 0 && (
                <div className="fixed bottom-8 right-8">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : `Enroll in ${selectedCourses.length} Course${selectedCourses.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No available courses at the moment</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AvailableCourses;