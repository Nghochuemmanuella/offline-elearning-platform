import React, { useState, useEffect} from 'react';
import localDB from './db';
import QuizTaker from './QuizTaker';
import { ComposeMessage } from './Messages';


const ANIMATIONS = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(40px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  .edu-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  }
  .edu-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 12px 32px rgba(0,255,47,0.18) !important;
  }
  .edu-btn {
    transition: transform 0.1s ease, opacity 0.15s ease !important;
  }
  .edu-btn:active {
    transform: scale(0.97) !important;
  }
  .edu-search:focus {
    box-shadow: 0 0 0 3px rgba(0,255,47,0.25) !important;
    outline: none !important;
    border-color: #00ff2f !important;
  }
  .edu-attach-btn {
    transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease !important;
  }
  .edu-attach-btn:hover {
    background: #00ff2f !important;
    color: #000 !important;
    transform: translateY(-1px) !important;
  }
  .edu-stat-box {
    transition: box-shadow 0.2s ease, transform 0.2s ease !important;
  }
  .edu-stat-box:hover {
    box-shadow: 0 6px 20px rgba(0,255,47,0.15) !important;
    transform: translateY(-2px) !important;
  }
  .edu-filter-btn {
    transition: background 0.15s ease, color 0.15s ease !important;
  }
`;

const LESSON_MATERIALS_DEFAULT = {
  1: "Focus on Offline-First Design: Learn about Service Workers and PouchDB synchronization patterns.",
  2: "Database Systems: Understanding NoSQL vs SQL. We use CouchDB for its master-master replication.",
  3: "Distributed Systems: Exploring CAP theorem and how data stays consistent across nodes.",
  4: "HCI: Designing interfaces for low-bandwidth environments in the Northwest Region.",
  5: "Mobile Dev: Building hybrid apps using React and Capacitor.",
  6: "Client-Server: This module covers the Bridge you just built between PouchDB and CouchDB!"
};

const S = {
  main: {
    padding: '24px',
    fontFamily: 'monospace',
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#f4f6f8',
    minHeight: '100vh',
  },

  // ── Welcome Banner ──
  banner: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#fff',
    padding: '28px',
    marginBottom: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,255,47,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  bannerTitle: {
    margin: 0,
    color: '#00ff2f',
    fontSize: '1.6rem',
    fontWeight: '900',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  bannerSub: {
    margin: '4px 0 0',
    opacity: 0.5,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  levelBadge: {
    background: 'rgba(0,255,47,0.15)',
    color: '#00ff2f',
    fontWeight: '900',
    fontSize: '0.72rem',
    padding: '6px 16px',
    letterSpacing: '2px',
    border: '1px solid rgba(0,255,47,0.3)',
    borderRadius: '20px',
    flexShrink: 0,
  },

  // Stats row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '14px 16px',
    backdropFilter: 'blur(10px)',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: '#888',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: '#00ff2f',
    lineHeight: 1,
  },
  statSub: {
    fontSize: '0.62rem',
    color: '#555',
    marginTop: '3px',
  },

  // Progress
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    marginBottom: '8px',
    letterSpacing: '0.5px',
    color: '#aaa',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '99px',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #00cc25, #00ff2f)',
    borderRadius: '99px',
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 0 10px rgba(0,255,47,0.4)',
  }),

  // ── Toolbar ──
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterGroup: {
    display: 'flex',
    gap: '6px',
  },
  filterBtn: (active) => ({
    padding: '8px 16px',
    background: active ? '#000' : '#fff',
    color: active ? '#00ff2f' : '#555',
    border: `1px solid ${active ? '#000' : '#ddd'}`,
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: '0.7rem',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
  }),
  filterBtnLast: (active) => ({
    padding: '8px 16px',
    background: active ? '#000' : '#fff',
    color: active ? '#00ff2f' : '#555',
    border: `1px solid ${active ? '#000' : '#ddd'}`,
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: '0.7rem',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
  }),
  searchInput: {
    padding: '10px 16px',
    background: '#fff',
    color: '#000',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    outline: 'none',
    width: '220px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },

  // ── Module Grid ──
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },

  // Module Card
  card: (isDone) => ({
    background: '#fff',
    border: `1px solid ${isDone ? 'rgba(0,255,47,0.3)' : '#e8e8e8'}`,
    borderRadius: '12px',
    padding: '0',
    boxShadow: isDone
      ? '0 4px 20px rgba(0,255,47,0.12)'
      : '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    cursor: 'default',
  }),
  cardHeader: (isDone) => ({
    background: isDone ? 'linear-gradient(135deg, #00cc25, #00ff2f)' : 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
    color: isDone ? '#000' : '#00ff2f',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.62rem',
    letterSpacing: '1px',
    fontWeight: '700',
  }),
  cardBody: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardCode: {
    fontSize: '0.62rem',
    color: '#aaa',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '800',
    lineHeight: 1.3,
    color: '#111',
    flex: 1,
  },
  cardMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  metaTag: (color) => ({
    fontSize: '0.58rem',
    padding: '3px 8px',
    background: color === 'green' ? 'rgba(0,255,47,0.1)' : '#f5f5f5',
    color: color === 'green' ? '#00aa1f' : '#888',
    border: `1px solid ${color === 'green' ? 'rgba(0,255,47,0.25)' : '#e8e8e8'}`,
    borderRadius: '20px',
    letterSpacing: '0.5px',
    fontWeight: '600',
  }),
  cardBtn: (isDone) => ({
    width: '100%',
    padding: '13px',
    background: isDone ? '#111' : '#00ff2f',
    color: isDone ? '#00ff2f' : '#000',
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.8rem',
    letterSpacing: '1.5px',
    cursor: 'pointer',
    borderRadius: '0 0 12px 12px',
  }),

  // ── Empty State ──
  empty: {
    gridColumn: '1 / -1',
    padding: '60px 20px',
    textAlign: 'center',
    border: '2px dashed #e0e0e0',
    borderRadius: '12px',
    background: '#fff',
  },
  emptyTitle: {
    fontWeight: '900',
    fontSize: '1.1rem',
    marginBottom: '8px',
    color: '#333',
  },
  emptySub: {
    color: '#aaa',
    fontSize: '0.8rem',
  },

  // ── Modal ──
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#fff',
    padding: '0',
    maxWidth: '620px',
    width: '100%',
    borderRadius: '16px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideInUp 0.25s ease',
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
    color: '#00ff2f',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0,255,47,0.15)',
    borderRadius: '16px 16px 0 0',
  },
  modalCode: {
    fontSize: '0.62rem',
    letterSpacing: '2px',
    opacity: 0.5,
    marginBottom: '4px',
  },
  modalTitle: {
    margin: 0,
    fontWeight: '900',
    fontSize: '1.1rem',
    lineHeight: 1.2,
  },
  modalBody: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
  },
  modalContent: {
    background: '#f8f8f8',
    border: '1px solid #ebebeb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    fontSize: '0.85rem',
    lineHeight: 1.7,
    color: '#333',
    whiteSpace: 'pre-wrap',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  attachLabel: {
    fontSize: '0.62rem',
    fontWeight: '700',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block',
    color: '#888',
    textTransform: 'uppercase',
  },
  attachGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  attachBtn: {
    background: '#111',
    color: '#00ff2f',
    border: '1px solid rgba(0,255,47,0.2)',
    borderRadius: '8px',
    padding: '8px 14px',
    fontFamily: 'monospace',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
    borderRadius: '0 0 16px 16px',
  },
  actionBtn: (primary) => ({
    flex: 1,
    padding: '13px',
    background: primary ? '#111' : '#fff',
    color: primary ? '#00ff2f' : '#555',
    border: primary ? 'none' : '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.8rem',
    letterSpacing: '1px',
    cursor: 'pointer',
    boxShadow: primary ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  }),
};

function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed', bottom: '30px', right: '30px',
      background: '#111', color: '#00ff2f',
      border: '1px solid rgba(0,255,47,0.3)',
      borderRadius: '12px',
      padding: '14px 20px',
      fontFamily: 'monospace', fontWeight: '700',
      fontSize: '0.85rem', letterSpacing: '0.5px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(0,255,47,0.1)',
      zIndex: 99999, animation: 'toastIn 0.3s ease',
    }}>
      {message}
    </div>
  );
}

function StudentDashboard({
  user,
  selectedLevel,
  isOnline,
  completionPercent,
  levelSpecificCourses = [],
  completedLessons = [],
  searchTerm,
  setSearchTerm,
  selectedCourse,
  setSelectedCourse,
  handleComplete,
  LESSON_MATERIALS = LESSON_MATERIALS_DEFAULT,
}) {
  const [filter, setFilter] = useState('all');
  const [hovered, setHovered] = useState(null);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [quizCourse, setQuizCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageCourse, setMessageCourse] = useState(null);
useEffect(() => {
  if (levelSpecificCourses.length >= 0) {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }
}, [levelSpecificCourses]);

  useEffect(() => {
    const existing = document.getElementById('edu-animations');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'edu-animations';
      style.textContent = ANIMATIONS;
      document.head.appendChild(style);
    }
    setTimeout(() => setMounted(true), 50);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
 const completedCount = levelSpecificCourses.filter(c => 
  completedLessons.includes(c.id) || 
  completedLessons.includes(c._id)
).length;
 const pendingCount = levelSpecificCourses.length - completedCount;

  const displayedCourses = levelSpecificCourses.filter(course => {
    const isDone = completedLessons.includes(course.id);
    if (filter === 'pending') return !isDone;
    if (filter === 'done') return isDone;
    return true;
  });

  return (
    <main style={S.main}>

      {/* ── Welcome Banner ── */}
      <div style={S.banner}>
        <div style={S.bannerTop}>
          <div>
            <h1 style={S.bannerTitle}>
              {user?.name?.toUpperCase() || 'STUDENT'}
            </h1>
    <p style={S.bannerSub}>
  {completedLessons.length === 0 && levelSpecificCourses.length > 0
    ? `👋 Welcome to EduBridge! You have ${pendingCount} module${pendingCount !== 1 ? 's' : ''} ready to explore.`
    : completedLessons.length === levelSpecificCourses.length && levelSpecificCourses.length > 0
    ? `🎉 Amazing! You have completed all modules for Level ${selectedLevel}!`
    : `👋 Welcome back! You have ${pendingCount} module${pendingCount !== 1 ? 's' : ''} pending.`
  }
</p>      
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={S.levelBadge}>LEVEL {selectedLevel}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div className="edu-stat-box" style={S.statBox}>
            <div style={S.statLabel}>Completed</div>
            <div style={S.statValue}>{completedCount}</div>
            <div style={S.statSub}>modules done</div>
          </div>
          <div className="edu-stat-box" style={S.statBox}>
            <div style={S.statLabel}>Remaining</div>
            <div style={{ ...S.statValue, color: pendingCount > 0 ? '#fff' : '#00ff2f' }}>
              {pendingCount}
            </div>
            <div style={S.statSub}>to finish</div>
          </div>
          <div className="edu-stat-box" style={S.statBox}>
            <div style={S.statLabel}>Progress</div>
            <div style={S.statValue}>{completionPercent}%</div>
            <div style={S.statSub}>overall</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={S.progressHeader}>
          <span>COURSE PROGRESS</span>
          <span>{completedCount} / {levelSpecificCourses.length} MODULES</span>
        </div>
        <div style={S.progressTrack}>
          <div style={S.progressFill(mounted ? completionPercent : 0)} />
        </div>
        {completionPercent === 100 && (
          <p style={{ marginTop: '10px', color: '#00ff2f', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '1px' }}>
            ✓ ALL MODULES COMPLETE — EXCELLENT WORK!
          </p>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={S.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontWeight: '900', letterSpacing: '-0.5px', color: '#111' }}>
            MODULES
          </h2>
          <div style={S.filterGroup}>
            {[
              { key: 'all', label: `ALL (${levelSpecificCourses.length})` },
              { key: 'pending', label: `PENDING (${pendingCount})` },
              { key: 'done', label: `DONE (${completedCount})` },
            ].map(({ key, label }, i, arr) => (
              <button
                key={key}
                className="edu-filter-btn"
                onClick={() => setFilter(key)}
                style={i === arr.length - 1 ? S.filterBtnLast(filter === key) : S.filterBtn(filter === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="edu-search"
          style={S.searchInput}
        />
      </div>
     {/* ── Module Grid ── */}
<div style={S.grid}>
  {isLoading ? (
    // Skeleton loading cards
    [...Array(6)].map((_, i) => (
      <div key={i} style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {/* Skeleton header */}
        <div style={{
          background: '#e8e8e8',
          height: '38px',
          width: '100%',
        }} />
        {/* Skeleton body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: '#f0f0f0', height: '10px', borderRadius: '6px', width: '40%' }} />
          <div style={{ background: '#f0f0f0', height: '16px', borderRadius: '6px', width: '85%' }} />
          <div style={{ background: '#f0f0f0', height: '16px', borderRadius: '6px', width: '65%' }} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <div style={{ background: '#f0f0f0', height: '20px', borderRadius: '20px', width: '70px' }} />
            <div style={{ background: '#f0f0f0', height: '20px', borderRadius: '20px', width: '50px' }} />
          </div>
        </div>
        {/* Skeleton button */}
        <div style={{ background: '#f0f0f0', height: '44px', width: '100%' }} />
      </div>
    ))
  ) : displayedCourses.length === 0 ? (
    <div style={S.empty}>
      <div style={S.emptyTitle}>
        {searchTerm ? `No results for "${searchTerm}"` : 'No modules here yet'}
      </div>
      <p style={S.emptySub}>
        {searchTerm
          ? 'Try a different search term or clear the filter.'
          : filter === 'done'
            ? "You haven't completed any modules yet. Start one below!"
            : "Your lecturer hasn't uploaded modules for this level yet."}
      </p>
      
      {searchTerm && (
        
        <button
          className="edu-btn"
          onClick={() => setSearchTerm('')}
          style={{ ...S.cardBtn(false), width: 'auto', padding: '10px 20px', marginTop: '16px', display: 'inline-block', borderRadius: '8px' }}
        >
          CLEAR SEARCH
        </button>
      )}
    </div>
  ) : (
    displayedCourses.map((course, index) => {
      const isDone = completedLessons.includes(course.id);
      const hasAttachments = course._attachments && Object.keys(course._attachments).length > 0;

      return (
        <div
          key={course.id}
          className="edu-card"
          style={{
            ...S.card(isDone),
            animation: `fadeSlideUp 0.35s ease ${index * 0.06}s both`,
          }}
          onMouseEnter={() => setHovered(course.id)}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Card Header Strip */}
          <div style={S.cardHeader(isDone)}>
            <span>{isDone ? '✓ COMPLETED' : '◎ PENDING'}</span>
            <span>LVL {course.level || selectedLevel}</span>
          </div>

          {/* Card Body */}
          <div style={S.cardBody}>
            {course.code && <div style={S.cardCode}>{course.code}</div>}
            <h3 style={S.cardTitle}>{course.title}</h3>

            {/* Meta Tags */}
            <div style={S.cardMeta}>
              {hasAttachments && (
                <span style={S.metaTag('green')}>
                  📎 {Object.keys(course._attachments).length} FILE{Object.keys(course._attachments).length > 1 ? 'S' : ''}
                </span>
              )}
              {course.content && (
                <>
                  <span style={S.metaTag()}>CONTENT</span>
                  <span style={S.metaTag()}>
                    ~{Math.ceil(course.content.split(' ').length / 200)} MIN READ
                  </span>
                </>
              )}
              <span style={S.metaTag()}>OFFLINE READY</span>
              {(() => {
                const accessed = JSON.parse(localStorage.getItem('lastAccessed') || '{}');
                const time = accessed[course.id];
                if (!time) return null;
                const date = new Date(time);
                const now = new Date();
                const diffHrs = Math.floor((now - date) / 3600000);
                const label = diffHrs < 1 ? 'Just now' : diffHrs < 24 ? `${diffHrs}h ago` : `${Math.floor(diffHrs / 24)}d ago`;
                return <span style={S.metaTag()}>🕒 {label}</span>;
              })()}
            </div>
          </div>
<button
  className="edu-btn"
  onClick={() => setMessageCourse(course)}
  style={{
    width: '100%', padding: '10px',
    background: '#f0fff4', color: '#00aa1f',
    border: '1px solid rgba(0,255,47,0.2)',
    borderTop: '1px solid rgba(0,255,47,0.1)',
    fontFamily: 'monospace', fontWeight: '700',
    fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer',
  }}
>
  📩 MESSAGE LECTURER
</button>
          {/* Action Button */}
          <button
            className="edu-btn"
            onClick={() => {
              setSelectedCourse(course);
              const accessed = JSON.parse(localStorage.getItem('lastAccessed') || '{}');
              accessed[course.id] = new Date().toISOString();
              localStorage.setItem('lastAccessed', JSON.stringify(accessed));
            }}
            style={S.cardBtn(isDone)}
          >
            {isDone ? '↩ RE-VISIT MODULE' : '→ START NOW'}
          </button>
        </div>
      );
    })
  )}
</div>
      {/* ── Lesson Modal ── */}
      {selectedCourse && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setSelectedCourse(null); }}>
          <div style={S.modal}>

            {/* Modal Header */}
            <div style={S.modalHeader}>
              {selectedCourse.code && (
                <div style={S.modalCode}>{selectedCourse.code}</div>
              )}
              <h2 style={S.modalTitle}>{selectedCourse.title}</h2>
            </div>

            {/* Modal Body */}
            <div style={S.modalBody}>

              {/* Status Bar */}
              <div style={{
                display: 'flex', gap: '12px', marginBottom: '20px',
                padding: '10px 14px',
                background: completedLessons.includes(selectedCourse.id) ? 'rgba(0,255,47,0.06)' : '#f8f8f8',
                border: `1px solid ${completedLessons.includes(selectedCourse.id) ? 'rgba(0,255,47,0.2)' : '#ebebeb'}`,
                borderRadius: '8px',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.5px',
                  color: completedLessons.includes(selectedCourse.id) ? '#00aa00' : '#999',
                }}>
                  {completedLessons.includes(selectedCourse.id) ? '✓ COMPLETED' : '◎ NOT YET COMPLETED'}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#bbb', marginLeft: 'auto' }}>
                  LEVEL {selectedCourse.level || selectedLevel}
                </span>
              </div>

              {/* Content */}
              <div style={S.attachLabel}>MODULE CONTENT</div>
              <div style={S.modalContent}>
                {selectedCourse.content
                  || LESSON_MATERIALS[selectedCourse.id]
                  || "No offline content available for this module yet."}
              </div>

              {/* Attachments */}
              {selectedCourse._attachments && Object.keys(selectedCourse._attachments).length > 0 && (
                <div>
                  <span style={S.attachLabel}>📎 ATTACHMENTS</span>
                  <div style={S.attachGrid}>
                    {Object.keys(selectedCourse._attachments).map(name => (
                      <button
                        key={name}
                        className="edu-attach-btn"
                        style={S.attachBtn}
                        onClick={async () => {
                          const blob = await localDB.getAttachment(selectedCourse._id, name);
                          window.open(URL.createObjectURL(blob));
                        }}
                      >
                        ↗ {name.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Take Quiz Button */}
            <div style={{ padding: '0 24px 16px' }}>
              <button
                className="edu-btn"
                style={{
                  width: '100%', padding: '11px',
                  background: '#f5f5f5', color: '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontFamily: 'monospace', fontWeight: '700',
                  fontSize: '0.8rem', letterSpacing: '1px', cursor: 'pointer',
                }}
                onClick={() => { setQuizCourse(selectedCourse); setSelectedCourse(null); }}
              >
                🧪 TAKE QUIZ
              </button>
            </div>

            {/* Modal Actions */}
            <div style={S.modalActions}>
              <button
                className="edu-btn"
                style={S.actionBtn(true)}
                onClick={async () => {
                  await handleComplete(selectedCourse.id);
                  showToast('✓ MODULE COMPLETE — PROGRESS SAVED!');
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                onMouseLeave={e => (e.currentTarget.style.background = '#111')}
              >
                {completedLessons.includes(selectedCourse.id)
                  ? '✓ MARK AS RE-DONE'
                  : '✓ COMPLETE MODULE'}
              </button>
              <button
                className="edu-btn"
                style={S.actionBtn(false)}
                onClick={() => setSelectedCourse(null)}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                ✕ CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} />}
      {quizCourse && (
        <QuizTaker
          course={quizCourse}
          user={user}
          onClose={() => setQuizCourse(null)}
          onComplete={(lessonId) => {
            handleComplete(lessonId);
            setQuizCourse(null);
            showToast('🏆 QUIZ PASSED — MODULE COMPLETE!');
          }}
        />
      )}
{messageCourse && (
  <ComposeMessage
    course={messageCourse}
    user={user}
    lecturerEmail={messageCourse.createdBy}
    onClose={() => setMessageCourse(null)}
    onSent={() => setMessageCourse(null)}
  />
)}
    </main>
  );
}

export default StudentDashboard;
