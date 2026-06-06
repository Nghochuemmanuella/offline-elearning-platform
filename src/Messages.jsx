import React, { useState, useEffect, useRef } from 'react';
import localDB from './db';
import { useToast, useConfirm } from './Toast';

const MESSAGE_TYPES = [
  { id: 'mark_complaint', label: '📝 Mark Complaint', color: '#ff4444' },
  { id: 'module_clarification', label: '❓ Module Clarification', color: '#ffaa00' },
  { id: 'general_inquiry', label: '💬 General Inquiry', color: '#00aa1f' },
];

// ── Voice Hook ──────────────────────────────────────────────
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e) => { onResult(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recRef.current = r;
  }, []);

  const toggle = () => {
    if (!recRef.current) { 'Error: ' + err.message, 'error'
      showToast('Voice not supported in this browser.'); return; }
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  return { listening, toggle, supported: !!recRef.current };
}

// ── Compose Modal (used from module card) ───────────────────
export function ComposeMessage({ course, user, lecturerEmail, onClose, onSent }) {
  const [msgType, setMsgType] = useState('module_clarification');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { listening, toggle } = useVoiceInput((t) => setText(prev => prev + t));
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const send = async () => {
    if (!text.trim()) showToast('Please type a message.', 'warning');
     return;  setSending(true);
    try {
      await localDB.put({
        _id: `msg_${user.email}_${course._id}_${Date.now()}`,
        type: 'message',
        fromEmail: user.email,
        fromName: user.name,
        toEmail: lecturerEmail,
        courseId: course._id,
        courseTitle: course.title,
        msgType,
        text: text.trim(),
        replies: [],
        readByLecturer: false,
        readByStudent: true,
        createdAt: new Date().toISOString(),
      });
     showToast('Message sent!', 'success');
     onSent && onSent();
      onClose();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');

    }
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.75)', zIndex: 20000,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
        fontFamily: 'monospace',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#00ff2f', fontWeight: '900', fontSize: '0.95rem' }}>📩 NEW MESSAGE</div>
            <div style={{ color: '#555', fontSize: '0.65rem', marginTop: '2px' }}>{course.title}</div>
          </div>
          <button onClick={onClose} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: '700' }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          <label style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '8px' }}>MESSAGE TYPE:</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {MESSAGE_TYPES.map(t => (
              <button key={t.id} onClick={() => setMsgType(t.id)} style={{
                padding: '6px 14px', borderRadius: '20px', border: `1px solid ${msgType === t.id ? t.color : '#e0e0e0'}`,
                background: msgType === t.id ? t.color : '#fff',
                color: msgType === t.id ? '#fff' : '#555',
                fontFamily: 'monospace', fontWeight: '700', fontSize: '0.7rem', cursor: 'pointer',
              }}>{t.label}</button>
            ))}
          </div>
          <label style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '8px' }}>YOUR MESSAGE:</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={listening ? '🎤 Listening... speak now' : 'Type your message here...'}
            rows={4}
            style={{
              width: '100%', background: '#f8f8f8', color: '#111',
              border: '1px solid #e0e0e0', borderRadius: '10px',
              padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem',
              lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={toggle} style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: listening ? '#ff4444' : '#f5f5f5',
              color: listening ? '#fff' : '#555',
              border: `1px solid ${listening ? '#ff4444' : '#e0e0e0'}`,
              cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>🎤</button>
            <button onClick={send} disabled={sending} style={{
              flex: 1, padding: '12px', background: sending ? '#ccc' : '#00ff2f',
              color: '#000', border: 'none', borderRadius: '10px',
              fontFamily: 'monospace', fontWeight: '900', fontSize: '0.85rem',
              letterSpacing: '1px', cursor: sending ? 'not-allowed' : 'pointer',
            }}>{sending ? 'SENDING...' : '📩 SEND MESSAGE'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Messages View ─────────────────────────────────────
function Messages({ user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMsg, setOpenMsg] = useState(null);
  const [courses, setCourses] = useState([]);

  // Bottom bar state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [msgType, setMsgType] = useState('module_clarification');
  const [newMsgText, setNewMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [showTypePanel, setShowTypePanel] = useState(false);
  const [showModulePanel, setShowModulePanel] = useState(false);

  const bottomRef = useRef(null);
  const { listening, toggle: toggleVoice } = useVoiceInput((t) => setNewMsgText(prev => prev + t));

  const fetchMessages = async () => {
    try {
      const result = await localDB.allDocs({ include_docs: true });
      const docs = result.rows.map(r => r.doc);
      const msgs = docs
        .filter(d => d.type === 'message' && d.fromEmail === user.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(msgs);
      const allCourses = docs.filter(d => d.type === 'lesson' && d.level === user.level);
      setCourses(allCourses);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const listener = localDB.changes({ since: 'now', live: true, include_docs: true })
      .on('change', fetchMessages);
    return () => listener.cancel();
  }, []);
  const deleteMessage = async (msg) => {
  const yes = await showConfirm('Delete this message and all replies?');
  if (!yes) return;
try {
  const doc = await localDB.get(msg._id);
  await localDB.remove(doc);
} catch (err) {
  showToast('Error: ' + err.message, 'error');
}
};

  const sendNewMessage = async () => {
    if (!selectedCourse) { showToast('Please select a module first.'); return; }
    if (!newMsgText.trim()) { showToast('Please type a message.'); return; }
    setSending(true);
    try {
      const course = courses.find(c => c._id === selectedCourse);
      await localDB.put({
        _id: `msg_${user.email}_${selectedCourse}_${Date.now()}`,
        type: 'message',
        fromEmail: user.email,
        fromName: user.name,
        toEmail: course?.createdBy || 'admin@edubridge.com',
        courseId: selectedCourse,
        courseTitle: course?.title || 'Unknown Module',
        msgType,
        text: newMsgText.trim(),
        replies: [],
        readByLecturer: false,
        readByStudent: true,
        createdAt: new Date().toISOString(),
      });
      setNewMsgText('');
      setSelectedCourse('');
      setShowTypePanel(false);
      setShowModulePanel(false);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    setSending(false);
  };

  const unreadReplies = messages.filter(m =>
    m.replies?.length > 0 && !m.readByStudent
  ).length;

  const selectedCourseObj = courses.find(c => c._id === selectedCourse);
  const selectedTypeObj = MESSAGE_TYPES.find(t => t.id === msgType);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace', color: '#aaa' }}>
      Loading messages...
    </div>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', fontFamily: 'monospace',
      background: '#f4f4f4',
    }}>

      {/* ── Scrollable content area ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px 24px 16px',
        maxWidth: '800px', width: '100%', margin: '0 auto',
        boxSizing: 'border-box',
        // leave space for the bottom bar
        paddingBottom: showTypePanel || showModulePanel ? '240px' : '100px',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#00ff2f', fontWeight: '900', fontSize: '1.1rem' }}>
              📬 MY MESSAGES
            </h2>
            <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.7rem', letterSpacing: '1px' }}>
              {messages.length} TOTAL · {unreadReplies} UNREAD REPLIES
            </p>
          </div>
          {unreadReplies > 0 && (
            <span style={{
              background: '#ff4444', color: '#fff', borderRadius: '20px',
              padding: '4px 12px', fontSize: '0.7rem', fontWeight: '900',
            }}>
              {unreadReplies} NEW
            </span>
          )}
        </div>

        {/* Messages list */}
        {messages.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '40px',
            textAlign: 'center', border: '2px dashed #e0e0e0',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
            <div style={{ fontWeight: '900', color: '#333', marginBottom: '6px' }}>No messages yet</div>
            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
              Use the bar below to select a module and send your first message.
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const msgTypeInfo = MESSAGE_TYPES.find(t => t.id === msg.msgType);
            const hasUnreadReply = msg.replies?.length > 0 && !msg.readByStudent;

            return (
              <div key={msg._id} style={{
                background: '#fff', borderRadius: '14px', marginBottom: '12px',
                border: `1px solid ${hasUnreadReply ? '#00ff2f' : '#e8e8e8'}`,
                boxShadow: hasUnreadReply ? '0 4px 20px rgba(0,255,47,0.12)' : '0 2px 10px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                {/* Message header row */}
                <div style={{
                  padding: '14px 18px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                }} onClick={async () => {
                  setOpenMsg(openMsg?._id === msg._id ? null : msg);
                  if (hasUnreadReply) {
                    try {
                      const doc = await localDB.get(msg._id);
                      await localDB.put({ ...doc, readByStudent: true });
                    } catch (e) {}
                  }
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
                        background: msgTypeInfo?.color + '20',
                        color: msgTypeInfo?.color,
                        border: `1px solid ${msgTypeInfo?.color}40`,
                        fontWeight: '700',
                      }}>{msgTypeInfo?.label}</span>
                      {hasUnreadReply && (
                        <span style={{
                          fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
                          background: '#00ff2f', color: '#000', fontWeight: '900',
                        }}>NEW REPLY</span>
                      )}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111' }}>
                      📘 {msg.courseTitle}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>
                      {new Date(msg.createdAt).toLocaleString()} · {msg.replies?.length || 0} replies
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={e => { e.stopPropagation(); deleteMessage(msg); }} style={{
                      background: '#ff444420', color: '#ff4444', border: '1px solid #ff444440',
                      borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                      fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: '700',
                    }}>🗑</button>
                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                      {openMsg?._id === msg._id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded conversation */}
                {openMsg?._id === msg._id && (
                  <div style={{ padding: '16px 18px' }}>
                    {/* Student message bubble */}
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        background: '#111', color: '#00ff2f', padding: '12px 16px',
                        borderRadius: '14px 14px 4px 14px', fontSize: '0.85rem', lineHeight: 1.6,
                        maxWidth: '80%',
                      }}>
                        <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: '4px' }}>YOU</div>
                        {msg.text}
                      </div>
                    </div>

                    {/* Lecturer replies */}
                    {msg.replies?.length > 0 ? (
                      msg.replies.map((reply, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                          <div style={{
                            background: '#f0fff4', border: '1px solid rgba(0,255,47,0.2)',
                            padding: '12px 16px', borderRadius: '4px 14px 14px 14px',
                            fontSize: '0.85rem', lineHeight: 1.6, color: '#333',
                            maxWidth: '80%',
                          }}>
                            <div style={{ fontSize: '0.62rem', color: '#00aa1f', marginBottom: '4px', fontWeight: '700' }}>
                              👨‍🏫 {reply.fromName} · {new Date(reply.createdAt).toLocaleString()}
                            </div>
                            {reply.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.75rem', padding: '10px 0' }}>
                        ⏳ Waiting for lecturer reply...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Fixed bottom compose bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0a0a0a',
        borderTop: '2px solid rgba(0,255,47,0.2)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        zIndex: 1000,
        fontFamily: 'monospace',
      }}>
        {/* Module & type selector panels — slide up when active */}
        {showModulePanel && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#111',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '8px' }}>
              SELECT MODULE:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {courses.length === 0 ? (
                <span style={{ color: '#555', fontSize: '0.75rem' }}>No modules available.</span>
              ) : courses.map(c => (
                <button key={c._id} onClick={() => { setSelectedCourse(c._id); setShowModulePanel(false); }} style={{
                  padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'monospace', fontWeight: '700', fontSize: '0.7rem',
                  border: `1px solid ${selectedCourse === c._id ? '#00ff2f' : 'rgba(255,255,255,0.15)'}`,
                  background: selectedCourse === c._id ? '#00ff2f' : 'transparent',
                  color: selectedCourse === c._id ? '#000' : '#aaa',
                }}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {showTypePanel && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#111',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '8px' }}>
              MESSAGE TYPE:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MESSAGE_TYPES.map(t => (
                <button key={t.id} onClick={() => { setMsgType(t.id); setShowTypePanel(false); }} style={{
                  padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'monospace', fontWeight: '700', fontSize: '0.7rem',
                  border: `1px solid ${msgType === t.id ? t.color : 'rgba(255,255,255,0.15)'}`,
                  background: msgType === t.id ? t.color : 'transparent',
                  color: msgType === t.id ? '#fff' : '#aaa',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Tag pills row — shows selected module + type at a glance */}
        <div style={{
          padding: '8px 16px 0',
          display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Module picker pill */}
          <button onClick={() => { setShowModulePanel(p => !p); setShowTypePanel(false); }} style={{
            padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
            fontFamily: 'monospace', fontWeight: '700', fontSize: '0.65rem',
            border: `1px solid ${selectedCourse ? '#00ff2f' : 'rgba(255,255,255,0.2)'}`,
            background: selectedCourse ? 'rgba(0,255,47,0.1)' : 'transparent',
            color: selectedCourse ? '#00ff2f' : '#666',
          }}>
            {selectedCourseObj ? `📘 ${selectedCourseObj.title.length > 20 ? selectedCourseObj.title.slice(0,18)+'…' : selectedCourseObj.title}` : '📘 Select Module ▾'}
          </button>

          {/* Type picker pill */}
          <button onClick={() => { setShowTypePanel(p => !p); setShowModulePanel(false); }} style={{
            padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
            fontFamily: 'monospace', fontWeight: '700', fontSize: '0.65rem',
            border: `1px solid ${selectedTypeObj ? selectedTypeObj.color + '80' : 'rgba(255,255,255,0.2)'}`,
            background: selectedTypeObj ? selectedTypeObj.color + '18' : 'transparent',
            color: selectedTypeObj ? selectedTypeObj.color : '#666',
          }}>
            {selectedTypeObj ? `${selectedTypeObj.label} ▾` : '💬 Type ▾'}
          </button>
        </div>

        {/* Main input row */}
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          padding: '10px 16px 14px',
        }}>
          {/* Voice button */}
          <button onClick={toggleVoice} title="Voice input" style={{
            width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
            background: listening ? '#ff4444' : 'rgba(255,255,255,0.07)',
            color: listening ? '#fff' : '#666',
            border: `1px solid ${listening ? '#ff4444' : 'rgba(255,255,255,0.12)'}`,
            cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🎤</button>

          {/* Text input */}
          <input
            type="text"
            value={newMsgText}
            onChange={e => setNewMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNewMessage(); } }}
            placeholder={listening ? '🎤 Listening...' : selectedCourse ? 'Type your message...' : 'Select a module first…'}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.07)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.85rem',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#00ff2f'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          />

          {/* Send button */}
          <button
            onClick={sendNewMessage}
            disabled={sending}
            title="Send message"
            style={{
              height: '42px', padding: '0 16px', borderRadius: '10px', flexShrink: 0,
              background: sending ? '#555' : '#00ff2f',
              color: sending ? '#999' : '#000',
              border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace', fontWeight: '900', fontSize: '0.8rem',
              letterSpacing: '0.5px',
            }}
          >
            {sending ? '...' : '➤ SEND'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messages;
