import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import api from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalRegulations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [staffRes, coursesRes, studentsRes, regulationsRes] = await Promise.all([
        api.get('/admin/staff'),
        api.get('/admin/courses'),
        api.get('/admin/students'),
        api.get('/admin/regulations')
      ]);

      setStats({
        totalStaff: staffRes.data.count || 0,
        totalCourses: coursesRes.data.count || 0,
        totalStudents: studentsRes.data.count || 0,
        totalRegulations: regulationsRes.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the admin panel</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Staff"
                value={stats.totalStaff}
                icon="👥"
                color="border-blue-500"
              />
              <StatCard
                title="Total Courses"
                value={stats.totalCourses}
                icon="📚"
                color="border-green-500"
              />
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon="👨‍🎓"
                color="border-purple-500"
              />
              <StatCard
                title="Total Regulations"
                value={stats.totalRegulations}
                icon="📋"
                color="border-orange-500"
              />
            </div>
          )}

          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/upload-staff"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <div className="text-2xl mb-2">📤</div>
                <p className="font-medium text-gray-800">Upload Staff</p>
              </a>
              
              <a
                href="/admin/upload-courses"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center"
              >
                <div className="text-2xl mb-2">📥</div>
                <p className="font-medium text-gray-800">Upload Courses</p>
              </a>
              
              <a
                href="/admin/manage-regulations"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <p className="font-medium text-gray-800">Manage Regulations</p>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;