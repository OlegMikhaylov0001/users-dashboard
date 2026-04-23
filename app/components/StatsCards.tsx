"use client";

import { useState } from "react";
import { statPct, type computeStats } from "../hooks/useDashboard";

type Stats = ReturnType<typeof computeStats>;

const STAT_CONFIGS = [
  { key: "total",      label: "Total",      color: "text-zinc-900 dark:text-zinc-100",    large: true  },
  { key: "admins",     label: "Admins",     color: "text-[#A32D2D] dark:text-red-400",    large: true  },
  { key: "moderators", label: "Moderators", color: "text-[#854F0B] dark:text-amber-400",  large: true  },
  { key: "avgAge",     label: "Avg age",    color: "text-zinc-900 dark:text-zinc-100",    large: true  },
  { key: "topDept",    label: "Top dept",   color: "text-[#185FA5] dark:text-blue-400",   large: false },
  { key: "gender",     label: "Gender",     color: "text-[#7C3AED] dark:text-violet-400", large: false },
] as const;

function formatValue(key: (typeof STAT_CONFIGS)[number]["key"], stats: Stats): string {
  switch (key) {
    case "topDept": return stats.topDept.length > 12 ? stats.topDept.slice(0, 11) + "…" : stats.topDept;
    case "gender":  return `${stats.femalePct}F · ${100 - stats.femalePct}M`;
    default:        return String(stats[key]);
  }
}

function formatSub(key: (typeof STAT_CONFIGS)[number]["key"], stats: Stats): string | null {
  if (key === "admins")     return statPct(stats.admins, stats.total);
  if (key === "moderators") return statPct(stats.moderators, stats.total);
  if (key === "avgAge")     return "years";
  if (key === "gender")     return "% balance";
  return null;
}

// ── component ─────────────────────────────────────────────────────────────────

export function StatsCards({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState(false);

  const topDeptShort = stats.topDept.length > 10 ? stats.topDept.slice(0, 9) + "…" : stats.topDept;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 shrink-0">

      {/* ── Mobile summary bar (toggle) — hidden on sm+ ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
            {stats.total}
          </span>
          <span className="text-[13px] text-zinc-400">users</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="text-[13px] text-[#185FA5] dark:text-blue-400 truncate">{topDeptShort}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="text-[13px] text-[#7C3AED] dark:text-violet-400 shrink-0">
            {stats.femalePct}F {100 - stats.femalePct}M
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* ── Full stats grid ──
          Mobile:  hidden by default, visible when open
          sm+:     always visible (sm:grid overrides hidden)                  ── */}
      <div className={`${open ? "grid" : "hidden"} sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-200 dark:bg-zinc-800`}>
        {STAT_CONFIGS.map(({ key, label, color, large }) => {
          const sub = formatSub(key, stats);
          return (
            <div key={key} className="bg-white dark:bg-zinc-900 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                {label}
              </p>
              <p className={`font-semibold leading-tight ${color} ${large ? "text-[22px]" : "text-[15px] mt-1"}`}>
                {formatValue(key, stats)}
              </p>
              {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
