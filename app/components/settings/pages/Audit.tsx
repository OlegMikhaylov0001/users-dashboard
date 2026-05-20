"use client";

import { I } from "../../icons";

interface Row {
  who: string;
  what: string;
  det: string;
  when: string;
  ip: string;
  sev: "ok" | "warn" | "danger";
}

const ROWS: Row[] = [
  { who: "Oleg M.", what: "updated workspace", det: 'name: "Acme" → "UserBase"', when: "2 min ago", ip: "89.216.84.12", sev: "ok" },
  { who: "Emma Kowalski", what: "invited member", det: "jasper@userbase.app · role: Admin", when: "14 min ago", ip: "74.125.40.8", sev: "ok" },
  { who: "Jasper Tanaka", what: "rotated API key", det: "production · ub_live_…7f9a", when: "32 min ago", ip: "188.40.55.2", sev: "warn" },
  { who: "Oleg M.", what: "changed role", det: "liam@userbase.app: Member → Viewer", when: "1 hr ago", ip: "89.216.84.12", sev: "ok" },
  { who: "Aisha Habib", what: "enabled SSO", det: "provider: Okta", when: "3 hr ago", ip: "142.250.4.6", sev: "ok" },
  { who: "System", what: "failed login", det: "email: marco@acme.io · 5 attempts", when: "4 hr ago", ip: "5.62.148.10", sev: "danger" },
  { who: "Marco Silva", what: "updated user", det: "changed department for 12 users", when: "yesterday", ip: "74.125.40.8", sev: "ok" },
  { who: "Oleg M.", what: "deleted department", det: 'name: "Pilot team" · 0 users', when: "yesterday", ip: "89.216.84.12", sev: "warn" },
  { who: "Nia Vargas", what: "exported data", det: "users.csv · 208 rows", when: "2 days ago", ip: "5.62.148.10", sev: "warn" },
];

export function Audit() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Audit log</div>
        <div className="set-page-sub">
          Workspace-wide event history. Retained for 90 days on Business, 2 years on Enterprise.
        </div>
      </div>

      <div className="set-toolbar">
        <div className="search">
          <I.Search size={13} />
          <input className="search-input" placeholder="Search by actor, event, IP…" />
        </div>
        <select className="set-select" style={{ height: 28, width: 140 }} defaultValue="All events">
          <option>All events</option>
          <option>Sign-in</option>
          <option>Members</option>
          <option>Settings</option>
          <option>API keys</option>
        </select>
        <select className="set-select" style={{ height: 28, width: 130 }} defaultValue="Last 7 days">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Custom range</option>
        </select>
        <div style={{ flex: 1 }} />
        <button type="button" className="ds-btn-outline" style={{ height: 28 }}>
          <I.Download size={12} /> Export
        </button>
      </div>

      <div className="set-block" style={{ padding: 0 }}>
        {ROWS.map((r, i) => (
          <div className="audit-row" key={i}>
            <span
              className={`audit-dot ${
                r.sev === "warn" ? "warn" : r.sev === "danger" ? "danger" : ""
              }`}
            />
            <div>
              <span className="audit-actor">{r.who}</span>{" "}
              <span className="audit-event">
                {r.what} · <code>{r.det}</code>
              </span>
            </div>
            <div className="audit-meta">{r.ip}</div>
            <div className="audit-meta" style={{ textAlign: "right" }}>
              {r.when}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
