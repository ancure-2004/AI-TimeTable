import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">
                AI Timetable Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* User Info Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user?.firstName}!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-gray-900">{user?.phone || 'N/A'}</p>
              </div>
              
              {isTeacher && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specialization</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.specialization || 'N/A'}</p>
                  </div>
                </>
              )}
              
              {isStudent && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Enrollment Number</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.enrollmentNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Program</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.program}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Semester</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Section</p>
                    <p className="mt-1 text-sm text-gray-900">{user?.section}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAdmin && (
                <>
                  {/* Academic Structure Section */}
                  <div className="col-span-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Academic Structure</h4>
                  </div>
                  
                  <button
                    onClick={() => navigate('/departments')}
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-left"
                  >
                    <div className="text-purple-600 font-semibold mb-1">Departments</div>
                    <div className="text-sm text-gray-600">Manage departments</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/programs')}
                    className="p-4 bg-pink-50 rounded-lg hover:bg-pink-100 text-left"
                  >
                    <div className="text-pink-600 font-semibold mb-1">Programs</div>
                    <div className="text-sm text-gray-600">Manage degree programs</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/classes')}
                    className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 text-left"
                  >
                    <div className="text-cyan-600 font-semibold mb-1">Classes</div>
                    <div className="text-sm text-gray-600">Manage student classes</div>
                  </button>

                  {/* Resources Section */}
                  <div className="col-span-3 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Resources</h4>
                  </div>
                  
                  <button
                    onClick={() => navigate('/subjects')}
                    className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-left"
                  >
                    <div className="text-indigo-600 font-semibold mb-1">Subjects</div>
                    <div className="text-sm text-gray-600">Manage subjects</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/teachers')}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-left"
                  >
                    <div className="text-green-600 font-semibold mb-1">Teachers</div>
                    <div className="text-sm text-gray-600">Manage teachers</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/classrooms')}
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-left"
                  >
                    <div className="text-purple-600 font-semibold mb-1">Classrooms</div>
                    <div className="text-sm text-gray-600">Manage classrooms</div>
                  </button>

                  {/* Timetable Section */}
                  <div className="col-span-3 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Timetable Management</h4>
                  </div>
                  
                  <button
                    onClick={() => navigate('/assign-subjects')}
                    className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 text-left"
                  >
                    <div className="text-orange-600 font-semibold mb-1">Assign Subjects</div>
                    <div className="text-sm text-gray-600">Assign subjects to classes</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/view-timetables')}
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-left"
                  >
                    <div className="text-blue-600 font-semibold mb-1">View Timetables</div>
                    <div className="text-sm text-gray-600">View all class timetables</div>
                  </button>

                  <button
                    onClick={() => navigate('/users')}
                    className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 text-left"
                  >
                    <div className="text-yellow-600 font-semibold mb-1">Users</div>
                    <div className="text-sm text-gray-600">Manage users</div>
                  </button>
                </>
              )}
              
              {isTeacher && (
                <>
                  <button
                    onClick={() => alert('My Timetable - Coming Soon')}
                    className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-left"
                  >
                    <div className="text-indigo-600 font-semibold mb-1">My Timetable</div>
                    <div className="text-sm text-gray-600">View your schedule</div>
                  </button>
                  
                  <button
                    onClick={() => alert('My Subjects - Coming Soon')}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-left"
                  >
                    <div className="text-green-600 font-semibold mb-1">My Subjects</div>
                    <div className="text-sm text-gray-600">Subjects you teach</div>
                  </button>
                </>
              )}
              
              {isStudent && (
                <>
                  <button
                    onClick={() => alert('My Timetable - Coming Soon')}
                    className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-left"
                  >
                    <div className="text-indigo-600 font-semibold mb-1">My Timetable</div>
                    <div className="text-sm text-gray-600">View your schedule</div>
                  </button>
                  
                  <button
                    onClick={() => alert('My Courses - Coming Soon')}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-left"
                  >
                    <div className="text-green-600 font-semibold mb-1">My Courses</div>
                    <div className="text-sm text-gray-600">Enrolled courses</div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {isAdmin && 'You have full access to manage the timetable system.'}
                {isTeacher && 'Your teaching schedule will be available once admin generates the timetable.'}
                {isStudent && 'Your class schedule will be available once admin generates the timetable.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
