import React, { ReactNode, useEffect } from 'react';

// Base modal overlay style
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  maxHeight: '90vh',
  overflowY: 'auto',
  width: '100%',
  maxWidth: '500px'
};

// Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  style?: React.CSSProperties;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  className,
  style,
  closeOnBackdropClick = true,
  closeOnEscape = true
}) => {
  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '500px' },
    lg: { maxWidth: '700px' },
    xl: { maxWidth: '900px' },
    full: { maxWidth: '95vw', height: '95vh' }
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={overlayStyle}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={className}
        style={{
          ...modalStyle,
          ...sizeStyles[size],
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Modal Header
interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  className,
  style
}) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      ...style
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
      <div>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    
    {onClose && (
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: '#64748b',
          padding: '0.25rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Close modal"
      >
        ×
      </button>
    )}
  </div>
);

// Modal Content
interface ModalContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
  style
}) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      ...style
    }}
  >
    {children}
  </div>
);

// Modal Footer
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  style,
  align = 'right'
}) => {
  const alignStyles = {
    left: { justifyContent: 'flex-start' },
    center: { justifyContent: 'center' },
    right: { justifyContent: 'flex-end' },
    'space-between': { justifyContent: 'space-between' }
  };

  return (
    <div
      className={className}
      style={{
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '1rem',
        ...alignStyles[align],
        ...style
      }}
    >
      {children}
    </div>
  );
};

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  className?: string;
  style?: React.CSSProperties;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  className,
  style
}) => {
  const variantStyles = {
    danger: { color: '#dc2626', icon: '⚠️' },
    warning: { color: '#d97706', icon: '🚨' },
    info: { color: '#2563eb', icon: 'ℹ️' }
  };

  const variantStyle = variantStyles[variant];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm"
      className={className}
      style={style}
    >
      <ModalHeader 
        title={title} 
        icon={variantStyle.icon}
        onClose={onClose} 
      />
      <ModalContent>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {message}
        </p>
      </ModalContent>
      <ModalFooter>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            background: variantStyle.color,
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

// Loading Modal
interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = 'Loading...',
  className,
  style
}) => (
  <Modal 
    isOpen={isOpen} 
    onClose={() => {}} 
    size="sm"
    closeOnBackdropClick={false}
    closeOnEscape={false}
    className={className}
    style={style}
  >
    <ModalContent>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}
        />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ModalContent>
  </Modal>
);

// Success Modal
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Success!',
  message,
  actionText = 'OK',
  onAction,
  className,
  style
}) => (
  <Modal 
    isOpen={isOpen} 
    onClose={onClose} 
    size="sm"
    className={className}
    style={style}
  >
    <ModalHeader 
      title={title} 
      icon="✅"
      onClose={onClose} 
    />
    <ModalContent>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {message}
      </p>
    </ModalContent>
    <ModalFooter>
      <button
        onClick={onAction || onClose}
        style={{
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '6px',
          background: '#059669',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        {actionText}
      </button>
    </ModalFooter>
  </Modal>
);