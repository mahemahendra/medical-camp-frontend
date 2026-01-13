import React, { ReactNode } from 'react';

// Base badge styles
const baseBadgeStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.75rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem'
};

// Badge color variants
const badgeVariants = {
  success: {
    background: '#dcfce7',
    color: '#166534'
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e'
  },
  info: {
    background: '#dbeafe',
    color: '#1e40af'
  },
  primary: {
    background: '#e0f2fe',
    color: '#0369a1'
  },
  secondary: {
    background: '#f1f5f9',
    color: '#475569'
  },
  neutral: {
    background: '#f3f4f6',
    color: '#374151'
  }
};

// Status color mapping for medical camp statuses
const statusColors = {
  REGISTERED: { bg: '#fef3c7', color: '#92400e' }, // Yellow
  IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af' }, // Blue
  COMPLETED: { bg: '#dcfce7', color: '#166534' },   // Green
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },   // Red
  ACTIVE: { bg: '#dcfce7', color: '#166534' },      // Green
  INACTIVE: { bg: '#f1f5f9', color: '#475569' }     // Gray
};

// Generic Badge component
interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof badgeVariants;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  style
}) => {
  const sizeStyles = {
    sm: { padding: '0.125rem 0.375rem', fontSize: '0.6875rem' },
    md: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
    lg: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' }
  };

  return (
    <span
      className={className}
      style={{
        ...baseBadgeStyle,
        ...badgeVariants[variant],
        ...sizeStyles[size],
        ...style
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge for visit/user status
interface StatusBadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  style
}) => {
  const getStatusStyle = (status: string) => {
    const upperStatus = status.toUpperCase();
    return statusColors[upperStatus as keyof typeof statusColors] || statusColors.REGISTERED;
  };

  const statusStyle = getStatusStyle(status);

  return (
    <span
      className={className}
      style={{
        ...baseBadgeStyle,
        background: statusStyle.bg,
        color: statusStyle.color,
        ...style
      }}
    >
      {status}
    </span>
  );
};

// Priority Badge
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
  style?: React.CSSProperties;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className,
  style
}) => {
  const priorityStyles = {
    low: { bg: '#f0f9ff', color: '#0369a1', icon: '🔵' },
    medium: { bg: '#fef3c7', color: '#92400e', icon: '🟡' },
    high: { bg: '#fed7aa', color: '#c2410c', icon: '🟠' },
    urgent: { bg: '#fee2e2', color: '#991b1b', icon: '🔴' }
  };

  const priorityStyle = priorityStyles[priority];

  return (
    <span
      className={className}
      style={{
        ...baseBadgeStyle,
        background: priorityStyle.bg,
        color: priorityStyle.color,
        ...style
      }}
    >
      <span>{priorityStyle.icon}</span>
      {priority.toUpperCase()}
    </span>
  );
};

// Role Badge
interface RoleBadgeProps {
  role: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  className,
  style
}) => {
  const roleStyles = {
    ADMIN: { variant: 'error' as const, icon: '⚡' },
    CAMP_HEAD: { variant: 'primary' as const, icon: '👑' },
    DOCTOR: { variant: 'success' as const, icon: '👩‍⚕️' },
    VISITOR: { variant: 'neutral' as const, icon: '👤' }
  };

  const roleConfig = roleStyles[role.toUpperCase() as keyof typeof roleStyles] || 
                   { variant: 'neutral' as const, icon: '👤' };

  return (
    <Badge 
      variant={roleConfig.variant}
      icon={roleConfig.icon}
      className={className}
      style={style}
    >
      {role}
    </Badge>
  );
};

// Count Badge (for notifications, counts, etc.)
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: keyof typeof badgeVariants;
  className?: string;
  style?: React.CSSProperties;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'error',
  className,
  style
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();

  if (count === 0) return null;

  return (
    <Badge
      variant={variant}
      size="sm"
      className={className}
      style={{
        borderRadius: '50%',
        minWidth: '20px',
        height: '20px',
        padding: '0',
        justifyContent: 'center',
        ...style
      }}
    >
      {displayCount}
    </Badge>
  );
};

// Online/Offline Status Dot
interface StatusDotProps {
  online?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  online = false,
  size = 8,
  className,
  style
}) => (
  <span
    className={className}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: online ? '#10b981' : '#9ca3af',
      display: 'inline-block',
      ...style
    }}
    title={online ? 'Online' : 'Offline'}
  />
);

// Tag Badge for categories, labels, etc.
interface TagBadgeProps {
  children: ReactNode;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  children,
  color = '#6366f1',
  removable = false,
  onRemove,
  className,
  style
}) => (
  <span
    className={className}
    style={{
      ...baseBadgeStyle,
      background: `${color}15`,
      color: color,
      borderRadius: '12px',
      ...style
    }}
  >
    {children}
    {removable && (
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          marginLeft: '0.25rem',
          padding: 0,
          fontSize: '0.75rem'
        }}
      >
        ×
      </button>
    )}
  </span>
);

// Avatar Badge for profile pictures with status
interface AvatarBadgeProps {
  name: string;
  size?: number;
  online?: boolean;
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  name,
  size = 40,
  online,
  src,
  className,
  style
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            color: '#0369a1',
            fontWeight: 'bold'
          }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <StatusDot
          online={online}
          size={size * 0.25}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            border: '2px solid white'
          }}
        />
      )}
    </div>
  );
};