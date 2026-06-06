import React, { useState, useEffect } from 'react';
import localDB from './db';
import { useToast } from './Toast';

const QuizTaker = ({ course, user, onClose, onComplete }) => {
  const { showToast } = useToast();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [previousResult, setPreviousResult] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Load quiz
        const quizDoc = await localDB.get(`quiz_${course._id || course.id}`);
        setQuiz(quizDoc);

        // Check if already taken
        const resultId = `quizresult_${user.email}_${course._id || course.id}`;
        try {
          const existing = await localDB.get(resultId);
          setAlreadyTaken(true);
          setPreviousResult(existing);
        } catch (e) {
          // Not taken yet
        }
      } catch (e) {
        setQuiz(null);
      }
      setLoading(false);
    };
    loadQuiz();
  }, [course, user]);

  const handleAnswer = (qIndex, oIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      showToast('Please answer all questions before submitting.', 'warning'); return;
    }

    // Calculate score
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });

    const scorePercent = Math.round((correct / quiz.questions.length) * 100);
    const hasPassed = scorePercent >= quiz.passmark;

    setScore(scorePercent);
    setPassed(hasPassed);
    setSubmitted(true);

    // Save result to PouchDB
    try {
      const resultId = `quizresult_${user.email}_${course._id || course.id}`;
      let existing = null;
      try { existing = await localDB.get(resultId); } catch (e) {}

      await localDB.put({
        _id: resultId,
        _rev: existing?._rev,
        type: 'quiz_result',
        userId: user.email,
        lessonId: course._id || course.id,
        lessonTitle: course.title,
        score: scorePercent,
        correct,
        total: quiz.questions.length,
        passed: hasPassed,
        completedAt: new Date().toISOString(),
      });

      if (hasPassed && onComplete) onComplete(course._id || course.id);
    } catch (err) {
      console.error('Error saving quiz result:', err);
    }
  };

  const S = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.92)', zIndex: 10001,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px',
    },
    modal: {
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '20px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      width: '100%', maxWidth: '600px',
      maxHeight: '90vh', overflowY: 'auto',
      fontFamily: 'monospace',
    },
    header: {
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)', color: '#00ff2f',
      padding: '18px 24px',
      borderBottom: '1px solid rgba(0,255,47,0.15)',
      borderRadius: '20px 20px 0 0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    body: { padding: '24px' },
    option: (selected) => ({
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', marginBottom: '10px',
      border: `1px solid ${selected ? '#0a0a0a' : '#e0e0e0'}`,
      borderRadius: '10px',
      background: selected ? '#0a0a0a' : '#fff',
      color: selected ? '#00ff2f' : '#000',
      cursor: 'pointer', fontFamily: 'monospace',
      fontWeight: selected ? '900' : '400',
      transition: 'all 0.15s ease',
      boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
    }),
    resultOption: (isCorrect, isSelected) => ({
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', marginBottom: '10px',
      border: `1px solid ${isCorrect ? '#00aa00' : isSelected ? '#ff4444' : '#e0e0e0'}`,
      borderRadius: '10px',
      background: isCorrect ? '#e8ffe8' : isSelected ? '#ffe8e8' : '#fff',
      color: '#000', fontFamily: 'monospace',
    }),
    btn: (color) => ({
      padding: '12px 24px',
      background: color || '#0a0a0a',
      color: color === '#00ff2f' ? '#000' : '#fff',
      border: 'none', borderRadius: '10px',
      fontFamily: 'monospace',
      fontWeight: '900', cursor: 'pointer',
      letterSpacing: '1px', fontSize: '0.85rem',
      transition: 'opacity 0.15s ease',
    }),
  };

  if (loading) return (
    <div style={S.overlay}>
      <div style={{ color: '#00ff2f', fontFamily: 'monospace', fontSize: '1.2rem' }}>LOADING QUIZ...</div>
    </div>
  );

  if (!quiz) return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={S.header}>
          <span>NO QUIZ AVAILABLE</span>
          <button onClick={onClose} style={S.btn('#ff4444')}>✕</button>
        </div>
        <div style={S.body}>
          <p style={{ color: '#666', fontSize: '0.85rem' }}>
            No quiz has been created for this module yet. Check back later!
          </p>
          <button onClick={onClose} style={{ ...S.btn('#000'), marginTop: '20px', width: '100%' }}>CLOSE</button>
        </div>
      </div>
    </div>
  );

  // Already taken screen
  if (alreadyTaken && !submitted) return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={S.header}>
          <span>QUIZ ALREADY TAKEN</span>
          <button onClick={onClose} style={S.btn('#ff4444')}>✕</button>
        </div>
        <div style={S.body}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
              {previousResult?.passed ? '🏆' : '📝'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: previousResult?.passed ? '#00aa00' : '#ff4444' }}>
              {previousResult?.score}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
              {previousResult?.correct}/{previousResult?.total} correct
            </div>
            <div style={{ marginTop: '10px', fontWeight: '900', color: previousResult?.passed ? '#00aa00' : '#ff4444' }}>
              {previousResult?.passed ? '✓ PASSED' : '✗ FAILED'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '8px' }}>
              Taken on: {new Date(previousResult?.completedAt).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => { setAlreadyTaken(false); setAnswers({}); setCurrentQ(0); }}
              style={{ ...S.btn('#333'), flex: 1 }}
            >
              RETAKE QUIZ
            </button>
            <button onClick={onClose} style={{ ...S.btn('#00ff2f'), flex: 1 }}>CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Results screen
  if (submitted) return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ ...S.header, background: passed ? '#000' : '#ff4444', borderBottom: `3px solid ${passed ? '#00ff2f' : '#fff'}` }}>
          <span>{passed ? '🏆 QUIZ PASSED!' : '📝 QUIZ COMPLETE'}</span>
          <button onClick={onClose} style={S.btn(passed ? '#ff4444' : '#000')}>✕</button>
        </div>
        <div style={S.body}>
          <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '2px solid #eee', marginBottom: '24px' }}>
            <div style={{ fontSize: '4rem', fontWeight: '900', color: passed ? '#00aa00' : '#ff4444', lineHeight: 1 }}>
              {score}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
              {Object.values(answers).filter((a, i) => a === quiz.questions[i]?.correct).length} of {quiz.questions.length} correct
            </div>
            <div style={{ marginTop: '12px', padding: '8px 20px', display: 'inline-block', background: passed ? '#0a0a0a' : '#ff4444', color: passed ? '#00ff2f' : '#fff', fontWeight: '900', letterSpacing: '2px', borderRadius: '20px' }}>
              {passed ? '✓ PASSED' : '✗ FAILED'} — PASS MARK: {quiz.passmark}%
            </div>
          </div>

          {/* Answer Review */}
          <h3 style={{ fontWeight: '900', marginBottom: '16px', fontSize: '0.85rem', letterSpacing: '1px' }}>ANSWER REVIEW:</h3>
          {quiz.questions.map((q, i) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '900', fontSize: '0.85rem', marginBottom: '8px' }}>
                Q{i + 1}: {q.question}
              </div>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} style={S.resultOption(oIndex === q.correct, oIndex === answers[i])}>
                  <span>{oIndex === q.correct ? '✓' : oIndex === answers[i] ? '✗' : '○'}</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {!passed && (
              <button
                onClick={() => { setSubmitted(false); setAnswers({}); setCurrentQ(0); }}
                style={{ ...S.btn('#333'), flex: 1 }}
              >
                RETRY
              </button>
            )}
            <button onClick={onClose} style={{ ...S.btn('#00ff2f'), flex: 1 }}>
              {passed ? '✓ DONE' : 'CLOSE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
 // Review screen
if (reviewing) return (
  <div style={S.overlay}>
    <div style={S.modal}>
      <div style={S.header}>
        <div>
          <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '1px' }}>{course.title}</div>
          <div style={{ fontWeight: '900' }}>REVIEW YOUR ANSWERS</div>
        </div>
        <button onClick={onClose} style={S.btn('#ff4444')}>✕</button>
      </div>
      <div style={S.body}>
        <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '20px', letterSpacing: '0.5px' }}>
          Check your answers below. Click any question to go back and change it.
        </p>

        {quiz.questions.map((q, i) => (
          <div
            key={i}
            onClick={() => { setCurrentQ(i); setReviewing(false); }}
            style={{
              marginBottom: '14px', padding: '14px 16px',
              border: answers[i] !== undefined ? '1px solid rgba(0,255,47,0.25)' : '1px solid #ff444440',
              borderLeft: answers[i] !== undefined ? '4px solid #00ff2f' : '4px solid #ff4444',
              borderRadius: '10px', cursor: 'pointer',
              background: answers[i] !== undefined ? 'rgba(0,255,47,0.03)' : 'rgba(255,68,68,0.03)',
            }}
          >
            <div style={{ fontWeight: '900', fontSize: '0.82rem', color: '#111', marginBottom: '6px' }}>
              Q{i + 1}: {q.question}
            </div>
            <div style={{ fontSize: '0.78rem', color: answers[i] !== undefined ? '#00aa1f' : '#ff4444', fontWeight: '700' }}>
              {answers[i] !== undefined
                ? `Your answer: ${['A','B','C','D'][answers[i]]}. ${q.options[answers[i]]}`
                : '⚠ Not answered yet — click to answer'}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setReviewing(false)}
            style={{ ...S.btn('#333'), flex: 1 }}
          >
            ← BACK TO QUIZ
          </button>
          <button
            onClick={() => {
              if (Object.keys(answers).length < quiz.questions.length) {
                showToast('Please answer all questions before submitting.', 'warning'); return;
              }
              setReviewing(false);
              handleSubmit();
            }}
            style={{ ...S.btn('#00ff2f'), flex: 1 }}
          >
            SUBMIT QUIZ ✓
          </button>
        </div>
      </div>
    </div>
  </div>
);
  // Quiz taking screen
  const question = quiz.questions[currentQ];
  const totalQ = quiz.questions.length;
  const progress = Math.round(((currentQ + 1) / totalQ) * 100);

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '1px' }}>{course.title}</div>
            <div style={{ fontWeight: '900' }}>QUESTION {currentQ + 1} OF {totalQ}</div>
          </div>
          <button onClick={onClose} style={S.btn('#ff4444')}>✕</button>
        </div>

        <div style={S.body}>
          {/* Progress */}
          <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '99px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#00ff2f', transition: 'width 0.3s' }} />
          </div>

          {/* Question */}
          <div style={{ fontWeight: '900', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.4 }}>
            {question.question}
          </div>

          {/* Options */}
          {question.options.map((opt, oIndex) => (
            <div
              key={oIndex}
              style={S.option(answers[currentQ] === oIndex)}
              onClick={() => handleAnswer(currentQ, oIndex)}
            >
              <span style={{ fontWeight: '900', minWidth: '20px' }}>
                {['A', 'B', 'C', 'D'][oIndex]}.
              </span>
              <span>{opt}</span>
            </div>
          ))}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(prev => prev - 1)} style={{ ...S.btn('#333'), flex: 1 }}>
                ← PREVIOUS
              </button>
            )}
            {currentQ < totalQ - 1 ? (
              <button
                onClick={() => {
                  if (answers[currentQ] === undefined) {
                   showToast('Please select an answer before continuing.', 'warning'); return;
                  }
                  setCurrentQ(prev => prev + 1);
                }}
                style={{ ...S.btn('#000'), flex: 1 }}
              >
                NEXT →
              </button>
          ) : (
  <button
    onClick={() => {
      if (answers[currentQ] === undefined) {
        showToast('Please select an answer before continuing.', 'warning'); return;
      }
      setReviewing(true);
    }}
    style={{ ...S.btn('#00ff2f'), flex: 1 }}
  >
    REVIEW ANSWERS →
  </button>
)} 
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;