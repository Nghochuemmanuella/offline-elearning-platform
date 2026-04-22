import React from 'react';

const Sidebar = ({ isOpen, toggleSidebar, user, onNavigate, onLogout }) => {
  
  const isLecturer = user?.name?.toLowerCase().includes('admin') || user?.email?.includes('lecturer');

  // Updated Menu Items to include the AI Assistant
  const menuItems = isLecturer ? [
    { name: '📊 Admin Dashboard', id: 'lecturer' },
    { name: '📚 Content Preview', id: 'student' },
    { name: '🤖 Offline AI Assistant', id: 'ai' }, // Added here
    { name: '👤 Faculty Profile', id: 'profile' },
    { name: '⚙️ Settings', id: 'settings' }
  ] : [
    { name: '🏠 Student Home', id: 'student' },
    { name: '📖 My Courses', id: 'student' },
    { name: '🤖 Offline AI Assistant', id: 'ai' }, // Added here
    { name: '🏆 Academic Profile', id: 'profile' },
    { name: '⚙️ Settings', id: 'settings' }
  ];

  return (
    <div style={{
      width: isOpen ? '280px' : '0',
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: '#000000',
      color: '#00ff2f',
      overflowX: 'hidden',
      transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      paddingTop: '80px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isOpen ? '4px 0px 15px rgba(0, 255, 47, 0.2)' : 'none',
      borderRight: isOpen ? '2px solid #00ff2f' : 'none'
    }}>
      <button 
        onClick={toggleSidebar}
        style={{ 
          position: 'absolute', top: '20px', right: '20px', 
          background: '#00ff2f', border: 'none', color: '#000', 
          width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' 
        }}
      >
        ×
      </button>

      {/* BRANDING SECTION */}
      <div style={{ padding: '0 25px 30px 25px', borderBottom: '1px solid #1a1a1a' }}>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>EDUBRIDGE</h2>
        <div style={{ 
          display: 'inline-block',
          marginTop: '8px',
          padding: '2px 8px',
          backgroundColor: isLecturer ? '#00ff2f' : '#333',
          color: isLecturer ? '#000' : '#00ff2f',
          fontSize: '0.6rem',
          fontWeight: 'bold',
          borderRadius: '3px',
          letterSpacing: '1px'
        }}>
          {isLecturer ? 'ADMINISTRATOR' : 'STUDENT ENGINE'}
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <div style={{ flex: 1, marginTop: '20px' }}>
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            style={{ 
              padding: '18px 25px', 
              cursor: 'pointer', 
              fontSize: '0.95rem', 
              fontWeight: 'bold', 
              borderBottom: '1px solid #0d0d0d', 
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#111'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => {
              onNavigate(item.id); 
              toggleSidebar();
            }}
          >
            {item.name}
          </div>
        ))}

        {/* --- SPECIAL LECTURER ACTION --- */}
        {isLecturer && (
          <div style={{ padding: '20px' }}>
            <div 
              style={{ 
                padding: '15px', 
                cursor: 'pointer', 
                fontSize: '0.85rem', 
                fontWeight: '900', 
                backgroundColor: '#00ff2f', 
                color: '#000',
                textAlign: 'center',
                boxShadow: '4px 4px 0px #fff',
                border: '2px solid #000'
              }}
              onClick={() => {
                onNavigate('lecturer'); 
                toggleSidebar();
              }}
            >
              ⚡ QUICK UPLOAD
            </div>
          </div>
        )}
      </div>

      {/* --- USER CONTEXT & LOGOUT --- */}
      <div style={{ padding: '20px 25px', backgroundColor: '#080808', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>
          CONNECTED AS: <br/>
          <span style={{ color: '#fff', fontSize: '0.8rem' }}>{user.name}</span>
        </div>
        
        <div 
          style={{ 
            padding: '10px 0', 
            cursor: 'pointer', 
            color: '#ff4444', 
            fontWeight: 'bold',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onClick={() => {
            if(window.confirm("Disconnect from EduBridge Session?")) {
              onLogout();
            }
          }}
        >
          <span>🚪</span> SIGN OUT
        </div>
      </div>
    </div>
  );
};

export default Sidebar;