"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { User } from "../../types";
import { initials, paletteFor } from "../../lib/palette";
import { I } from "../icons";

interface SidePanelProps {
  user: User;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

type Tab = "overview" | "activity" | "permissions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sp-row">
      <span className="sp-row-key">{label}</span>
      <span className="sp-row-val">{children}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="sp-section-header">{children}</div>;
}

export function SidePanel({ user, onClose, onNext, onPrev }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const pal = paletteFor(user.firstName, false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (inField) return;
      if (e.key === "Escape") onClose();
      if (onNext && (e.key === "j" || e.key === "ArrowDown")) {
        e.preventDefault();
        onNext();
      }
      if (onPrev && (e.key === "k" || e.key === "ArrowUp")) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  return (
    <aside className="side-panel">
      <div className="sp-header">
        <div className="avatar lg" style={{ background: pal.bg, color: pal.fg, borderColor: pal.bg }}>
          {user.image ? (
            <Image src={user.image} alt="" width={56} height={56} unoptimized />
          ) : (
            initials(user)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sp-id">USR-{user.id}</span>
            <span className={"role-badge " + user.role}>
              <span className="role-dot" />
              {user.role}
            </span>
          </div>
          <div className="sp-name">{user.firstName} {user.lastName}</div>
          <div className="sp-title">{user.company.title} · {user.company.department}</div>
        </div>
        <div className="sp-actions">
          {onPrev && (
            <button type="button" className="ds-icon-btn" onClick={onPrev} title="Previous (K)">
              <I.ChevUp size={13} />
            </button>
          )}
          {onNext && (
            <button type="button" className="ds-icon-btn" onClick={onNext} title="Next (J)">
              <I.ChevDown size={13} />
            </button>
          )}
          <button type="button" className="ds-icon-btn" onClick={onClose} title="Close (Esc)">
            <I.X size={13} />
          </button>
        </div>
      </div>

      <div className="sp-tabs">
        <button type="button" className={"sp-tab" + (tab === "overview" ? " active" : "")} onClick={() => setTab("overview")}>Overview</button>
        <button type="button" className={"sp-tab" + (tab === "activity" ? " active" : "")} onClick={() => setTab("activity")}>Activity</button>
        <button type="button" className={"sp-tab" + (tab === "permissions" ? " active" : "")} onClick={() => setTab("permissions")}>Permissions</button>
      </div>

      <div className="sp-body">
        {tab === "overview" && (
          <>
            <div className="sp-section">
              <SectionHeader>Contact</SectionHeader>
              <Row label="Email">
                <I.Mail size={11} style={{ color: "var(--fg-tertiary)" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
                <button
                  type="button"
                  className="ds-icon-btn"
                  title="Copy"
                  style={{ marginLeft: "auto" }}
                  onClick={() => navigator.clipboard?.writeText(user.email).catch(() => {})}
                >
                  <I.Copy size={11} />
                </button>
              </Row>
              <Row label="Phone">
                <I.Phone size={11} style={{ color: "var(--fg-tertiary)" }} />
                {user.phone}
              </Row>
              <Row label="Username">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>@{user.username}</span>
              </Row>
            </div>

            <div className="sp-section">
              <SectionHeader>Profile</SectionHeader>
              <Row label="Age">{user.age}</Row>
              <Row label="Gender">
                <span style={{ textTransform: "capitalize" }}>{user.gender}</span>
              </Row>
              <Row label="Location">
                {user.address.city}, {user.address.country}
              </Row>
              <Row label="Blood type">{user.bloodGroup}</Row>
            </div>

            <div className="sp-section">
              <SectionHeader>Work</SectionHeader>
              <Row label="Company">
                <I.Building size={11} style={{ color: "var(--fg-tertiary)" }} />
                {user.company.name}
              </Row>
              <Row label="Department">
                <span className="dept-tag">{user.company.department}</span>
              </Row>
              <Row label="Title">{user.company.title}</Row>
            </div>

            <div className="sp-section">
              <SectionHeader>System</SectionHeader>
              <Row label="Birth date">
                <I.Calendar size={11} style={{ color: "var(--fg-tertiary)" }} />
                {user.birthDate}
              </Row>
              <Row label="University">{user.university}</Row>
            </div>
          </>
        )}

        {tab === "activity" && (
          <div className="sp-section">
            <SectionHeader>Recent activity</SectionHeader>
            {[
              { t: "Updated profile picture", ago: "2h ago" },
              { t: `Joined ${user.company.department}`, ago: "1d ago" },
              { t: `Signed in from ${user.address.city}`, ago: "5d ago" },
              { t: `Role changed to ${user.role}`, ago: "2w ago" },
              { t: "Account created", ago: user.birthDate },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 12.5 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--fg-muted)",
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ color: "var(--fg-secondary)" }}>{a.t}</div>
                  <div style={{ color: "var(--fg-tertiary)", fontSize: 11.5, marginTop: 1 }}>{a.ago}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "permissions" && (
          <div className="sp-section">
            <SectionHeader>Access scopes</SectionHeader>
            {["users.read", "users.write", "billing.read", "settings.write", "audit.read"].map((s) => {
              const granted =
                user.role === "admin" ||
                (user.role === "moderator" && !s.endsWith(".write")) ||
                s === "users.read";
              return (
                <div className="sp-row" key={s}>
                  <span
                    className="sp-row-key"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}
                  >
                    {s}
                  </span>
                  <span className="sp-row-val">
                    {granted ? (
                      <span style={{ color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <I.Check size={11} /> granted
                      </span>
                    ) : (
                      <span style={{ color: "var(--fg-tertiary)" }}>—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sp-footer">
        <button type="button" className="ds-btn-outline" style={{ flex: 1, justifyContent: "center" }}>
          <I.Send size={11} /> Message
        </button>
        <button type="button" className="ds-btn-outline" style={{ flex: 1, justifyContent: "center" }}>
          <I.Edit size={11} /> Edit
        </button>
        <button type="button" className="ds-btn-primary">
          <I.ArrowUpRight size={11} /> Open
        </button>
      </div>
    </aside>
  );
}
