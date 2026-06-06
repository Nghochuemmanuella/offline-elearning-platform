import React, { useState, useEffect } from 'react';
import localDB from './db';

function QuizResults({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const allDocs = await localDB.allDocs({ include_docs: true });
        const docs = allDocs.rows.map(r => r.doc);

        const myResults = docs
          .filter(d => d.type === 'quiz_result' && d.userId === user.email)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        setResults(myResults);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
      }
      setLoading(false);
    };

    fetchResults();
    const listener = localDB.changes({ since: 'now', live: true, include_docs: true })
      .on('change', fetchResults);
    return () => listener.cancel();
  }, [user]);

  // ── Summary stats ──
  const totalTaken  = results.length;
  const totalPassed = results.filter(r => r.passed).length;
  const avgScore    = totalTaken > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalTaken)
    : 0;

  if (loading) return (
    <div style={{
      padding: '40px', textAlign: 'center',
      fontFamily: 'monospace', color: '#aaa',
    }}>
      Loading results...
    </div>
  );

  return (
    <div style={{
      padding: '24px',
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '0 auto',
      background: '#f4f6f8',
      minHeight: '100vh',
    }}>

      {/* ── Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,255,47,0.1)',
      }}>
        <h2 style={{
          margin: '0 0 20px',
          color: '#00ff2f',
          fontWeight: '900',
          fontSize: '1.1rem',
          letterSpacing: '1px',
        }}>
          🏆 MY QUIZ RESULTS
        </h2>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}>
          {[
            { label: 'QUIZZES TAKEN', value: totalTaken },
            { label: 'PASSED',        value: totalPassed },
            { label: 'AVG SCORE',     value: `${avgScore}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '14px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '0.58rem',
                color: '#666',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>
                {label}
              </div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: '900',
                color: '#00ff2f',
                lineHeight: 1,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Results list ── */}
      {results.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '2px dashed #e0e0e0',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📝</div>
          <div style={{
            fontWeight: '900', fontSize: '1rem',
            color: '#333', marginBottom: '8px',
          }}>
            No quiz results yet
          </div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
            Complete a module quiz to see your results here.
          </div>
        </div>
      ) : (
        results.map((r, i) => (
          <div key={r._id} style={{
            background: '#fff',
            borderRadius: '14px',
            marginBottom: '12px',
            overflow: 'hidden',
            border: `1px solid ${r.passed ? 'rgba(0,255,47,0.25)' : 'rgba(255,68,68,0.2)'}`,
            boxShadow: r.passed
              ? '0 4px 20px rgba(0,255,47,0.08)'
              : '0 4px 20px rgba(255,68,68,0.06)',
            animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both`,
          }}>

            {/* Card top strip */}
            <div style={{
              background: r.passed
                ? 'linear-gradient(135deg, #0a0a0a, #1a1a1a)'
                : 'linear-gradient(135deg, #1a0a0a, #2a1010)',
              padding: '10px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '700',
                letterSpacing: '1px',
                color: r.passed ? '#00ff2f' : '#ff4444',
              }}>
                {r.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
              <span style={{
                fontSize: '0.62rem',
                color: '#555',
                letterSpacing: '0.5px',
              }}>
                {new Date(r.completedAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </span>
            </div>

            {/* Card body */}
            <div style={{ padding: '16px 18px' }}>
              {/* Module name */}
              <div style={{
                fontWeight: '900',
                fontSize: '0.95rem',
                color: '#111',
                marginBottom: '12px',
              }}>
                📘 {r.lessonTitle || r.lessonId}
              </div>

              {/* Score + correct row */}
              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {/* Score pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: r.passed ? 'rgba(0,255,47,0.07)' : 'rgba(255,68,68,0.07)',
                  border: `1px solid ${r.passed ? 'rgba(0,255,47,0.2)' : 'rgba(255,68,68,0.2)'}`,
                  borderRadius: '10px',
                  padding: '10px 16px',
                  flex: '0 0 auto',
                }}>
                  <span style={{
                    fontSize: '1.8rem',
                    fontWeight: '900',
                    color: r.passed ? '#00aa1f' : '#ff4444',
                    lineHeight: 1,
                  }}>
                    {r.score}%
                  </span>
                  <div style={{ fontSize: '0.62rem', color: '#aaa', lineHeight: 1.5 }}>
                    <div>SCORE</div>
                    <div style={{ color: r.passed ? '#00aa1f' : '#ff4444', fontWeight: '700' }}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                </div>

                {/* Correct answers pill */}
                <div style={{
                  background: '#f8f8f8',
                  border: '1px solid #e8e8e8',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  flex: '0 0 auto',
                }}>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#333',
                    lineHeight: 1,
                  }}>
                    {r.correct}<span style={{ fontSize: '0.9rem', color: '#aaa' }}>/{r.total}</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#aaa', marginTop: '2px' }}>
                    CORRECT
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <div style={{
                    fontSize: '0.58rem',
                    color: '#aaa',
                    letterSpacing: '1px',
                    marginBottom: '6px',
                  }}>
                    ACCURACY
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#f0f0f0',
                    borderRadius: '99px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${r.score}%`,
                      height: '100%',
                      background: r.passed
                        ? 'linear-gradient(90deg, #00cc25, #00ff2f)'
                        : 'linear-gradient(90deg, #cc2200, #ff4444)',
                      borderRadius: '99px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default QuizResults;
