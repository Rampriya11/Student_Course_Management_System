import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    dob: '',
    email: '',
    contact: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/staff/profile');
      setProfile(response.data.data);
      setFormData({
        staffName: response.data.data.staffName || '',
        dob: response.data.data.dob ? new Date(response.data.data.dob).toISOString().split('T')[0] : '',
        email: response.data.data.email || '',
        contact: response.data.data.contact || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/staff/profile', formData);
      setProfile(response.data.data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      staffName: profile.staffName || '',
      dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      email: profile.email || '',
      contact: profile.contact || ''
    });
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

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
                      {profile.staffName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-6 mt-16">
                      <h2 className="text-2xl font-bold text-gray-800">{profile.staffName}</h2>
                      <p className="text-gray-600">{profile.staffId}</p>
                    </div>
                  </div>

                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Staff Name *
                          </label>
                          <input
                            type="text"
                            name="staffName"
                            value={formData.staffName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact
                          </label>
                          <input
                            type="tel"
                            name="contact"
                            value={formData.contact}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Personal Information
                        </h3>

                        <div>
                          <p className="text-sm text-gray-600">Staff Name</p>
                          <p className="font-medium">{profile.staffName}</p>
                        </div>

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
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{profile.email || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Professional Information
                        </h3>

                        <div>
                          <p className="text-sm text-gray-600">Staff ID</p>
                          <p className="font-medium">{profile.staffId}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium">{profile.department}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Role</p>
                          <p className="font-medium">{profile.role}</p>
                        </div>
                      </div>
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
