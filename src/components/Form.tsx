import React, { forwardRef, ReactNode } from 'react';

// Base input styles
const baseInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: '#334155',
  fontSize: '0.875rem'
};

const errorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '0.25rem'
};

// Label component
interface LabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Label: React.FC<LabelProps> = ({ 
  htmlFor, 
  required = false, 
  children, 
  className,
  style 
}) => (
  <label 
    htmlFor={htmlFor} 
    className={className}
    style={{ ...labelStyle, ...style }}
  >
    {children}
    {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
  </label>
);

// Input component
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'rounded';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  error, 
  size = 'md', 
  variant = 'default',
  style,
  ...props 
}, ref) => {
  const sizeStyles = {
    sm: { padding: '0.5rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1rem', fontSize: '1rem' },
    lg: { padding: '1rem', fontSize: '1.125rem' }
  };

  const variantStyles = {
    default: { borderRadius: '8px' },
    rounded: { borderRadius: '10px' }
  };

  return (
    <div>
      <input
        ref={ref}
        style={{
          ...baseInputStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...(error && { borderColor: '#ef4444' }),
          ...style
        }}
        {...props}
      />
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
});

Input.displayName = 'Input';

// TextArea component
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  variant?: 'default' | 'rounded';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ 
  error, 
  variant = 'default',
  style,
  ...props 
}, ref) => {
  const variantStyles = {
    default: { borderRadius: '8px' },
    rounded: { borderRadius: '10px' }
  };

  return (
    <div>
      <textarea
        ref={ref}
        style={{
          ...baseInputStyle,
          ...variantStyles[variant],
          resize: 'vertical',
          minHeight: '80px',
          ...(error && { borderColor: '#ef4444' }),
          ...style
        }}
        {...props}
      />
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
});

TextArea.displayName = 'TextArea';

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  variant?: 'default' | 'rounded';
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ 
  error, 
  variant = 'default',
  options = [],
  children,
  style,
  ...props 
}, ref) => {
  const variantStyles = {
    default: { borderRadius: '8px' },
    rounded: { borderRadius: '10px' }
  };

  return (
    <div>
      <select
        ref={ref}
        style={{
          ...baseInputStyle,
          ...variantStyles[variant],
          background: 'white',
          ...(error && { borderColor: '#ef4444' }),
          ...style
        }}
        {...props}
      >
        {options.length > 0 
          ? options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children
        }
      </select>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
});

Select.displayName = 'Select';

// FormField wrapper component
interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  className,
  style
}) => (
  <div 
    className={className}
    style={{ marginBottom: '1.25rem', ...style }}
  >
    {label && (
      <Label required={required}>
        {label}
      </Label>
    )}
    {children}
    {error && <div style={errorStyle}>{error}</div>}
  </div>
);

// FormGroup for inline fields
interface FormGroupProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  columns = 2,
  gap = '1rem',
  className,
  style
}) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
      ...style
    }}
  >
    {children}
  </div>
);