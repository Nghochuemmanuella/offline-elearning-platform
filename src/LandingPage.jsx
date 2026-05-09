import React, { useState, useEffect } from 'react';

// ─── INJECT STYLES ────────────────────────────────────────────────────────────
const LANDING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes glitch {
    0%   { clip-path: inset(0 0 98% 0); transform: translate(-4px, 0); }
    10%  { clip-path: inset(40% 0 50% 0); transform: translate(4px, 0); }
    20%  { clip-path: inset(80% 0 10% 0); transform: translate(-4px, 0); }
    30%  { clip-path: inset(10% 0 70% 0); transform: translate(0, 0); }
    100% { clip-path: inset(0 0 98% 0); transform: translate(0, 0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes pulse-border {
    0%, 100% { box-shadow: 6px 6px 0px #00ff2f; }
    50%       { box-shadow: 10px 10px 0px #00ff2f; }
  }

  .landing-page * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .land-btn-primary {
    transition: transform 0.1s ease, box-shadow 0.1s ease !important;
  }
  .land-btn-primary:hover {
    transform: translate(-3px, -3px) !important;
    box-shadow: 9px 9px 0px #00ff2f !important;
  }
  .land-btn-primary:active {
    transform: translate(0, 0) !important;
    box-shadow: 3px 3px 0px #00ff2f !important;
  }
  .land-btn-secondary {
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease !important;
  }
  .land-btn-secondary:hover {
    transform: translate(-3px, -3px) !important;
    box-shadow: 9px 9px 0px #fff !important;
    background: #111 !important;
  }
  .feature-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease !important;
  }
  .feature-card:hover {
    transform: translate(-4px, -4px) !important;
    box-shadow: 10px 10px 0px #00ff2f !important;
  }
  .stat-item {
    transition: border-color 0.2s ease !important;
  }
  .stat-item:hover {
    border-color: #00ff2f !important;
  }
  .cursor-blink {
    animation: blink 1s step-end infinite;
  }
  .glitch-text::before {
    content: attr(data-text);
    position: absolute;
    left: 0; top: 0;
    color: #00ff2f;
    animation: glitch 3s infinite;
    opacity: 0.6;
  }
  .scanline {
    position: fixed;
    top: 0; left: 0;
    width: 100%;
    height: 3px;
    background: rgba(0, 255, 47, 0.08);
    animation: scanline 4s linear infinite;
    pointer-events: none;
    z-index: 9999;
  }
  .marquee-track {
    animation: marquee 20s linear infinite;
  }
  .float-card {
    animation: float 4s ease-in-out infinite;
  }
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const phrases = [
     'LEARN WITHOUT LIMITS.',
    'OFFLINE-FIRST.',
    'ALWAYS AVAILABLE.',
   
  ];

  // Inject styles
  useEffect(() => {
    const existing = document.getElementById('landing-styles');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'landing-styles';
      style.textContent = LANDING_STYLES;
      document.head.appendChild(style);
    }
    setTimeout(() => setVisible(true), 100);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    }, []);

  // Typewriter effect
  useEffect(() => {
    const phrase = phrases[currentPhrase];
    let i = 0;
    setTypedText('');

    const typeInterval = setInterval(() => {
      if (i < phrase.length) {
        setTypedText(phrase.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentPhrase(prev => (prev + 1) % phrases.length);
        }, 2000);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [currentPhrase]);

  const features = [
    {
      icon: '📡',
      title: 'OFFLINE FIRST',
      desc: 'Study anywhere in the Northwest Region — even with zero internet. All modules cached locally via PouchDB.',
      tag: 'CORE FEATURE',
    },
    {
      icon: '🔄',
      title: 'AUTO SYNC',
      desc: 'When connectivity returns, your progress and new modules sync automatically with the campus CouchDB server.',
      tag: 'DISTRIBUTED',
    },
    {
      icon: '🤖',
      title: 'AI TUTOR',
      desc: 'Ask questions about your modules using the built-in Ollama-powered AI assistant — works completely offline.',
      tag: 'AI POWERED',
    },
    {
      icon: '📊',
      title: 'LEVEL SYSTEM',
      desc: 'Content is provisioned by academic level (200, 300, 400). Only relevant modules are downloaded to your device.',
      tag: 'SMART CACHING',
    },
    {
      icon: '👨‍🏫',
      title: 'LECTURER TOOLS',
      desc: 'Upload modules, attach PDFs, track student engagement, and manage content — all from one dashboard.',
      tag: 'MANAGEMENT',
    },
    {
      icon: '🔒',
      title: 'SECURE AUTH',
      desc: 'Passwords hashed with bcrypt. Role-based access for students and lecturers. Built with security in mind.',
      tag: 'SECURITY',
    },
  ];

  const stats = [
    { value: '3', label: 'ACADEMIC LEVELS' },
    { value: '100%', label: 'OFFLINE CAPABLE' },
    { value: 'PWA', label: 'INSTALLABLE APP' },
    { value: 'P2P', label: 'SYNC ENGINE' },
  ];

  const marqueeItems = ['OFFLINE-FIRST', 'POUCHDB', 'COUCHDB', 'REACT', 'PWA', 'BAMENDA', 'DISTRIBUTED', 'EDUBRIDGE', 'SYNC ENGINE', 'AI TUTOR'];

  return (
    <div className="landing-page" style={{
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: "'Space Mono', monospace",
      overflowX: 'hidden',
    }}>
      {/* Scanline effect */}
      <div className="scanline" />

      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '16px 20px' : '20px 40px', borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
        animation: visible ? 'fadeUp 0.4s ease' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         <img src="/logo192.png" alt="EduBridge" style={{ height: '45px', width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="land-btn-secondary"
            onClick={onEnter}
            style={{
              padding: '10px 20px', background: 'transparent',
              color: '#fff', border: '2px solid #333',
              fontFamily: "'Space Mono', monospace", fontWeight: '700',
              fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer',
              boxShadow: '4px 4px 0px #333',
            }}
          >
            LOGIN
          </button>
          <button
            className="land-btn-primary"
            onClick={onEnter}
            style={{
              padding: '10px 20px', background: '#00ff2f',
              color: '#000', border: '2px solid #00ff2f',
              fontFamily: "'Space Mono', monospace", fontWeight: '900',
              fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer',
             
            }}
          >
            GET STARTED →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: isMobile ? '40px 20px' : '60px 40px', position: 'relative',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,255,47,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,47,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-block', padding: '6px 16px',
          border: '1px solid #00ff2f', color: '#00ff2f',
          fontSize: '0.65rem', letterSpacing: '3px', marginBottom: '30px',
          animation: visible ? 'fadeUp 0.5s ease 0.1s both' : 'none',
        }}>
          
          ◉ DISTRIBUTED E-LEARNING SYSTEM — DESIGNED WITH YOU IN MIND
        </div>
        <img src="/logo192.png" alt="EduBridge" style={{ width: '150px', marginBottom: '24px', animation: visible ? 'fadeUp 0.4s ease' : 'none' }} />

        {/* Main title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 6rem)',
          fontWeight: '900',
          lineHeight: 1,
          letterSpacing: '-2px',
          marginBottom: '20px',
          fontFamily: "'Syne', sans-serif",
          animation: visible ? 'fadeUp 0.5s ease 0.2s both' : 'none',
          position: 'relative',
        }}>
          <span style={{ color: '#00ff2f' }}>EDU</span>BRIDGE
        </h1>

        {/* Typewriter */}
        <div style={{
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          fontWeight: '700',
          letterSpacing: '2px',
          marginBottom: '30px',
          minHeight: '40px',
          animation: visible ? 'fadeUp 0.5s ease 0.3s both' : 'none',
          color: '#fff',
        }}>
          {typedText}<span className="cursor-blink" style={{ color: '#00ff2f' }}>█</span>
        </div>

        {/* Description */}
        <p style={{
          maxWidth: '600px', fontSize: '0.9rem', lineHeight: 1.8,
          color: '#888', marginBottom: '40px', letterSpacing: '0.5px',
          animation: visible ? 'fadeUp 0.5s ease 0.4s both' : 'none',
        }}>
          A progressive web app built for students and lecturers in areas with limited internet access.
          Learn, progress, and sync — with or without a connection.
        </p>


        {/* Floating card */}
        <div className="float-card" style={{
          marginTop: '60px',
          border: '2px solid #1a1a1a', padding: '16px 24px',
          background: '#0a0a0a', display: 'flex', gap: '24px',
          flexWrap: 'wrap', justifyContent: 'center',
          animation: visible ? 'fadeUp 0.5s ease 0.6s both' : 'none',
        }}>
          {['PouchDB', 'CouchDB', 'React', 'PWA', 'Ollama AI'].map(tech => (
            <span key={tech} style={{
              fontSize: '0.65rem', color: '#555', letterSpacing: '1px',
            }}>
              <span style={{ color: '#00ff2f', marginRight: '6px' }}>▸</span>{tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        padding: '14px 0', overflow: 'hidden', background: '#050505',
      }}>
        <div className="marquee-track" style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap' }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{
              fontSize: '0.7rem', letterSpacing: '3px', padding: '0 30px',
              color: i % 2 === 0 ? '#333' : '#00ff2f', fontWeight: '700',
            }}>
              {item} ◆
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: '80px 40px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
           gap: '0',
        }}>
          {stats.map(({ value, label }, i) => (
            <div
              key={i}
              className="stat-item"
              style={{
                padding: '40px 30px', textAlign: 'center',
                borderRight: !isMobile && i < stats.length - 1 ? '1px solid #1a1a1a' : 'none',
                 borderBottom: '1px solid #1a1a1a',
                borderTop: '1px solid #1a1a1a',
                borderLeft: i === 0 ? '1px solid #1a1a1a' : 'none',
              }}
            >
              <div style={{
              fontSize: '2rem',
              fontWeight: '900', color: '#00ff2f',
              fontFamily: "'Syne', sans-serif", lineHeight: 1,
              marginBottom: '8px',
                 }}>{value}</div>
              <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{padding: isMobile ? '40px 20px' : '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '0.65rem', color: '#00ff2f', letterSpacing: '3px', marginBottom: '16px' }}>
            ◈ WHAT MAKES EDUBRIDGE DIFFERENT
          </div>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: '900', letterSpacing: '-1px',
            fontFamily: "'Syne', sans-serif",
          }}>
            BUILT FOR THE <span style={{ color: '#00ff2f' }}>REAL WORLD</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {features.map(({ icon, title, desc, tag }, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                border: '2px solid #1a1a1a', padding: '28px',
                background: '#050505',
                boxShadow: '6px 6px 0px #111',
                animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem' }}>{icon}</span>
                <span style={{
                  fontSize: '0.55rem', padding: '3px 8px',
                  border: '1px solid #00ff2f', color: '#00ff2f',
                  letterSpacing: '1px', fontWeight: '700',
                }}>{tag}</span>
              </div>
              <h3 style={{
                fontSize: '0.95rem', fontWeight: '900',
                letterSpacing: '1px', marginBottom: '10px', color: '#fff',
              }}>{title}</h3>
              <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        padding: isMobile ? '40px 20px' : '80px 40px', background: '#050505',
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ fontSize: '0.65rem', color: '#00ff2f', letterSpacing: '3px', marginBottom: '16px' }}>
              ◈ THE PROCESS
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: '900', letterSpacing: '-1px',
              fontFamily: "'Syne', sans-serif",
            }}>HOW IT <span style={{ color: '#00ff2f' }}>WORKS</span></h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { step: '01', title: 'SIGN UP & SELECT LEVEL', desc: 'Create your account and select your academic level (200, 300, or 400). EduBridge provisions the right modules for you.' },
              { step: '02', title: 'MODULES CACHED LOCALLY', desc: 'Your level-specific modules are downloaded to your browser via PouchDB — ready to access even with no internet.' },
              { step: '03', title: 'LEARN OFFLINE', desc: 'Read content, complete modules, and get help from the AI tutor — all without needing a connection.' },
              { step: '04', title: 'SYNC WHEN CONNECTED', desc: 'When internet returns, your progress automatically syncs to the campus CouchDB server. Lecturers see your completions in real time.' },
            ].map(({ step, title, desc }, i) => (
              <div key={i} style={{
                display: 'flex', gap: '30px', alignItems: 'flex-start',
                padding: '30px 0', borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none',
              }}>
                <div style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900',
                  color: '#00ff2f', fontFamily: "'Syne', sans-serif",
                  minWidth: '80px', lineHeight: 1,
                }}>{step}</div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', color: '#00ff2f' }}>{title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: isMobile ? '60px 20px' : '100px 40px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(ellipse at center, rgba(0,255,47,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontSize: '0.65rem', color: '#00ff2f', letterSpacing: '3px', marginBottom: '20px' }}>
          ◉ READY TO START?
        </div>
        <button
  className="land-btn-primary"
  onClick={onEnter}
  style={{
    padding: '14px 40px', background: '#00ff2f',
    color: '#000', border: '3px solid #00ff2f',
    fontFamily: "'Space Mono', monospace", fontWeight: '900',
    fontSize: '0.9rem', letterSpacing: '3px', cursor: 'pointer',
    marginBottom: '50px'
  }}
>
  GET STARTED →
</button>
        <h2 style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          fontWeight: '900', letterSpacing: '-2px', marginBottom: '20px',
          fontFamily: "'Syne', sans-serif",
        }}>
          EDUCATION SHOULD HAVE<br />
          <span style={{ color: '#00ff2f' }}>NO BARRIERS.</span>
        </h2>
        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '40px', letterSpacing: '0.5px' }}>
          Join EduBridge and access your modules — online or offline.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '30px 40px', borderTop: '1px solid #1a1a1a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
        flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo192.png" alt="EduBridge" style={{ height: '35px', width: 'auto' }} />
<span style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px' }}>
  EDUBRIDGE © 2026 — NGHOCHU EMMANUELLA AFAMBOMBI
</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#333', letterSpacing: '1px' }}>
          FINAL YEAR PROJECT · UNIVERSITY OF BAMENDA
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
