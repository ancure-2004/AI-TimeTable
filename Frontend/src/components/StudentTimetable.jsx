import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentTimetable();
  }, []);

  const fetchStudentTimetable = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/timetables/student/${user._id}`);
      setTimetable(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student timetable:', error);
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
              <h1 className="text-xl font-bold text-gray-900">My Timetable</h1>
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
              Your class timetable hasn't been published yet. Please contact your administrator.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        ) : timetable && timetable.timetable ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Timetable Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-indigo-500 to-purple-600">
              <h2 className="text-2xl font-bold text-white">
                {timetable.class?.name || 'Your Class Timetable'}
              </h2>
            </div>

            {/* Timetable Grid */}
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
                      {timetable.timetable.schedule.map((daySchedule, dayIndex) => (
                        <td key={dayIndex} className="border border-gray-300 px-2 py-2">
                          {daySchedule[slotIndex]?.length > 0 ? (
                            daySchedule[slotIndex].map((entry, entryIndex) => (
                              <div
                                key={entryIndex}
                                className={`mb-1 p-3 rounded ${
                                  entry.event
                                    ? 'bg-yellow-100 text-yellow-800 font-semibold text-center'
                                    : 'bg-linear-to-br from-blue-50 to-indigo-50 border-l-4 border-indigo-500'
                                }`}
                              >
                                {entry.event ? (
                                  <div className="text-sm">{entry.event}</div>
                                ) : (
                                  <>
                                    <div className="font-semibold text-indigo-900 text-sm">
                                      {entry.subject}
                                    </div>
                                    <div className="text-xs text-gray-700 mt-1">
                                      👨‍🏫 {entry.teacher}
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
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <svg className="h-5 w-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-700">Important Notes:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Please arrive at your classroom 5 minutes before the scheduled time</li>
                    <li>Lunch break is from 13:00 to 14:00</li>
                    <li>Contact your class representative for any room changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Timetable Available</h3>
            <p className="text-gray-600">
              Your class timetable hasn't been published yet. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
