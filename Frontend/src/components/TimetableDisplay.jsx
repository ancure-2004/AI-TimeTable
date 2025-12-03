import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TimetableDisplay() {
  const [solverResponse, setSolverResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerateTimetable = () => {
    setLoading(true);
    setSolverResponse(null);

    fetch('http://localhost:5000/generate-timetable', {
      method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
      setSolverResponse(data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error connecting to backend.');
      setLoading(false);
    });
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slotTimes = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00', // Lunch
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00'
  ];

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
              <h1 className="text-xl font-bold text-gray-900">Generate Timetable</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Generate Button */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold mb-4">AI Timetable Generator</h2>
          <p className="text-gray-600 mb-6">Click the button below to generate an optimized timetable</p>
          
          <button 
            onClick={handleGenerateTimetable}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all ${
              loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Generate Timetable
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {solverResponse && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {solverResponse.status === 'success' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-green-600">✓ Timetable Generated Successfully</h3>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Time</th>
                        {dayNames.map((day, index) => (
                          <th key={index} className="border border-gray-300 px-4 py-2 text-center font-semibold">
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
                          {solverResponse.timetable.map((daySchedule, dayIndex) => (
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
                                        <div className="font-semibold text-blue-900">{entry.subject}</div>
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

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is a basic timetable. In future phases, we'll generate separate timetables for each class, teacher, and student.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-center text-red-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 text-center mb-2">Generation Failed</h3>
                <p className="text-gray-700 text-center">{solverResponse.message}</p>
              </div>
            )}
          </div>
        )}

        {!solverResponse && !loading && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-400">No timetable generated yet. Click the button above to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimetableDisplay;
