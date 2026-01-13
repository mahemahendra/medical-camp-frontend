import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none'
  },
  secondary: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #e2e8f0'
  },
  success: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    border: 'none'
  },
  danger: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    border: 'none'
  },
  ghost: {
    background: 'transparent',
    color: '#334155',
    border: '1px solid #e2e8f0'
  },
  outline: {
    background: 'transparent',
    color: '#1e40af',
    border: '2px solid #1e40af'
  }
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    minHeight: '32px'
  },
  md: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    minHeight: '40px'
  },
  lg: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    minHeight: '48px'
  }
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon,
  className
}) => {
  const styles: React.CSSProperties = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    borderRadius: '8px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    boxShadow: variant === 'primary' || variant === 'success' || variant === 'danger'
      ? '0 2px 4px rgba(0,0,0,0.1)'
      : 'none'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={styles}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variant === 'primary' || variant === 'success' || variant === 'danger'
            ? '0 2px 4px rgba(0,0,0,0.1)'
            : 'none';
        }
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Icon Button for compact actions
interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  title?: string;
}

const iconSizes: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { width: '28px', height: '28px', fontSize: '0.875rem' },
  md: { width: '36px', height: '36px', fontSize: '1rem' },
  lg: { width: '44px', height: '44px', fontSize: '1.25rem' }
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  title
}) => {
  const getBackground = () => {
    switch (variant) {
      case 'primary': return '#3b82f6';
      case 'danger': return '#ef4444';
      default: return '#f1f5f9';
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return 'white';
      default:
        return '#334155';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...iconSizes[size],
        background: getBackground(),
        color: getColor(),
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {icon}
    </button>
  );
};

// Button Group for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  align = 'left'
}) => {
  const justifyContent = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
  }[align];

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      justifyContent
    }}>
      {children}
    </div>
  );
};
