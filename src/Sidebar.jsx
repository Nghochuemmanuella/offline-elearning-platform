import React, { useState, useEffect } from 'react';
import localDB from './db';

const Sidebar = ({ isOpen, toggleSidebar, user, onNavigate, onLogout, hasNewModules }) => {

  const [unreadMessages, setUnreadMessages] = useState(0);

  const isLecturer = user?.role === 'lecturer' || 
                     user?.name?.toLowerCase().includes('admin') || 
                     user?.email?.includes('lecturer');

  useEffect(() => {
    if (!user?.email) return;
    const fetchUnread = async () => {
      try {
        const result = await localDB.allDocs({ include_docs: true });
        const docs = result.rows.map(r => r.doc);
        let count = 0;
        if (isLecturer) {
          count = docs.filter(d =>
            d.type === 'message' &&
            d.toEmail === user.email &&
            !d.readByLecturer
          ).length;
        } else {
          count = docs.filter(d =>
            d.type === 'message' &&
            d.fromEmail === user.email &&
            d.replies?.length > 0 &&
            !d.readByStudent
          ).length;
        }
        setUnreadMessages(count);
      } catch (err) { }
    };
    fetchUnread();
    const listener = localDB.changes({ since: 'now', live: true, include_docs: true })
      .on('change', fetchUnread);
    return () => listener.cancel();
  }, [user, isLecturer]);
  
  const menuItems = isLecturer ? [
    { name: '📊 Admin Dashboard', id: 'lecturer' },
      { name: '📬 Inbox', id: 'inbox', msgBadge: true },
    { name: '🤖 Offline AI Assistant', id: 'ai' },
    { name: '👤 Faculty Profile', id: 'profile' },
    { name: ' LOGOUT', id: 'logout' },
  ] : [
    { name: '🏠 Student Home', id: 'student', badge: true },
    { name: '📬 My Messages', id: 'messages', msgBadge: true },
    { name: '🏆 My Results', id: 'results' },
    { name: '🤖 Offline AI Assistant', id: 'ai' },
    { name: '🏆 Academic Profile', id: 'profile' },
    { name: ' Logout', id: 'logout' },
  ];

  return (
    <div style={{
      width: isOpen ? '280px' : '0px',
      position: 'fixed',
      left: 0, top: 0, 
      height: '100dvh',
      backgroundColor: '#000',
      color: '#00ff2f',
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      borderRight: isOpen ? '2px solid #00ff2f' : 'none'
    }}>
      <div style={{ flexShrink: '0'}}></div>
      <button onClick={toggleSidebar} style={{ alignSelf: 'flex-end', margin: '20px', background: '#00ff2f', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
         ×
      </button>

      <div style={{ padding: '0 25px 30px 25px' }}>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '2px', fontWeight: '900', margin: 0 }}>EDUBRIDGE</h2>
        <div style={{ marginTop: '5px', fontSize: '0.65rem', color: '#00ff2f', border: '1px solid rgba(0,255,47,0.4)', display: 'inline-block', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
          {isLecturer ? 'LECTURER PORTAL' : 'STUDENT ENGINE'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}> {/* Fixed typo: overflowY */}
 

 {menuItems.map((item) => {
  const isUploadBtn = item.id === 'upload';
  const isLogoutBtn = item.id === 'logout';

  return (
    <div 
      key={item.id} 
      onClick={() => { 
        // --- LOGIC CHANGE START ---
        if (isLogoutBtn) {
          onLogout(); // Call the logout function directly
        } else {
          onNavigate(item.id); 
          toggleSidebar(); 
        }
        // --- LOGIC CHANGE END ---
      }}
      style={isLogoutBtn ? {
        // STYLE FOR LOGOUT LINK
        margin: '40px 20px 20px 20px',
        padding: '14px', 
        backgroundColor: '#ff4444',
        cursor: 'pointer',
        textAlign: 'center', 
        fontWeight: 'bold', 
        color: '#fff',          
        borderTop: '1px solid #111', // Visual separator
        fontSize:'0.85rem',
        borderRadius: '2.5rem'

      } : isUploadBtn ? {
        // STYLE FOR QUICK UPLOAD BUTTON
        margin: '15px 20px',
        padding: '14px',
        backgroundColor: '#00ff2f', 
        color: '#000', 
        textAlign: 'center',
        fontWeight: '900',
        cursor: 'pointer',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,255,47,0.25)',
        fontSize: '0.85rem',
        letterSpacing: '1px',
        transition: 'opacity 0.15s ease',
      } : {
        // STYLE FOR REGULAR LINKS
        padding: '18px 25px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        borderBottom: '1px solid #111',
        color: '#00ff2f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {item.name}
      {item.badge && hasNewModules && (
    <span style={{
      width: '10px', height: '10px',
      borderRadius: '50%', background: '#ff4444',
      display: 'inline-block', flexShrink: 0,
    }} />
  )}
  {item.msgBadge && unreadMessages > 0 && (
  <span style={{
    background: '#ff4444', color: '#fff',
    borderRadius: '20px', padding: '2px 8px',
    fontSize: '0.6rem', fontWeight: '900',
    flexShrink: 0,
  }}>{unreadMessages}</span>
)}
    </div>
  );
})}  
</div>
    </div>
  );
};

export default Sidebar;