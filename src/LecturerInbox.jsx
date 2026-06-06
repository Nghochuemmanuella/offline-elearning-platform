import React, { useState, useEffect, useRef } from 'react';
import localDB from './db';

const MESSAGE_TYPES = [
  { id: 'mark_complaint', label: '📝 Mark Complaint', color: '#ff4444' },
  { id: 'module_clarification', label: '❓ Module Clarification', color: '#ffaa00' },
  { id: 'general_inquiry', label: '💬 General Inquiry', color: '#00aa1f' },
];

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
    if (!recRef.current) { alert('Voice not supported in this browser.'); return; }
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  return { listening, toggle };
}

function LecturerInbox({ user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMsg, setOpenMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const { listening, toggle } = useVoiceInput((t) => setReplyText(prev => prev + t));

  const fetchMessages = async () => {
    try {
      const result = await localDB.allDocs({ include_docs: true });
      const msgs = result.rows
        .map(r => r.doc)
        .filter(d => d.type === 'message' && d.toEmail === user.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(msgs);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const listener = localDB.changes({ since: 'now', live: true, include_docs: true })
      .on('change', fetchMessages);
    return () => listener.cancel();
  }, []);

  const openMessage = async (msg) => {
    setOpenMsg(openMsg?._id === msg._id ? null : msg);
    setReplyText('');
    if (!msg.readByLecturer) {
      try {
        const doc = await localDB.get(msg._id);
        await localDB.put({ ...doc, readByLecturer: true });
      } catch (e) { }
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) { alert('Please type a reply.'); return; }
    setSending(true);
    try {
      const doc = await localDB.get(openMsg._id);
      const newReply = {
        fromEmail: user.email,
        fromName: user.name,
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
      };
      await localDB.put({
        ...doc,
        replies: [...(doc.replies || []), newReply],
        readByStudent: false,
      });
      setReplyText('');
      alert('✅ Reply sent!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
    setSending(false);
  };

  const deleteMessage = async (msg) => {
    if (!window.confirm('Delete this message and all replies?')) return;
    try {
      const doc = await localDB.get(msg._id);
      await localDB.remove(doc);
      if (openMsg?._id === msg._id) setOpenMsg(null);
    } catch (err) { alert('❌ Error: ' + err.message); }
  };

  const unreadCount = messages.filter(m => !m.readByLecturer).length;

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.readByLecturer;
    if (filter === 'replied') return m.replies?.length > 0;
    if (filter === 'pending') return !m.replies?.length;
    return true;
  });

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace', color: '#aaa' }}>
      Loading inbox...
    </div>
  );

  return (
    <div style={{ padding: '24px', fontFamily: 'monospace', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
        borderRadius: '16px', padding: '24px', marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#00ff2f', fontWeight: '900', fontSize: '1.1rem' }}>
              📬 STUDENT INBOX
            </h2>
            <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.7rem', letterSpacing: '1px' }}>
              {messages.length} TOTAL · {unreadCount} UNREAD
            </p>
          </div>
          {unreadCount > 0 && (
            <span style={{
              background: '#ff4444', color: '#fff', borderRadius: '20px',
              padding: '6px 16px', fontSize: '0.75rem', fontWeight: '900',
            }}>
              {unreadCount} UNREAD
            </span>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `ALL (${messages.length})` },
            { id: 'unread', label: `UNREAD (${unreadCount})` },
            { id: 'pending', label: `PENDING REPLY (${messages.filter(m => !m.replies?.length).length})` },
            { id: 'replied', label: `REPLIED (${messages.filter(m => m.replies?.length > 0).length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 14px', borderRadius: '20px',
              background: filter === f.id ? '#00ff2f' : 'rgba(255,255,255,0.05)',
              color: filter === f.id ? '#000' : '#888',
              border: `1px solid ${filter === f.id ? '#00ff2f' : 'rgba(255,255,255,0.1)'}`,
              fontFamily: 'monospace', fontWeight: '700', fontSize: '0.65rem',
              cursor: 'pointer', letterSpacing: '0.5px',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {filteredMessages.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '40px',
          textAlign: 'center', border: '2px dashed #e0e0e0',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
          <div style={{ fontWeight: '900', color: '#333', marginBottom: '6px' }}>No messages here</div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
            Students can message you from their module cards.
          </div>
        </div>
      ) : (
        filteredMessages.map(msg => {
          const msgTypeInfo = MESSAGE_TYPES.find(t => t.id === msg.msgType);
          const isUnread = !msg.readByLecturer;
          const isOpen = openMsg?._id === msg._id;

          return (
            <div key={msg._id} style={{
              background: '#fff', borderRadius: '14px', marginBottom: '12px',
              border: `1px solid ${isUnread ? '#ffaa00' : '#e8e8e8'}`,
              boxShadow: isUnread ? '0 4px 20px rgba(255,170,0,0.12)' : '0 2px 10px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Message header */}
              <div style={{
                padding: '16px 18px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', borderBottom: isOpen ? '1px solid #f0f0f0' : 'none',
              }} onClick={() => openMessage(msg)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {isUnread && (
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#ffaa00', display: 'inline-block', flexShrink: 0,
                      }} />
                    )}
                    <span style={{
                      fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
                      background: msgTypeInfo?.color + '20', color: msgTypeInfo?.color,
                      border: `1px solid ${msgTypeInfo?.color}40`, fontWeight: '700',
                    }}>{msgTypeInfo?.label}</span>
                    <span style={{
                      fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
                      background: '#f0f0f0', color: '#666', fontWeight: '700',
                    }}>📘 {msg.courseTitle}</span>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '0.9rem', color: '#111' }}>
                    👤 {msg.fromName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '2px' }}>
                    {msg.fromEmail} · {new Date(msg.createdAt).toLocaleString()} · {msg.replies?.length || 0} replies
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); deleteMessage(msg); }} style={{
                    background: '#ff444420', color: '#ff4444', border: '1px solid #ff444440',
                    borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                    fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: '700',
                  }}>🗑 DEL</button>
                  <span style={{ color: '#aaa' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded view */}
              {isOpen && (
                <div style={{ padding: '16px 18px' }}>

                  {/* Student message */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.62rem', color: '#aaa', marginBottom: '6px', letterSpacing: '1px' }}>
                      STUDENT MESSAGE:
                    </div>
                    <div style={{
                      background: '#f8f8f8', border: '1px solid #ebebeb',
                      padding: '12px 16px', borderRadius: '4px 12px 12px 12px',
                      fontSize: '0.85rem', lineHeight: 1.6, color: '#333',
                    }}>
                      {msg.text}
                    </div>
                  </div>

                  {/* Previous replies */}
                  {msg.replies?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#aaa', marginBottom: '8px', letterSpacing: '1px' }}>
                        PREVIOUS REPLIES:
                      </div>
                      {msg.replies.map((reply, i) => (
                        <div key={i} style={{
                          background: '#f0fff4', border: '1px solid rgba(0,255,47,0.2)',
                          padding: '10px 14px', borderRadius: '12px 12px 4px 12px',
                          marginBottom: '8px', fontSize: '0.82rem', lineHeight: 1.6, color: '#333',
                        }}>
                          <div style={{ fontSize: '0.6rem', color: '#00aa1f', marginBottom: '4px', fontWeight: '700' }}>
                            YOU · {new Date(reply.createdAt).toLocaleString()}
                          </div>
                          {reply.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.62rem', color: '#aaa', marginBottom: '8px', letterSpacing: '1px' }}>
                      YOUR REPLY:
                    </div>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={listening ? '🎤 Listening...' : 'Type your reply here...'}
                      rows={3}
                      style={{
                        width: '100%', background: '#f8f8f8', color: '#111',
                        border: '1px solid #e0e0e0', borderRadius: '10px',
                        padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.85rem',
                        lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        marginBottom: '10px',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#00ff2f'; e.target.style.boxShadow = '0 0 0 3px rgba(0,255,47,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={toggle} style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: listening ? '#ff4444' : '#f5f5f5',
                        color: listening ? '#fff' : '#555',
                        border: `1px solid ${listening ? '#ff4444' : '#e0e0e0'}`,
                        cursor: 'pointer', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>🎤</button>
                      <button onClick={sendReply} disabled={sending} style={{
                        flex: 1, padding: '12px', background: sending ? '#ccc' : '#00ff2f',
                        color: '#000', border: 'none', borderRadius: '10px',
                        fontFamily: 'monospace', fontWeight: '900', fontSize: '0.85rem',
                        letterSpacing: '1px', cursor: sending ? 'not-allowed' : 'pointer',
                      }}>{sending ? 'SENDING...' : '↩ SEND REPLY'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default LecturerInbox;
