import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : profile ? (
            <div className="max-w-4xl">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
                <div className="px-8 pb-8">
                  <div className="flex items-center -mt-16 mb-6">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white flex items-center justify-center text-4xl font-bold text-blue-600">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-6 mt-16">
                      <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                      <p className="text-gray-600">{profile.studentId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Personal Information
                      </h3>
                      
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">
                          {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium">{profile.contact || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Parent Number</p>
                        <p className="font-medium">{profile.parentContact || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{profile.email || 'N/A'}</p>
                      </div>

                      {profile.fatherName && (
                        <div>
                          <p className="text-sm text-gray-600">Father's Name</p>
                          <p className="font-medium">{profile.fatherName}</p>
                        </div>
                      )}

                      {profile.motherName && (
                        <div>
                          <p className="text-sm text-gray-600">Mother's Name</p>
                          <p className="font-medium">{profile.motherName}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Academic Information
                      </h3>

                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{profile.department}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Program</p>
                        <p className="font-medium">{profile.program}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Admission Year</p>
                        <p className="font-medium">{profile.admissionYear || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Current Semester</p>
                        <p className="font-medium">{profile.semester}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Regulation</p>
                        <p className="font-medium">{profile.regulation}</p>
                      </div>


                    </div>
                  </div>

                  {profile.address && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Address</h3>
                      <p className="text-gray-700">{profile.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Unable to load profile</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;