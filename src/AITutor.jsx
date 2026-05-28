import React, { useState } from 'react';

const AITutor = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'tinyllama',
          prompt: prompt,
          stream: false
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setResponse("❌ Offline AI not detected. Please ensure Ollama is running on your machine.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f6f8',
      padding: '24px',
      fontFamily: 'monospace',
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
      }}>

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,255,47,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>🤖</span>
            <div>
              <h2 style={{ margin: 0, color: '#00ff2f', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                OFFLINE AI TUTOR
              </h2>
              <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.72rem', letterSpacing: '1px' }}>
                POWERED BY TINYLLAMA · WORKS WITHOUT INTERNET
              </p>
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid #e8e8e8',
        }}>
          <label style={{
            fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1.5px',
            color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '10px'
          }}>
            YOUR QUESTION
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything about your courses, modules or topics..."
            rows={5}
            style={{
              width: '100%',
              background: '#f8f8f8',
              color: '#111',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              padding: '14px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#00ff2f';
              e.target.style.boxShadow = '0 0 0 3px rgba(0,255,47,0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={askAI}
            disabled={loading}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '13px',
              background: loading ? '#555' : '#111',
              color: '#00ff2f',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'monospace',
              fontWeight: '900',
              fontSize: '0.85rem',
              letterSpacing: '1.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'background 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#222'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#111'; }}
            onMouseDown={e => { e.target.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.target.style.transform = 'scale(1)'; }}
          >
            {loading ? '⏳ THINKING...' : '→ ASK ASSISTANT'}
          </button>
        </div>

        {/* Response Card */}
        {response && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #e8e8e8',
            animation: 'fadeIn 0.3s ease',
          }}>
            <label style={{
              fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1.5px',
              color: '#00aa1f', textTransform: 'uppercase', display: 'block', marginBottom: '12px'
            }}>
              ✓ RESPONSE
            </label>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem',
              lineHeight: 1.8,
              color: '#333',
            }}>
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;