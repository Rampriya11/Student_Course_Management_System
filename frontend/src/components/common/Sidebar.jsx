import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/upload-staff', label: 'Upload Staff', icon: '👥' },
    { path: '/admin/manage-staff', label: 'Manage Staff', icon: '⚙️' },
    { path: '/admin/upload-courses', label: 'Upload Courses', icon: '📚' },
    { path: '/admin/manage-courses', label: 'Manage Courses', icon: '📖' },
    { path: '/admin/manage-regulations', label: 'Regulations', icon: '📋' },
    { path: '/admin/view-students', label: 'View Students', icon: '👨‍🎓' }
  ];

  const staffLinks = [
    { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/staff/upload-students', label: 'Upload Students', icon: '👥' },
    { path: '/staff/manage-students', label: 'Manage Students', icon: '⚙️' },
    { path: '/staff/enter-grades', label: 'Enter Grades', icon: '✍️' },
    { path: '/staff/view-grades', label: 'View Grades', icon: '📈' }
  ];

  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/student/profile', label: 'Profile', icon: '👤' },
    { path: '/student/available-courses', label: 'Available Courses', icon: '📚' },
    { path: '/student/enrolled-courses', label: 'My Courses', icon: '📖' },
    { path: '/student/grades', label: 'Grade Sheet', icon: '📄' }
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'staff':
        return staffLinks;
      case 'student':
        return studentLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <nav className="mt-8">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`flex items-center px-6 py-3 hover:bg-gray-700 transition ${
                  isActive(link.path) ? 'bg-gray-700 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="mr-3 text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;