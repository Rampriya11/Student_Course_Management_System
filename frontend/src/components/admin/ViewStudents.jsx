import { useState, useEffect, useCallback } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import api from '../../api/axios';
import Select from 'react-select';

const ViewStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: '',
    regulation: '',
    department: '',
    course: '',
    status: ''
  });
  const [dropdownOptions, setDropdownOptions] = useState({
    semesters: [],
    regulations: [],
    departments: [],
    courses: []
  });

  const fetchDropdownOptions = useCallback(async () => {
    try {
      // Fetch regulations
      const regulationsResponse = await api.get('/admin/regulations');
      const regulations = regulationsResponse.data.data.map(reg => ({
        value: reg.year.toString(),
        label: `${reg.year} - ${reg.name}`
      }));

      // Fetch courses
      const coursesResponse = await api.get('/admin/courses');
      const courses = coursesResponse.data.data.map(course => ({
        value: course._id,
        label: `${course.courseCode} - ${course.courseName}`
      }));

      // Static departments
      const departments = [
        'Information Technology',
        'Computer Science Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Artificial Intelligence and Data Science'
      ].map(dept => ({
        value: dept,
        label: dept
      }));

      // Static semesters (1-8)
      const semesters = Array.from({ length: 8 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Semester ${i + 1}`
      }));

      setDropdownOptions({
        semesters,
        regulations,
        departments,
        courses
      });
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.regulation) params.append('regulation', filters.regulation);
      if (filters.department) params.append('department', filters.department);
      if (filters.course) params.append('course', filters.course);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/admin/students?${params.toString()}`);
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDropdownOptions();
    fetchStudents();
  }, [fetchDropdownOptions, fetchStudents]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.regulation) params.append('regulation', filters.regulation);
      if (filters.department) params.append('department', filters.department);
      if (filters.course) params.append('course', filters.course);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/admin/students/export?${params.toString()}`);

      if (response.data.filePath) {
        window.open(`${api.defaults.baseURL.replace('/api', '')}${response.data.filePath}`, '_blank');
      }
    } catch (error) {
      console.error('Error exporting students:', error);
      alert('Failed to export students');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">View Students</h1>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Export to Excel
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <Select
                  value={filters.semester ? { value: filters.semester, label: `Semester ${filters.semester}` } : null}
                  onChange={(selectedOption) => {
                    const newSemester = selectedOption ? selectedOption.value : '';
                    setFilters({ ...filters, semester: newSemester });
                  }}
                  options={[
                    { value: '', label: 'All Semesters' },
                    ...dropdownOptions.semesters
                  ]}
                  isSearchable={true}
                  placeholder="Select Semester"
                  className="w-full"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      minHeight: '2.5rem'
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#9ca3af'
                    })
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regulation
                </label>
                <Select
                  value={filters.regulation ? dropdownOptions.regulations.find(reg => reg.value === filters.regulation) : null}
                  onChange={(selectedOption) => setFilters({ ...filters, regulation: selectedOption ? selectedOption.value : '' })}
                  options={[
                    { value: '', label: 'All Regulations' },
                    ...dropdownOptions.regulations
                  ]}
                  isSearchable={true}
                  placeholder="Select Regulation"
                  className="w-full"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      minHeight: '2.5rem'
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#9ca3af'
                    })
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Select
                  value={filters.department ? dropdownOptions.departments.find(dept => dept.value === filters.department) : null}
                  onChange={(selectedOption) => setFilters({ ...filters, department: selectedOption ? selectedOption.value : '' })}
                  options={[
                    { value: '', label: 'All Departments' },
                    ...dropdownOptions.departments
                  ]}
                  isSearchable={true}
                  placeholder="Select Department"
                  className="w-full"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      minHeight: '2.5rem'
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#9ca3af'
                    })
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                {(() => {
                  const courseOptions = [
                    { value: '', label: 'All Courses' },
                    ...dropdownOptions.courses
                  ];
                  return (
                    <Select
                      value={courseOptions.find(option => option.value === filters.course) || null}
                      onChange={(selectedOption) => setFilters({ ...filters, course: selectedOption ? selectedOption.value : '' })}
                      options={courseOptions}
                      isSearchable={true}
                      placeholder="Select Course"
                      className="w-full"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          minHeight: '2.5rem'
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#9ca3af'
                        })
                      }}
                    />
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={filters.status ? { value: filters.status, label: filters.status.charAt(0).toUpperCase() + filters.status.slice(1) } : null}
                  onChange={(selectedOption) => setFilters({ ...filters, status: selectedOption ? selectedOption.value : '' })}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'enrolled', label: 'Enrolled' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  isSearchable={false}
                  placeholder="Select Status"
                  className="w-full"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      minHeight: '2.5rem'
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#9ca3af'
                    })
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">
                  Total Students: <span className="font-semibold">{students.length}</span>
                </p>
              </div>
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
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Regulation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      {filters.course && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.regulation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.cgpa || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student.email || 'N/A'}
                        </td>
                        {filters.course && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.courseStatus ? student.courseStatus.charAt(0).toUpperCase() + student.courseStatus.slice(1) : 'N/A'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ViewStudents;
