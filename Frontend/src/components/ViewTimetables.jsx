import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewTimetables = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const response = await axios.get('http://localhost:5000/timetables');
      setTimetables(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching timetables:', error);
      setError('Failed to load timetables');
      setLoading(false);
    }
  };

  const handleView = async (timetableId) => {
    try {
      const response = await axios.get(`http://localhost:5000/timetables/${timetableId}`);
      setSelectedTimetable(response.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Failed to load timetable details');
    }
  };

  const handlePublish = async (timetableId) => {
    if (!window.confirm('Are you sure you want to publish this timetable? Students and teachers will be able to see it.')) return;

    try {
      await axios.put(`http://localhost:5000/timetables/${timetableId}/publish`);
      alert('Timetable published successfully');
      fetchTimetables();
      if (selectedTimetable && selectedTimetable._id === timetableId) {
        handleView(timetableId);
      }
    } catch (error) {
      alert('Error publishing timetable');
    }
  };

  const handleDelete = async (timetableId) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;

    try {
      await axios.delete(`http://localhost:5000/timetables/${timetableId}`);
      alert('Timetable deleted successfully');
      fetchTimetables();
      if (selectedTimetable && selectedTimetable._id === timetableId) {
        setSelectedTimetable(null);
      }
    } catch (error) {
      alert('Error deleting timetable');
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
          <p className="mt-4 text-gray-600">Loading timetables...</p>
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
              <h1 className="text-xl font-bold text-gray-900">View All Timetables</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timetables List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">All Timetables ({timetables.length})</h2>
              </div>

              {timetables.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="mb-4">No timetables generated yet.</p>
                  <button
                    onClick={() => navigate('/assign-subjects')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Assign Subjects & Generate
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {timetables.map((tt) => (
                    <div
                      key={tt._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedTimetable?._id === tt._id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => handleView(tt._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{tt.class?.name || 'Unnamed Class'}</h3>
                          <p className="text-sm text-gray-600">{tt.class?.code || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {tt.class?.program?.department?.name || 'Department'} • 
                            {tt.class?.program?.name || 'Program'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Semester {tt.semester} • Section {tt.class?.section || 'A'} • {tt.academicYear}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                tt.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : tt.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {tt.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {tt.status === 'draft' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(tt._id);
                              }}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tt._id);
                            }}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timetable Display */}
          <div className="lg:col-span-2">
            {selectedTimetable ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">{selectedTimetable.class?.name || 'Timetable'}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedTimetable.class?.program?.department?.name || 'Department'} • 
                    {selectedTimetable.class?.program?.name || 'Program'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedTimetable.class?.code} • Semester {selectedTimetable.semester} • 
                    Section {selectedTimetable.class?.section || 'A'} • {selectedTimetable.academicYear}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 text-sm rounded-full ${
                        selectedTimetable.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedTimetable.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                          Time
                        </th>
                        {dayNames.map((day, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 px-4 py-2 text-center font-semibold"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slotTimes.map((time, slotIndex) => (
                        <tr key={slotIndex}>
                          <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                            {time}
                          </td>
                          {selectedTimetable.schedule.map((daySchedule, dayIndex) => (
                            <td key={dayIndex} className="border border-gray-300 px-2 py-2">
                              {daySchedule[slotIndex]?.length > 0 ? (
                                daySchedule[slotIndex].map((entry, entryIndex) => (
                                  <div
                                    key={entryIndex}
                                    className={`mb-1 p-2 rounded text-sm ${
                                      entry.event
                                        ? 'bg-yellow-100 text-yellow-800 font-semibold text-center'
                                        : 'bg-blue-50 border-l-4 border-blue-500'
                                    }`}
                                  >
                                    {entry.event ? (
                                      <div>{entry.event}</div>
                                    ) : (
                                      <>
                                        <div className="font-semibold text-blue-900">
                                          {entry.subject}
                                        </div>
                                        <div className="text-xs text-gray-600">{entry.teacher}</div>
                                        <div className="text-xs text-gray-500">{entry.classroom}</div>
                                      </>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center text-gray-400 text-sm">Free</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-400">Select a timetable from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTimetables;
