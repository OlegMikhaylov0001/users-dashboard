import { ACCENT } from "../lib/palette";
import type { Filters } from "../hooks/useDashboard";

const SAVED_FILTERS = [
  { label: "Engineering", department: "Engineering" },
  { label: "HR team",     department: "Human Resources" },
  { label: "Services",    department: "Services" },
];

interface SidebarProps {
  totalUsers: number;
  filters: Filters;
  showCharts: boolean;
  onClear: () => void;
  onToggleCharts: () => void;
  onFilterRole: (role: string) => void;
  onApplyPreset: (department: string) => void;
  onClose: () => void;
}

export function Sidebar({
  totalUsers,
  filters,
  showCharts,
  onClear,
  onToggleCharts,
  onFilterRole,
  onApplyPreset,
  onClose,
}: SidebarProps) {
  return (
    <aside className="w-[220px] h-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col p-4 gap-4 overflow-y-auto">

      {/* Brand + mobile close */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: ACCENT }}
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12l4-8 4 8" /><path d="M10 8h4l-2-4z" />
          </svg>
        </div>
        <span className="text-sm font-medium flex-1">UserBase</span>
        {/* Close button — visible only on mobile */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <nav>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
          Main
        </p>
        <ul className="space-y-0.5">

          {/* All users */}
          <li>
            <button
              type="button"
              onClick={() => { onClear(); onClose(); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
              Users
              <span
                className="ml-auto text-[11px] text-white px-1.5 py-px rounded-full"
                style={{ background: ACCENT }}
              >
                {totalUsers}
              </span>
            </button>
          </li>

          {/* Charts toggle */}
          <li>
            <button
              type="button"
              onClick={onToggleCharts}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                showCharts
                  ? "text-[#185FA5] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 13V7M6 13V4M10 13V9M14 13V2" />
              </svg>
              Charts
              {showCharts && (
                <span className="ml-auto text-[11px] font-semibold text-[#185FA5] dark:text-blue-400">on</span>
              )}
            </button>
          </li>

          {/* Admins shortcut */}
          <li>
            <button
              type="button"
              onClick={() => { onFilterRole("admin"); onClose(); }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                filters.role === "admin"
                  ? "text-[#185FA5] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 14c0-2.2 2.7-4 6-4s6 1.8 6 4" />
              </svg>
              Admins
            </button>
          </li>
        </ul>
      </nav>

      {/* Saved filters */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
          Saved filters
        </p>
        <ul className="space-y-0.5">
          {SAVED_FILTERS.map(({ label, department }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => { onApplyPreset(department); onClose(); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                  filters.department === department
                    ? "text-[#185FA5] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M4 8h8M6 12h4" />
                </svg>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
