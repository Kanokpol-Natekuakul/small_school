import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number, isMobile: boolean): (number | '...')[] {
  const maxVisible = isMobile ? 3 : 7;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const sideCount = isMobile ? 0 : 1;

  // Always show first page
  pages.push(1);

  const leftBound = Math.max(2, currentPage - sideCount);
  const rightBound = Math.min(totalPages - 1, currentPage + sideCount);

  if (leftBound > 2) {
    pages.push('...');
  }

  for (let i = leftBound; i <= rightBound; i++) {
    pages.push(i);
  }

  if (rightBound < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const desktopPages = getPageNumbers(currentPage, totalPages, false);
  const mobilePages = getPageNumbers(currentPage, totalPages, true);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Left section: info text + items per page */}
      <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
        <span data-testid="pagination-info">
          แสดง {startItem}-{endItem} จาก {totalItems} รายการ
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">แสดง</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
              data-testid="items-per-page-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">รายการ/หน้า</span>
          </div>
        )}
      </div>

      {/* Right section: page navigation */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="ก่อนหน้า"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </button>

        {/* Desktop Page Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {desktopPages.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-xs text-slate-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[2rem] px-2 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-500'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                aria-label={`หน้า ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Mobile Page Buttons */}
        <div className="flex sm:hidden items-center gap-1">
          {mobilePages.map((page, index) =>
            page === '...' ? (
              <span key={`m-ellipsis-${index}`} className="px-1.5 py-1 text-xs text-slate-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[2rem] px-2 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-500'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                aria-label={`หน้า ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="ถัดไป"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
