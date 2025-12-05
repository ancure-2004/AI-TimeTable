import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TeacherTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('combined'); // 'combined' or 'individual'
  const [selectedClass, setSelectedClass] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeacherTimetable();
  }, []);

  const fetchTeacherTimetable = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/timetables/teacher/${user._id}`);
      setTimetableData(response.data);
      if (response.data.timetables && response.data.timetables.length > 0) {
        setSelectedClass(response.data.timetables[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      setError(error.response?.data?.message || 'Failed to load your timetable');
      setLoading(false);
    }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slotTimes = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00'
  ];

  // Extract teacher's classes from a single timetable schedule
  const getTeacherScheduleFromTimetable = (timetable) => {
    const teacherName = `${user.firstName} ${user.lastName}`;
    const schedule = [];
    
    if (timetable && timetable.schedule) {
      for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
        const daySchedule = [];
        for (let slotIndex = 0; slotIndex < 8; slotIndex++) {
          const slot = timetable.schedule[dayIndex][slotIndex];
          const teacherEntry = slot?.find(entry => entry.teacher === teacherName);
          daySchedule.push(teacherEntry || null);
        }
        schedule.push(daySchedule);
      }
    }
    
    return schedule;
  };

  // Combine all timetables to create teacher's complete weekly schedule
  const getCombinedTeacherSchedule = () => {
    if (!timetableData || !timetableData.timetables) return [];

    const teacherName = `${user.firstName} ${user.lastName}`;
    const combinedSchedule = [];

    // Initialize empty schedule (5 days x 8 slots)
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const daySchedule = [];
      for (let slotIndex = 0; slotIndex < 8; slotIndex++) {
        daySchedule.push([]);
      }
      combinedSchedule.push(daySchedule);
    }

    // Iterate through all timetables and extract teacher's classes
    timetableData.timetables.forEach(timetable => {
      if (timetable && timetable.schedule) {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          for (let slotIndex = 0; slotIndex < 8; slotIndex++) {
            const slot = timetable.schedule[dayIndex][slotIndex];
            const teacherEntries = slot?.filter(entry => entry.teacher === teacherName) || [];
            
            teacherEntries.forEach(entry => {
              // Add class name to the entry for context
              combinedSchedule[dayIndex][slotIndex].push({
                ...entry,
                className: timetable.class?.name || 'Unknown Class'
              });
            });
          }
        }
      }
    });

    return combinedSchedule;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  const combinedSchedule = timetableData ? getCombinedTeacherSchedule() : [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">My Teaching Schedule</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-red-600 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{error}</h3>
            <p className="text-gray-600 mb-6">
              No timetables have been published yet. Please contact your administrator.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        ) : timetableData && timetableData.timetables.length > 0 ? (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.department} • {user.specialization}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {timetableData.classes.length} Class{timetableData.classes.length !== 1 ? 'es' : ''}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {new Set(timetableData.classes.map(c => c.subject.name)).size} Subject{new Set(timetableData.classes.map(c => c.subject.name)).size !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classes List */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Classes:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timetableData.classes.map((classItem, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {classItem.class.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Subject: {classItem.subject.name} ({classItem.subject.code})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View Mode Selector */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">View Mode:</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('combined')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'combined'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📅 Complete Weekly Schedule
                  </button>
                  <button
                    onClick={() => setViewMode('individual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'individual'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📚 Class-wise Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Combined View */}
            {viewMode === 'combined' && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
                  <h2 className="text-2xl font-bold text-white">
                    Your Complete Weekly Schedule
                  </h2>
                  <p className="text-sm text-white text-opacity-90 mt-1">
                    All your classes across all sections in one view
                  </p>
                </div>

                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                          Time
                        </th>
                        {dayNames.map((day, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slotTimes.map((time, slotIndex) => (
                        <tr key={slotIndex} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium bg-gray-50 text-gray-700">
                            {time}
                          </td>
                          {combinedSchedule.map((daySchedule, dayIndex) => {
                            const entries = daySchedule[slotIndex];
                            return (
                              <td key={dayIndex} className="border border-gray-300 px-2 py-2">
                                {entries && entries.length > 0 ? (
                                  entries.map((entry, entryIndex) => (
                                    <div
                                      key={entryIndex}
                                      className={`mb-1 p-3 rounded ${
                                        entry.event
                                          ? 'bg-yellow-100 text-yellow-800 font-semibold text-center'
                                          : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-purple-500'
                                      }`}
                                    >
                                      {entry.event ? (
                                        <div className="text-sm">{entry.event}</div>
                                      ) : (
                                        <>
                                          <div className="font-semibold text-purple-900 text-sm">
                                            {entry.subject}
                                          </div>
                                          <div className="text-xs text-indigo-700 mt-1 font-medium">
                                            🎓 {entry.className}
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            📍 {entry.classroom}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-gray-400 text-sm py-2">Free</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <svg className="h-5 w-5 text-purple-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-700">Complete Weekly Overview:</p>
                      <p className="mt-1">
                        This view shows all your teaching slots across all classes in a single weekly schedule. 
                        Each entry displays the subject, class name, and room location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Class View */}
            {viewMode === 'individual' && (
              <>
                <div className="bg-white shadow rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class to View Schedule:
                  </label>
                  <select
                    value={selectedClass?._id || ''}
                    onChange={(e) => {
                      const selected = timetableData.timetables.find(t => t._id === e.target.value);
                      setSelectedClass(selected);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {timetableData.timetables.map((tt) => (
                      <option key={tt._id} value={tt._id}>
                        {tt.class?.name || 'Class'} - Semester {tt.semester}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClass && (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-teal-600">
                      <h2 className="text-2xl font-bold text-white">
                        {selectedClass.class?.name || 'Class Schedule'}
                      </h2>
                      <p className="text-sm text-white text-opacity-90 mt-1">
                        Your teaching schedule for this class only
                      </p>
                    </div>

                    <div className="p-6 overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                              Time
                            </th>
                            {dayNames.map((day, index) => (
                              <th
                                key={index}
                                className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700"
                              >
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {slotTimes.map((time, slotIndex) => {
                            const teacherSchedule = getTeacherScheduleFromTimetable(selectedClass);
                            return (
                              <tr key={slotIndex} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium bg-gray-50 text-gray-700">
                                  {time}
                                </td>
                                {teacherSchedule.map((daySchedule, dayIndex) => {
                                  const entry = daySchedule[slotIndex];
                                  return (
                                    <td key={dayIndex} className="border border-gray-300 px-2 py-2">
                                      {entry ? (
                                        entry.event ? (
                                          <div className="p-3 rounded bg-yellow-100 text-yellow-800 font-semibold text-center text-sm">
                                            {entry.event}
                                          </div>
                                        ) : (
                                          <div className="p-3 rounded bg-gradient-to-br from-green-50 to-teal-50 border-l-4 border-green-500">
                                            <div className="font-semibold text-green-900 text-sm">
                                              {entry.subject}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              📍 {entry.classroom}
                                            </div>
                                          </div>
                                        )
                                      ) : (
                                        <div className="text-center text-gray-400 text-sm py-2">Free</div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-start space-x-2 text-sm text-gray-600">
                        <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-700">Class-specific View:</p>
                          <p className="mt-1">
                            This schedule shows only your teaching slots for {selectedClass.class?.name}. 
                            Use the dropdown above to switch between different classes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teaching Schedule Available</h3>
            <p className="text-gray-600 mb-4">
              You haven't been assigned to any classes yet, or timetables haven't been published.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetable;
