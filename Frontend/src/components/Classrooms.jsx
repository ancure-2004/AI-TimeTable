import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({ name: '', capacity: '' });
  const navigate = useNavigate();

  const fetchClassrooms = () => {
    fetch('http://localhost:5000/classrooms/')
      .then(res => res.json())
      .then(data => setClassrooms(data))
      .catch(err => console.error(err));
  };

  useEffect(() => fetchClassrooms(), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/classrooms/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(res => res.json())
    .then(() => {
      fetchClassrooms();
      setForm({ name: '', capacity: '' });
    })
    .catch(err => console.error(err));
  };

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
              <h1 className="text-xl font-bold text-gray-900">Manage Classrooms</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Classroom Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Classroom</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Room Name (e.g., Room 101)"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <input
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={e => setForm({...form, capacity: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              required
            />
            <button 
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Add Classroom
            </button>
          </form>
        </div>

        {/* Classrooms List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classrooms.map(classroom => (
                <tr key={classroom._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classroom.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classroom.capacity} students</td>
                </tr>
              ))}
            </tbody>
          </table>
          {classrooms.length === 0 && (
            <div className="text-center py-12 text-gray-500">No classrooms added yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Classrooms;
