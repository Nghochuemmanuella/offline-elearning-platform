import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; 
import localDB, { saveProgress, getLocalUser, startSync } from './db'; 
import Sidebar from './Sidebar'; 
import Auth from './Auth'; 
import LecturerDashboard from './LecturerDashboard'; 
import Profile from './Profile';
import AITutor from './AITutor';

const COURSE_CONTENT = []

const LESSON_MATERIALS = {
  1: "Focus on Offline-First Design: Learn about Service Workers and PouchDB synchronization patterns.",
  2: "Database Systems: Understanding NoSQL vs SQL. We use CouchDB for its master-master replication.",
  3: "Distributed Systems: Exploring CAP theorem and how data stays consistent across nodes.",
  4: "HCI: Designing interfaces for low-bandwidth environments in the Northwest Region.",
  5: "Mobile Dev: Building hybrid apps using React and Capacitor.",
  6: "Client-Server: This module covers the Bridge you just built between PouchDB and CouchDB!"
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('edubridge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState('student');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [dynamicLessons, setDynamicLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isLecturer = user?.name?.toLowerCase().includes('admin') || user?.email?.includes('lecturer');
  const [selectedLevel, setSelectedLevel] = useState(user?.level || null);

  const fetchAllCourses = useCallback(async (currentUserId) => {
    try {
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      const fetched = result.rows
        .filter(row => row.doc.type === 'lesson')
        .map(row => ({ ...row.doc, id: row.doc._id }));
      setDynamicLessons(fetched);
      if (currentUserId) {
        const progress = result.rows
          .filter(row => row.id.startsWith(`progress_${currentUserId}_`))
          .map(row => row.doc.lessonId);
        setCompletedLessons(progress);
      }
    } catch (err) { console.log(err); }
  }, []);

  useEffect(() => {
    if (isLecturer) setView('lecturer');
    fetchAllCourses(user?.id);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user, isLecturer, fetchAllCourses]);

  // --- NETWORK STATUS LISTENER ---
useEffect(() => {
  const handleStatusChange = () => {
    setIsOnline(navigator.onLine);
  };

  window.addEventListener('online', handleStatusChange);
  window.addEventListener('offline', handleStatusChange);

  // Clean up on unmount
  return () => {
    window.removeEventListener('online', handleStatusChange);
    window.removeEventListener('offline', handleStatusChange);
  };
}, []);

  const handleLogin = (userData) => {
    const userObj = typeof userData === 'string' 
      ? { name: userData, id: userData.replace(/\s+/g, '_').toLowerCase() } 
      : userData;
    setUser(userObj);
    localStorage.setItem('edubridge_user', JSON.stringify(userObj));
    setSelectedLevel(userObj.level || null);
    const isAdmin = userObj.name?.toLowerCase().includes('admin');
    setView(isAdmin ? 'lecturer' : 'student');
  };
   

  const saveLevel = (level) => {
  const updatedUser = { ...user, level: level };
  setUser(updatedUser);
  localStorage.setItem('edubridge_user', JSON.stringify(updatedUser));
  setSelectedLevel(level);
  
  // Optional: Re-fetch courses specifically for this level
  if (typeof fetchAllCourses === 'function') {
    fetchAllCourses(user.id);
  }
};
  const handleLogout = () => {
    if (window.confirm("Exit EduBridge?")) {
      localStorage.removeItem('edubridge_user');
      window.location.reload();
    }
  };

  const handleComplete = async (id) => {
    if (!user) return;
    await saveProgress(id, 'complete', user.id);
    setCompletedLessons(prev => [...prev, id]); // Instant UI update
    setSelectedCourse(null);
  };

  const allCourses = [...COURSE_CONTENT, ...dynamicLessons];
  const filtered = allCourses.filter(course => {
  const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
  
  // If user is a student, only show courses for their level
  // Note: Standard courses like COURSE_CONTENT might need a 'level' property added later
  const matchesLevel = isLecturer ? true : (course.level === selectedLevel);
  
  return matchesSearch && matchesLevel;
});
  const completionPercent = allCourses.length > 0 ? Math.round((completedLessons.length / allCourses.length) * 100) : 0;

  if (!user) return <Auth onLogin={handleLogin} />;
  // If logged in as student but no level is selected yet
if (user && !isLecturer && !selectedLevel) {
  return (
    <div style={{ 
      height: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#00ff2f' 
    }}>
      <h2 style={{ marginBottom: '30px', fontWeight: '900', textAlign: 'center' }}>
        SELECT YOUR ACADEMIC LEVEL
      </h2>
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', width: '250px' }}>
        {['200', '300', '400'].map(lvl => (
          <button 
            key={lvl}
            onClick={() => saveLevel(lvl)}
            style={{ 
              padding: '20px', background: '#00ff2f', color: '#000', 
              border: 'none', fontWeight: '900', cursor: 'pointer',
              fontSize: '1.2rem', boxShadow: '6px 6px 0px #333'
            }}
          >
            LEVEL {lvl}
          </button>
        ))}
      </div>
      <p style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>
        This helps EduBridge provision the right offline modules for you.
      </p>
    </div>
  );
}
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'monospace' }}>
      <Sidebar isOpen={isSidebarOpen} user={user} onNavigate={setView} onLogout={handleLogout} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div style={{ flex: 1, marginLeft: isSidebarOpen && !isMobile ? '280px' : '0', transition: '0.3s' }}>
        <nav style={{ background: '#000', color: '#00ff2f', padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #00ff2f', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#00ff2f', fontSize: '20px', cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: '900' }}>EDUBRIDGE</span>
          <span style={{ fontSize: '0.7rem', border: '1px solid #00ff2f', padding: '2px 5px', border: isOnline ? '1px solid #00ff2f' : '1px solid #ff4444', 
  backgroundColor: isOnline ? 'transparent' : '#ff4444',
  color: isOnline ? '#00ff2f' : '#fff'}}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </nav>

        {view === 'lecturer' ? (
          <LecturerDashboard isMobile={isMobile} />
        ) : view === 'ai' ? (
          <div style={{ padding: '20px' }}><AITutor /></div>
        ) : (
          <main style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px', background: '#000', color: '#fff', padding: '20px', boxShadow: '8px 8px 0px #00ff2f' }}>
              <h1 style={{ margin: 0, color: '#00ff2f' }}>Welcome, {user?.name}!</h1>
              <p style={{ margin: '5px 0 15px 0', opacity: 0.8 }}>Software Engineering Final Year Portal</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span>COURSE PROGRESS</span>
                <span>{completionPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#333' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', background: '#00ff2f' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>MODULES</h2>
              <input type="text" placeholder="SEARCH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', background: '#000', color: '#00ff2f', border: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filtered.map(course => {
                const isDone = completedLessons.includes(course.id);
                return (
                  <div key={course.id} style={{ background: '#fff', border: '3px solid #000', padding: '20px', boxShadow: isDone ? '6px 6px 0px #00ff2f' : '6px 6px 0px #000' }}>
                    <small style={{ color: '#888' }}>{course.code}</small>
                    <h3 style={{ margin: '10px 0' }}>{course.title}</h3>
                    <button onClick={() => setSelectedCourse(course)} style={{ width: '100%', padding: '12px', background: isDone ? '#000' : '#00ff2f', color: isDone ? '#00ff2f' : '#000', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>
                      {isDone ? 'RE-VISIT' : 'START NOW'}
                    </button>
                  </div>
                );
              })}
            </div>
          </main>
        )}
      </div>

      {selectedCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#fff', padding: '30px', maxWidth: '600px', width: '90%', border: '4px solid #000', boxShadow: '10px 10px 0px #00ff2f' }}>
            <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #000' }}>{selectedCourse.title}</h2>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', padding: '10px', background: '#f4f4f4' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCourse.content || LESSON_MATERIALS[selectedCourse.id] || "No offline content."}</p>
            </div>

            {selectedCourse._attachments && (
               <div style={{ marginBottom: '20px' }}>
                 <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>📎 ATTACHMENTS:</p>
                 {Object.keys(selectedCourse._attachments).map(name => (
                   <button key={name} onClick={async () => {
                     const blob = await localDB.getAttachment(selectedCourse._id, name);
                     window.open(URL.createObjectURL(blob));
                   }} style={{ background: '#000', color: '#fff', fontSize: '0.6rem', padding: '5px', marginRight: '5px', cursor: 'pointer' }}>{name.toUpperCase()}</button>
                 ))}
               </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleComplete(selectedCourse.id)} style={{ flex: 1, padding: '15px', background: '#000', color: '#00ff2f', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>COMPLETE MODULE</button>
              <button onClick={() => setSelectedCourse(null)} style={{ flex: 1, padding: '15px', background: '#fff', border: '1px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;