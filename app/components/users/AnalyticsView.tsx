"use client";

import type { User } from "../../types";
import { I } from "../icons";
import { DepartmentCard } from "./analytics/DepartmentCard";
import { GenderCard } from "./analytics/GenderCard";
import { AgeCard } from "./analytics/AgeCard";
import { GeoCard } from "./analytics/GeoCard";

interface AnalyticsViewProps {
  users: User[];
}

export function AnalyticsView({ users }: AnalyticsViewProps) {
  const total = users.length;

  if (total === 0) {
    return (
      <div className="analytics-empty-state">
        <I.Chart size={32} style={{ color: "var(--fg-muted)", marginBottom: 12 }} />
        <h3>No analytics data available</h3>
        <p>There are no users matching your active filters. Try clearing your filters to see metrics.</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-grid">
        <DepartmentCard users={users} total={total} />
        <GenderCard users={users} total={total} />
        <AgeCard users={users} total={total} />
        <GeoCard users={users} total={total} />
      </div>
    </div>
  );
}
