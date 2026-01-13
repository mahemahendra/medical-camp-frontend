import React, { ReactNode } from 'react';

// Base table styles
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
};

const headerStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderBottom: '2px solid var(--color-border)',
  textAlign: 'left',
  padding: '1rem',
  fontWeight: '600'
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid var(--color-border)'
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)'
};

// Table wrapper component
interface TableProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

export const Table: React.FC<TableProps> = ({ 
  children, 
  className,
  style,
  responsive = true 
}) => {
  const tableElement = (
    <table 
      className={className}
      style={{ ...tableStyle, ...style }}
    >
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div style={{ overflowX: 'auto' }}>
        {tableElement}
      </div>
    );
  }

  return tableElement;
};

// Table header component
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ 
  children, 
  className,
  style 
}) => (
  <thead className={className} style={style}>
    {children}
  </thead>
);

// Table body component
interface TableBodyProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TableBody: React.FC<TableBodyProps> = ({ 
  children, 
  className,
  style 
}) => (
  <tbody className={className} style={style}>
    {children}
  </tbody>
);

// Table row component
interface TableRowProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className,
  style,
  onClick,
  hoverable = false
}) => (
  <tr 
    className={className}
    style={{
      ...rowStyle,
      ...(hoverable && { 
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }),
      ...style
    }}
    onClick={onClick}
    onMouseEnter={hoverable ? (e) => {
      e.currentTarget.style.backgroundColor = '#f8fafc';
    } : undefined}
    onMouseLeave={hoverable ? (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    } : undefined}
  >
    {children}
  </tr>
);

// Table header cell component
interface TableHeaderCellProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  onSort?: () => void;
  width?: string | number;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className,
  style,
  align = 'left',
  sortable = false,
  onSort,
  width
}) => (
  <th 
    className={className}
    style={{
      ...headerStyle,
      textAlign: align,
      ...(sortable && { 
        cursor: 'pointer', 
        userSelect: 'none',
        position: 'relative'
      }),
      ...(width && { width }),
      ...style
    }}
    onClick={sortable ? onSort : undefined}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {children}
      {sortable && <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>↕</span>}
    </div>
  </th>
);

// Table cell component
interface TableCellProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  truncate?: boolean;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className,
  style,
  align = 'left',
  width,
  truncate = false,
  colSpan
}) => (
  <td 
    className={className}
    colSpan={colSpan}
    style={{
      ...cellStyle,
      textAlign: align,
      ...(width && { width }),
      ...(truncate && {
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }),
      ...style
    }}
  >
    {children}
  </td>
);

// Empty state component for tables
interface TableEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  colSpan?: number;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  colSpan = 8
}) => (
  <TableRow>
    <TableCell 
      colSpan={colSpan}
      style={{ 
        textAlign: 'center', 
        padding: '3rem 1rem',
        color: 'var(--color-text-secondary)'
      }}
    >
      <div>
        {icon && <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>}
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{title}</h3>
        {description && <p style={{ margin: '0 0 1rem 0' }}>{description}</p>}
        {action}
      </div>
    </TableCell>
  </TableRow>
);

// Table loading state
interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({ 
  rows = 5, 
  columns = 6 
}) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <TableCell key={colIndex}>
            <div 
              style={{
                height: '20px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px'
              }}
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
    <style>{`
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </>
);

// Compact table variant for dense data
interface CompactTableProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CompactTable: React.FC<CompactTableProps> = ({ 
  children, 
  className,
  style 
}) => (
  <Table 
    className={className}
    style={{
      fontSize: '0.875rem',
      ...style
    }}
  >
    {children}
  </Table>
);