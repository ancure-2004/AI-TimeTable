import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const fetchTeachers = () => {
    fetch('http://localhost:5000/teachers/')
      .then(res => res.json())
      .then(data => setTeachers(data))
      .catch(err => console.error(err));
  };

  useEffect(() => fetchTeachers(), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/teachers/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    .then(res => res.json())
    .then(() => {
      fetchTeachers();
      setName('');
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
              <h1 className="text-xl font-bold text-gray-900">Manage Teachers</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Teacher Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Teacher</h2>
          
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              placeholder="Teacher Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <button 
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Add Teacher
            </button>
          </form>
        </div>

        {/* Teachers List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher, index) => (
                <tr key={teacher._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && (
            <div className="text-center py-12 text-gray-500">No teachers added yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Teachers;
