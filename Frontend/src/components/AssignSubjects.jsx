import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AssignSubjects = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    preferredRoom: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAssignments(selectedClass);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes, teachersRes, classroomsRes] = await Promise.all([
        axios.get('http://localhost:5000/classes'),
        axios.get('http://localhost:5000/subjects'),
        axios.get('http://localhost:5000/teachers'),
        axios.get('http://localhost:5000/classrooms')
      ]);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
      setClassrooms(classroomsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const fetchAssignments = async (classId) => {
    try {
      const response = await axios.get(`http://localhost:5000/class-subjects/class/${classId}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.classId || !formData.subjectId || !formData.teacherId) {
      setError('Class, subject, and teacher are required');
      return;
    }

    const payload = {
      classId: formData.classId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      preferredRoom: formData.preferredRoom || null
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/class-subjects/${editingId}`, {
          teacherId: payload.teacherId,
          preferredRoom: payload.preferredRoom
        });
        setSuccess('Assignment updated successfully');
      } else {
        await axios.post('http://localhost:5000/class-subjects/add', payload);
        setSuccess('Subject assigned to class successfully');
      }
      
      setFormData({ classId: selectedClass || '', subjectId: '', teacherId: '', preferredRoom: '' });
      setEditingId(null);
      if (selectedClass) {
        fetchAssignments(selectedClass);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      classId: assignment.class._id,
      subjectId: assignment.subject._id,
      teacherId: assignment.teacher._id,
      preferredRoom: assignment.preferredRoom?._id || ''
    });
    setEditingId(assignment._id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;

    try {
      await axios.delete(`http://localhost:5000/class-subjects/${id}`);
      setSuccess('Assignment removed successfully');
      if (selectedClass) {
        fetchAssignments(selectedClass);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting assignment');
    }
  };

  const handleCancel = () => {
    setFormData({ classId: selectedClass || '', subjectId: '', teacherId: '', preferredRoom: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setFormData({ classId, subjectId: '', teacherId: '', preferredRoom: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  // Calculate total lectures for selected class
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
          <p className="mt-4 text-gray-600">Loading data...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Assign Subjects to Classes</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-blue-700">
            <strong>Step 1:</strong> Select a class below. <strong>Step 2:</strong> Assign subjects with teachers to that class.
          </p>
        </div>

        {/* Class Selection */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Step 1: Select Class</h2>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
          >
            <option value="">-- Select a Class --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} ({cls.code}) - Semester {cls.semester}
              </option>
            ))}
          </select>

          {selectedClass && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Class selected: <strong>{classes.find(c => c._id === selectedClass)?.name}</strong>
              </p>
              <p className="text-sm text-green-700 mt-1">
                Total lectures assigned: <strong>{calculateTotalLectures()} slots per week</strong> 
                {calculateTotalLectures() > 35 && <span className="text-red-600"> (⚠️ Exceeds 35 available slots!)</span>}
              </p>
            </div>
          )}
        </div>

        {/* Assignment Form */}
        {selectedClass && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Step 2: {editingId ? 'Edit Assignment' : 'Assign Subject to Class'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={editingId} // Can't change subject when editing
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code}) - {subject.lectures_per_week} lectures/week
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher *
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Room (Optional)
                  </label>
                  <select
                    value={formData.preferredRoom}
                    onChange={(e) => setFormData({ ...formData, preferredRoom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No preference</option>
                    {classrooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingId ? 'Update Assignment' : 'Assign Subject'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Assignments List */}
        {selectedClass && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Assigned Subjects ({assignments.length})
              </h2>
              <button
                onClick={() => navigate(`/generate-timetable-new/${selectedClass}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Generate Timetable →
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No subjects assigned to this class yet. Assign subjects using the form above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lectures/Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preferred Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.subject?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {assignment.subject?.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {assignment.subject?.lectures_per_week}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{assignment.teacher?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {assignment.preferredRoom?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedClass && classes.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              No classes found. Please{' '}
              <button
                onClick={() => navigate('/classes')}
                className="underline font-semibold"
              >
                create classes
              </button>{' '}
              first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignSubjects;
