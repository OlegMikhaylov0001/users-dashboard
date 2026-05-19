"use client";

import { useContext } from "react";
import { DashboardCtx } from "./dashboard-ctx";
import { I } from "./icons";

interface SavedView {
  id: string;
  name: string;
  count: number;
  department?: string;
  role?: string;
}

interface SidebarProps {
  totalUsers: number;
  adminsCount: number;
  savedViews: SavedView[];
  activeSavedId: string | null;
  onApplySaved: (id: string) => void;
  onClearFilters: () => void;
  active: "users" | "charts" | "admins";
  onSelectActive: (id: "users" | "charts" | "admins") => void;
}

export function Sidebar({
  totalUsers,
  adminsCount,
  savedViews,
  activeSavedId,
  onApplySaved,
  onClearFilters,
  active,
  onSelectActive,
}: SidebarProps) {
  const ctx = useContext(DashboardCtx);
  if (!ctx) return null;

  return (
    <aside className="sidebar">
      <button className="workspace" type="button">
        <div className="workspace-logo">U</div>
        <div className="workspace-name">UserBase</div>
        <I.ChevDown size={13} className="workspace-chev" />
      </button>

      <button className="sidebar-search" type="button" title="Search (⌘K — coming soon)">
        <I.Search size={13} />
        <span className="sidebar-search-text">Search</span>
        <span className="ds-kbd">⌘K</span>
      </button>

      <div className="nav-section">
        <button
          type="button"
          className={"nav-item" + (active === "users" ? " active" : "")}
          onClick={() => {
            onSelectActive("users");
            onClearFilters();
          }}
        >
          <I.Users size={14} className="nav-item-icon" />
          <span>Users</span>
          <span className="nav-item-count">{totalUsers}</span>
        </button>
        <button
          type="button"
          className={"nav-item" + (active === "charts" ? " active" : "")}
          onClick={() => onSelectActive("charts")}
        >
          <I.Chart size={14} className="nav-item-icon" />
          <span>Charts</span>
        </button>
        <button
          type="button"
          className={"nav-item" + (active === "admins" ? " active" : "")}
          onClick={() => {
            onSelectActive("admins");
            ctx.clear();
            ctx.setFilter("role", "admin");
          }}
        >
          <I.Shield size={14} className="nav-item-icon" />
          <span>Admins</span>
          <span className="nav-item-count">{adminsCount}</span>
        </button>
        <button type="button" className="nav-item">
          <I.Inbox size={14} className="nav-item-icon" />
          <span>Invitations</span>
          <span className="nav-item-dot" />
        </button>
      </div>

      <div className="nav-section">
        <div className="nav-header">
          <span>Saved</span>
          <button type="button" className="nav-header-action" title="New view">
            <I.Plus size={11} />
          </button>
        </div>
        {savedViews.map((v) => (
          <button
            key={v.id}
            type="button"
            className={"nav-item" + (activeSavedId === v.id ? " active" : "")}
            onClick={() => onApplySaved(v.id)}
          >
            <I.Bookmark size={13} className="nav-item-icon" />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
            <span className="nav-item-count">{v.count}</span>
          </button>
        ))}
      </div>

      <div className="nav-section" style={{ marginTop: 4 }}>
        <div className="nav-header"><span>Workspace</span></div>
        <button type="button" className="nav-item">
          <I.Hash size={13} className="nav-item-icon" />
          <span>Departments</span>
        </button>
        <button type="button" className="nav-item">
          <I.Tag size={13} className="nav-item-icon" />
          <span>Tags</span>
        </button>
        <button type="button" className="nav-item">
          <I.Settings size={13} className="nav-item-icon" />
          <span>Settings</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">OM</div>
        <div className="sidebar-footer-name">Oleg M.</div>
        <button type="button" className="ds-icon-btn" title="Notifications">
          <I.Bell size={13} />
        </button>
      </div>
    </aside>
  );
}
