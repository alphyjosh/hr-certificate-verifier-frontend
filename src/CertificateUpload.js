import React, { useState } from 'react';

// Badge component for field confidence
function FieldConfidenceBadge({ confidence, value }) {
  let color = 'gray';
  let label = 'Missing';
  if (value) {
    if (confidence === 'AI') {
      color = 'green';
      label = 'AI extracted';
    } else if (confidence === 'regex') {
      color = 'goldenrod';
      label = 'Pattern extracted';
    } else {
      color = 'gray';
      label = 'Manual or uncertain';
    }
  } else {
    color = 'red';
    label = 'Missing';
  }
  return (
    <span
      title={label}
      style={{
        display: 'inline-block',
        marginLeft: 8,
        marginRight: 4,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        border: '1px solid #888',
        verticalAlign: 'middle',
        cursor: 'help',
      }}
    ></span>
  );
}

function CertificateUpload() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(() => {
    // Try to load last response from localStorage
    const saved = localStorage.getItem('last_certificate_response');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [crossCheckResult, setCrossCheckResult] = useState(null);
  const [contacts, setContacts] = useState(null);

  const [emailStatus, setEmailStatus] = useState(null);

  // Manual entry fields for employee details
  const [employeeName, setEmployeeName] = useState('');
  const [idNo, setIdNo] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // When response changes, update manual fields with extracted values if available
  React.useEffect(() => {
    if (response && response.extracted_fields) {
      setEmployeeName(response.extracted_fields.employee_name || '');
      setIdNo(response.extracted_fields.id_no || '');
      setDepartment(response.extracted_fields.department || '');
      setDesignation(response.extracted_fields.designation || '');
    }
  }, [response]);

  async function handleCrossCheck() {
    if (!response || !response.extracted_fields || !response.extracted_fields.company_name) return;
    setCrossCheckResult({ official_website: null });
    const res = await fetch('http://localhost:8000/crosscheck_company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_name: response.extracted_fields.company_name }),
    });
    const data = await res.json();
    setCrossCheckResult(data);
  }

  async function handleFindContacts() {
    setContacts(null);
    setEmailStatus(null);
    if (!crossCheckResult || !crossCheckResult.official_website) return;
    const res = await fetch('http://localhost:8000/get_company_contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: crossCheckResult.official_website })
    });
    const data = await res.json();
    setContacts(data);
  }

  function handleSendVerificationEmail(email) {
    // Only Employee Name, Department, Designation are required
    if (!employeeName || !department || !designation) return;
    setPendingEmail(email);
    setShowConfirmModal(true);
  }

  async function actuallySendVerificationEmail() {
    setEmailStatus('Sending...');
    let certFields = response && response.extracted_fields ? { ...response.extracted_fields } : {};
    certFields.employee_name = employeeName;
    certFields.id_no = idNo;
    certFields.department = department;
    certFields.designation = designation;
    const res = await fetch('http://localhost:8000/send_verification_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_email: pendingEmail, fields: certFields })
    });
    const data = await res.json();
    setShowConfirmModal(false);
    setPendingEmail('');
    if (data.success) {
      setEmailStatus('Verification email sent successfully!');
    } else {
      setEmailStatus('Failed to send email: ' + (data.error || 'Unknown error'));
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResponse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data);
      localStorage.setItem('last_certificate_response', JSON.stringify(data));
    } catch (error) {
      setResponse({ error: 'Error uploading file.' });
      localStorage.removeItem('last_certificate_response');
    }
    setLoading(false);
  };

  // Download report handler
  async function downloadReport(format) {
    if (!response || !response.extracted_fields) return;
    const res = await fetch('http://localhost:8000/export_report?format=' + format, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.extracted_fields),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'pdf' ? 'verification_report.pdf' : 'verification_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Upload Experience Certificate</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          required
        />
        <div style={{ marginTop: 16, marginBottom: 16, padding: 16, border: '1px solid #d0d0d0', borderRadius: 8, background: '#f8f9fa' }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Employee Name:
            <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.employee_name} value={employeeName} />
            <span title="Enter the full name of the employee as it appears on the certificate" style={{ cursor: 'help', marginLeft: 4, color: '#007bff' }}>ⓘ</span>
            <input
              type="text"
              aria-label="Employee Name"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              style={{ marginLeft: 8, width: 200, borderColor: employeeName ? '#ced4da' : 'red', background: employeeName ? 'white' : '#fff0f0' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Employee ID No:
            <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.id_no} value={idNo} />
            <span title="Enter the employee's ID number as shown on the certificate (optional)" style={{ cursor: 'help', marginLeft: 4, color: '#007bff' }}>ⓘ</span>
            <input
              type="text"
              aria-label="Employee ID No"
              value={idNo}
              onChange={e => setIdNo(e.target.value)}
              style={{ marginLeft: 8, width: 200, borderColor: '#ced4da', background: 'white' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Department:
            <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.department} value={department} />
            <span title="Enter the department or unit where the employee worked" style={{ cursor: 'help', marginLeft: 4, color: '#007bff' }}>ⓘ</span>
            <input
              type="text"
              aria-label="Department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              style={{ marginLeft: 8, width: 200, borderColor: department ? '#ced4da' : 'red', background: department ? 'white' : '#fff0f0' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Designation:
            <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.designation} value={designation} />
            <span title="Enter the employee's designation (job title)" style={{ cursor: 'help', marginLeft: 4, color: '#007bff' }}>ⓘ</span>
            <input
              type="text"
              aria-label="Designation"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              style={{ marginLeft: 8, width: 200, borderColor: designation ? '#ced4da' : 'red', background: designation ? 'white' : '#fff0f0' }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 10, minWidth: 350, boxShadow: '0 2px 10px #0002' }}>
            <h3>Confirm Verification Email</h3>
            <div style={{ marginBottom: 16 }}>
              <b>Employee Name:</b> {employeeName} <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.employee_name} value={employeeName} /><br/>
              <b>Employee ID No (optional):</b> {idNo || <span style={{ color: '#888' }}>(not provided)</span>} <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.id_no} value={idNo} /><br/>
              <b>Department:</b> {department} <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.department} value={department} /><br/>
              <b>Designation:</b> {designation} <FieldConfidenceBadge confidence={response?.extracted_fields?._confidence?.designation} value={designation} /><br/>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: '#eee', padding: '6px 18px', borderRadius: 4 }}>Cancel</button>
              <button onClick={actuallySendVerificationEmail} style={{ background: '#007bff', color: 'white', padding: '6px 18px', borderRadius: 4 }}>Confirm & Send</button>
            </div>
          </div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 20 }}>
          {response.suspicious_features && response.suspicious_features.length > 0 && (
            <div style={{ background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, border: '1px solid #ffeeba', marginBottom: 12 }}>
              <b>⚠️ Suspicious Features Detected:</b>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {response.suspicious_features.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>
          )}
          {response.extracted_fields && response.extracted_fields.ocr_warning && response.extracted_fields.ocr_warning !== null && (
             <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 6, border: '1px solid #f5c6cb', marginBottom: 12 }}>
               <b>⚠️ OCR Warning:</b> {response.extracted_fields.ocr_warning}
             </div>
           )}
           <h3>Extracted Fields</h3>
           <pre>{JSON.stringify(response.extracted_fields, null, 2)}</pre>
          <button style={{ marginRight: 10 }} onClick={() => downloadReport('pdf')}>
            Download PDF Report
          </button>
          <button style={{ marginRight: 10 }} onClick={() => downloadReport('csv')}>
            Download CSV Report
          </button>
          <button style={{ marginRight: 10 }} onClick={handleCrossCheck}>
            Cross-Check Company Website
          </button>
          {crossCheckResult && (
            <div style={{ marginTop: 10 }}>
              <strong>Company Website Cross-Check Result:</strong>
              {crossCheckResult.official_website ? (
                <div>
                  Official Website: <a href={crossCheckResult.official_website} target="_blank" rel="noopener noreferrer">{crossCheckResult.official_website}</a>
                  <button style={{ marginLeft: 10 }} onClick={handleFindContacts}>
                    Find HR/Contact Info
                  </button>
                  {contacts && (
                    <div style={{ marginTop: 10 }}>
                      <strong>Found Emails:</strong>
                      {contacts.emails && contacts.emails.length > 0 ? (
                        <ul>
                          {contacts.emails.map((email, idx) => (
                            <li key={idx}>
                              {email}
                              <button style={{ marginLeft: 10 }} onClick={() => handleSendVerificationEmail(email)} disabled={!employeeName || !idNo || !department}>
                                Send Verification Email
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No emails found.</div>
                      )}
                      <strong>Found Phones:</strong>
                      {contacts.phones && contacts.phones.length > 0 ? (
                        <ul>
                          {contacts.phones.map((phone, idx) => (
                            <li key={idx}>{phone}</li>
                          ))}
                        </ul>
                      ) : (
                        <div>No phone numbers found.</div>
                      )}
                    </div>
                  )}
                  {emailStatus && <div style={{ marginTop: 10, color: emailStatus.startsWith('Verification') ? 'green' : 'red' }}>{emailStatus}</div>}
                </div>
              ) : (
                <div style={{ color: 'red' }}>{crossCheckResult.warning || crossCheckResult.error || 'No official website found.'}</div>
              )}
            </div>
          )}
          <h4>Raw OCR Text</h4>
          <pre>{response.raw_text}</pre>
          {response.error && <div style={{ color: 'red' }}>{response.error}</div>}
        </div>
      )}


    </div>
  );
}

export default CertificateUpload;