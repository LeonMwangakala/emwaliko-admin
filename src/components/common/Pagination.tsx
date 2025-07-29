import React from 'react';
import { ChevronLeftIcon } from '../../icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
      {/* Items per page selector */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">entries</span>
        </div>
      )}

      {/* Items info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-l hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 text-sm border-t border-b border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white ${
                  currentPage === page
                    ? 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-r hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
        >
          <ChevronLeftIcon className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default Pagination; 