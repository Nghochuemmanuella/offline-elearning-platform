import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; 
import localDB, { saveProgress, getLocalUser, startSync, resolveConflicts } from './db'; 
import bcrypt from 'bcryptjs'
import Sidebar from './Sidebar'; 
import Auth from './Auth'; 
import LecturerDashboard from './LecturerDashboard'; 
import Profile from './Profile';
import AITutor from './AITutor';
import StudentDashboard from './StudentDashboard';
import LandingPage from './LandingPage';

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
  const [showLanding, setShowLanding] = useState(true); 
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
      // 1. Fetch all documents from the local PouchDB
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      
      // 2. Extract lessons (Modules)
      const fetched = result.rows
        .filter(row => row.doc.type === 'lesson')
        .map(row => ({ ...row.doc, id: row.doc._id }));
      setDynamicLessons(fetched);

      // 3. Extract persistent progress for the logged-in student
      if (currentUserId) {
       const progress = [...new Set(result.rows
  .filter(row => 
    row.doc.type === 'progress' && 
    (row.doc.userId === currentUserId || row.id.includes(currentUserId))
  )
  .map(row => row.doc.lessonId))]; 

        console.log("Successfully restored progress from DB:", progress);
        setCompletedLessons(progress);
      }
    } catch (err) { 
      console.error("Database Fetch Error:", err); 
    }
  }, []); 

  useEffect(() => {
    // 1. Force Lecturer view if user is an admin
    if (isLecturer && view === 'student') setView('lecturer');

    // 2. Fetch courses and progress using the most reliable ID
    // PouchDB usually uses _id. If that's missing, we fall back to id.
    const activeId = user?.email || user?._id || user?.id ;
    if (activeId) {
      fetchAllCourses(user.email || activeId);
    }

    // 3. Handle Screen Resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user, isLecturer, view, fetchAllCourses]); // Added 'view' to dependencies for stability
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

  const handleLogin = async (userData) => {
    // 1. ADMIN BYPASS (Hardcoded for you to always have access)
    if (userData.email === "admin@edubridge.com" && userData.password === "Admin1234") {
      const adminObj = { 
        name: "System Admin", 
        id: "admin_root", 
        role: "lecturer", 
        email: userData.email,
        level: '400' 
      };
      setUser(adminObj);
      localStorage.setItem('edubridge_user', JSON.stringify(adminObj));
      setView('lecturer');
      startSync();
      resolveConflicts();

      return;
    }

    // 2. DATABASE SEARCH (Check for registered Students/Lecturers)
    try {
      const result = await localDB.allDocs({ include_docs: true });
      
      // Look for a user doc where email AND password match
      const matchedUsers = result.rows.filter(row => 
  row.doc.type === 'user' && 
  row.doc.email === userData.email
);

const foundUser = await Promise.all(
  matchedUsers.map(async row => {
    const match = await bcrypt.compare(userData.password, row.doc.password);
    return match ? row : null;
  })
).then(results => results.find(r => r !== null));

      if (foundUser) {
        const userObj = foundUser.doc;
        setUser(userObj);
        localStorage.setItem('edubridge_user', JSON.stringify(userObj));
        setSelectedLevel(userObj.level || null);
        
        // Decide where to send them
        const isAdmin = userObj.role === 'lecturer' || userObj.name?.toLowerCase().includes('admin');
        setView(isAdmin ? 'lecturer' : 'student');
        startSync();
        resolveConflicts();
      } else {
        // If nothing matches
        alert("❌ Invalid Email or Password. Please try again.");
      }
    } catch (err) {
      console.error("Login Database Error:", err);
      alert("⚠️ Offline Database Error. Please refresh.");
    }
  };
   

  const saveLevel = async (level) => {
    try {
      // 1. Update the record in the persistent database (PouchDB)
      // We use user._id or user.id to find the correct document
      const userId = user._id || user.id;
      
      if (userId) {
        const userDoc = await localDB.get(userId);
        const updatedDoc = { 
          ...userDoc, 
          level: level 
        };
        await localDB.put(updatedDoc);
      }

      // 2. Update the local React state and Browser Storage
      const updatedUser = { ...user, level: level };
      setUser(updatedUser);
      localStorage.setItem('edubridge_user', JSON.stringify(updatedUser));
      setSelectedLevel(level);
      
      // 3. Refresh courses to show only modules for the new level
      if (typeof fetchAllCourses === 'function') {
        fetchAllCourses(userId);
      }

      console.log(`✅ Level ${level} saved to database for admin visibility.`);
    } catch (err) {
      console.error("❌ Database sync failed:", err);
      
      // Fallback: Still update UI state so the student isn't blocked 
      // if the database record is temporarily missing.
      setSelectedLevel(level);
    }
  };
  const handleLogout = () => {
    if (window.confirm("Exit EduBridge?")) {
      localStorage.removeItem('edubridge_user');
      window.location.reload();
    }
  };

const handleComplete = async (lessonId) => {
  if (!user) return;
  
  const activeId = user._id || user.id; 
  
  if (!activeId) {
    console.error("Cannot save progress: No User ID found");
    return;
  }

  try {
    // 1. SAVE DIRECTLY TO POUCHDB
    // We use a unique ID and explicit 'type' so the Lecturer can filter it
    await localDB.put({
      _id: progressId,
      _rev: existingDoc?._rev,
      type: 'progress',
      userId: user.email,
      lessonId: lessonId,
      status: 'complete',
      completedAt: new Date().toISOString()
});
    
    // 2. UPDATE LOCAL UI STATE
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) return prev;
      return [...prev, lessonId];
    });

    // 3. CLOSE MODAL
    setSelectedCourse(null);
    
    console.log(`✅ Progress for ${lessonId} saved for Lecturer visibility.`);
    
    // 4. REFRESH DATA (Optional but helpful)
    if (typeof fetchAllCourses === 'function') {
      fetchAllCourses(activeId);
    }

  } catch (err) {
    console.error("❌ Persistence Error:", err);
    // Fallback: update UI even if DB fails
    setCompletedLessons(prev => [...prev, lessonId]);
    setSelectedCourse(null);
  }
};
  
  // 1. Combine standard content and database lessons
  const allCourses = [...COURSE_CONTENT, ...dynamicLessons];

  // 2. Filter courses for the search bar AND the student's level
  const levelSpecificCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Lecturers see everything; Students see only their level (200, 300, 400)
    const matchesLevel = isLecturer ? true : (course.level === selectedLevel);
    
    return matchesSearch && matchesLevel;
  });

  // 3. Calculate percentage based ONLY on modules for the current level
  // This ensures 1/1 = 100% instead of 1/3 = 33%
  const completionPercent = levelSpecificCourses.length > 0 
    ? Math.round((completedLessons.length / levelSpecificCourses.length) * 100) 
    : 0;

  // --- END OF CORRECTED BLOCK ---
  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;
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

      {/* --- UPDATED NAVIGATION LOGIC --- */}
{view === 'lecturer' || view === 'upload'? (
  <LecturerDashboard isMobile={isMobile} user={user}
  initialMode={view === 'upload' ? 'upload' : 'view'} />
) : view === 'profile' ? (
   <Profile user={user} 
   isLecturer={isLecturer}
   allCourses={levelSpecificCourses}  
   completedLessons={completedLessons}
   selectedLevel={selectedLevel}
   onLevelChange={saveLevel}/>
) : view === 'ai' ? (
  <div style={{ padding: '20px' }}><AITutor /></div>
) : (
  <StudentDashboard
            user={user}
            selectedLevel={selectedLevel}
            isOnline={isOnline}
            completionPercent={completionPercent}
            levelSpecificCourses={levelSpecificCourses}
            completedLessons={completedLessons}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            handleComplete={handleComplete}
            LESSON_MATERIALS={LESSON_MATERIALS}
          />
        )}
      </div>
    </div>
  );
}

export default App;