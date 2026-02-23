"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers to display (max 5 visible around current)
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-8 mb-4" aria-label="Pagination">
      {/* Pr\u00e9c\u00e9dent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--border-color)]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Pr&eacute;c.</span>
      </button>

      {/* Num\u00e9ros de page */}
      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-[var(--muted)]">
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-xl transition-colors ${
              page === currentPage
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--border-color)]"
      >
        <span className="hidden sm:inline">Suiv.</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
