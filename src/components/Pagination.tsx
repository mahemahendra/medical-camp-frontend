import React, { ReactNode } from 'react';

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  className,
  style
}) => {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border)',
    borderRadius: '0.25rem',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s, color 0.2s'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--color-primary)',
    color: 'white',
    fontWeight: 'bold'
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#f5f5f5',
    cursor: 'not-allowed',
    color: '#999'
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center',
        margin: '2rem 0',
        ...style
      }}
    >
      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.25rem',
        flexWrap: 'wrap'
      }}>
        {/* First page button */}
        {showFirstLast && totalPages > maxVisiblePages && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
            title="First page"
          >
            ⟨⟨
          </button>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
          title="Previous page"
        >
          ← Previous
        </button>
        
        {/* Page numbers */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {visiblePages.map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: '0.5rem' }}
                >
                  {page}
                </span>
              );
            }
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={currentPage === page ? activeButtonStyle : buttonStyle}
                title={`Page ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
          title="Next page"
        >
          Next →
        </button>

        {/* Last page button */}
        {showFirstLast && totalPages > maxVisiblePages && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
            title="Last page"
          >
            ⟩⟩
          </button>
        )}
      </div>

      {/* Info text */}
      {showInfo && totalItems && itemsPerPage && (
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      )}
    </div>
  );
};

// Simple pagination for smaller components
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  style
}) => {
  if (totalPages <= 1) return null;

  const buttonStyle: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem'
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        ...style
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...buttonStyle,
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        ←
      </button>
      
      <span style={{ 
        fontSize: '0.875rem', 
        color: 'var(--color-text-secondary)' 
      }}>
        {currentPage} of {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...buttonStyle,
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        →
      </button>
    </div>
  );
};

// Page size selector
interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
  style?: React.CSSProperties;
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100],
  className,
  style
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: 'var(--color-text-secondary)',
      ...style
    }}
  >
    <span>Show</span>
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      style={{
        padding: '0.25rem 0.5rem',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        background: 'white',
        fontSize: 'inherit'
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <span>per page</span>
  </div>
);

// Complete pagination with page size selector
interface CompletePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  style?: React.CSSProperties;
}

export const CompletePagination: React.FC<CompletePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  className,
  style
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      ...style
    }}
  >
    <PageSizeSelector
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      options={pageSizeOptions}
    />
    
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      totalItems={totalItems}
      itemsPerPage={pageSize}
      style={{ margin: 0 }}
    />
  </div>
);