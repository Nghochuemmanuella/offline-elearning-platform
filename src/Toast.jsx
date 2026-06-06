/**
 * EduBridge — Toast.jsx
 * ─────────────────────
 * Drop-in global notification system. Replaces all alert() and window.confirm() calls.
 *
 * EXPORTS:
 *   ToastProvider   — wrap your app once in App.jsx
 *   useToast        — { showToast } for success / error / warning / info
 *   useConfirm      — { showConfirm } returns a Promise<boolean>, replaces window.confirm()
 *
 * USAGE — showToast:
 *   const { showToast } = useToast();
 *   showToast('✅ Module saved!');                        // default: success
 *   showToast('❌ Something went wrong.', 'error');
 *   showToast('⚠️ Check your input.', 'warning');
 *   showToast('ℹ️ Note something.', 'info');
 *
 * USAGE — showConfirm:
 *   const { showConfirm } = useConfirm();
 *   const yes = await showConfirm('Delete this module?');
 *   if (yes) { ... }
 *
 *   // With custom button labels:
 *   const yes = await showConfirm('Exit EduBridge?', { confirm: 'EXIT', cancel: 'STAY' });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── CSS injected once ────────────────────────────────────────────────────────
const TOAST_CSS = `
@keyframes eb-slideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes eb-fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
@keyframes eb-modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}
@keyframes eb-overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

function injectCSS() {
  if (document.getElementById('eb-toast-css')) return;
  const style = document.createElement('style');
  style.id = 'eb-toast-css';
  style.textContent = TOAST_CSS;
  document.head.appendChild(style);
}

// ─── Colour map ───────────────────────────────────────────────────────────────
const VARIANTS = {
  success: {
    border: '#00ff2f',
    icon: '✓',
    iconBg: '#00ff2f',
    iconColor: '#000',
    barColor: '#00ff2f',
  },
  error: {
    border: '#ff4444',
    icon: '✕',
    iconBg: '#ff4444',
    iconColor: '#fff',
    barColor: '#ff4444',
  },
  warning: {
    border: '#ffaa00',
    icon: '⚠',
    iconBg: '#ffaa00',
    iconColor: '#000',
    barColor: '#ffaa00',
  },
  info: {
    border: 'rgba(255,255,255,0.25)',
    icon: 'i',
    iconBg: 'rgba(255,255,255,0.15)',
    iconColor: '#fff',
    barColor: 'rgba(255,255,255,0.3)',
  },
};

// ─── Contexts ─────────────────────────────────────────────────────────────────
const ToastContext   = createContext(null);
const ConfirmContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  injectCSS();

  // ── Toast state ──
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, dying: false }]);
    // Start fade-out 400ms before removal
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, dying: true } : t));
    }, duration - 400);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // ── Confirm state ──
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({ message, options });
    });
  }, []);

  const handleConfirm = (answer) => {
    setConfirmState(null);
    resolveRef.current?.(answer);
    resolveRef.current = null;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ConfirmContext.Provider value={{ showConfirm }}>
        {children}

        {/* ── Toast stack ── */}
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          maxWidth: '360px',
          width: 'calc(100vw - 48px)',
        }}>
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>

        {/* ── Confirm modal ── */}
        {confirmState && (
          <ConfirmModal
            message={confirmState.message}
            options={confirmState.options}
            onAnswer={handleConfirm}
          />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

// ─── Toast item ───────────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const v = VARIANTS[toast.type] || VARIANTS.success;

  return (
    <div
      onClick={onDismiss}
      style={{
        pointerEvents: 'all',
        cursor: 'pointer',
        background: '#0a0a0a',
        border: `1px solid ${v.border}30`,
        borderLeft: `3px solid ${v.border}`,
        borderRadius: '12px',
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${v.border}15`,
        fontFamily: 'monospace',
        animation: toast.dying
          ? 'eb-fadeOut 0.35s ease forwards'
          : 'eb-slideUp 0.3s ease forwards',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: v.iconBg,
        color: v.iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: '900',
        flexShrink: 0,
        marginTop: '1px',
      }}>
        {v.icon}
      </div>

      {/* Message */}
      <span style={{
        color: '#e8e8e8',
        fontSize: '0.82rem',
        lineHeight: 1.5,
        letterSpacing: '0.2px',
        flex: 1,
      }}>
        {toast.message}
      </span>

      {/* Dismiss hint */}
      <span style={{
        color: '#444',
        fontSize: '0.65rem',
        flexShrink: 0,
        marginTop: '3px',
      }}>✕</span>

      {/* Bottom progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        width: '100%',
        background: `${v.barColor}20`,
      }}>
        <div style={{
          height: '100%',
          background: v.barColor,
          animation: `eb-fadeOut 3.5s linear forwards`,
          width: '100%',
          transformOrigin: 'left',
        }} />
      </div>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, options = {}, onAnswer }) {
  const confirmLabel = options.confirm || 'CONFIRM';
  const cancelLabel  = options.cancel  || 'CANCEL';
  const danger       = options.danger  !== false; // default true = red confirm btn

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(4px)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'eb-overlayIn 0.2s ease',
    }}>
      <div style={{
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '28px 28px 24px',
        maxWidth: '380px',
        width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        fontFamily: 'monospace',
        animation: 'eb-modalIn 0.25s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(255,68,68,0.12)',
          border: '1px solid rgba(255,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          marginBottom: '16px',
        }}>
          ⚠️
        </div>

        {/* Message */}
        <p style={{
          color: '#e0e0e0',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          margin: '0 0 24px',
          fontWeight: '700',
          letterSpacing: '0.2px',
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Cancel */}
          <button
            onClick={() => onAnswer(false)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              color: '#888',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              fontFamily: 'monospace',
              fontWeight: '700',
              fontSize: '0.78rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#888'; }}
          >
            {cancelLabel}
          </button>

          {/* Confirm */}
          <button
            onClick={() => onAnswer(true)}
            style={{
              flex: 1,
              padding: '12px',
              background: danger ? '#ff4444' : '#00ff2f',
              color: danger ? '#fff' : '#000',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'monospace',
              fontWeight: '900',
              fontSize: '0.78rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: danger
                ? '0 4px 16px rgba(255,68,68,0.3)'
                : '0 4px 16px rgba(0,255,47,0.2)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ToastProvider>');
  return ctx;
}
