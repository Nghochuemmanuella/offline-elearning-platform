import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; 
import localDB, { saveProgress, getLocalUser, startSync } from './db'; 
import Sidebar from './Sidebar'; 
import Auth from './Auth'; 
import LecturerDashboard from './LecturerDashboard'; 
import Profile from './Profile';
import AITutor from './AITutor';

const COURSE_CONTENT = [
  { id: 1, title: "Advanced Software Architecture", code: "CENP4105", credits: 4, type: "Core" },
  { id: 2, title: "Database Management Systems", code: "CENP3102", credits: 3, type: "Core" },
  { id: 3, title: "Distributed Systems & Cloud", code: "CENP4107", credits: 4, type: "Elective" },
  { id: 4, title: "Human Computer Interaction", code: "SWE3105", credits: 2, type: "Core" },
  { id: 5, title: "Mobile Application Development", code: "SWE4109", credits: 3, type: "Practical" },
  { id: 6, title: "Client Server Development", code: "SWE4110", credits: 3, type: "Practical" }
];

const LESSON_MATERIALS = {
  1: "Focus on Offline-First Design: Learn about Service Workers and PouchDB synchronization patterns.",
  2: "Database Systems: Understanding NoSQL vs SQL. We use CouchDB for its master-master replication.",
  3: "Distributed Systems: Exploring CAP theorem and how data stays consistent across nodes.",
  4: "HCI: Designing interfaces for low-bandwidth environments in the Northwest Region.",
  5: "Mobile Dev: Building hybrid apps using React and Capacitor.",
  6: "Client-Server: This module covers the Bridge you just built between PouchDB and CouchDB!"
};

function App() {
  const [user, setUser] = useState(null); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [dynamicLessons, setDynamicLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null); 
  const [view, setView] = useState('student'); 
  const [syncMessage, setSyncMessage] = useState("");

  // Screen size state for responsive tweaks
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLecturer = user?.name?.toLowerCase().includes('admin') || user?.email?.includes('lecturer');

  const showToast = (msg) => {
    setSyncMessage(msg);
    setTimeout(() => setSyncMessage(""), 4000); 
  };

  const fetchAllCourses = useCallback(async (currentUserId) => {
    try {
      const result = await localDB.allDocs({ include_docs: true, attachments: true });
      const fetchedLessons = result.rows
        .filter(row => row.doc.type === 'lesson')
        .map(row => ({
           id: row.doc._id,
           title: row.doc.title,
           code: row.doc.code || "EXT-001",
           credits: row.doc.credits || 0,
           content: row.doc.content,
           _attachments: row.doc._attachments,
           _id: row.doc._id,
           type: "Offline Content"
        }));
      setDynamicLessons(fetchedLessons);

      if (currentUserId) {
        const progressIds = result.rows
          .filter(row => row.id.startsWith(`progress_${currentUserId}_`)) 
          .map(row => row.doc.lessonId);
        setCompletedLessons(progressIds);
      }
    } catch (err) {
      console.log("Error loading database content", err);
    }
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const initApp = async () => {
      const savedUser = await getLocalUser();
      if (savedUser) {
        setUser(savedUser);
        fetchAllCourses(savedUser.id);
      }
    };

    initApp();

    const syncHandler = startSync();
    syncHandler.on('paused', (info) => {
      if (info && (info.push?.docs_read > 0 || info.pull?.docs_read > 0)) {
        showToast("🔄 DATA SYNCED: Remote & Local nodes merged.");
      }
    });

    const dbListener = localDB.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', () => {
      fetchAllCourses(user?.id); 
    });

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      syncHandler.cancel();
      dbListener.cancel();
    };
  }, [fetchAllCourses, user?.id]);

  const handleLogin = (userData) => {
    const userObj = typeof userData === 'string' ? { name: userData, id: userData.replace(/\s+/g, '_').toLowerCase() } : userData;
    setUser(userObj);
    const isAdmin = userObj.name?.toLowerCase().includes('admin') || userObj.email?.includes('lecturer');
    setView(isAdmin ? 'lecturer' : 'student');
    fetchAllCourses(userObj.id);
  };
  
  const handleComplete = async (id) => {
    if (!user) return;
    await saveProgress(id, 'complete', user.id);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const allAvailableCourses = [...COURSE_CONTENT, ...dynamicLessons];
  const filteredCourses = allAvailableCourses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const uniqueCompletions = [...new Set(completedLessons)].length;
  const completionPercentage = allAvailableCourses.length > 0 
    ? Math.min(Math.round((uniqueCompletions / allAvailableCourses.length) * 100), 100) 
    : 0;

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'monospace', overflowX: 'hidden' }}>
      
      {/* Sidebar - Now handles mobile overlay automatically */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        user={user} 
        onNavigate={(target) => { setView(target); if(isMobile) setIsSidebarOpen(false); }} 
        onLogout={() => { localStorage.clear(); window.location.reload(); }}
      />

      {/* Main Content Area - Responsive Margin */}
      <div style={{ 
        marginLeft: isSidebarOpen && !isMobile ? '280px' : '0', 
        transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '100vh',
        width: '100%'
      }}>
        
        {/* Navigation Bar */}
        <nav style={{ 
          background: '#000', color: '#00ff2f', padding: '15px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100, borderBottom: '2px solid #00ff2f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#00ff2f', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>☰</button>
            <h2 style={{ margin: 0, letterSpacing: '1px', fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>EDUBRIDGE</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              padding: '4px 8px', border: `1px solid ${isOnline ? '#00ff2f' : '#ff4444'}`, 
              borderRadius: '4px', fontSize: '0.6rem', color: isOnline ? '#00ff2f' : '#ff4444',
              fontWeight: 'bold'
            }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </nav>

        {(() => {
          if (view === 'lecturer') return <LecturerDashboard isMobile={isMobile} />;
          if (view === 'profile') return <Profile user={user} isLecturer={isLecturer} allCourses={allAvailableCourses} completedLessons={completedLessons} />;
          if (view === 'ai') return <div style={{ padding: isMobile ? '15px' : '30px' }}><AITutor /></div>;
          return (
            <main style={{ padding: isMobile ? '15px' : '30px', backgroundColor: '#f9f9f9', minHeight: '90vh' }}>
              
              {/* Progress Bar Container */}
              <div style={{ backgroundColor: '#000', padding: '15px', border: '4px solid #000', boxShadow: '6px 6px 0px #00ff2f', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ff2f', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  <span>STUDENT PROGRESS</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#333' }}>
                  <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: '#00ff2f', transition: 'width 0.5s' }}></div>
                </div>
              </div>

              {/* Title and Search Section */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                marginBottom: '25px',
                gap: '15px'
              }}>
                <h1 style={{ color: '#000', margin: '0', fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: '900' }}>COURSES</h1>
                <input 
                  type="text" 
                  placeholder="SEARCH..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ 
                    padding: '12px', 
                    width: isMobile ? '100%' : '250px', 
                    backgroundColor: '#000', 
                    color: '#00ff2f', 
                    border: 'none',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              {/* Responsive Course Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {filteredCourses.map((course) => {
                  const isDone = completedLessons.includes(course.id);
                  return (
                    <div key={course.id} style={{ backgroundColor: '#fff', border: '3px solid #000', padding: '20px', boxShadow: isDone ? '5px 5px 0px #00ff2f' : '5px 5px 0px #000' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>{course.code}</div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>{course.title}</h3>
                      <button onClick={() => setSelectedCourse(course)} style={{ backgroundColor: isDone ? '#000' : '#00ff2f', color: isDone ? '#00ff2f' : '#000', fontWeight: '900', padding: '12px', width: '100%', border: '2px solid #000', cursor: 'pointer' }}>
                        {isDone ? 'RE-VISIT' : 'START NOW'}
                      </button>
                    </div>
                  );
                })}
              </div>   
            </main>
          );
        })()}
      </div>

      {/* Sync Toast Notification */}
      {syncMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', left: isMobile ? '20px' : 'auto', 
          backgroundColor: '#000', color: '#00ff2f',
          padding: '12px 20px', border: '3px solid #00ff2f', fontWeight: '900', zIndex: 9999,
          boxShadow: '5px 5px 0px #000', fontSize: '0.8rem'
        }}>
          {syncMessage}
        </div>
      )}

      {/* Responsive Lesson Modal */}
      {selectedCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '10px' : '0' }}>
          <div style={{ 
            backgroundColor: '#fff', padding: isMobile ? '25px' : '40px', 
            width: '100%', maxWidth: '600px', border: '4px solid #000', 
            boxShadow: '10px 10px 0px #00ff2f', boxSizing: 'border-box' 
          }}>
            <h2 style={{ textTransform: 'uppercase', fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.5rem', marginBottom: '15px' }}>{selectedCourse.title}</h2>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' }}>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                {selectedCourse.content || LESSON_MATERIALS[selectedCourse.id] || "No materials found."}
              </p>
            </div>

            {selectedCourse._attachments && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px dashed #000' }}>
                <div style={{ marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>📎 DOWNLOADS:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.keys(selectedCourse._attachments).map((fileName) => (
                    <button
                      key={fileName}
                      onClick={async () => {
                        try {
                          const blob = await localDB.getAttachment(selectedCourse._id, fileName);
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch (err) {
                          alert("Error: " + err.message);
                        }
                      }}
                      style={{
                        backgroundColor: '#000', color: '#fff', border: 'none', padding: '6px 12px',
                        fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      {fileName.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '25px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
              <button 
                onClick={() => { handleComplete(selectedCourse.id); setSelectedCourse(null); }} 
                style={{ backgroundColor: '#000', color: '#00ff2f', padding: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
              >
                COMPLETE
              </button>
              <button 
                onClick={() => setSelectedCourse(null)} 
                style={{ padding: '12px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', fontWeight: 'bold', flex: 1 }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;