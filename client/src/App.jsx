import React, { useState, useEffect } from 'react';
import './App.css'; 
import localDB, { saveProgress } from './db'; 
import Sidebar from './Sidebar'; 
import Auth from './Auth'; 

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [user, setUser] = useState(null); // Tracks if logged in
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- 2. THE ENGINE (Connection & Data Loading) ---
  useEffect(() => {
    // Check for internet changes
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Load lesson progress from PouchDB
    const loadData = async () => {
      try {
        const result = await localDB.allDocs({ include_docs: true });
        const ids = result.rows.map(row => row.doc.lessonId);
        setCompletedLessons(ids);
      } catch (err) {
        console.log("Database initialized.");
      }
    };
    loadData();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // --- 3. ACTIONS ---
  const handleLogin = (userName) => {
    setUser(userName); 
  };

  const handleComplete = async (id) => {
    await saveProgress(id, 'completed');
    setCompletedLessons([...completedLessons, id]);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 4. GATEKEEPER (If no user, show Login screen) ---
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // --- 5. MAIN DASHBOARD UI (If user exists) ---
  return (
    <div className="App" style={{ 
      marginLeft: isSidebarOpen ? '280px' : '0', 
      transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100vh',
      backgroundColor: '#ffffff' 
    }}>
      
      {/* SIDEBAR COMPONENT */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* TOP NAVIGATION (BLACK & NEON) */}
      <nav style={{ 
        background: '#000000', 
        color: '#00ff2f', 
        padding: '15px 20px', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: '#00ff2f', fontSize: '24px', cursor: 'pointer', marginRight: '20px' }}
          >
            ☰
          </button>
          <h2 style={{ margin: 0, letterSpacing: '3px', fontWeight: '900' }}>EDUBRIDGE</h2>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', borderLeft: '2px solid #333', paddingLeft: '15px' }}>
          STUDENT: <span style={{ color: '#fff' }}>{user.toUpperCase()}</span>
        </div>
      </nav>

      {/* OFFLINE STATUS BANNER (NEON GREEN) */}
      {!isOnline && (
        <div style={{ backgroundColor: '#ef0000e2', color: '#000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px' }}>
          ⚡ OFFLINE MODE ACTIVE: DATA SAVING TO LOCAL ENGINE
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main style={{ padding: '50px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <header style={{ marginBottom: '50px', paddingLeft: '25px' }}>
          <h1 style={{ color: '#000000', margin: '12', fontSize: '3rem', fontWeight: '900', textTransform: 'uppercase' }}>
            Welcome, {user}
          </h1>
          <p style={{ color: '#666', marginTop: '10px', fontSize: '1.1rem' }}>
           Your <strong>Software Engineering Journey </strong> starts Here .
          </p>
        </header>

        {/* LESSON LIST SECTION */}
        <section>
          {[1, 2, 3].map((num) => (
            <div key={num} style={{ 
              backgroundColor: '#ffffff', 
              border: '4px solid #000000', 
              marginBottom: '30px', 
              padding: '30px', 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '10px 10px 0px #00ff2f' // Bold Neon Shadow
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>MODULE 0{num}</span>
                <h3 style={{ margin: '5px 0', color: '#000000', fontSize: '1.4rem' }}>
                  Advanced System Architecture & Offline Sync
                </h3>
              </div>
              
              {completedLessons.includes(num) ? (
                <div style={{ 
                  backgroundColor: '#00ff2f', 
                  color: '#000', 
                  padding: '12px 25px', 
                  fontWeight: '900',
                  border: '2px solid #000'
                }}>
                  DONE
                </div>
              ) : (
                <button 
                  onClick={() => handleComplete(num)}
                  style={{ 
                    backgroundColor: '#000', 
                    color: '#00ff2f', 
                    border: 'none', 
                    padding: '15px 30px', 
                    fontWeight: '900', 
                    cursor: 'pointer',
                    letterSpacing: '1px'
                  }}
                >
                  COMPLETE
                </button>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;