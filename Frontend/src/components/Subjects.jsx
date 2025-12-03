import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', lectures_per_week: 1 });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSubjects = () => {
    fetch('http://localhost:5000/subjects/')
      .then(res => res.json())
      .then(data => setSubjects(data))
      .catch(err => console.error(err));
  };

  useEffect(() => fetchSubjects(), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/subjects/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(res => res.json())
    .then(() => {
      fetchSubjects();
      setForm({ name: '', code: '', lectures_per_week: 1 });
    })
    .catch(() => setError('Failed to add subject'));
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
              <h1 className="text-xl font-bold text-gray-900">Manage Subjects</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Subject Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Subject</h2>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Subject Name"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              placeholder="Subject Code"
              value={form.code}
              onChange={e => setForm({...form, code: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <input
              type="number"
              placeholder="Lectures/Week"
              value={form.lectures_per_week}
              onChange={e => setForm({...form, lectures_per_week: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              required
            />
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Subject
            </button>
          </form>
        </div>

        {/* Subjects List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lectures/Week</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map(subject => (
                <tr key={subject._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.lectures_per_week}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">No subjects added yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Subjects;
