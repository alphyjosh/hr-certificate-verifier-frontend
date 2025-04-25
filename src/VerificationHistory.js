import React, { useEffect, useState } from 'react';

function VerificationHistory(props) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatusId, setUpdateStatusId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [hrReply, setHrReply] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/verifications');
      const data = await res.json();
      setVerifications(data.verifications || []);
      setError(null);
    } catch (e) {
      setError('Failed to fetch verifications');
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id) => {
    if (!newStatus) return;
    try {
      await fetch('http://localhost:8000/update_verification_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, hr_reply: hrReply })
      });
      setUpdateStatusId(null);
      setNewStatus('');
      setHrReply('');
      fetchVerifications();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>Verification History</h2>
      <button onClick={() => props.onBackToHome && props.onBackToHome()} style={{ marginBottom: 20, background: '#007bff', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 4 }}>
        Back to Home
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : verifications.length === 0 ? (
        <div>No verification requests found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>To Email</th>
              <th>Employee Name</th>
              <th>ID No</th>
              <th>Department</th>
              <th>Status</th>
              <th>Sent At</th>
              <th>HR Reply</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{v.id}</td>
                <td>{v.to_email}</td>
                <td>{v.employee_name || '-'}</td>
                <td>{v.id_no || '-'}</td>
                <td>{v.department || '-'}</td>
                <td>{v.status}</td>
                <td>{v.sent_at && v.sent_at.replace('T', ' ').substring(0, 19)}</td>
                <td>{v.hr_reply || '-'}</td>
                <td>
                  {updateStatusId === v.id ? (
                    <div>
                      <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        <option value="">Select status</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <input
                        type="text"
                        placeholder="HR reply (optional)"
                        value={hrReply}
                        onChange={e => setHrReply(e.target.value)}
                        style={{ marginLeft: 8 }}
                      />
                      <button onClick={() => handleUpdateStatus(v.id)} style={{ marginLeft: 8 }}>
                        Save
                      </button>
                      <button onClick={() => setUpdateStatusId(null)} style={{ marginLeft: 4 }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setUpdateStatusId(v.id)}>
                      Update Status
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default VerificationHistory;
