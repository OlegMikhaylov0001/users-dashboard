"use client";

import { I } from "../icons";
import { ACCEPTED, EXPIRED_DECLINED, PENDING, type InvTab } from "./data";
import { InvTable } from "./InvTable";

interface Props {
  tab: InvTab;
  setTab: (tab: InvTab) => void;
  onOpenComposer: () => void;
  onOpenBulk: () => void;
  showBulkBar: boolean;
}

export function InvitationsPage({ tab, setTab, onOpenComposer, onOpenBulk, showBulkBar }: Props) {
  const data = tab === "pending" ? PENDING : tab === "accepted" ? ACCEPTED : tab === "expired" ? EXPIRED_DECLINED : [];

  return (
    <div className="inv-content">
      <div className="inv-page-head">
        <div>
          <div className="inv-page-title">Invitations</div>
          <div className="inv-page-sub">
            People you&rsquo;ve invited to UserBase. Pending invitations expire after 14 days
            unless extended.
          </div>
        </div>
        <div className="inv-head-actions">
          <button type="button" className="btn-md-outline" onClick={onOpenBulk}>
            <I.Download size={13} style={{ transform: "scaleY(-1)" }} /> Bulk invite (CSV)
          </button>
          <button type="button" className="btn-md-primary" onClick={onOpenComposer}>
            <I.Plus size={13} /> Send invitations
          </button>
        </div>
      </div>

      <div className="inv-stats">
        <div className="inv-stat">
          <div className="inv-stat-label">Pending</div>
          <div className="inv-stat-value">8</div>
          <div className="inv-stat-trend warn">
            <I.Clock size={11} /> 1 expiring this week
          </div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat-label">Sent this month</div>
          <div className="inv-stat-value">
            16<span className="inv-stat-value-sub">invites</span>
          </div>
          <div className="inv-stat-trend">
            <I.ArrowUpRight size={11} /> +4 vs last month
          </div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat-label">Acceptance rate</div>
          <div className="inv-stat-value">
            82<span className="inv-stat-value-sub">%</span>
          </div>
          <div className="inv-stat-trend muted">last 30 days</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat-label">Seats remaining</div>
          <div className="inv-stat-value">
            26<span className="inv-stat-value-sub">/ 50</span>
          </div>
          <div className="inv-stat-trend muted">Business plan</div>
        </div>
      </div>

      {/* Invite link summary */}
      <div className="inv-link-panel">
        <div className="inv-link-panel-icon">
          <I.Globe size={16} />
        </div>
        <div className="inv-link-panel-text">
          <div className="inv-link-panel-title">
            Shareable invite link
            <span
              className="inv-status sent"
              style={{ height: 18, padding: "0 7px", fontSize: 10 }}
            >
              Active
            </span>
          </div>
          <div className="inv-link-panel-sub">
            Anyone with this link can join as Member. Limit and expiry below.
          </div>
        </div>
        <div className="inv-link-input">
          <input readOnly value="https://userbase.app/join/k2f-9p7x-c4dq" />
          <button type="button" className="ll-copy">
            <I.Copy size={11} /> Copy
          </button>
        </div>
        <div className="inv-link-meta">
          <span>
            Role: <b style={{ color: "var(--fg)" }}>Member</b>
          </span>
          <span>
            Used: <b style={{ color: "var(--fg)" }}>3 / 10</b>
          </span>
          <span>
            Expires: <b style={{ color: "var(--fg)" }}>Nov 14</b>
          </span>
        </div>
        <div className="inv-toggle on" title="Disable link" />
      </div>

      <div className="inv-tabs">
        <button
          type="button"
          className={`inv-tab ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Pending <span className="inv-tab-count">8</span>
        </button>
        <button
          type="button"
          className={`inv-tab ${tab === "accepted" ? "active" : ""}`}
          onClick={() => setTab("accepted")}
        >
          Accepted <span className="inv-tab-count">147</span>
        </button>
        <button
          type="button"
          className={`inv-tab ${tab === "expired" ? "active" : ""}`}
          onClick={() => setTab("expired")}
        >
          Expired &amp; declined <span className="inv-tab-count">12</span>
        </button>
        <button
          type="button"
          className={`inv-tab ${tab === "empty" ? "active" : ""}`}
          onClick={() => setTab("empty")}
        >
          Empty state preview
        </button>
      </div>

      <div className="inv-toolbar">
        <div className="search">
          <I.Search size={13} />
          <input placeholder="Search by email or inviter…" />
        </div>
        <select
          className="inv-select"
          style={{ height: 30, width: 130, padding: "0 10px" }}
          defaultValue="All roles"
        >
          <option>All roles</option>
          <option>Admin</option>
          <option>Member</option>
          <option>Viewer</option>
        </select>
        <select
          className="inv-select"
          style={{ height: 30, width: 150, padding: "0 10px" }}
          defaultValue="All departments"
        >
          <option>All departments</option>
          <option>Engineering</option>
          <option>Design</option>
          <option>Sales</option>
          <option>HR</option>
        </select>
        <div style={{ flex: 1 }} />
        <button type="button" className="ds-btn-ghost">
          <I.Download size={12} /> Export
        </button>
      </div>

      {showBulkBar && (
        <div className="inv-bulk-bar">
          <span>
            <b>3</b> invitations selected
          </span>
          <span className="vsep" />
          <button type="button">
            <I.Send size={11} style={{ verticalAlign: "middle", marginRight: 4 }} /> Resend all
          </button>
          <button type="button">
            <I.Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} /> Extend
            expiry
          </button>
          <button type="button" style={{ color: "oklch(0.85 0.13 25)" }}>
            <I.X size={11} style={{ verticalAlign: "middle", marginRight: 4 }} /> Revoke all
          </button>
          <span style={{ flex: 1 }} />
          <button type="button">Clear</button>
        </div>
      )}

      {tab === "empty" ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">
            <I.Mail size={22} />
          </div>
          <div className="inv-empty-title">No pending invitations</div>
          <div className="inv-empty-sub">
            When you invite someone to UserBase, they&rsquo;ll show up here until they accept. You
            have <b style={{ color: "var(--fg)" }}>26 seats</b> remaining on the Business plan.
          </div>
          <div className="inv-empty-actions">
            <button type="button" className="btn-md-outline" onClick={onOpenBulk}>
              <I.Download size={13} style={{ transform: "scaleY(-1)" }} /> Upload CSV
            </button>
            <button type="button" className="btn-md-primary" onClick={onOpenComposer}>
              <I.Plus size={13} /> Send your first invitation
            </button>
          </div>
        </div>
      ) : (
        <InvTable rows={data} tab={tab} />
      )}
    </div>
  );
}
