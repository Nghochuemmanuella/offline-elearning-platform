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
          model: 'tinyllama', // A small model perfect for students
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
    <div style={{ backgroundColor: '#000', color: '#00ff2f', padding: '20px', border: '4px solid #00ff2f', fontFamily: 'monospace' }}>
      <h3>🤖 OFFLINE AI TUTOR</h3>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        placeholder="Ask a question about your courses..."
        style={{ width: '100%', background: '#111', color: '#00ff2f', border: '1px solid #333', padding: '10px' }}
      />
      <button onClick={askAI} disabled={loading} style={{ marginTop: '10px', padding: '10px', background: '#00ff2f', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
        {loading ? 'THINKING...' : 'ASK ASSISTANT'}
      </button>
      {response && <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap', borderTop: '1px solid #333', paddingTop: '10px' }}>{response}</div>}
    </div>
  );
};

export default AITutor;