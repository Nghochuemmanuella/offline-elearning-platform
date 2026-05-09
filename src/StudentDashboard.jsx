import React, { useState, useEffect} from 'react';
import localDB from './db';

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
    from { opacity: 0; transform: translateY(60px) scale(0.97); }
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
  .edu-card { transition: transform 0.15s ease, box-shadow 0.15s ease !important; }
  .edu-card:hover { transform: translate(-3px, -3px) !important; }
  .edu-btn { transition: transform 0.1s ease !important; }
  .edu-btn:active { transform: scale(0.97) !important; }
  .edu-search:focus { box-shadow: 4px 4px 0px #00ff2f !important; outline: none !important; }
  .edu-attach-btn { transition: background 0.15s ease, color 0.15s ease !important; }
  .edu-attach-btn:hover { background: #00ff2f !important; color: #000 !important; }
  .edu-stat-box { transition: border-color 0.2s ease, box-shadow 0.2s ease !important; }
  .edu-stat-box:hover { border-color: #00ff2f !important; box-shadow: 3px 3px 0px #00ff2f !important; }
`;
// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const LESSON_MATERIALS_DEFAULT = {
  1: "Focus on Offline-First Design: Learn about Service Workers and PouchDB synchronization patterns.",
  2: "Database Systems: Understanding NoSQL vs SQL. We use CouchDB for its master-master replication.",
  3: "Distributed Systems: Exploring CAP theorem and how data stays consistent across nodes.",
  4: "HCI: Designing interfaces for low-bandwidth environments in the Northwest Region.",
  5: "Mobile Dev: Building hybrid apps using React and Capacitor.",
  6: "Client-Server: This module covers the Bridge you just built between PouchDB and CouchDB!"
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  // Layout
  main: {
    padding: '24px',
    fontFamily: 'monospace',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  

  // ── Welcome Banner ──
  banner: {
    background: '#000',
    color: '#fff',
    padding: '24px',
    marginBottom: '24px',
    border: '3px solid #000',
    boxShadow: '8px 8px 0px #00ff2f',
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
    opacity: 0.6,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  levelBadge: {
    background: '#00ff2f',
    color: '#000',
    fontWeight: '900',
    fontSize: '0.75rem',
    padding: '6px 14px',
    letterSpacing: '2px',
    border: '2px solid #00ff2f',
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
    background: '#111',
    border: '1px solid #333',
    padding: '12px 14px',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: '#666',
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
    fontSize: '0.65rem',
    color: '#555',
    marginTop: '3px',
  },

  // Progress
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    marginBottom: '6px',
    letterSpacing: '1px',
  },
  progressTrack: {
    width: '100%',
    height: '12px',
    background: '#222',
    position: 'relative',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: '#00ff2f',
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
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
    gap: '0',
  },
  filterBtn: (active) => ({
    padding: '8px 16px',
    background: active ? '#000' : '#fff',
    color: active ? '#00ff2f' : '#000',
    border: '2px solid #000',
    borderRight: 'none',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.7rem',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.1s',
  }),
  filterBtnLast: (active) => ({
    padding: '8px 16px',
    background: active ? '#000' : '#fff',
    color: active ? '#00ff2f' : '#000',
    border: '2px solid #000',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.7rem',
    letterSpacing: '1px',
    cursor: 'pointer',
  }),
  searchInput: {
    padding: '10px 14px',
    background: '#000',
    color: '#00ff2f',
    border: '2px solid #000',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    outline: 'none',
    width: '200px',
    letterSpacing: '1px',
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
    border: '3px solid #000',
    padding: '0',
    boxShadow: isDone ? '6px 6px 0px #00ff2f' : '6px 6px 0px #000',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.1s, box-shadow 0.1s',
    cursor: 'default',
  }),
  cardHeader: (isDone) => ({
    background: isDone ? '#00ff2f' : '#000',
    color: isDone ? '#000' : '#00ff2f',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.65rem',
    letterSpacing: '1.5px',
    fontWeight: '900',
  }),
  cardBody: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardCode: {
    fontSize: '0.65rem',
    color: '#999',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '900',
    lineHeight: 1.3,
    color: '#000',
    flex: 1,
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  metaTag: (color) => ({
    fontSize: '0.6rem',
    padding: '2px 6px',
    background: color === 'green' ? '#000' : '#f0f0f0',
    color: color === 'green' ? '#00ff2f' : '#666',
    border: `1px solid ${color === 'green' ? '#000' : '#ddd'}`,
    letterSpacing: '1px',
    fontWeight: '700',
  }),
  cardBtn: (isDone) => ({
    width: '100%',
    padding: '13px',
    background: isDone ? '#000' : '#00ff2f',
    color: isDone ? '#00ff2f' : '#000',
    border: '2px solid #000',
    borderTop: '3px solid #000',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.8rem',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'opacity 0.1s',
  }),

  // ── Empty State ──
  empty: {
    gridColumn: '1 / -1',
    padding: '60px 20px',
    textAlign: 'center',
    border: '3px dashed #000',
    background: '#fff',
  },
  emptyTitle: {
    fontWeight: '900',
    fontSize: '1.2rem',
    marginBottom: '8px',
  },
  emptySub: {
    color: '#666',
    fontSize: '0.8rem',
  },

  // ── Modal ──
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    padding: '0',
    maxWidth: '640px',
    width: '100%',
    border: '4px solid #000',
    boxShadow: '12px 12px 0px #00ff2f',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    background: '#000',
    color: '#00ff2f',
    padding: '18px 24px',
    borderBottom: '3px solid #00ff2f',
  },
  modalCode: {
    fontSize: '0.65rem',
    letterSpacing: '2px',
    opacity: 0.6,
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
    background: '#f5f5f5',
    border: '2px solid #e0e0e0',
    padding: '16px',
    marginBottom: '20px',
    fontSize: '0.85rem',
    lineHeight: 1.7,
    color: '#111',
    whiteSpace: 'pre-wrap',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  attachLabel: {
    fontSize: '0.65rem',
    fontWeight: '900',
    letterSpacing: '1.5px',
    marginBottom: '8px',
    display: 'block',
  },
  attachGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  attachBtn: {
    background: '#000',
    color: '#00ff2f',
    border: '2px solid #000',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '1px',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: '0',
    borderTop: '3px solid #000',
  },
  actionBtn: (primary) => ({
    flex: 1,
    padding: '16px',
    background: primary ? '#000' : '#fff',
    color: primary ? '#00ff2f' : '#000',
    border: 'none',
    borderRight: primary ? '2px solid #000' : 'none',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: '0.8rem',
    letterSpacing: '2px',
    cursor: 'pointer',
  }),
};
function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed', bottom: '30px', right: '30px',
      background: '#000', color: '#00ff2f',
      border: '3px solid #00ff2f', padding: '15px 20px',
      fontFamily: 'monospace', fontWeight: '900',
      fontSize: '0.85rem', letterSpacing: '1px',
      boxShadow: '6px 6px 0px #00ff2f',
      zIndex: 99999, animation: 'fadeIn 0.2s ease'
    }}>
      {message}
    </div>
  );
}
// ─── COMPONENT ───────────────────────────────────────────────────────────────
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

  const completedCount = levelSpecificCourses.filter(c => completedLessons.includes(c.id)).length;
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
           <p style={S.bannerSub}>Welcome back! You have {pendingCount} module{pendingCount !== 1 ? 's' : ''} pending.</p>
            </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={S.levelBadge}>LEVEL {selectedLevel}</span>

          </div>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div style={S.statBox}>
            <div style={S.statLabel}>Completed</div>
            <div style={S.statValue}>{completedCount}</div>
            <div style={S.statSub}>modules done</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>Remaining</div>
            <div style={{ ...S.statValue, color: pendingCount > 0 ? '#fff' : '#00ff2f' }}>
              {pendingCount}
            </div>
            <div style={S.statSub}>to finish</div>
          </div>
          <div style={S.statBox}>
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
          {completionPercent > 0 && completionPercent < 100 && (
            <div style={{
              position: 'absolute', right: `${100 - completionPercent}%`,
              top: '-18px', fontSize: '0.6rem', color: '#00ff2f',
              transform: 'translateX(50%)', letterSpacing: '1px',
            }}>{completionPercent}%</div>
          )}
        </div>
        {completionPercent === 100 && (
          <p style={{ marginTop: '10px', color: '#00ff2f', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px' }}>
            ✓ ALL MODULES COMPLETE — EXCELLENT WORK!
          </p>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={S.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <h2 style={{ margin: 0, fontWeight: '900', letterSpacing: '-0.5px', marginRight: '20px' }}>
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
          placeholder="SEARCH MODULES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="edu-search"
          style={S.searchInput}
           />
      </div>

      {/* ── Module Grid ── */}
      <div style={S.grid}>
        {displayedCourses.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyTitle}>
              {searchTerm ? `NO RESULTS FOR "${searchTerm.toUpperCase()}"` : 'NO MODULES HERE YET'}
            </div>
            <p style={S.emptySub}>
              {searchTerm
                ? 'Try a different search term or clear the filter.'
                : filter === 'done'
                  ? "You haven't completed any modules yet. Start one below!"
                  : 'Your lecturer hasn\'t uploaded modules for this level yet.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ ...S.cardBtn(false), width: 'auto', padding: '10px 20px', marginTop: '16px', display: 'inline-block' }}
              >
                CLEAR SEARCH
              </button>
            )}
          </div>
        ) : (
          displayedCourses.map((course, index ) => {
            const isDone = completedLessons.includes(course.id);
            const hasAttachments = course._attachments && Object.keys(course._attachments).length > 0;
            const isHovered = hovered === course.id;

            return (
     <div
         key={course.id}
         className="edu-card"
         style={{
          ...S.card(isDone),
         boxShadow: isHovered
         ? isDone ? '8px 8px 0px #00ff2f' : '8px 8px 0px #000'
         : isDone ? '6px 6px 0px #00ff2f' : '6px 6px 0px #000',
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
                      <span style={S.metaTag()}>CONTENT AVAILABLE</span>
                    )}
                    <span style={S.metaTag()}>OFFLINE READY</span>
                  </div>
                </div>

                {/* Action Button */}
    <button
                
                    
         className="edu-btn"
         onClick={() => setSelectedCourse(course)}
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
                padding: '10px 14px', background: '#f5f5f5',
                border: '2px solid #e0e0e0', alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1px',
                  color: completedLessons.includes(selectedCourse.id) ? '#00aa00' : '#666',
                }}>
                  {completedLessons.includes(selectedCourse.id) ? '✓ COMPLETED' : '◎ NOT YET COMPLETED'}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#999', marginLeft: 'auto', letterSpacing: '1px' }}>
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

            {/* Modal Actions */}
            <div style={S.modalActions}>
              <button
                style={S.actionBtn(true)}
                onClick={async () => {
                await handleComplete(selectedCourse.id);
                  showToast('✓ MODULE COMPLETE — PROGRESS SAVED!');
                }}
                onMouseEnter={e => (e.target.style.background = '#111')}
                onMouseLeave={e => (e.target.style.background = '#000')}
              >
                {completedLessons.includes(selectedCourse.id)
                  ? '✓ MARK AS RE-DONE'
                  : '✓ COMPLETE MODULE'}
              </button>
              <button
                style={S.actionBtn(false)}
                onClick={() => setSelectedCourse(null)}
                onMouseEnter={e => (e.target.style.background = '#f0f0f0')}
                onMouseLeave={e => (e.target.style.background = '#fff')}
              >
                ✕ CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
        {toast && <Toast message={toast} />}
   
    </main>
  );
}

export default StudentDashboard;
