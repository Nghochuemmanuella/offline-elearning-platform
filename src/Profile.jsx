import React from 'react';

const Profile = ({ user, isLecturer, allCourses = [], completedLessons = [] }) => {
  // 1. Calculate stats safely with fallbacks
  const totalModules = allCourses?.length || 0;
  const studentCompletedCount = completedLessons?.length || 0;
  
  // 2. Count modules added via the Lecturer Dashboard (Offline Content)
  const lecturerManagedCount = allCourses?.filter(c => c.type === "Offline Content").length || 0;

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        border: '4px solid #000', 
        padding: '30px', 
        boxShadow: '10px 10px 0px #00ff2f' 
      }}>
        <h1 style={{ 
          fontWeight: '900', 
          borderBottom: '4px solid #000', 
          paddingBottom: '10px',
          letterSpacing: '-1px'
        }}>
          {isLecturer ? 'FACULTY DASHBOARD' : 'STUDENT DOSSIER'}
        </h1>
        
        <div style={{ marginTop: '30px', lineHeight: '1.8' }}>
          <p style={{ fontSize: '1.2rem', margin: '5px 0' }}>
            <strong style={{ backgroundColor: '#000', color: '#00ff2f', padding: '2px 8px' }}>NAME:</strong> {user?.name?.toUpperCase() || "N/A"}
          </p>
          <p style={{ fontSize: '1.2rem', margin: '5px 0' }}>
            <strong style={{ backgroundColor: '#000', color: '#00ff2f', padding: '2px 8px' }}>ROLE:</strong> {isLecturer ? 'LECTURER' : 'UNIVERSITY STUDENT'}
          </p>
          <p style={{ fontSize: '1.2rem', margin: '5px 0' }}>
            <strong style={{ backgroundColor: '#000', color: '#00ff2f', padding: '2px 8px' }}>ID:</strong> {user?.id || "UB-2026-OFFLINE"}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px', 
          marginTop: '40px' 
        }}>
          <div style={{ 
            padding: '30px', 
            background: '#000', 
            color: '#00ff2f', 
            textAlign: 'center',
            border: '4px solid #000'
          }}>
            <h2 style={{ margin: 0, fontSize: '3rem' }}>{totalModules}</h2>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>TOTAL ACCESSIBLE MODULES</p>
          </div>

          <div style={{ 
            padding: '30px', 
            border: '4px solid #000', 
            textAlign: 'center',
            backgroundColor: isLecturer ? '#f0f0f0' : '#fff'
          }}>
            <h2 style={{ margin: 0, fontSize: '3rem' }}>
              {isLecturer ? lecturerManagedCount : studentCompletedCount}
            </h2>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>
              {isLecturer ? 'DYNAMIC MODULES ADDED' : 'COMPLETED LESSONS'}
            </p>
          </div>
        </div>

        <div style={{ 
          marginTop: '40px', 
          padding: '15px', 
          border: '2px dashed #000', 
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          SYSTEM STATUS: <strong>OFFLINE-READY (POUCHDB ACTIVE)</strong>
        </div>
      </div>
    </div>
  );
};

export default Profile;