import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SlotEditModal = ({ isOpen, onClose, slotData, timetableData, onSave }) => {
  const [formData, setFormData] = useState({
    slotType: 'class', // 'class', 'free', or 'event'
    subject: '',
    teacher: '',
    classroom: '',
    eventName: ''
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      initializeFormData();
    }
  }, [isOpen, slotData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subjects assigned to this class
      const subjectsResponse = await axios.get(
        `http://localhost:5000/class-subjects/class/${timetableData.class._id}`
      );
      setAvailableSubjects(subjectsResponse.data);

      // Fetch all classrooms
      const classroomsResponse = await axios.get('http://localhost:5000/classrooms');
      setAvailableClassrooms(classroomsResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const initializeFormData = () => {
    if (slotData.currentContent && slotData.currentContent.length > 0) {
      const content = slotData.currentContent[0];
      if (content.event) {
        setFormData({
          slotType: 'event',
          subject: '',
          teacher: '',
          classroom: '',
          eventName: content.event
        });
      } else {
        setFormData({
          slotType: 'class',
          subject: content.subject || '',
          teacher: content.teacher || '',
          classroom: content.classroom || '',
          eventName: ''
        });
      }
    } else {
      setFormData({
        slotType: 'free',
        subject: '',
        teacher: '',
        classroom: '',
        eventName: ''
      });
    }
  };

  const handleSubjectChange = (e) => {
    const selectedSubjectName = e.target.value;
    const subjectInfo = availableSubjects.find(
      (s) => s.subject.name === selectedSubjectName
    );

    if (subjectInfo) {
      setFormData({
        ...formData,
        subject: selectedSubjectName,
        teacher: subjectInfo.teacher.name || ''
      });
    }
  };

  const handleSave = () => {
    // Validate based on slot type
    if (formData.slotType === 'class') {
      if (!formData.subject || !formData.teacher || !formData.classroom) {
        setError('Please fill all required fields for a class');
        return;
      }
    } else if (formData.slotType === 'event') {
      if (!formData.eventName.trim()) {
        setError('Please enter an event name');
        return;
      }
    }

    // Prepare data to save
    let slotContent;
    if (formData.slotType === 'free') {
      slotContent = [];
    } else if (formData.slotType === 'event') {
      slotContent = [{ event: formData.eventName }];
    } else {
      slotContent = [{
        subject: formData.subject,
        teacher: formData.teacher,
        classroom: formData.classroom
      }];
    }

    onSave({
      day: slotData.day,
      slot: slotData.slot,
      content: slotContent
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Time Slot</h2>
              <p className="text-sm text-gray-600 mt-1">
                {slotData.dayName} • {slotData.timeSlot}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Slot Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slot Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, slotType: 'class' })}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.slotType === 'class'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    📚 Class
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, slotType: 'free' })}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.slotType === 'free'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    🕐 Free
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, slotType: 'event' })}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.slotType === 'event'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    🎉 Event
                  </button>
                </div>
              </div>

              {/* Class Type Fields */}
              {formData.slotType === 'class' && (
                <div className="space-y-4">
                  {/* Subject Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a subject</option>
                      {availableSubjects.map((cs) => (
                        <option key={cs._id} value={cs.subject.name}>
                          {cs.subject.name} ({cs.subject.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Only subjects assigned to this class are shown
                    </p>
                  </div>

                  {/* Teacher Field (Auto-populated) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.teacher}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Select a subject first"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Teacher is automatically assigned based on subject
                    </p>
                  </div>

                  {/* Classroom Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Classroom <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.classroom}
                      onChange={(e) =>
                        setFormData({ ...formData, classroom: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a classroom</option>
                      {availableClassrooms.map((classroom) => (
                        <option key={classroom._id} value={classroom.name}>
                          {classroom.name} ({classroom.type}) - Capacity: {classroom.capacity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Event Type Fields */}
              {formData.slotType === 'event' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) =>
                      setFormData({ ...formData, eventName: e.target.value })
                    }
                    placeholder="e.g., Department Meeting, Workshop, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Free Slot Info */}
              {formData.slotType === 'free' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    This slot will be marked as free time with no scheduled class or event.
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ℹ️ Important Notes
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Changes will be validated for conflicts before saving</li>
                  <li>• Teacher availability and room clashes will be checked</li>
                  <li>• This creates a new version in the edit history</li>
                  <li>• Lunch break slot (13:00-14:00) should remain free</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotEditModal;
