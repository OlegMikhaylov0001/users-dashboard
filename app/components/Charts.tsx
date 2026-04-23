"use client";

import { useContext } from "react";
import type { User } from "../types";
import { DarkCtx } from "./dark-ctx";

// ── Donut chart: role distribution ───────────────────────────────────────────

const ROLE_SEGMENTS = [
  { role: "admin",     label: "Admins",     light: "#A32D2D", dark: "#F87171" },
  { role: "moderator", label: "Moderators", light: "#854F0B", dark: "#FCD34D" },
  { role: "user",      label: "Users",      light: "#185FA5", dark: "#60A5FA" },
];

function pct(n: number, total: number) {
  return total ? `${Math.round((n / total) * 100)}%` : "0%";
}

export function RoleDonut({ users }: { users: User[] }) {
  const isDark = useContext(DarkCtx);
  const total = users.length;
  const data = ROLE_SEGMENTS.map((s) => ({
    ...s,
    count: users.filter((u) => u.role === s.role).length,
    color: isDark ? s.dark : s.light,
  }));

  if (!total) return <p className="text-[13px] text-zinc-400">No data</p>;

  const cx = 70, cy = 70, r = 62, ir = 40;
  let angle = -Math.PI / 2;

  const paths = data.map((d) => {
    const sweep = (d.count / total) * 2 * Math.PI;
    if (sweep < 0.001) return { ...d, path: "" };
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + sweep), iy2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
      `A ${ir} ${ir} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`,
    ].join(" ");
    angle += sweep;
    return { ...d, path };
  });

  const textFill = isDark ? "#f4f4f5" : "#18181b";
  const subFill = isDark ? "#71717a" : "#a1a1aa";

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-28 h-28 shrink-0">
        {paths.map((s) =>
          s.path ? <path key={s.role} d={s.path} fill={s.color} /> : null
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="600" fill={textFill}>
          {total}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill={subFill}>
          users
        </text>
      </svg>
      <div className="space-y-2.5 flex-1 min-w-0">
        {data.map((d) => (
          <div key={d.role} className="flex items-center gap-2 text-[13px]">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-zinc-500 dark:text-zinc-400">{d.label}</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 ml-auto">{d.count}</span>
            <span className="text-zinc-400 text-[12px] w-10 text-right shrink-0">
              {pct(d.count, total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Histogram: age distribution ───────────────────────────────────────────────

const AGE_BUCKETS = [
  { label: "18–25", min: 18, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36–45", min: 36, max: 45 },
  { label: "46–55", min: 46, max: 55 },
  { label: "56–65", min: 56, max: 65 },
  { label: "66+",   min: 66, max: 999 },
];

export function AgeHistogram({ users }: { users: User[] }) {
  const isDark = useContext(DarkCtx);
  const barColor = isDark ? "#60A5FA" : "#185FA5";
  const labelFill = isDark ? "#71717a" : "#a1a1aa";
  const countFill = isDark ? "#a1a1aa" : "#52525b";

  const counts = AGE_BUCKETS.map((b) => ({
    ...b,
    count: users.filter((u) => u.age >= b.min && u.age <= b.max).length,
  }));
  const maxC = Math.max(...counts.map((c) => c.count), 1);
  const W = 280, H = 96, pad = 8;
  const barW = (W - pad * 2) / counts.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
      {counts.map((c, i) => {
        const bH = (c.count / maxC) * H;
        const x = pad + i * barW + barW * 0.12;
        const w = barW * 0.76;
        return (
          <g key={c.label}>
            <rect x={x} y={H - bH} width={w} height={bH} fill={barColor} rx="3" opacity="0.85" />
            {c.count > 0 && (
              <text x={x + w / 2} y={H - bH - 3} textAnchor="middle" fontSize="9" fill={countFill}>
                {c.count}
              </text>
            )}
            <text x={x + w / 2} y={H + 13} textAnchor="middle" fontSize="9" fill={labelFill}>
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Horizontal bar: users by department ──────────────────────────────────────

export function DeptBar({ users, maxItems = 10 }: { users: User[]; maxItems?: number }) {
  const isDark = useContext(DarkCtx);
  const barColor = isDark ? "#60A5FA" : "#185FA5";
  const labelFill = isDark ? "#71717a" : "#71717a";
  const countFill = isDark ? "#a1a1aa" : "#52525b";

  const map = new Map<string, number>();
  users.forEach((u) =>
    map.set(u.company.department, (map.get(u.company.department) ?? 0) + 1)
  );
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxItems);
  const maxC = sorted[0]?.[1] ?? 1;
  const ROW = 24, LABEL_W = 112, W = 300;

  if (!sorted.length) return <p className="text-[13px] text-zinc-400">No data</p>;

  return (
    <svg
      viewBox={`0 0 ${W} ${sorted.length * ROW}`}
      className="w-full"
      style={{ height: sorted.length * ROW }}
    >
      {sorted.map(([dept, count], i) => {
        const barW = Math.max(2, (count / maxC) * (W - LABEL_W - 34));
        const label = dept.length > 14 ? dept.slice(0, 13) + "…" : dept;
        return (
          <g key={dept} transform={`translate(0, ${i * ROW})`}>
            <text x={LABEL_W - 6} y={15} textAnchor="end" fontSize="10" fill={labelFill}>
              {label}
            </text>
            <rect x={LABEL_W} y={5} width={barW} height={14} fill={barColor} rx="3" opacity="0.8" />
            <text x={LABEL_W + barW + 5} y={15} fontSize="10" fill={countFill}>
              {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Gender breakdown ──────────────────────────────────────────────────────────

export function GenderBreakdown({ users }: { users: User[] }) {
  const isDark = useContext(DarkCtx);
  const femaleColor = isDark ? "#C084FC" : "#7C3AED";
  const maleColor   = isDark ? "#38BDF8" : "#0284C7";

  const female = users.filter((u) => u.gender === "female").length;
  const male   = users.filter((u) => u.gender === "male").length;
  const total  = users.length || 1;
  const fPct   = Math.round((female / total) * 100);
  const mPct   = 100 - fPct;

  return (
    <div className="space-y-3">
      <div className="flex h-5 rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${fPct}%`, background: femaleColor }}
        />
        <div className="h-full flex-1 transition-all" style={{ background: maleColor }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Female", count: female, pct: fPct, color: femaleColor },
          { label: "Male",   count: male,   pct: mPct, color: maleColor },
        ].map((g) => (
          <div key={g.label} className="flex items-center gap-2 text-[13px]">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
            <span className="text-zinc-500 dark:text-zinc-400">{g.label}</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 ml-auto">
              {g.pct}%
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-zinc-400">
        <span>{female} women</span>
        <span>{male} men</span>
      </div>
    </div>
  );
}
