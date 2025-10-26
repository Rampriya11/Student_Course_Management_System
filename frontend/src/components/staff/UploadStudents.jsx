import { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';
import { downloadTemplate } from '../../utils/excelHelper';

const UploadStudents = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [successfulResults, setSuccessfulResults] = useState([]);
  const [errorResults, setErrorResults] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage({ type: '', text: '' });
    setSuccessfulResults([]);
    setErrorResults([]);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate('students');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/staff/upload-students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessfulResults(response.data.data || []);
      setErrorResults(response.data.errors || []);

      if (response.data.errors && response.data.errors.length > 0) {
        setMessage({ 
          type: 'warning', 
          text: `${response.data.message}. Found ${response.data.errors.length} validation errors.` 
        });
      } else {
        setMessage({ type: 'success', text: response.data.message });
      }
      setFile(null);
      e.target.reset();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Students</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Download the Excel template and fill in student details</li>
                <li>Required fields: StudentID, Name, DOB, Department, Program, AdmissionYear, Semester, Regulation</li>
                <li>Optional fields: Contact, Email, FatherName, MotherName, ParentContact, Address</li>
                <li>Date format for DOB: YYYY-MM-DD</li>
                <li>Default password will be: StudentID + DOB (YYYYMMDD)</li>
              </ul>
              
              <button
                onClick={handleDownloadTemplate}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Download Template
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Excel File</h2>

              {message.text && (
                <div
                  className={`mb-4 p-4 rounded ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-700 border border-green-400'
                      : message.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-400'
                      : 'bg-red-100 text-red-700 border border-red-400'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Excel File (.xlsx, .xls)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Students'}
                </button>
              </form>
            </div>

            {(successfulResults.length > 0 || errorResults.length > 0) && (
              <>
                {successfulResults.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Successfully Processed Students ({successfulResults.length})</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Student ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Semester
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {successfulResults.map((student, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {student.studentId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {student.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {student.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {student.semester}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    student.status === 'created'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {student.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {errorResults.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Validation Errors ({errorResults.length})</h2>
                    <div className="space-y-2">
                      {errorResults.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadStudents;