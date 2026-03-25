import React from 'react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: '🏠 Dashboard', id: 'dash' },
    { name: '📚 My Courses', id: 'courses' },
    { name: '🏆 Achievements', id: 'awards' },
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
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      paddingTop: '80px',
      zIndex: 1000,
      boxShadow: isOpen ? '4px solid  #00ff2f' : 'none'
    }}>
      <button 
        onClick={toggleSidebar}
        style={{ position: 'absolute', top: '20px', right: '20px', background: '#00ff2f', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ×
      </button>
      {/* Sidebar Branding */}
      <div style={{ padding: '0 25px 30px 25px', borderBottom: '1px solid #1a1a1a' }}>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '3px', fontWeight: '900' }}>EDUBRIDGE</h2>
        <span style={{ fontSize: '0.7rem', color: '#444' }}>OFFLINE-FIRST ENGINE</span>
      </div>
      {menuItems.map((item) => (
        <div 
          key={item.id} 
          style={{ padding: '20px 25px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', borderBottom: '1px solid #0d0d0d', transition: '0.3s' }}
          onClick={() => alert(`Navigating to ${item.name}`)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;