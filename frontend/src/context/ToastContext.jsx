import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newToast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 5000),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const { type, message } = toast;

  let bgClass = 'bg-white border-slate-200 text-slate-800';
  let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

  if (type === 'success') {
    bgClass = 'bg-white border-emerald-200 text-slate-800 shadow-md';
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
  } else if (type === 'error') {
    bgClass = 'bg-white border-red-200 text-slate-800 shadow-md';
    icon = <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />;
  } else if (type === 'warning') {
    bgClass = 'bg-white border-amber-200 text-slate-800 shadow-md';
    icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
  } else if (type === 'info') {
    bgClass = 'bg-white border-blue-200 text-slate-800 shadow-md';
    icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
  }

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all transform ease-out duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgClass}`}
    >
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1 text-sm font-medium leading-snug">{message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
