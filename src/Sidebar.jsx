import React from 'react';

const Sidebar = ({ isOpen, toggleSidebar, user, onNavigate, onLogout }) => {
  
  // 1. Identify if user is Lecturer/Admin
  const isLecturer = user?.role === 'lecturer' || 
                     user?.name?.toLowerCase().includes('admin') || 
                     user?.email?.includes('lecturer');

  const menuItems = isLecturer ? [
    { name: '📊 Admin Dashboard', id: 'lecturer' },
    { name: '📚 Content Preview', id: 'student' },
    { name: '🤖 Offline AI Assistant', id: 'ai' },
    { name: '👤 Faculty Profile', id: 'profile' }
  ] : [
    { name: '🏠 Student Home', id: 'student' },
    { name: '📖 My Courses', id: 'student' },
    { name: '🤖 Offline AI Assistant', id: 'ai' },
    { name: '🏆 Academic Profile', id: 'profile' }
  ];

  return (
    <div style={{
      width: isOpen ? '280px' : '0px',
      position: 'fixed',
      left: 0, top: 0, height: '100vh',
      backgroundColor: '#000',
      color: '#00ff2f',
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      borderRight: isOpen ? '2px solid #00ff2f' : 'none'
    }}>
      
      <button onClick={toggleSidebar} style={{ alignSelf: 'flex-end', margin: '20px', background: '#00ff2f', border: 'none', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>
        CLOSE ×
      </button>

      <div style={{ padding: '0 25px 30px 25px' }}>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '2px', fontWeight: '900', margin: 0 }}>EDUBRIDGE</h2>
        <div style={{ marginTop: '5px', fontSize: '0.65rem', color: '#00ff2f', border: '1px solid #00ff2f', display: 'inline-block', padding: '2px 5px' }}>
          {isLecturer ? 'LECTURER PORTAL' : 'STUDENT ENGINE'}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            onClick={() => { 
              onNavigate(item.id); 
              toggleSidebar(); 
            }}
            style={{ padding: '18px 25px', cursor: 'pointer', fontWeight: 'bold', borderBottom: '1px solid #111' }}
          >
            {item.name}
          </div>
        ))}
      </div>

      {/* RESTORED USER INFO SECTION */}
      <div style={{ padding: '20px 25px', backgroundColor: '#080808', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>
          SYSTEM USER: <br/>
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.name || 'Unknown User'}</span>
        </div>
        
        <button 
          onClick={onLogout}
          style={{ width: '100%', padding: '10px', background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', cursor: 'pointer', fontWeight: 'bold' }}
        >
           LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Sidebar;