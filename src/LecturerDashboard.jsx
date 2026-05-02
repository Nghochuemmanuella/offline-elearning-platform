import React, { useState, useEffect } from 'react';
import localDB from './db';

const LecturerDashboard = ({ isMobile, user, initialMode }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [content, setContent] = useState('');
  const [myCourses, setMyCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [level, setLevel] = useState('400'); // Default to level 400
  const [showUploadForm, setShowUploadForm] = useState(initialMode === 'upload');
  useEffect(() => {
    if (initialMode === 'upload') {
      setShowUploadForm(true);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }, [initialMode]);
 
  const fetchDashboardData = async () => {
    try {
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      const allDocs = result.rows.map(row => row.doc);
      
      // 1. Get all modules (lessons)
      const courses = allDocs.filter(doc => doc.type === 'lesson');
      setMyCourses(courses);

      // 2. Get all students who have registered
      const students = allDocs.filter(doc => doc.type === 'user' && doc.role === 'student');

      // 3. Get all progress/completion records
      const progressDocs = allDocs.filter(doc => doc.type === 'progress' || (doc._id && doc._id.startsWith('progress_'))
    || (doc._id && doc._id.includes('completion')));
    console.log("Found Progress Docs:", progressDocs.length, progressDocs);

      
      const statsMap = {};
      
      // First, add every registered student to the map
      students.forEach(student => {
        // Use the email as the primary key because it's the most consistent
        const key = student.email || student._id; 
        statsMap[key] = { 
          id: student.name || 'Unknown Student', 
          email: student.email,
          level: student.level || 'N/A',
          completed: 0 
        };
      });

      // Then, update the completion count for those who have finished modules
      // Then, update the completion count for those who have finished modules
      progressDocs.forEach(doc => {
        // 1. Extract potential identifiers from the progress document
        const pUserId = doc.userId;
        const pUserEmail = doc.userEmail;
        const pIdPart = doc._id && doc._id.split('_')[1]; // Extracts from "progress_email_lesson"

        // 2. Find the student in our map by checking ALL possible matches
        const studentToUpdate = Object.values(statsMap).find(student => {
          const sEmail = student.email?.toLowerCase();
          
          // Check if any part of the progress doc matches the student's email
          return (
            (pUserId && pUserId.toLowerCase() === sEmail) ||
            (pUserEmail && pUserEmail.toLowerCase() === sEmail) ||
            (pIdPart && pIdPart.toLowerCase() === sEmail)
          );
        });

        // 3. If we found them, increment their count
        if (studentToUpdate) {
          studentToUpdate.completed += 1;
        }
      });

      setStudentStats(Object.values(statsMap));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };
  useEffect(() => {
    fetchDashboardData();
    const listener = localDB.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', fetchDashboardData);

    return () => listener.cancel();
  }, []);

     const handleSaveCourse = async (e) => {
  e.preventDefault();
  try {
    let attachmentObj = null;
    if (selectedFile) {
      attachmentObj = {
        [selectedFile.name]: { content_type: selectedFile.type, data: selectedFile }
      };
    }

    if (editingId) {
      const existingDoc = await localDB.get(editingId);
      await localDB.put({
        ...existingDoc,
        title, code, content, level, // <--- ADDED LEVEL HERE
        credits: parseInt(credits) || 0,
        updatedAt: new Date().toISOString(),
        _attachments: attachmentObj || existingDoc._attachments
      });
      alert("✅ Module Updated!");
    } else {
      await localDB.put({
        _id: `lesson_${Date.now()}`,
        type: 'lesson',
        title, code, content, level, // <--- ADDED LEVEL HERE
        credits: parseInt(credits) || 0,
        createdAt: new Date().toISOString(),
        _attachments: attachmentObj
      });
      alert("✅ Module Published!");
    }

    // Reset level along with other fields
    setEditingId(null);
    setSelectedFile(null);
    setTitle(''); setCode(''); setCredits(''); setContent(''); setLevel('400'); 
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
};

  return (
    // FORCED WHITE BACKGROUND WRAPPER
    <div style={{ 
      backgroundColor: '#ffffff', 
      color: '#000000', 
      minHeight: '100vh', 
      width: '100%',
      padding: isMobile ? '20px' : '40px', 
      fontFamily: 'monospace',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* SECTION 1: ANALYTICS */}
        <h2 style={{ borderBottom: '4px solid #000', paddingBottom: '10px', color: '#000' }}>STUDENT ENGAGEMENT</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '50px', 
          marginTop: '20px' 
        }}>
         
         {studentStats.length === 0 ? (
  <p style={{ color: '#666' }}>No student data synced yet.</p>
) : (
  studentStats.map((stat) => (
    <div 
      key={stat.email || stat.id} 
      style={{ 
        border: '3px solid #000', 
        padding: '15px', 
        boxShadow: '5px 5px 0px #00ff2f', 
        backgroundColor: '#fff' 
      }}
    >
      {/* STUDENT NAME */}
      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>STUDENT NAME</div>
      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#000' }}>
        {stat.id.toUpperCase()}
      </div>
      
      {/* STUDENT LEVEL & EMAIL */}
      <div style={{ marginTop: '5px', fontSize: '0.7rem', color: '#444' }}>
        LEVEL: <span style={{ fontWeight: 'bold' }}>{stat.level}</span> | {stat.email}
      </div>

      {/* COMPLETION COUNT */}
      <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>
        MODULES COMPLETED: 
        <span style={{ 
          marginLeft: '8px',
          color: '#00ff2f', 
          backgroundColor: '#000', 
          padding: '2px 8px',
          borderRadius: '2px'
        }}>
          {stat.completed}
        </span>
      </div>
    </div>
  ))
)}
        </div>

        {/* SECTION 2: CREATE/EDIT FORM */}
        <form onSubmit={handleSaveCourse} style={{ backgroundColor: '#000', padding: isMobile ? '20px' : '30px', border: '4px solid #000', boxShadow: editingId ? '10px 10px 0px #ccc' : '10px 10px 0px #00ff2f', marginBottom: '50px' }}>
          <h3 style={{ color: editingId ? '#fff' : '#00ff2f', marginTop: 0 }}>
            {editingId ? '🛠️ EDITING MODULE' : '➕ CREATE NEW MODULE'}
          </h3>
          <input placeholder="TITLE" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', margin: '15px 0' }}>
            <input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} required style={inputStyle} />
            <input type="number" placeholder="CREDITS" value={credits} onChange={(e) => setCredits(e.target.value)} required style={inputStyle} />
          </div>
          {/* --- LEVEL SELECTOR ADDED HERE --- */}
         <div style={{ marginBottom: '15px' }}>
         <label style={{ color: '#fff', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>TARGET STUDENT LEVEL:</label>
         <select 
         value={level} 
         onChange={(e) => setLevel(e.target.value)} 
         style={{ ...inputStyle, cursor: 'pointer' }}
        >
        <option value="200">Level 200</option>
        <option value="300">Level 300</option>
        <option value="400">Level 400</option>
        </select>
        </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#fff', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>ATTACH RESOURCE (PDF/IMG):</label>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={inputStyle} />
          </div>
          <textarea placeholder="CONTENT" value={content} onChange={(e) => setContent(e.target.value)} required style={{ ...inputStyle, minHeight: '100px', marginBottom: '15px' }} />
          <button type="submit" style={{ width: '100%', padding: '15px', border: 'none', fontWeight: '900', cursor: 'pointer', backgroundColor: editingId ? '#fff' : '#00ff2f', color: '#000' }}>
            {editingId ? 'SAVE CHANGES' : 'PUBLISH MODULE'}
          </button>
        </form>

        {/* SECTION 3: COURSE LIST */}
        <h2 style={{ borderBottom: '4px solid #000', paddingBottom: '10px', color: '#000' }}>ACTIVE MODULES</h2>
        <div style={{ marginTop: '20px' }}>
          {myCourses.map(course => (
            <div key={course._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '2px solid #000', marginBottom: '10px', backgroundColor: '#fff' }}>
              <div>
                <strong style={{ color: '#000' }}>{course.title}</strong>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{course.code} • {course._attachments ? '📎 Attached' : '📝 Text Only'}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => {
                  setEditingId(course._id);
                  setTitle(course.title); setCode(course.code); setCredits(course.credits); setContent(course.content);
                  setLevel(course.level || '400');
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }} style={actionBtnStyle}>EDIT</button>
                <button onClick={async () => { if(window.confirm("Delete?")) await localDB.remove(course); }} style={{ ...actionBtnStyle, backgroundColor: '#ff4444' }}>DEL</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', outline: 'none', boxSizing: 'border-box' };
const actionBtnStyle = { background: '#000', color: '#fff', border: 'none', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold' };

export default LecturerDashboard;