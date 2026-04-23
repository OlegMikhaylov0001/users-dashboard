interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const base = "w-7 h-7 flex items-center justify-center rounded-lg border text-[13px] transition-colors";
  const inactive = `${base} border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-30`;

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={inactive}>
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 2l-4 4 4 4" />
        </svg>
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-7 text-center text-[13px] text-zinc-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={
              p === page
                ? `${base} bg-[#185FA5] border-[#185FA5] text-white`
                : inactive
            }
          >
            {p}
          </button>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={inactive}>
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 2l4 4-4 4" />
        </svg>
      </button>
    </div>
  );
}
