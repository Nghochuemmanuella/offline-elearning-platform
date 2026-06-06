import React, { useState } from 'react';
import localDB from './db';
import bcrypt from 'bcryptjs';

const Profile = ({ user, isLecturer, allCourses = [], completedLessons = [], selectedLevel, onLevelChange }) => {
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [pwMessage, setPwMessage] = useState('');
  

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPwMessage('❌ Passwords do not match.');
      return;
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setPwMessage('❌ Password must be 8+ characters and include a number.');
      return;
    }
    try {
      const userId = user._id || user.id;
      const userDoc = await localDB.get(userId);
      const isMatch = await bcrypt.compare(currentPassword, userDoc.password);
      if (!isMatch) {
        setPwMessage('❌ Current password is incorrect.');
        return;
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await localDB.put({ ...userDoc, password: hashed, mustChangePassword: false });
      setPwMessage('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage('❌ Error: ' + err.message);
    }
  };

const totalModules = allCourses.length;

const lecturerManagedCount = allCourses.filter(c => 
  c.type === "lesson" && 
  c.createdBy === user?.email
).length;

const displayCount = isLecturer
  ? lecturerManagedCount
  : allCourses.filter(course => {
      const cId = course._id || course.id;
      return completedLessons.some(completedId => String(completedId) === String(cId));
    }).length;

  const inputStyle = {
    width: '100%', padding: '11px 14px', marginBottom: '10px',
    background: '#f8f8f8', border: '1px solid #e0e0e0',
    borderRadius: '8px', color: '#111', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f4f6f8',
      minHeight: '100vh',
      fontFamily: 'monospace',
    }}>
      <div style={{
        maxWidth: '760px',
        margin: '0 auto',
      }}>

        {/* ── Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,255,47,0.1)',
        }}>
          <h1 style={{
            margin: '0 0 20px 0',
            color: '#00ff2f',
            fontWeight: '900',
            fontSize: '1.3rem',
            letterSpacing: '-0.5px',
          }}>
            {isLecturer ? 'FACULTY DASHBOARD' : 'STUDENT DOSSIER'}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'NAME', value: user?.name?.toUpperCase() || 'N/A' },
              { label: 'ROLE', value: isLecturer ? 'LECTURER' : 'UNIVERSITY STUDENT' },
              { label: 'ID', value: user?.id || 'UB-2026-OFFLINE' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '0.62rem', fontWeight: '700', letterSpacing: '1.5px',
                  color: '#00ff2f', background: 'rgba(0,255,47,0.1)',
                  border: '1px solid rgba(0,255,47,0.2)',
                  borderRadius: '6px', padding: '3px 10px', minWidth: '50px',
                  textAlign: 'center',
                }}>{label}</span>
                <span style={{ color: '#ccc', fontSize: '0.95rem', fontWeight: '600' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,255,47,0.1)',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '3rem', color: '#00ff2f', fontWeight: '900', lineHeight: 1 }}>
              {totalModules}
            </h2>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.72rem', color: '#666', letterSpacing: '1px' }}>
              TOTAL MODULES IN SYSTEM
            </p>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,255,47,0.08)',
            border: '1px solid rgba(0,255,47,0.15)',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '3rem', color: '#00aa1f', fontWeight: '900', lineHeight: 1 }}>
              {displayCount}
            </h2>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.72rem', color: '#888', letterSpacing: '1px' }}>
              {isLecturer ? 'MODULES YOU PUBLISHED' : 'YOUR COMPLETED LESSONS'}
            </p>
          </div>
        </div>
     {!isLecturer && (
  <div style={{
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e8e8e8',
  }}>
    <p style={{ fontWeight: '900', marginBottom: '6px', fontSize: '0.85rem', color: '#111' }}>
      ACADEMIC LEVEL
    </p>
    <p style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: '0', letterSpacing: '0.5px' }}>
      You are enrolled at{' '}
      <strong style={{ color: '#00aa1f', fontSize: '0.9rem' }}>Level {selectedLevel}</strong>.
      Contact your administrator if your level is incorrect.
    </p>
  </div>
)}

{/* ── Change Password — Lecturer Only ── */}
{isLecturer && (
  <div style={{
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e8e8e8',
  }}>
    <p style={{ fontWeight: '900', marginBottom: '6px', fontSize: '0.85rem', color: '#111' }}>
      🔐 CHANGE PASSWORD
    </p>
    <p style={{ 
      fontSize: '0.72rem', color: '#aaa', 
      marginBottom: '16px', letterSpacing: '0.5px',
      lineHeight: 1.6
    }}>
      Update your temporary password below.
    </p>
    <input
      type="password"
      placeholder="Current password"
      value={currentPassword}
      onChange={e => setCurrentPassword(e.target.value)}
      style={inputStyle}
    />
    <input
      type="password"
      placeholder="New password"
      value={newPassword}
      onChange={e => setNewPassword(e.target.value)}
      style={inputStyle}
    />
    <input
      type="password"
      placeholder="Confirm new password"
      value={confirmPassword}
      onChange={e => setConfirmPassword(e.target.value)}
      style={inputStyle}
    />
    {pwMessage && (
      <p style={{
        fontSize: '0.75rem', marginBottom: '10px',
        color: pwMessage.includes('✅') ? '#00aa00' : '#ee4444',
        background: pwMessage.includes('✅') ? 'rgba(0,170,0,0.06)' : 'rgba(238,68,68,0.06)',
        padding: '8px 12px', borderRadius: '6px',
      }}>
        {pwMessage}
      </p>
    )}
    <button
      onClick={handleChangePassword}
      style={{
        width: '100%', padding: '12px',
        background: '#111', color: '#00ff2f',
        border: 'none', borderRadius: '8px',
        fontWeight: '900', cursor: 'pointer',
        fontFamily: 'monospace', letterSpacing: '1.5px',
        fontSize: '0.85rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      UPDATE PASSWORD
    </button>
  </div>
)}
        {/* ── System Status ── */}
        <div style={{
          padding: '14px 20px',
          background: 'rgba(0,255,47,0.06)',
          border: '1px solid rgba(0,255,47,0.15)',
          borderRadius: '10px',
          fontSize: '0.78rem',
          textAlign: 'center',
          color: '#555',
        }}>
          SYSTEM STATUS: <strong style={{ color: '#00aa1f' }}>OFFLINE-READY (POUCHDB ACTIVE)</strong>
        </div>

      </div>
    </div>
  );
};

export default Profile;