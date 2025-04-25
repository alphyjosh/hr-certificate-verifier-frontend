import React, { useState } from 'react';
import CertificateUpload from './CertificateUpload';
import './mobile.css';
import VerificationHistory from './VerificationHistory';

function App() {
  const [page, setPage] = useState('upload');
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, margin: 20 }}>
        <button onClick={() => setPage('upload')} style={{ background: page === 'upload' ? '#007bff' : '#f0f0f0', color: page === 'upload' ? 'white' : 'black', border: 'none', padding: '10px 20px', borderRadius: 4 }}>
          Upload Certificate
        </button>
        <button onClick={() => setPage('history')} style={{ background: page === 'history' ? '#007bff' : '#f0f0f0', color: page === 'history' ? 'white' : 'black', border: 'none', padding: '10px 20px', borderRadius: 4 }}>
          Verification History
        </button>
      </div>
      {page === 'upload' ? <CertificateUpload /> : <VerificationHistory onBackToHome={() => setPage('upload')} />}
    </div>
  );
}

export default App;