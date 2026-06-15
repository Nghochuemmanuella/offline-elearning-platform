import React, { useState, useEffect } from 'react';
import localDB from './db';
import QuizBuilder from './QuizBuilder';
import { useToast, useConfirm } from './Toast';
const LecturerDashboard = ({ isMobile, user, initialMode }) => {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [content, setContent] = useState('');
  const [myCourses, setMyCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [level, setLevel] = useState('400'); // Default to level 400
  const [resetRequests, setResetRequests] = useState([]);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showCreateLecturer, setShowCreateLecturer] = useState(false);
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [lecturerPassword, setLecturerPassword] = useState('');
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [quizResultsModal, setQuizResultsModal] = useState(null);
  useEffect(() => {
  if (initialMode === 'upload') {
  window.scrollTo({ top: 400, behavior: 'smooth' });
}
  }, [initialMode]);
 
  const fetchDashboardData = async () => {
    try {
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      const allDocs = result.rows.map(row => row.doc);
      
      // 1. Get all modules (lessons)
    const courses = allDocs.filter(doc => 
  doc.type === 'lesson' && 
  (user?.email === 'admin@edubridge.com' || doc.createdBy === user?.email)
);
      setMyCourses(courses);
      const quizzes = allDocs.filter(doc => 
  doc.type === 'quiz' &&
  courses.some(c => c._id === doc.lessonId)
);
setMyQuizzes(quizzes);

      // 2. Get all students who have registered
   const lecturerCourseIds = allDocs
  .filter(doc => 
    doc.type === 'lesson' && 
    (user?.email === 'admin@edubridge.com' || doc.createdBy === user?.email)
  )
  .map(doc => doc._id);

const relevantProgress = allDocs.filter(doc => 
  (doc.type === 'progress' || (doc._id && doc._id.startsWith('progress_'))) &&
  lecturerCourseIds.includes(doc.lessonId)
);

const relevantStudentEmails = [...new Set(relevantProgress.map(doc => doc.userId))];

const students = allDocs.filter(doc => 
  doc.type === 'user' && 
  doc.role === 'student' && 
  doc.email !== 'admin@edubridge.com' &&
  (user?.email === 'admin@edubridge.com' || relevantStudentEmails.includes(doc.email))
);
      // 3. Get all progress/completion records
    const progressDocs = relevantProgress;
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
      const resets = allDocs.filter(doc => doc.type === 'reset_request');
      setResetRequests(resets);
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
      showToast('Module updated successfully!', 'success');
    } else {
      await localDB.put({
        _id: `lesson_${Date.now()}`,
        type: 'lesson',
        title, code, content, level, // <--- ADDED LEVEL HERE
        credits: parseInt(credits) || 0,
        createdAt: new Date().toISOString(),
        createdBy: user?.email,
        _attachments: attachmentObj
      });
     showToast('Module published!', 'success');
    }

    // Reset level along with other fields
    setEditingId(null);
    setSelectedFile(null);
    setTitle(''); setCode(''); setCredits(''); setContent(''); setLevel('400'); 
  } catch (err) {
   showToast('Error: ' + err.message, 'error');
  }
};

  return (
    // FORCED WHITE BACKGROUND WRAPPER
    <div style={{ 
      backgroundColor: '#f4f6f8', 
      color: '#000000', 
      minHeight: '100vh', 
      width: '100%',
      padding: isMobile ? '20px' : '40px', 
      fontFamily: 'monospace',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* SECTION 0: CREATE LECTURER ACCOUNT */}
{user?.email === 'admin@edubridge.com' && <div style={{ marginBottom: '40px' }}>
  <h2 style={{ 
    borderBottom: '2px solid rgba(0,255,47,0.3)', 
    paddingBottom: '10px', color: '#111', 
    fontSize: '1rem', letterSpacing: '1.5px', 
    fontWeight: '900', marginBottom: '20px' 
  }}>
    👨‍🏫 LECTURER MANAGEMENT
  </h2>
  <button
    onClick={() => setShowCreateLecturer(!showCreateLecturer)}
    style={{ 
      padding: '12px 24px', background: '#0a0a0a', 
      color: '#00ff2f', border: '1px solid rgba(0,255,47,0.35)', 
      borderRadius: '10px', fontFamily: 'monospace', fontWeight: '900', 
      cursor: 'pointer', letterSpacing: '1px', 
      marginBottom: '20px'
    }}
  >
    {showCreateLecturer ? '✕ CANCEL' : '➕ CREATE LECTURER ACCOUNT'}
  </button>

  {showCreateLecturer && (
    <div style={{ 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)', 
      padding: '24px', borderRadius: '16px', 
      border: '1px solid rgba(0,255,47,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
    }}>
      <h3 style={{ color: '#00ff2f', marginTop: 0, marginBottom: '20px' }}>
        NEW LECTURER ACCOUNT
      </h3>
      <input
        placeholder="FULL NAME"
        value={lecturerName}
        onChange={(e) => setLecturerName(e.target.value)}
        style={{ ...inputStyle, marginBottom: '12px' }}
      />
      <input
        type="email"
        placeholder="EMAIL ADDRESS"
        value={lecturerEmail}
        onChange={(e) => setLecturerEmail(e.target.value)}
        style={{ ...inputStyle, marginBottom: '12px' }}
      />
      <input
        type="password"
        placeholder="TEMPORARY PASSWORD"
        value={lecturerPassword}
        onChange={(e) => setLecturerPassword(e.target.value)}
        style={{ ...inputStyle, marginBottom: '20px' }}
      />
      <button
        onClick={async () => {
          if (!lecturerName || !lecturerEmail || !lecturerPassword) {
           showToast('Please fill in all fields.', 'warning'); 
           return;
          }
          if (lecturerPassword.length < 8 || !/\d/.test(lecturerPassword)) {
            showToast('Password must be 8+ characters and include a number.', 'warning');
             return;
          }
          // Email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
if (!emailRegex.test(lecturerEmail)) {
 showToast('Please enter a valid email address.', 'warning');
  return;
}
const blockedDomains = [
  'test.com', 'fake.com', 'asdf.com', 'mailinator.com',
  'guerrillamail.com', 'tempmail.com', 'throwaway.com',
  'yopmail.com', 'trashmail.com', 'maildrop.cc'
];
const emailDomain = lecturerEmail.split('@')[1]?.toLowerCase();
if (blockedDomains.includes(emailDomain)) {
  showToast('Please use a real email address.', 'warning');
   return;
}
          try {
            // Check if email already exists
            const allDocs = await localDB.allDocs({ include_docs: true });
            const exists = allDocs.rows.find(r => 
              r.doc.type === 'user' && 
              r.doc.email?.toLowerCase() === lecturerEmail.toLowerCase()
            );
            if (exists) {
             showToast('A user with this email already exists.', 'error'); 
             return;
            }
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(lecturerPassword, 10);
            await localDB.put({
              _id: `user_${lecturerEmail}`,
              type: 'user',
              name: lecturerName,
              email: lecturerEmail,
              password: hashedPassword,
              role: 'lecturer',
              createdAt: new Date().toISOString()
            });
           showToast('Lecturer account created for ' + lecturerName + '.', 'success');
            setLecturerName('');
            setLecturerEmail('');
            setLecturerPassword('');
            setShowCreateLecturer(false);
          } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
        }}
        style={{ 
          width: '100%', padding: '15px', border: 'none', 
          borderRadius: '10px', fontWeight: '900', cursor: 'pointer', 
          fontFamily: 'monospace', letterSpacing: '1px', 
          backgroundColor: '#00ff2f', color: '#000',
          boxShadow: '0 4px 16px rgba(0,255,47,0.2)'
        }}
      >
        CREATE LECTURER ACCOUNT
</button>

      
    </div>
  )}
</div>}

        {/* SECTION 1: ANALYTICS */}
        <h2 style={{ borderBottom: '2px solid rgba(0,255,47,0.3)', paddingBottom: '10px', color: '#111', fontSize: '1rem', letterSpacing: '1.5px', fontWeight: '900' }}>STUDENT ENGAGEMENT</h2>
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
        border: '1px solid rgba(0,0,0,0.08)', 
        padding: '18px', 
        borderRadius: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)', 
        backgroundColor: '#fff',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* STUDENT NAME */}
      <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#999', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Student Name</div>
      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#111', lineHeight: 1.2 }}>
        {stat.id.toUpperCase()}
      </div>
      
      {/* STUDENT LEVEL & EMAIL */}
      <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#777', lineHeight: 1.5 }}>
  <span style={{ fontWeight: '700', color: '#00aa1f', background: 'rgba(0,255,47,0.1)', padding: '2px 8px', borderRadius: '20px', marginRight: '6px' }}>LVL {stat.level}</span>
  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', marginTop: '4px' }}>{stat.email}</span>
</div>

  {/* COMPLETION COUNT */}
<div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Modules Completed</span>
  <span style={{ 
    marginLeft: 'auto',
    color: '#00ff2f', 
    backgroundColor: '#0a0a0a', 
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '900',
    letterSpacing: '1px'
  }}>
    {stat.completed}
  </span>
</div>

{/* VIEW QUIZ RESULTS BUTTON */}
<button
  onClick={async () => {
    const allDocs = await localDB.allDocs({ include_docs: true });
    const results = allDocs.rows
      .map(r => r.doc)
      .filter(d => d.type === 'quiz_result' && d.userId === stat.email);
    if (results.length === 0) {
     showToast(stat.id + ' has not taken any quizzes yet.', 'info');
      return;
    }
  setQuizResultsModal({ name: stat.id, results });
  }}
  style={{ 
    marginTop: '10px', width: '100%',
    padding: '8px', background: '#f5f5f5',
    color: '#333', border: '1px solid #e0e0e0',
    borderRadius: '8px', fontFamily: 'monospace',
    fontWeight: '700', cursor: 'pointer',
    fontSize: '0.7rem', letterSpacing: '0.5px'
  }}
>
  📊 VIEW QUIZ RESULTS
</button>
    </div>
  ))
)}
        </div>
    <div style={{ marginBottom: '20px', textAlign: 'right' }}>
  <button
    onClick={() => setShowQuizBuilder(true)}
    style={{ padding: '12px 24px', background: '#0a0a0a', color: '#00ff2f', border: '1px solid rgba(0,255,47,0.35)', borderRadius: '10px', fontFamily: 'monospace', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.1s ease' }}
  >
    🧪 CREATE QUIZ
  </button>
</div>
        {/* SECTION 2: CREATE/EDIT FORM */}
        <form onSubmit={handleSaveCourse} style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)', padding: isMobile ? '20px' : '30px', borderRadius: '16px', border: '1px solid rgba(0,255,47,0.12)', boxShadow: editingId ? '0 8px 32px rgba(0,0,0,0.25), 0 0 0 2px rgba(180,180,180,0.15)' : '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,255,47,0.1)', marginBottom: '50px' }}>
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
          <input 
     type="file" 
  key={editingId || 'new'}
  onChange={(e) => setSelectedFile(e.target.files[0])} 
  style={inputStyle} 
/>
          </div>
          <textarea placeholder="CONTENT" value={content} onChange={(e) => setContent(e.target.value)} required style={{ ...inputStyle, minHeight: '100px', marginBottom: '15px' }} />
          <button type="submit" style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '1px', backgroundColor: editingId ? '#fff' : '#00ff2f', color: '#000', marginTop: '8px', boxShadow: '0 4px 16px rgba(0,255,47,0.2)' }}>
            {editingId ? 'SAVE CHANGES' : 'PUBLISH MODULE'}
          </button>
        </form>
       {/* SECTION: PASSWORD RESET REQUESTS */}
{resetRequests.length > 0 && (
  <div style={{ marginBottom: '50px' }}>
    <h2 style={{ borderBottom: '2px solid rgba(255,68,68,0.3)', paddingBottom: '10px', color: '#111', fontSize: '1rem', letterSpacing: '1.5px', fontWeight: '900' }}>
      🔐 PASSWORD RESET REQUESTS 
      <span style={{ fontSize: '0.72rem', marginLeft: '10px', background: '#ff4444', color: '#fff', padding: '3px 10px', borderRadius: '20px' }}>
        {resetRequests.filter(r => r.status === 'pending').length} PENDING
      </span>
    </h2>
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {resetRequests.map(req => (
        <div key={req._id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#fff',
          borderRadius: '12px',
          borderLeft: req.status === 'pending' ? '4px solid #ff4444' : '4px solid #00ff2f',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <div>
            <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{req.email}</div>
            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
              Requested: {new Date(req.requestedAt).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: 'bold',
              color: req.status === 'pending' ? '#ff4444' : '#00aa00' }}>
              STATUS: {req.status?.toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {req.status === 'pending' && (
              <button
                style={{ ...actionBtnStyle, backgroundColor: '#00ff2f', color: '#000' }}
onClick={async () => {
  try {
    // Search for user with case-insensitive email match
const allDocs = await localDB.allDocs({ include_docs: true });
const userDoc = allDocs.rows
  .map(r => r.doc)
  .find(d => d.type === 'user' && d.email?.toLowerCase() === req.email?.toLowerCase());

if (!userDoc) throw new Error(`Student account not found for ${req.email}`);
await localDB.put({ ...userDoc, resetApproved: true });

    // 2. Mark request as approved
    const reqDoc = await localDB.get(req._id);
    await localDB.put({ ...reqDoc, status: 'approved', approvedAt: new Date().toISOString() });

    showToast('Reset approved for ' + req.email, 'success');
   } catch (err) {
  showToast('Error: ' + err.message, 'error');
}
}}
              >
                  APPROVE
              </button>
            )}
            <button
              style={{ ...actionBtnStyle, backgroundColor: '#ff4444' }}
 onClick={async () => {
  const yes = await showConfirm('Delete this reset request?');
  if (yes) {
    const reqDoc = await localDB.get(req._id);
    await localDB.remove(reqDoc);
  }
}} 
            >
              DEL
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        {/* SECTION 3: COURSE LIST */}
        <h2 style={{ borderBottom: '2px solid rgba(0,255,47,0.3)', paddingBottom: '10px', color: '#111', fontSize: '1rem', letterSpacing: '1.5px', fontWeight: '900' }}>ACTIVE MODULES</h2>
        <div style={{ marginTop: '20px' }}>
          {myCourses.map(course => (
            <div key={course._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '10px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
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
  <button
  onClick={async () => {
    const yes = await showConfirm('Delete this module? This cannot be undone.');
    if (yes) await localDB.remove(course);
  }}
  style={{ ...actionBtnStyle, backgroundColor: '#ff4444' }}
>
  DEL
</button>
</div>
</div>
            
 ))}
</div>
  {/* SECTION: MY QUIZZES */}
{myQuizzes.length > 0 && (
  <div style={{ marginTop: '40px' }}>
    <h2 style={{ borderBottom: '2px solid rgba(0,255,47,0.3)', paddingBottom: '10px', color: '#111', fontSize: '1rem', letterSpacing: '1.5px', fontWeight: '900', marginBottom: '20px' }}>
      🧪 MY QUIZZES
    </h2>
    {myQuizzes.map(quiz => {
      const module = myCourses.find(c => c._id === quiz.lessonId);
      return (
        <div key={quiz._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '10px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div>
            <strong style={{ color: '#000' }}>{module?.title || 'Unknown Module'}</strong>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
              {quiz.questions?.length || 0} questions • Pass mark: {quiz.passmark}%
            </div>
          </div>
          <button
  onClick={async () => {
  const yes = await showConfirm('Delete this quiz?');
  if (yes) {
    const doc = await localDB.get(quiz._id);
    await localDB.remove(doc);
  }
}}
            style={{ ...actionBtnStyle, backgroundColor: '#ff4444' }}
          >
            DEL
          </button>
        </div>
      );
    })}
  </div>
)}
      </div>
       {showQuizBuilder && (
        <QuizBuilder
          courses={myCourses}
          onClose={() => setShowQuizBuilder(false)}
        />
      )}
      {quizResultsModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)', zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  }} onClick={e => { if (e.target === e.currentTarget) setQuizResultsModal(null); }}>
    <div style={{
      background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
      maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 24px 64px rgba(0,0,0,0.3)', fontFamily: 'monospace', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#00ff2f', fontWeight: '900', fontSize: '0.95rem' }}>📊 QUIZ RESULTS</div>
          <div style={{ color: '#555', fontSize: '0.65rem', marginTop: '2px' }}>
            {quizResultsModal.name.toUpperCase()}
          </div>
        </div>
        <button onClick={() => setQuizResultsModal(null)} style={{
          background: '#ff4444', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'monospace', fontWeight: '700',
        }}>✕</button>
      </div>

      {/* Results list */}
      <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quizResultsModal.results.map((r, i) => (
          <div key={i} style={{
            border: `1px solid ${r.passed ? 'rgba(0,255,47,0.25)' : 'rgba(255,68,68,0.25)'}`,
            borderLeft: `4px solid ${r.passed ? '#00ff2f' : '#ff4444'}`,
            borderRadius: '10px', padding: '14px 16px',
            background: r.passed ? 'rgba(0,255,47,0.04)' : 'rgba(255,68,68,0.04)',
          }}>
            <div style={{ fontWeight: '900', fontSize: '0.85rem', color: '#111', marginBottom: '8px' }}>
              📘 {r.lessonTitle || r.lessonId}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                background: r.passed ? '#00ff2f' : '#ff4444',
                color: r.passed ? '#000' : '#fff',
              }}>
                {r.passed ? '✅ PASSED' : '❌ FAILED'}
              </span>
              <span style={{
                fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
                background: '#f5f5f5', color: '#555', border: '1px solid #e0e0e0',
              }}>
                Score: {r.score}%
              </span>
              <span style={{
                fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
                background: '#f5f5f5', color: '#555', border: '1px solid #e0e0e0',
              }}>
                {r.correct}/{r.total} correct
              </span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '8px' }}>
              {new Date(r.completedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' };
const actionBtnStyle = { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace', transition: 'opacity 0.15s ease' };

export default LecturerDashboard;