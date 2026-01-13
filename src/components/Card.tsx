import React, { ReactNode } from 'react';

// Base card styles
const baseCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden'
};

// Card component
interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: boolean | string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  style,
  padding = true,
  hoverable = false,
  onClick
}) => (
  <div
    className={className}
    style={{
      ...baseCardStyle,
      ...(padding && { 
        padding: typeof padding === 'string' ? padding : 'var(--spacing-lg)' 
      }),
      ...(hoverable && {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s'
      }),
      ...(onClick && { cursor: 'pointer' }),
      ...style
    }}
    onClick={onClick}
    onMouseEnter={hoverable ? (e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    } : undefined}
    onMouseLeave={hoverable ? (e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    } : undefined}
  >
    {children}
  </div>
);

// Card Header
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className,
  style
}) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      ...style
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
      <div>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {title}
        </h3>
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
    {actions && <div>{actions}</div>}
  </div>
);

// Card Content
interface CardContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardContent: React.FC<CardContentProps> = ({
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

// Card Footer
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  style
}) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderTop: '1px solid var(--color-border)',
      background: '#f9fafb',
      ...style
    }}
  >
    {children}
  </div>
);

// Stat Card for displaying metrics
interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: string;
  change?: {
    value: number | string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color = '#2563eb',
  icon,
  change,
  className,
  style
}) => (
  <Card
    className={className}
    style={{
      textAlign: 'center',
      padding: '1.5rem',
      ...style
    }}
  >
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto'
      }}
    >
      {icon ? (
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      ) : (
        <div
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: color,
            borderRadius: '50%'
          }}
        />
      )}
    </div>
    
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
      {value}
    </div>
    
    <div style={{ 
      fontSize: '0.875rem', 
      color: 'var(--color-text-secondary)',
      fontWeight: '500'
    }}>
      {title}
    </div>
    
    {change && (
      <div style={{ 
        fontSize: '0.75rem', 
        marginTop: '0.5rem',
        color: change.type === 'increase' ? '#10b981' : 
               change.type === 'decrease' ? '#ef4444' : 'var(--color-text-secondary)'
      }}>
        {change.type === 'increase' && '↗ '}
        {change.type === 'decrease' && '↘ '}
        {change.value}
      </div>
    )}
  </Card>
);

// Info Card for displaying key-value information
interface InfoCardProps {
  title: string;
  data: Array<{
    label: string;
    value: string | number | ReactNode;
    highlight?: boolean;
  }>;
  icon?: string;
  actions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  data,
  icon,
  actions,
  className,
  style
}) => (
  <Card className={className} style={style} padding={false}>
    <CardHeader title={title} icon={icon} actions={actions} />
    <CardContent>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {data.map((item, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: index < data.length - 1 ? '1px solid #f1f5f9' : 'none'
            }}
          >
            <span style={{ 
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem'
            }}>
              {item.label}:
            </span>
            <span style={{ 
              fontWeight: item.highlight ? '600' : '500',
              color: item.highlight ? 'var(--color-primary)' : 'inherit'
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Section Card with background for grouping content
interface SectionCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  background?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  children,
  className,
  style,
  background = '#f8fafc'
}) => (
  <div
    className={className}
    style={{
      background,
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      ...style
    }}
  >
    <h3 style={{
      margin: '0 0 1rem 0',
      fontSize: '1rem',
      color: '#334155',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      {icon && <span>{icon}</span>}
      {title}
    </h3>
    {children}
  </div>
);

// Empty Card for placeholder states
interface EmptyCardProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyCard: React.FC<EmptyCardProps> = ({
  icon,
  title,
  description,
  action,
  className,
  style
}) => (
  <Card 
    className={className}
    style={{ 
      textAlign: 'center', 
      padding: '3rem 2rem',
      ...style 
    }}
  >
    {icon && <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>{icon}</div>}
    <h3 style={{ 
      margin: '0 0 0.5rem 0', 
      fontSize: '1.25rem',
      color: 'var(--color-text-secondary)'
    }}>
      {title}
    </h3>
    {description && (
      <p style={{ 
        margin: '0 0 1.5rem 0',
        color: 'var(--color-text-secondary)'
      }}>
        {description}
      </p>
    )}
    {action}
  </Card>
);