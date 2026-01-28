import React from 'react';

export type HeaderTheme = 'doctor' | 'camp-head' | 'admin';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  theme?: HeaderTheme;
  onBack?: () => void;
  actions?: React.ReactNode;
}

const themeColors: Record<HeaderTheme, { gradient: string; accent: string }> = {
  'doctor': {
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    accent: '#1e40af'
  },
  'camp-head': {
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    accent: '#059669'
  },
  'admin': {
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    accent: '#7c3aed'
  }
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  icon = '🏥',
  theme = 'doctor',
  onBack,
  actions
}) => {
  const colors = themeColors[theme];

  return (
    <header style={{
      background: colors.gradient,
      padding: '0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <HeaderButton onClick={onBack} variant="ghost" theme={theme}>
              ←
            </HeaderButton>
          )}
          <div style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>{
              (icon?.startsWith('http') || icon?.startsWith('/') || icon?.startsWith('data:')) ? (
                <img
                  src={icon}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                icon
              )
            }</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'white', fontWeight: '600' }}>{title}</h1>
            {subtitle && (
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.875rem' }}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

// Button variants
type ButtonVariant = 'primary' | 'ghost' | 'outline';

interface HeaderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  theme?: HeaderTheme;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  theme = 'doctor',
  type = 'button',
  disabled = false
}) => {
  const colors = themeColors[theme];

  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: '8px',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      opacity: disabled ? 0.6 : 1
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          background: 'white',
          color: colors.accent,
          border: 'none'
        };
      case 'ghost':
        return {
          ...base,
          background: 'rgba(255,255,255,0.15)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)'
        };
      case 'outline':
        return {
          ...base,
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.5)'
        };
      default:
        return base;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={getStyles()}
      onMouseOver={(e) => {
        if (!disabled && variant === 'ghost') {
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && variant === 'ghost') {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
        }
      }}
    >
      {children}
    </button>
  );
};

// Search Input for headers
interface HeaderSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  theme?: HeaderTheme;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  theme = 'doctor'
}) => {
  const colors = themeColors[theme];

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        style={{
          minWidth: '250px',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.95)',
          fontSize: '0.875rem'
        }}
      />
      <button
        onClick={onSearch}
        style={{
          background: 'white',
          color: colors.accent,
          border: 'none',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >🔍</button>
      {value && onClear && (
        <button
          onClick={onClear}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer'
          }}
        >✕</button>
      )}
    </div>
  );
};

// Page container with consistent background
interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
    {children}
  </div>
);

// Content container with max width
interface ContentContainerProps {
  children: React.ReactNode;
  padding?: string;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  padding = '1.5rem'
}) => (
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding }}>
    {children}
  </div>
);
