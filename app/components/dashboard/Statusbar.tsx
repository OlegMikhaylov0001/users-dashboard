"use client";

import React from "react";
import type { Filters } from "../../hooks/useDashboard";

interface StatusbarProps {
  totalCount: number;
  filteredCount: number;
  hasFilters: boolean;
  filters: Filters;
  ageFilter: [number, number] | null;
}

export function Statusbar({
  totalCount,
  filteredCount,
  hasFilters,
  filters,
  ageFilter,
}: StatusbarProps) {
  const activeFiltersCount = React.useMemo(() => {
    if (!hasFilters) return 0;
    const standardCount = Object.values(filters).filter(Boolean).length;
    const ageCount = ageFilter ? 1 : 0;
    return standardCount + ageCount;
  }, [hasFilters, filters, ageFilter]);

  return (
    <div className="statusbar">
      <span>
        <span className="dot" />
        Synced just now
      </span>
      <span>
        Showing <b style={{ color: "var(--fg-secondary)" }}>{filteredCount}</b> of {totalCount}
      </span>
      {hasFilters && activeFiltersCount > 0 && (
        <span style={{ color: "var(--accent-fg)" }}>
          {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
        </span>
      )}
      <span className="spacer" />
      <span>
        <kbd>↑↓</kbd> nav
      </span>
      <span>
        <kbd>↵</kbd> open
      </span>
      <span>
        <kbd>esc</kbd> close
      </span>
    </div>
  );
}
