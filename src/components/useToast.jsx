import React, { useState, useCallback } from 'react';

export const TOAST_CSS = `
.toast-container {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.toast {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  animation: toast-in 0.3s ease both;
  max-width: 380px;
  color: #fff;
  border-left: 4px solid;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
.toast--success { background: #1e3a2b; color: #5ddb8a; border-color: #28a745; }
.toast--error   { background: #3a1e1e; color: #ff6b6b; border-color: #dc3545; }
.toast--info    { background: #1e2c3a; color: #74b9ff; border-color: #0984e3; }
.toast--warning { background: #3a2e1e; color: #fdcb6e; border-color: #e17055; }
`;

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <i className={`fas ${
            t.type === 'success' ? 'fa-check-circle' :
            t.type === 'error'   ? 'fa-times-circle' :
            t.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
          }`}></i>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  
  const showToast = useCallback((msg, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return { toasts, showToast };
}
