"use client";

import Link from "next/link";
import { useContext } from "react";
import { DashboardCtx } from "./dashboard-ctx";
import { I } from "./icons";

import { cn } from "../lib/utils";

interface SavedView {
  id: string;
  name: string;
  count: number;
  department?: string;
  role?: string;
  isCustom?: boolean;
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
  onDeleteCustomView?: (id: string) => void;
  onOpenSearch?: () => void;
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
  onDeleteCustomView,
  onOpenSearch,
}: SidebarProps) {
  const ctx = useContext(DashboardCtx);
  if (!ctx) return null;

  return (
    <aside className="sidebar">
      <Link href="/" className="workspace" style={{ textDecoration: "none" }}>
        <div className="workspace-logo">U</div>
        <div className="workspace-name">UserBase</div>
        <I.ChevDown size={13} className="workspace-chev" />
      </Link>

      <button className="sidebar-search" type="button" title="Search (⌘K)" onClick={onOpenSearch}>
        <I.Search size={13} />
        <span className="sidebar-search-text">Search</span>
        <span className="ds-kbd">⌘K</span>
      </button>

      <div className="nav-section">
        <button
          type="button"
          className={cn("nav-item", active === "users" && "active")}
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
          className={cn("nav-item", active === "charts" && "active")}
          onClick={() => onSelectActive("charts")}
        >
          <I.Chart size={14} className="nav-item-icon" />
          <span>Charts</span>
        </button>
        <button
          type="button"
          className={cn("nav-item", active === "admins" && "active")}
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
        <Link href="/invitations" className="nav-item">
          <I.Inbox size={14} className="nav-item-icon" />
          <span>Invitations</span>
          <span className="nav-item-dot" />
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-header">
          <span>Saved</span>
          <button type="button" className="nav-header-action" title="New view">
            <I.Plus size={11} />
          </button>
        </div>
        {savedViews.map((v) => (
          <div
            key={v.id}
            className="nav-item-preset-wrapper"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <button
              type="button"
              className={cn("nav-item", activeSavedId === v.id && "active")}
              onClick={() => onApplySaved(v.id)}
              style={{ flex: 1, paddingRight: v.isCustom ? "32px" : "8px" }}
            >
              <I.Bookmark size={13} className="nav-item-icon" />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
              <span className="nav-item-count">{v.count}</span>
            </button>
            {v.isCustom && onDeleteCustomView && (
              <button
                type="button"
                className="ds-icon-btn preset-delete-btn"
                title="Delete saved view"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCustomView(v.id);
                }}
                style={{
                  position: "absolute",
                  right: "6px",
                  padding: "4px",
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                }}
              >
                <I.X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="nav-section" style={{ marginTop: 4 }}>
        <div className="nav-header"><span>Workspace</span></div>
        <Link href="/settings#depts" className="nav-item">
          <I.Hash size={13} className="nav-item-icon" />
          <span>Departments</span>
        </Link>
        <Link href="/settings#tags" className="nav-item">
          <I.Tag size={13} className="nav-item-icon" />
          <span>Tags</span>
        </Link>
        <Link href="/settings" className="nav-item">
          <I.Settings size={13} className="nav-item-icon" />
          <span>Settings</span>
        </Link>
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
