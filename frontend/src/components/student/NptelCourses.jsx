import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const NptelCourses = () => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchAvailableCourses = async (query = '') => {
    setLoading(true);
    try {
      const response = await api.get('/student/nptel/courses', {
        params: { query: query || 'NPTEL', maxResults: 20 }
      });
      setAvailableCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching NPTEL courses:', error);
      setMessage({ type: 'error', text: 'Failed to fetch NPTEL courses' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get('/student/nptel/enrolled');
      setEnrolledCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching enrolled NPTEL courses:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchAvailableCourses(searchQuery.trim());
    }
  };

  const handleEnroll = async (course) => {
    setEnrolling(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/student/nptel/enroll', {
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        videoUrl: course.videoUrl,
        instructor: course.instructor
      });

      setMessage({ type: 'success', text: 'Successfully enrolled in NPTEL course!' });
      fetchEnrolledCourses();

      // Remove from available courses
      setAvailableCourses(prev => prev.filter(c => c.courseId !== course.courseId));
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to enroll in course'
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleDrop = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this NPTEL course?')) {
      return;
    }

    try {
      await api.delete(`/student/nptel/courses/${courseId}`);
      setMessage({ type: 'success', text: 'Successfully dropped NPTEL course!' });
      fetchEnrolledCourses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to drop course'
      });
    }
  };

  const handleAccess = async (courseId) => {
    try {
      await api.put(`/student/nptel/courses/${courseId}/access`);
      // Update local state to reflect new access time
      setEnrolledCourses(prev =>
        prev.map(course =>
          course.courseId === courseId
            ? { ...course, lastAccessedAt: new Date().toISOString() }
            : course
        )
      );
    } catch (error) {
      console.error('Error updating access time:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">NPTEL Courses</h1>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === 'available'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Available Courses
              </button>
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === 'enrolled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                My Enrolled Courses ({enrolledCourses.length})
              </button>
            </div>
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

          {activeTab === 'available' && (
            <div>
              {/* Search Form */}
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search NPTEL courses (e.g., Data Structures, Machine Learning)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>
                <p className="text-sm text-gray-600 mt-2">
                  Search for NPTEL courses by topic. Leave empty to see general NPTEL courses.
                </p>
              </div>

              {/* Available Courses */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : availableCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map((course) => (
                    <div
                      key={course.courseId}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                    >
                      {course.thumbnailUrl && (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {course.description || 'No description available'}
                        </p>
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex justify-between">
                            <span>Instructor:</span>
                            <span className="font-medium">{course.instructor}</span>
                          </div>
                          {course.publishedAt && (
                            <div className="flex justify-between">
                              <span>Published:</span>
                              <span>{formatDate(course.publishedAt)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnroll(course)}
                            disabled={enrolling}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
                          >
                            {enrolling ? 'Enrolling...' : 'Enroll'}
                          </button>
                          <a
                            href={course.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleAccess(course.courseId)}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-center text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500 mb-4">No NPTEL courses found</p>
                  <p className="text-sm text-gray-400">
                    Try searching with different keywords or check back later
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'enrolled' && (
            <div>
              {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses
                    .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
                    .map((course) => (
                    <div
                      key={course.courseId}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                    >
                      {course.thumbnailUrl && (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {course.description || 'No description available'}
                        </p>
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex justify-between">
                            <span>Instructor:</span>
                            <span className="font-medium">{course.instructor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Enrolled:</span>
                            <span>{formatDate(course.enrolledAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Accessed:</span>
                            <span>{formatDate(course.lastAccessedAt)}</span>
                          </div>
                          {course.dropped && (
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-medium text-red-600">Dropped</span>
                            </div>
                          )}
                          {course.gradePoints !== undefined && (
                            <div className="flex justify-between">
                              <span>Grade:</span>
                              <span className="font-medium text-green-600">
                                {course.letterGrade} ({course.gradePoints} points)
                              </span>
                            </div>
                          )}
                          {course.semester && (
                            <div className="flex justify-between">
                              <span>Semester:</span>
                              <span className="font-medium">{course.semester}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={course.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleAccess(course.courseId)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center text-sm"
                          >
                            Continue Learning
                          </a>
                          <button
                            onClick={() => handleDrop(course.courseId)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Drop
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500 mb-4">No enrolled NPTEL courses yet</p>
                  <p className="text-sm text-gray-400">
                    Browse available courses and start learning!
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NptelCourses;
