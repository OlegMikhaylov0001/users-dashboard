"use client";

import React, { useMemo } from "react";
import type { User } from "../../../types";
import { I } from "../../icons";

interface AgeCardProps {
  users: User[];
  total: number;
}

export function AgeCard({ users, total }: AgeCardProps) {
  const ageData = useMemo(() => {
    const groups = [
      { label: "18–25", count: 0, range: [18, 25] },
      { label: "26–35", count: 0, range: [26, 35] },
      { label: "36–45", count: 0, range: [36, 45] },
      { label: "46–55", count: 0, range: [46, 55] },
      { label: "56+", count: 0, range: [56, 120] },
    ];

    users.forEach((u) => {
      const age = u.age;
      const group = groups.find((g) => age >= g.range[0] && age <= g.range[1]);
      if (group) {
        group.count++;
      }
    });

    return groups.map((g) => ({
      label: g.label,
      count: g.count,
      percentage: total ? Math.round((g.count / total) * 100) : 0,
    }));
  }, [users, total]);

  const maxAgeCount = useMemo(() => {
    if (ageData.length === 0) return 1;
    return Math.max(...ageData.map((a) => a.count), 1);
  }, [ageData]);

  return (
    <div className="analytics-card animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="analytics-card-header">
        <div className="analytics-card-title-wrap">
          <I.Calendar size={16} className="analytics-card-icon" />
          <span className="analytics-card-title">Age Distribution</span>
        </div>
        <span className="analytics-card-badge">Histogram</span>
      </div>
      <div className="analytics-card-body">
        <div className="age-histogram-wrap">
          <div className="age-bars-container">
            {ageData.map((item, idx) => {
              const barHeight = Math.max(8, (item.count / maxAgeCount) * 130);
              const colors = [
                "linear-gradient(180deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 70%, black) 100%)",
                "linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)",
                "linear-gradient(180deg, #EC4899 0%, #BE185D 100%)",
                "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                "linear-gradient(180deg, #10B981 0%, #047857 100%)",
              ];
              return (
                <div key={item.label} className="age-bar-wrapper">
                  <div className="age-bar-tooltip tabular">
                    <b>{item.count}</b> users ({item.percentage}%)
                  </div>
                  <div
                    className="age-bar"
                    style={{
                      height: `${barHeight}px`,
                      background: colors[idx % colors.length],
                    }}
                  />
                  <span className="age-bar-label">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="age-grid-lines">
            <div className="age-grid-line" />
            <div className="age-grid-line" />
            <div className="age-grid-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
