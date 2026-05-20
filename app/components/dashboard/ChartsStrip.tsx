"use client";

import React, { useMemo } from "react";
import type { User } from "../../types";

interface ChartsStripProps {
  users: User[];
  filteredUsers: User[];
}

export function ChartsStrip({ users, filteredUsers }: ChartsStripProps) {
  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const avgAge = total ? Math.round(filteredUsers.reduce((s, u) => s + u.age, 0) / total) : 0;

    const deptCounts: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      const dept = u.company.department || "—";
      deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
    });
    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];

    const femaleCount = filteredUsers.filter((u) => u.gender === "female").length;
    const fPct = total ? Math.round((femaleCount / total) * 100) : 0;

    const buckets = [0, 0, 0, 0, 0]; // <26, 26-35, 36-45, 46-55, 56+
    filteredUsers.forEach((u) => {
      const age = u.age;
      const bucketIdx = age < 26 ? 0 : age < 36 ? 1 : age < 46 ? 2 : age < 56 ? 3 : 4;
      buckets[bucketIdx]++;
    });
    const maxB = Math.max(...buckets, 1);

    const adminCount = filteredUsers.filter((u) => u.role === "admin").length;
    const adminPct = total ? Math.round((adminCount / total) * 100) : 0;

    return {
      total,
      avgAge,
      topDept,
      fPct,
      buckets,
      maxB,
      adminCount,
      adminPct,
    };
  }, [filteredUsers]);

  const { total, avgAge, topDept, fPct, buckets, maxB, adminCount, adminPct } = stats;

  return (
    <div className="charts-strip">
      <div className="chart-card">
        <div className="chart-label">Total · filtered</div>
        <div className="chart-value">
          {total}
          <span className="chart-value-sub">/ {users.length}</span>
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-label">Admins</div>
        <div className="chart-value">
          {adminCount}
          <span className="chart-value-sub">{adminPct}%</span>
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-label">Avg age · top dept</div>
        <div className="chart-value" style={{ fontSize: 14 }}>
          {avgAge} y
          <span className="chart-value-sub" style={{ marginLeft: 8 }}>·</span>
          <span className="chart-value-sub" style={{ marginLeft: 4, color: "var(--fg-secondary)" }}>
            {topDept[0]}
          </span>
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-label">Gender · age dist</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {fPct}
            <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>%F</span>
          </div>
          <svg width="80" height="22" viewBox="0 0 80 22" aria-hidden>
            {buckets.map((b, i) => (
              <rect
                key={i}
                x={i * 16 + 1}
                y={22 - (b / maxB) * 20}
                width="14"
                height={(b / maxB) * 20}
                rx="1.5"
                fill="var(--accent)"
                opacity={0.35 + (b / maxB) * 0.55}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
