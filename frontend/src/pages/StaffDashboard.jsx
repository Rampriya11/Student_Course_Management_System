import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import api from '../api/axios';

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/staff/students');
      setStats({
        totalStudents: response.data.count || 0
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
            <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the staff panel</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon="👨‍🎓"
                color="border-blue-500"
              />
            </div>
          )}

          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/staff/upload-students"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <div className="text-2xl mb-2">📤</div>
                <p className="font-medium text-gray-800">Upload Students</p>
              </a>

              <a
                href="/staff/manage-students"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <p className="font-medium text-gray-800">Manage Students</p>
              </a>

              <a
                href="/staff/enter-grades"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center"
              >
                <div className="text-2xl mb-2">✍️</div>
                <p className="font-medium text-gray-800">Enter Grades</p>
              </a>

              <a
                href="/staff/profile"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-2xl mb-2">👤</div>
                <p className="font-medium text-gray-800">My Profile</p>
              </a>
            </div>
          </div>


        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;