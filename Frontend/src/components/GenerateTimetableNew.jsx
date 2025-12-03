import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function GenerateTimetableNew() {
  const { classId } = useParams();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [solverResponse, setSolverResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const navigate = useNavigate();

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchAssignments();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/classes/${classId}`);
      setClassData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class:', error);
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/class-subjects/class/${classId}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleGenerateTimetable = async () => {
    setGenerating(true);
    setSolverResponse(null);

    try {
      const response = await axios.post(
        `http://localhost:5000/timetables/generate/${classId}`,
        {
          academicYear: academicYear,
          userId: user?._id
        }
      );
      setSolverResponse(response.data);
      setGenerating(false);
    } catch (error) {
      console.error('Error:', error);
      setSolverResponse(
        error.response?.data || {
          status: 'error',
          message: 'Failed to connect to server'
        }
      );
      setGenerating(false);
    }
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

  const calculateTotalLectures = () => {
    return assignments.reduce((sum, assignment) => {
      return sum + (assignment.subject?.lectures_per_week || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">Class not found</p>
          <button
            onClick={() => navigate('/assign-subjects')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Go Back
          </button>
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
                onClick={() => navigate('/assign-subjects')}
                className="text-indigo-600 hover:text-indigo-800 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Generate Timetable</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Class Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">{classData.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Class Code</p>
              <p className="font-semibold">{classData.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-semibold">{classData.program?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Semester</p>
              <p className="font-semibold">{classData.semester}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-semibold">{classData.section}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Subjects Assigned:</strong> {assignments.length} subjects
            </p>
            <p className="text-sm text-blue-700">
              <strong>Total Lectures:</strong> {calculateTotalLectures()} slots per week
              {calculateTotalLectures() > 35 && (
                <span className="text-red-600 font-semibold"> (⚠️ Exceeds 35 slots!)</span>
              )}
            </p>
          </div>
        </div>

        {/* Subjects List */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Subjects to Schedule</h3>
          {assignments.length === 0 ? (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-yellow-700">
                No subjects assigned to this class. Please{' '}
                <button
                  onClick={() => navigate('/assign-subjects')}
                  className="underline font-semibold"
                >
                  assign subjects
                </button>{' '}
                first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignments.map((assignment, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-semibold">{assignment.subject?.name}</p>
                  <p className="text-sm text-gray-600">
                    {assignment.subject?.code} • {assignment.subject?.lectures_per_week} lectures/week
                  </p>
                  <p className="text-sm text-gray-600">Teacher: {assignment.teacher?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Section */}
        {assignments.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
            <h3 className="text-xl font-bold mb-4">Generate Timetable</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-40 px-3 py-2 border border-gray-300 rounded-md mx-auto"
                placeholder="2024-25"
              />
            </div>
            
            <button 
              onClick={handleGenerateTimetable}
              disabled={generating || assignments.length === 0}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all ${
                generating || assignments.length === 0
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {generating ? (
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
        )}

        {/* Results */}
        {solverResponse && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {solverResponse.status === 'success' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-green-600">✓ Timetable Generated Successfully</h3>
                  <button
                    onClick={() => navigate('/view-timetables')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    View All Timetables
                  </button>
                </div>

                {/* Class Info Banner */}
                <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
                  <p className="font-semibold text-green-800">
                    Timetable for: {solverResponse.classInfo?.name} ({solverResponse.classInfo?.code})
                  </p>
                  <p className="text-sm text-green-700">Semester {solverResponse.classInfo?.semester}</p>
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
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-center text-red-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 text-center mb-2">Generation Failed</h3>
                <p className="text-gray-700 text-center mb-4">{solverResponse.message}</p>
                
                {solverResponse.details && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm">
                    <p className="font-semibold mb-2">Diagnostic Information:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>Lectures needed: {solverResponse.details.total_lectures_needed}</li>
                      <li>Available slots: {solverResponse.details.available_slots}</li>
                      <li>Teachers: {solverResponse.details.num_teachers}</li>
                      <li>Classrooms: {solverResponse.details.num_classrooms}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GenerateTimetableNew;
