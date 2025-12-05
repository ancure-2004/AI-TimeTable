import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VersionHistory = ({ timetableId, onClose, onRevert }) => {
  const [history, setHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [timetableId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/timetables/${timetableId}/history`
      );
      setHistory(response.data.history || []);
      setCurrentVersion(response.data.currentVersion || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load version history');
      setLoading(false);
    }
  };

  const handleRevert = async (versionNumber) => {
    if (!window.confirm(`Are you sure you want to revert to Version ${versionNumber}? This will create a new version with the old schedule.`)) {
      return;
    }

    try {
      setReverting(true);
      setError('');

      // Get user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id || userData._id;

      const response = await axios.post(
        `http://localhost:5000/timetables/${timetableId}/revert/${versionNumber}`,
        { userId }
      );

      setReverting(false);
      alert(`Successfully reverted to Version ${versionNumber}. Current version is now ${response.data.timetable.currentVersion}.`);
      
      // Call parent component's revert handler to refresh timetable
      if (onRevert) {
        onRevert(response.data.timetable);
      }
      
      onClose();
    } catch (error) {
      console.error('Error reverting:', error);
      setReverting(false);
      setError('Failed to revert to this version');
      alert('Failed to revert: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionIcon = (versionNumber) => {
    if (versionNumber === currentVersion) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Current
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-600 mt-1">
                Current Version: {currentVersion} • {history.length} versions
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-red-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No edit history yet</p>
              <p className="text-sm text-gray-500">History will be created when you save changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {history.map((version, index) => (
                  <div
                    key={version._id || index}
                    className={`relative pb-8 ${index === history.length - 1 ? 'pb-0' : ''}`}
                  >
                    {/* Timeline line */}
                    {index !== history.length - 1 && (
                      <div className="absolute top-5 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                    )}

                    <div className="relative flex items-start group">
                      {/* Timeline dot */}
                      <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        version.versionNumber === currentVersion
                          ? 'bg-green-500 ring-4 ring-green-100'
                          : 'bg-gray-300 ring-4 ring-gray-100'
                      }`}>
                        <span className="text-white text-sm font-semibold">
                          {version.versionNumber}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="ml-4 flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                Version {version.versionNumber}
                              </h4>
                              {getVersionIcon(version.versionNumber)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {version.changeDescription || 'No description'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {version.editedBy?.firstName} {version.editedBy?.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDate(version.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          {version.versionNumber !== currentVersion && (
                            <div className="ml-4">
                              <button
                                onClick={() => handleRevert(version.versionNumber)}
                                disabled={reverting}
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {reverting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Reverting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Revert
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  About Version History
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Each time you save changes, a new version is created</li>
                  <li>• You can revert to any previous version at any time</li>
                  <li>• Reverting creates a new version (no data is lost)</li>
                  <li>• All changes are tracked with timestamp and editor info</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
