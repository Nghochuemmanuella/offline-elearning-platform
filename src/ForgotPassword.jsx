import React, { useState } from 'react';
import localDB from './db';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    margin: '8px 0',
    backgroundColor: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#00ff2f',
    outline: 'none',
    WebkitTextFillColor: '#00ff2f',
    WebkitBoxShadow: '0 0 0px 1000px #111 inset',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await localDB.put({
        _id: `reset_${email}_${Date.now()}`,
        type: 'reset_request',
        email: email,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting request. Please try again.');
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#000'
    }}>
      <div style={{
        width: '90%', maxWidth: '380px', padding: '36px 32px',
        border: '1px solid rgba(0,255,47,0.2)',
        borderRadius: '20px',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,47,0.08)',
        backgroundColor: '#0a0a0a',
      }}>
        <img src="/logo192.png" alt="EduBridge" style={{ width: '100px', marginBottom: '20px' }} />
        
        {submitted ? (
          <div>
            <h2 style={{ color: '#00ff2f', marginBottom: '20px', letterSpacing: '2px' }}>REQUEST SENT!</h2>
            <p style={{ color: '#666', fontSize: '0.8rem', lineHeight: 1.7, marginBottom: '20px' }}>
              Your password reset request has been logged. Please contact your lecturer or visit the admin office. They will reset your password shortly.
            </p>
            <button
              onClick={onBack}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: '#00ff2f', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: '900',
                cursor: 'pointer', letterSpacing: '2px',
                fontSize: '0.85rem', fontFamily: 'monospace',
              }}
            >
              BACK TO LOGIN
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#00ff2f', marginBottom: '10px', letterSpacing: '2px' }}>RESET PASSWORD</h2>
            <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Enter your email address. Your reset request will be sent to the admin for processing.
            </p>
            <form onSubmit={handleRequest}>
              <input
                type="email"
                placeholder="YOUR EMAIL ADDRESS"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: '#0a0a0a', color: '#00ff2f',
                  border: '1px solid rgba(0,255,47,0.35)', borderRadius: '10px',
                  fontWeight: '900', fontFamily: 'monospace',
                  cursor: 'pointer', letterSpacing: '2px',
                  fontSize: '0.85rem', marginTop: '10px',
                  boxShadow: '0 4px 16px rgba(0,255,47,0.15)',
                }}
              >
                SUBMIT REQUEST
              </button>
            </form>
            <p
              onClick={onBack}
              style={{ color: '#555', fontSize: '0.75rem', marginTop: '20px', cursor: 'pointer' }}
            >
              ← BACK TO LOGIN
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;