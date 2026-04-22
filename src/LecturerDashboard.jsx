import React, { useState, useEffect } from 'react';
import localDB from './db';

const LecturerDashboard = ({ isMobile }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [content, setContent] = useState('');
  const [myCourses, setMyCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [studentStats, setStudentStats] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      
      const courses = result.rows
        .filter(row => row.doc.type === 'lesson')
        .map(row => row.doc);
      setMyCourses(courses);

      // Filtering out "Unknown" or empty user IDs to keep the chart clean
      const progressDocs = result.rows
        .filter(row => row.id.startsWith('progress_') && row.doc.userId)
        .map(row => row.doc);

      const statsMap = {};
      progressDocs.forEach(doc => {
        const studentId = doc.userId;
        if (!statsMap[studentId]) {
          statsMap[studentId] = { id: studentId, completed: 0 };
        }
        statsMap[studentId].completed += 1;
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
          title, code, content,
          credits: parseInt(credits) || 0,
          updatedAt: new Date().toISOString(),
          _attachments: attachmentObj || existingDoc._attachments
        });
        alert("✅ Module Updated!");
      } else {
        await localDB.put({
          _id: `lesson_${Date.now()}`,
          type: 'lesson',
          title, code, content,
          credits: parseInt(credits) || 0,
          createdAt: new Date().toISOString(),
          _attachments: attachmentObj
        });
        alert("✅ Module Published!");
      }

      setEditingId(null);
      setSelectedFile(null);
      setTitle(''); setCode(''); setCredits(''); setContent('');
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
          {studentStats.length === 0 ? <p style={{ color: '#666' }}>No student data synced yet.</p> : 
            studentStats.map(stat => (
              <div key={stat.id} style={{ border: '3px solid #000', padding: '15px', boxShadow: '5px 5px 0px #00ff2f', backgroundColor: '#fff' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>STUDENT_ID</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#000' }}>{(stat.id || 'USER').toUpperCase()}</div>
                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#000' }}>
                  COMPLETED: <span style={{ color: '#00ff2f', backgroundColor: '#000', padding: '2px 6px' }}>{stat.completed}</span>
                </div>
              </div>
            ))
          }
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