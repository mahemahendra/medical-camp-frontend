import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export interface AlertModalProps {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export function AlertModal({
  show,
  title,
  message,
  type,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose
}: AlertModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Allow animation to complete
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleClose();
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  if (!show) return null;

  const getIcon = () => {
    const icons = {
      success: { emoji: '✓', color: '#059669' },
      error: { emoji: '✕', color: '#dc2626' },
      warning: { emoji: '⚠', color: '#d97706' },
      info: { emoji: 'ℹ', color: '#2563eb' },
      confirm: { emoji: '?', color: '#7c3aed' }
    };
    return icons[type];
  };

  const getHeaderColor = () => {
    const colors = {
      success: '#d1fae5',
      error: '#fee2e2',
      warning: '#fef3c7',
      info: '#dbeafe',
      confirm: '#f3f4f6'
    };
    return colors[type];
  };

  const icon = getIcon();
  const isConfirmType = type === 'confirm';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.15s ease',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: getHeaderColor(),
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: icon.color,
              fontWeight: 'bold',
              flexShrink: 0
            }}
          >
            {icon.emoji}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                lineHeight: 1.3
              }}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <p
            style={{
              margin: 0,
              color: '#374151',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '1rem 1.5rem 1.5rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}
        >
          {isConfirmType && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              size="sm"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === 'error' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useAlert() {
  const [alertState, setAlertState] = useState<AlertModalProps | null>(null);

  const showAlert = (props: Omit<AlertModalProps, 'show' | 'onClose'>) => {
    setAlertState({
      ...props,
      show: true,
      onClose: () => setAlertState(null)
    });
  };

  const AlertComponent = alertState ? (
    <AlertModal {...alertState} />
  ) : null;

  return { showAlert, AlertComponent };
}