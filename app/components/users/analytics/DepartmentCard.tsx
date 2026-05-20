"use client";

import React, { useMemo } from "react";
import type { User } from "../../../types";
import { I } from "../../icons";

interface DepartmentCardProps {
  users: User[];
  total: number;
}

export function DepartmentCard({ users, total }: DepartmentCardProps) {
  const deptData = useMemo(() => {
    if (total === 0) return [];
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const d = u.company?.department || "Other";
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [users, total]);

  const maxDeptCount = useMemo(() => {
    if (deptData.length === 0) return 1;
    return Math.max(...deptData.map((d) => d.count), 1);
  }, [deptData]);

  return (
    <div className="analytics-card animate-fade-in">
      <div className="analytics-card-header">
        <div className="analytics-card-title-wrap">
          <I.Building size={16} className="analytics-card-icon" />
          <span className="analytics-card-title">Departments</span>
        </div>
        <span className="analytics-card-badge">{deptData.length} Sectors</span>
      </div>
      <div className="analytics-card-body">
        <div className="dept-list">
          {deptData.map((d) => (
            <div key={d.name} className="dept-item">
              <div className="dept-header">
                <span className="dept-name" title={d.name}>{d.name}</span>
                <span className="dept-count tabular">
                  {d.count} <span className="dept-percentage">{d.percentage}%</span>
                </span>
              </div>
              <div className="dept-progress-track">
                <div
                  className="dept-progress-bar"
                  style={{
                    width: `${(d.count / maxDeptCount) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent) 0%, #8B5CF6 100%)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
