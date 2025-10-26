import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import api from '../api/axios';

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    totalCredits: 0,
    cgpa: 0
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/courses/enrolled')
      ]);

    setProfile(profileRes.data.data);

    console.log('Courses response:', coursesRes.data);

    // Only count completed courses and their credits
    const completedCourses = coursesRes.data.data?.completedCourses || [];
    const completedCredits = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

    setStats({
      enrolledCourses: completedCourses.length,
      totalCredits: completedCredits,
      cgpa: profileRes.data.data.cgpa || 0
    });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {profile?.name}!</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Completed Courses"
                  value={stats.enrolledCourses}
                  icon="📚"
                  color="border-blue-500"
                />
                <StatCard
                  title="Completed Credits"
                  value={stats.totalCredits}
                  icon="🎓"
                  color="border-green-500"
                />
                <StatCard
                  title="CGPA"
                  value={stats.cgpa.toFixed(2)}
                  icon="⭐"
                  color="border-purple-500"
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-semibold">{profile?.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold">{profile?.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Program</p>
                    <p className="font-semibold">{profile?.program}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Semester</p>
                    <p className="font-semibold">{profile?.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Regulation</p>
                    <p className="font-semibold">{profile?.regulation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{profile?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="/student/available-courses"
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                  >
                    <div className="text-2xl mb-2">📚</div>
                    <p className="font-medium text-gray-800">Browse Courses</p>
                  </a>
                  
                  <a
                    href="/student/enrolled-courses"
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center"
                  >
                    <div className="text-2xl mb-2">📖</div>
                    <p className="font-medium text-gray-800">My Courses</p>
                  </a>
                  
                  <a
                    href="/student/grades"
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center"
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <p className="font-medium text-gray-800">View Grades</p>
                  </a>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;