import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op implementation instead of throwing
    console.warn('useToast called outside ToastProvider, using no-op implementation');
    return {
      addToast: () => {},
      removeToast: () => {}
    };
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 300); // Allow animation to complete
    }, (toast.duration || 5000) - 300);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, onRemove]);

  const getToastStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: '1rem 1.25rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isLeaving ? 'translateX(100%)' : 'translateX(0)',
      opacity: isLeaving ? 0 : 1,
      maxWidth: '100%',
      wordBreak: 'break-word'
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: '1px solid #6ee7b7',
        color: '#065f46'
      },
      error: {
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        border: '1px solid #f87171',
        color: '#991b1b'
      },
      warning: {
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '1px solid #f59e0b',
        color: '#92400e'
      },
      info: {
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        border: '1px solid #60a5fa',
        color: '#1e40af'
      }
    };

    return { ...baseStyles, ...typeStyles[toast.type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[toast.type];
  };

  return (
    <div
      style={getToastStyles()}
      onClick={() => onRemove(toast.id)}
    >
      <div style={{
        fontSize: '1.25rem',
        flexShrink: 0,
        lineHeight: 1
      }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.875rem',
          marginBottom: toast.message ? '0.25rem' : 0,
          lineHeight: 1.4
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.8,
            lineHeight: 1.3
          }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          opacity: 0.6,
          lineHeight: 1,
          padding: 0,
          color: 'inherit'
        }}
      >
        ×
      </button>
    </div>
  );
}