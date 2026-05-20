"use client";

import React, { useRef, useEffect } from "react";
import { I } from "../icons";

interface TopbarProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportCSV: () => void;
  onOpenSearch: () => void;
}

export function Topbar({
  totalCount,
  searchQuery,
  onSearchChange,
  onExportCSV,
  onOpenSearch,
}: TopbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on '/' global key press, unless in textarea/input
  useEffect(() => {
    const handleSlashPress = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleSlashPress);
    return () => window.removeEventListener("keydown", handleSlashPress);
  }, []);

  const handleToggleTheme = () => {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
  };

  return (
    <div className="topbar">
      <div className="topbar-title">
        <span style={{ color: "var(--fg-tertiary)", fontWeight: 500 }}>Workspace</span>
        <span className="topbar-crumb-sep">/</span>
        <span>Users</span>
        <span className="topbar-count tabular">{totalCount}</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <I.Search size={13} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search name, email, username…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="ds-icon-btn"
              onClick={() => onSearchChange("")}
              title="Clear"
            >
              <I.X size={11} />
            </button>
          ) : (
            <span className="ds-kbd" onClick={onOpenSearch} style={{ cursor: "pointer" }} title="Search via palette (⌘K)">/</span>
          )}
        </div>
        <button
          type="button"
          className="ds-btn-ghost"
          title="Export active filter list to CSV"
          onClick={onExportCSV}
        >
          <I.Download size={12} />
          Export
        </button>
        <button
          type="button"
          className="ds-icon-btn"
          title="Toggle theme"
          onClick={handleToggleTheme}
        >
          <I.Moon size={13} />
        </button>
        <button type="button" className="ds-btn-primary">
          <I.Plus size={12} />
          Invite
        </button>
      </div>
    </div>
  );
}
