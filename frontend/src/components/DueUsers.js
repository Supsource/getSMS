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
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Users with Upcoming Due Dates</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="text-center mb-6">
        <button 
          className={`bg-blue-600 text-white px-5 py-3 rounded-lg mr-3 transition duration-300 hover:bg-blue-500 ${loadingFetch ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={fetchUsers}
          disabled={loadingFetch}
        >
          {loadingFetch ? 'Loading...' : 'Refresh'}
        </button>
        <button 
          className={`bg-green-600 text-white px-5 py-3 rounded-lg transition duration-300 hover:bg-green-500 ${loadingFetch ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={exportCsv}
          disabled={loadingFetch} 
        >
          Download CSV
        </button>
      </div>

      {loadingFetch && <div className="text-center text-blue-600 text-lg">Loading...</div>} {/* Loading Indicator */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user['Contact Number']} className="border rounded-lg p-5 shadow-md bg-white transition duration-200 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800">{user.ownerName}</h2>
            <p><strong className="text-gray-600">Vehicle No:</strong> {user.vehicleNo}</p>
            <p><strong className="text-gray-600">Contact Number:</strong> {user['Contact Number']}</p>
            <p><strong className="text-gray-600">Pollution Due Date:</strong> {formatDate(user.pollutionDueDate)}</p>
            <p><strong className="text-gray-600">Insurance Due Date:</strong> {formatDate(user.insuranceDueDate)}</p>
            <button 
              className={`mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 hover:bg-blue-500 ${loadingSms[user['Contact Number']] ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={() => sendSms(user)}
              disabled={loadingSms[user['Contact Number']]} 
            >
              {loadingSms[user['Contact Number']] ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        ))}
      </div>

      {smsSentUsers.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">SMS Already Sent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {smsSentUsers.map(user => (
              <div key={user['Contact Number']} className="border rounded-lg p-5 shadow-md bg-white transition duration-200 hover:shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800">{user.ownerName}</h2>
                <p><strong className="text-gray-600">Vehicle No:</strong> {user.vehicleNo}</p>
                <p><strong className="text-gray-600">Contact Number:</strong> {user['Contact Number']}</p>
                <p><strong className="text-gray-600">Pollution Due Date:</strong> {formatDate(user.pollutionDueDate)}</p>
                <p><strong className="text-gray-600">Insurance Due Date:</strong> {formatDate(user.insuranceDueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DueUsers;
