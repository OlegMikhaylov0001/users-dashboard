"use client";

import Link from "next/link";
import { I } from "../icons";

export type SettingsSection =
  | "general"
  | "members"
  | "roles"
  | "depts"
  | "tags"
  | "notifs"
  | "appear"
  | "api"
  | "integ"
  | "billing"
  | "security"
  | "audit"
  | "danger";

type IconComponent = typeof I[keyof typeof I];

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: IconComponent;
  pill?: string;
  pillCls?: string;
  dot?: boolean;
}

export const SET_SECTIONS: { group: string; items: NavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { id: "general", label: "General", icon: I.Settings },
      { id: "members", label: "Members", icon: I.Users, pill: "24" },
      { id: "roles", label: "Roles & permissions", icon: I.Shield },
      { id: "depts", label: "Departments", icon: I.Hash },
      { id: "tags", label: "Tags", icon: I.Tag },
    ],
  },
  {
    group: "Preferences",
    items: [
      { id: "notifs", label: "Notifications", icon: I.Bell, dot: true },
      { id: "appear", label: "Appearance", icon: I.Sun },
    ],
  },
  {
    group: "Developer",
    items: [
      { id: "api", label: "API & Webhooks", icon: I.Bolt },
      { id: "integ", label: "Integrations", icon: I.Globe },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "billing", label: "Plan & billing", icon: I.Bookmark, pill: "pro", pillCls: "pro" },
      { id: "security", label: "Security", icon: I.Shield },
      { id: "audit", label: "Audit log", icon: I.Eye },
    ],
  },
  {
    group: "Danger",
    items: [{ id: "danger", label: "Danger zone", icon: I.Trash }],
  },
];

interface Props {
  active: SettingsSection;
  onChange: (id: SettingsSection) => void;
}

export function SettingsSidebar({ active, onChange }: Props) {
  return (
    <aside className="set-sidebar">
      <div className="set-sidebar-head">
        <div
          className="workspace-logo"
          style={{ width: 26, height: 26, borderRadius: 7, fontSize: 12 }}
        >
          U
        </div>
        <div className="set-sidebar-head-text">
          <div>UserBase</div>
          <div className="set-sidebar-head-sub">Business plan</div>
        </div>
      </div>

      <Link href="/" className="set-nav-item" style={{ marginTop: 6 }}>
        <I.ArrowRight
          size={13}
          className="set-nav-item-icon"
          style={{ transform: "scaleX(-1)" }}
        />
        <span style={{ fontSize: 12.5 }}>Back to dashboard</span>
      </Link>

      {SET_SECTIONS.map((group) => (
        <div key={group.group}>
          <div className="set-section-label">{group.group}</div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`set-nav-item ${isActive ? "active" : ""}`}
                onClick={() => onChange(item.id)}
              >
                <Icon size={14} className="set-nav-item-icon" />
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
                {item.dot && <span className="set-nav-item-dot" />}
                {item.pill && (
                  <span className={`set-nav-item-pill ${item.pillCls ?? ""}`}>
                    {item.pill}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="sidebar-footer" style={{ marginTop: "auto" }}>
        <div className="sidebar-footer-avatar">OM</div>
        <div className="sidebar-footer-name">Oleg M.</div>
        <button type="button" className="ds-icon-btn">
          <I.Settings size={13} />
        </button>
      </div>
    </aside>
  );
}
