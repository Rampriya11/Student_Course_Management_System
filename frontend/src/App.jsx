import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UploadStaff from './components/admin/UploadStaff';
import ManageStaff from './components/admin/ManageStaff';
import UploadCourses from './components/admin/UploadCourses';
import ManageCourses from './components/admin/ManageCourses';
import ManageRegulations from './components/admin/ManageRegulations';
import ViewStudents from './components/admin/ViewStudents';

// Staff Pages
import StaffDashboard from './pages/StaffDashboard';
import UploadStudents from './components/staff/UploadStudents';
import ManageStudents from './components/staff/ManageStudents';
import EnterGrades from './components/staff/EnterGrades';
import ViewGrades from './components/staff/ViewGrades';
import StaffProfile from './components/staff/Profile';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import Profile from './components/student/Profile';
import AvailableCourses from './components/student/AvailableCourses';
import EnrolledCourses from './components/student/EnrolledCourses';
import GradeSheet from './components/student/GradeSheet';
import NptelCourses from './components/student/NptelCourses';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes - Change Password */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UploadStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UploadCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-regulations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageRegulations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/view-students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViewStudents />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/upload-students"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <UploadStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/manage-students"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/enter-grades"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <EnterGrades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/view-grades"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <ViewGrades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/profile"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffProfile />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/available-courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AvailableCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrolled-courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <EnrolledCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/nptel-courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <NptelCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/grades"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <GradeSheet />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
