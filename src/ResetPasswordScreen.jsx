import React, { useState } from 'react';
import localDB from './db';
import bcrypt from 'bcryptjs';

const ResetPasswordScreen = ({ user, onDone }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%', padding: '12px', margin: '10px 0',
    backgroundColor: '#111', border: '1px solid #333',
    color: '#00ff2f', outline: 'none',
    WebkitTextFillColor: '#00ff2f',
    WebkitBoxShadow: '0 0 0px 1000px #111 inset',
    boxSizing: 'border-box', fontFamily: 'monospace',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setMessage('❌ Password must be 8+ characters and include a number.');
      return;
    }
    setLoading(true);
    try {
      const userId = user._id || user.id;
      const userDoc = await localDB.get(userId);
      const hashed = await bcrypt.hash(newPassword, 10);
      const updatedDoc = { ...userDoc, password: hashed, resetApproved: false, mustChangePassword: false };
      await localDB.put(updatedDoc);
      setMessage('✅ Password updated successfully!');
      setTimeout(() => onDone(updatedDoc), 1500);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#000',
    }}>
      <div style={{
        width: '90%', maxWidth: '380px', padding: '30px',
        border: '3px solid #00ff2f', textAlign: 'center',
        boxShadow: '6px 6px 0px #00ff2f', backgroundColor: '#000',
        fontFamily: 'monospace',
      }}>
        <img src="/logo192.png" alt="EduBridge" style={{ width: '80px', marginBottom: '16px' }} />
        <h2 style={{ color: '#00ff2f', letterSpacing: '2px', marginBottom: '8px' }}>
          SET NEW PASSWORD
        </h2>
        <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Your password reset has been approved. Please set a new password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="NEW PASSWORD"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="CONFIRM NEW PASSWORD"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />
          {message && (
            <p style={{
              fontSize: '0.75rem', marginBottom: '10px',
              color: message.includes('✅') ? '#00ff2f' : '#ff4444',
            }}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: '#00ff2f', color: '#000',
              border: 'none', fontWeight: '900',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '2px', fontSize: '0.85rem',
              fontFamily: 'monospace', marginTop: '10px',
            }}
          >
            {loading ? 'SAVING...' : 'UPDATE PASSWORD →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;