import React, { useState } from 'react';
import localDB from './db';

const QuizBuilder = ({ courses, onClose }) => {
  const [selectedLesson, setSelectedLesson] = useState('');
  const [passmark, setPassmark] = useState(70);
  const [questions, setQuestions] = useState([
    { id: 1, question: '', options: ['', '', '', ''], correct: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { id: prev.length + 1, question: '', options: ['', '', '', ''], correct: 0 }
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const newOptions = [...q.options];
      newOptions[oIndex] = value;
      return { ...q, options: newOptions };
    }));
  };

  const handleSave = async () => {
    if (!selectedLesson) { alert('Please select a module.'); return; }
    if (questions.some(q => !q.question || q.options.some(o => !o))) {
      alert('Please fill in all questions and options.');
      return;
    }
    setSaving(true);
    try {
      const quizId = `quiz_${selectedLesson}`;
      let existing = null;
      try { existing = await localDB.get(quizId); } catch (e) {}
      await localDB.put({
        _id: quizId,
        _rev: existing?._rev,
        type: 'quiz',
        lessonId: selectedLesson,
        passmark: parseInt(passmark),
        questions,
        createdAt: new Date().toISOString(),
      });
      alert('✅ Quiz saved successfully!');
      onClose();
    } catch (err) {
      alert('❌ Error saving quiz: ' + err.message);
    }
    setSaving(false);
  };

  const S = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      overflowY: 'auto', padding: '20px',
    },
    modal: {
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '20px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      width: '100%', maxWidth: '700px',
      padding: '32px', marginTop: '20px',
      fontFamily: 'monospace',
    },
    input: {
      width: '100%', padding: '11px 14px', background: '#111',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: '#fff', outline: 'none',
      fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '10px',
    },
    label: { fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '5px', color: '#555' },
    questionBox: {
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '20px', marginBottom: '16px',
      background: '#f9f9f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    btn: (color) => ({
      padding: '10px 20px',
      background: color || '#0a0a0a',
      color: color === '#00ff2f' ? '#000' : '#fff',
      border: 'none', borderRadius: '8px',
      fontFamily: 'monospace', fontWeight: '900',
      cursor: 'pointer', letterSpacing: '1px', fontSize: '0.8rem',
      transition: 'opacity 0.15s ease',
    }),
  };

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid rgba(0,255,47,0.2)', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontWeight: '900' }}>➕ CREATE QUIZ</h2>
          <button onClick={onClose} style={{ ...S.btn('#ff4444'), padding: '6px 12px' }}>✕ CLOSE</button>
        </div>

        {/* Module Selector */}
        <label style={S.label}>SELECT MODULE:</label>
        <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
          <option value="">-- Choose a module --</option>
          {courses.map(c => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>

        {/* Passmark */}
        <label style={S.label}>PASS MARK (%):</label>
        <input
          type="number" min="1" max="100"
          value={passmark}
          onChange={e => setPassmark(e.target.value)}
          style={S.input}
        />

        {/* Questions */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ ...S.label, fontSize: '0.85rem', marginBottom: '15px' }}>
            QUESTIONS ({questions.length})
          </label>

          {questions.map((q, qIndex) => (
            <div key={qIndex} style={S.questionBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: '900', fontSize: '0.8rem' }}>Q{qIndex + 1}</span>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qIndex)} style={{ ...S.btn('#ff4444'), padding: '4px 8px', fontSize: '0.7rem' }}>REMOVE</button>
                )}
              </div>

              <input
                placeholder={`Question ${qIndex + 1}`}
                value={q.question}
                onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                style={S.input}
              />

              <label style={{ ...S.label, marginTop: '8px' }}>OPTIONS (select correct answer):</label>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <input
                    type="radio"
                    name={`correct_${qIndex}`}
                    checked={q.correct === oIndex}
                    onChange={() => updateQuestion(qIndex, 'correct', oIndex)}
                    style={{ cursor: 'pointer', accentColor: '#00ff2f' }}
                  />
                  <input
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                    style={{ ...S.input, marginBottom: 0, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={addQuestion} style={S.btn('#333')}>+ ADD QUESTION</button>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn('#00ff2f'), flex: 1 }}>
            {saving ? 'SAVING...' : '✅ SAVE QUIZ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;