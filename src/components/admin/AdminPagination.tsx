'use client';

import React from 'react';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
}

/** 1 … 4 5 [6] 7 8 … 20 — always keeps first/last page and a window around the current one. */
function buildPageList(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach(p => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 1, pageCount - 2, pageCount - 3].forEach(p => pages.add(p));
  const sorted = [...pages].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
  isLoading = false,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(total, current * pageSize);

  return (
    <div className="admin-pagination" aria-busy={isLoading}>
      <div className="admin-pagination-info">
        <b>{first}–{last}</b> / {total.toLocaleString()} ჩეკი
      </div>

      <div className="admin-pagination-pages" role="navigation" aria-label="გვერდები">
        <button
          type="button"
          className="admin-page-btn"
          disabled={current <= 1 || isLoading}
          onClick={() => onPageChange(current - 1)}
          aria-label="წინა გვერდი"
        >
          ‹
        </button>
        {buildPageList(current, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="admin-page-gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`admin-page-btn ${p === current ? 'active' : ''}`}
              disabled={isLoading}
              onClick={() => onPageChange(p)}
              aria-current={p === current ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="admin-page-btn"
          disabled={current >= pageCount || isLoading}
          onClick={() => onPageChange(current + 1)}
          aria-label="შემდეგი გვერდი"
        >
          ›
        </button>
      </div>

      <label className="admin-pagination-size">
        <span>ჩვენება:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="admin-select-input"
        >
          {pageSizeOptions.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );
};
