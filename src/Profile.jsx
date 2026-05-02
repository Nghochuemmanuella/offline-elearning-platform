import React from 'react';

const Profile = ({ user, isLecturer, allCourses = [], completedLessons = [], selectedLevel, onLevelChange }) => {
  // 1. We use the courses passed from App.jsx (which are already filtered by level)
  const totalModules = allCourses.length; 
  const lecturerManagedCount = allCourses.filter(c => c.type === "lesson").length;
  const displayCount = isLecturer 
    ? lecturerManagedCount
    : allCourses.filter(course => {
        // 1. Check all possible ID locations
        const cId = course._id || course.id;
        
        // 2. Check if this ID exists in the completedLessons array
        // We also use .toString() just in case one is a number and one is a string
        return completedLessons.some(completedId => 
          String(completedId) === String(cId)
        );
      }).length;

  // 3. Lecturer count (matching your dashboard type)
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
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>TOTAL MODULES IN SYSTEM</p>
          </div>

          <div style={{ 
            padding: '30px', 
            border: '4px solid #000', 
            textAlign: 'center',
            backgroundColor: isLecturer ? '#f0f0f0' : '#fff'
          }}>
            <h2 style={{ margin: 0, fontSize: '3rem' }}>
              {displayCount}
            </h2>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>
              {isLecturer ? 'MODULES YOU PUBLISHED' : 'YOUR COMPLETED LESSONS'}
            </p>
          </div>
        </div>
        {!isLecturer && (
          <div style={{ marginTop: '30px', padding: '20px', border: '3px solid #000', boxShadow: '6px 6px 0px #00ff2f' }}>
            <p style={{ fontWeight: '900', marginBottom: '15px', fontSize: '0.9rem' }}>
              CURRENT LEVEL: <span style={{ background: '#000', color: '#00ff2f', padding: '2px 10px' }}>LEVEL {selectedLevel}</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '15px' }}>SWITCH ACADEMIC LEVEL:</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['200', '300', '400'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  style={{
                    flex: 1, padding: '12px',
                    background: selectedLevel === lvl ? '#000' : '#fff',
                    color: selectedLevel === lvl ? '#00ff2f' : '#000',
                    border: '3px solid #000',
                    fontWeight: '900', cursor: 'pointer',
                    fontFamily: 'monospace',
                    boxShadow: selectedLevel === lvl ? '4px 4px 0px #00ff2f' : '4px 4px 0px #000'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}
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