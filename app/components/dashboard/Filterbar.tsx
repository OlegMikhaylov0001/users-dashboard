"use client";

import React, { useRef } from "react";
import { I } from "../icons";
import { FilterChip } from "../ui/FilterChip";
import { cn } from "../../lib/utils";
import { useClickOutside } from "../../hooks/useClickOutside";
import type { Filters } from "../../hooks/useDashboard";

export type Tab = "all" | "admin" | "moderator" | "female" | "male";

interface FilterbarProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  counts: { all: number; admin: number; moderator: number; female: number; male: number };
  
  filters: Filters;
  setFilter: (key: keyof Filters, val: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  
  departments: string[];
  titles: string[];
  countries: string[];
  states: string[];
  
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  newViewName: string;
  setNewViewName: (name: string) => void;
  handleSaveView: () => void;
}

export function Filterbar({
  tab,
  setTab,
  counts,
  filters,
  setFilter,
  clearFilters,
  hasFilters,
  departments,
  titles,
  countries,
  states,
  showSaveModal,
  setShowSaveModal,
  newViewName,
  setNewViewName,
  handleSaveView,
}: FilterbarProps) {
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  // Automatically close the save-view popover when clicking outside of it
  useClickOutside(popoverContainerRef, () => {
    if (showSaveModal) {
      setShowSaveModal(false);
    }
  });

  const tabOptions: Array<{ id: Tab; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "admin", label: "Admins", count: counts.admin },
    { id: "moderator", label: "Mods", count: counts.moderator },
    { id: "female", label: "Female", count: counts.female },
    { id: "male", label: "Male", count: counts.male },
  ];

  return (
    <div className="filterbar">
      <div className="view-tabs">
        {tabOptions.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn("view-tab", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="view-tab-dot">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="filter-divider" />
      
      <FilterChip
        label="Role"
        value={filters.role}
        options={[
          { value: "admin", label: "Admin" },
          { value: "moderator", label: "Moderator" },
          { value: "user", label: "User" },
        ]}
        onSelect={(v) => setFilter("role", v)}
        onClear={() => setFilter("role", "")}
      />
      <FilterChip
        label="Department"
        value={filters.department}
        options={departments.map((d) => ({ value: d, label: d }))}
        onSelect={(v) => setFilter("department", v)}
        onClear={() => setFilter("department", "")}
        searchable
      />
      <FilterChip
        label="Gender"
        value={filters.gender}
        options={[
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
        ]}
        onSelect={(v) => setFilter("gender", v)}
        onClear={() => setFilter("gender", "")}
      />
      <FilterChip
        label="Title"
        value={filters.title}
        options={titles.map((t) => ({ value: t, label: t }))}
        onSelect={(v) => setFilter("title", v)}
        onClear={() => setFilter("title", "")}
        searchable
      />
      <FilterChip
        label="Country"
        value={filters.country}
        options={countries.map((c) => ({ value: c, label: c }))}
        onSelect={(v) => setFilter("country", v)}
        onClear={() => setFilter("country", "")}
        searchable
      />
      <FilterChip
        label="State"
        value={filters.state}
        options={states.map((s) => ({ value: s, label: s }))}
        onSelect={(v) => setFilter("state", v)}
        onClear={() => setFilter("state", "")}
        searchable
      />

      {hasFilters && (
        <button
          type="button"
          className="ds-btn-ghost"
          onClick={clearFilters}
        >
          Reset
        </button>
      )}

      <div className="filter-spacer" />

      <div style={{ position: "relative" }} ref={popoverContainerRef}>
        <button
          type="button"
          className="ds-btn-outline"
          style={{ whiteSpace: "nowrap" }}
          onClick={() => {
            if (!hasFilters) {
              alert("Please apply at least one filter before saving a view!");
              return;
            }
            setNewViewName("");
            setShowSaveModal(!showSaveModal);
          }}
        >
          <I.Star
            size={11}
            style={{
              color: hasFilters ? "var(--accent)" : "inherit",
              fill: hasFilters ? "var(--accent)" : "none",
            }}
          />
          Save view
        </button>
        
        {showSaveModal && (
          <div className="save-view-popover">
            <div className="save-view-popover-title">Save Custom View</div>
            <input
              type="text"
              placeholder="Enter view name..."
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveView();
                if (e.key === "Escape") setShowSaveModal(false);
              }}
            />
            <div className="save-view-popover-actions">
              <button
                type="button"
                className="ds-btn-ghost"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ds-btn-primary"
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
