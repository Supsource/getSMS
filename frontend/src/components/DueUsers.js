import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const DueUsers = () => {
  const [users, setUsers] = useState([]);
  const [smsSentUsers, setSmsSentUsers] = useState(JSON.parse(localStorage.getItem('smsSentUsers')) || []);
  const [error, setError] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(false); 
  const [loadingSms, setLoadingSms] = useState({}); // Loading state for sending SMS

  const fetchUsers = useCallback(() => {
    setLoadingFetch(true); 
    axios.get('http://127.0.0.1:5000/api/due-users')
      .then(res => {
        const usersWithoutSms = res.data.filter(user => !smsSentUsers.some(sentUser => sentUser['Contact Number'] === user['Contact Number']));
        setUsers(usersWithoutSms);
        setLoadingFetch(false); 
      })
      .catch(err => {
        console.error(err);
        setError('An error occurred while fetching users. Try Reloading!');
        setLoadingFetch(false);
      });
  }, [smsSentUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const sendSms = (user) => {
    setLoadingSms(prev => ({ ...prev, [user['Contact Number']]: true })); // Start loading for this user
    axios.post('http://127.0.0.1:5000/api/send-sms', { contactNumber: user['Contact Number'] })
      .then(() => {
        alert(`SMS sent to ${user.ownerName}!`);
        const updatedSmsSentUsers = [...smsSentUsers, user];
        setSmsSentUsers(updatedSmsSentUsers);
        localStorage.setItem('smsSentUsers', JSON.stringify(updatedSmsSentUsers));
        setUsers(users.filter(u => u['Contact Number'] !== user['Contact Number']));
        setLoadingSms(prev => ({ ...prev, [user['Contact Number']]: false })); // End loading for this user
      })
      .catch(err => {
        console.error(err);
        setError('An error occurred while sending SMS.');
        setLoadingSms(prev => ({ ...prev, [user['Contact Number']]: false })); 
      });
  };

  const exportCsv = () => {
    fetch('http://127.0.0.1:5000/api/export-csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_due_soon.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => {
        console.error(err);
        setError('An error occurred while exporting CSV.');
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 bg-white min-h-screen font-sans">
      <h1 className="text-5xl font-semibold text-center mb-8 text-gray-900">Users with Upcoming Due Dates</h1>

      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}

      <div className="text-center mb-12">
        <button 
          className={`bg-gray-900 text-white text-lg px-6 py-3 rounded-lg shadow-md mr-4 transition-transform duration-300 transform hover:scale-105 ${loadingFetch ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={fetchUsers}
          disabled={loadingFetch}
        >
          {loadingFetch ? 'Loading...' : 'Refresh'}
        </button>
        <button 
          className={`bg-gray-700 text-white text-lg px-6 py-3 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 ${loadingFetch ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={exportCsv}
          disabled={loadingFetch} 
        >
          Download CSV
        </button>
      </div>

      {loadingFetch && <div className="text-center text-gray-900 text-lg">Loading...</div>} {/* Loading Indicator */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {users.map(user => (
          <div key={user['Contact Number']} className="border border-gray-200 rounded-lg p-6 shadow-md bg-gray-50 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900">{user.ownerName}</h2>
            <p className="text-lg text-gray-600 mt-3"><strong>Vehicle No:</strong> {user.vehicleNo}</p>
            <p className="text-lg text-gray-600 mt-2"><strong>Contact Number:</strong> {user['Contact Number']}</p>
            <p className="text-lg text-gray-600 mt-2"><strong>Pollution Due Date:</strong> {formatDate(user.pollutionDueDate)}</p>
            <p className="text-lg text-gray-600 mt-2"><strong>Insurance Due Date:</strong> {formatDate(user.insuranceDueDate)}</p>
            <button 
              className={`mt-6 w-full bg-gray-900 text-white text-lg px-5 py-3 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 ${loadingSms[user['Contact Number']] ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={() => sendSms(user)}
              disabled={loadingSms[user['Contact Number']]} 
            >
              {loadingSms[user['Contact Number']] ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        ))}
      </div>

      {smsSentUsers.length > 0 && (
        <div className="mt-16">
          <h2 className="text-4xl font-semibold text-center mb-8 text-gray-900">SMS Already Sent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {smsSentUsers.map(user => (
              <div key={user['Contact Number']} className="border border-gray-200 rounded-lg p-6 shadow-md bg-gray-50 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-2xl font-semibold text-gray-900">{user.ownerName}</h2>
                <p className="text-lg text-gray-600 mt-3"><strong>Vehicle No:</strong> {user.vehicleNo}</p>
                <p className="text-lg text-gray-600 mt-2"><strong>Contact Number:</strong> {user['Contact Number']}</p>
                <p className="text-lg text-gray-600 mt-2"><strong>Pollution Due Date:</strong> {formatDate(user.pollutionDueDate)}</p>
                <p className="text-lg text-gray-600 mt-2"><strong>Insurance Due Date:</strong> {formatDate(user.insuranceDueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DueUsers;
