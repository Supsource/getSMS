import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DueUsers.css'; 

const DueUsers = () => {
  const [users, setUsers] = useState([]);
  const [smsSentUsers, setSmsSentUsers] = useState(JSON.parse(localStorage.getItem('smsSentUsers')) || []);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/due-users')
      .then(res => {
        const usersWithoutSms = res.data.filter(user => !smsSentUsers.some(sentUser => sentUser['Contact Number'] === user['Contact Number']));
        setUsers(usersWithoutSms);
      })
      .catch(err => {
        console.error(err);
        setError('An error occurred while fetching users.');
      });
  }, [smsSentUsers]);

  const sendSms = (user) => {
    axios.post('http://127.0.0.1:5000/api/send-sms', { contactNumber: user['Contact Number'] })
      .then(() => {
        alert(`SMS sent to ${user.ownerName}!`);

        // Move the user to SMS sent list and save to localStorage
        const updatedSmsSentUsers = [...smsSentUsers, user];
        setSmsSentUsers(updatedSmsSentUsers);
        localStorage.setItem('smsSentUsers', JSON.stringify(updatedSmsSentUsers));
        setUsers(users.filter(u => u['Contact Number'] !== user['Contact Number']));
      })
      .catch(err => {
        console.error(err);
        setError('An error occurred while sending SMS.');
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
    <div className="due-users-container">
      <h1>Users with Upcoming Due Dates</h1>
      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Vehicle No</th>
            <th>Contact Number</th>
            <th>Pollution Due Date</th>
            <th>Insurance Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user['Contact Number']}>
              <td>{user.ownerName}</td>
              <td>{user.vehicleNo}</td>
              <td>{user['Contact Number']}</td>
              <td>{formatDate(user.pollutionDueDate)}</td>
              <td>{formatDate(user.insuranceDueDate)}</td>
              <td>
                <button onClick={() => sendSms(user)}>Send SMS</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="buttons-container">
        <button onClick={exportCsv}>Download</button>
      </div>

      {smsSentUsers.length > 0 && (
        <div className="sms-sent-section">
          <h2>Already SMS Done</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle No</th>
                <th>Contact Number</th>
                <th>Pollution Due Date</th>
                <th>Insurance Due Date</th>
              </tr>
            </thead>
            <tbody>
              {smsSentUsers.map(user => (
                <tr key={user['Contact Number']}>
                  <td>{user.ownerName}</td>
                  <td>{user.vehicleNo}</td>
                  <td>{user['Contact Number']}</td>
                  <td>{formatDate(user.pollutionDueDate)}</td>
                  <td>{formatDate(user.insuranceDueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DueUsers;
