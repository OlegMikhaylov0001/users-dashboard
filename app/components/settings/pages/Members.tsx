"use client";

import { I } from "../../icons";

interface Member {
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "online" | "pending" | "suspended";
  last: string;
  hue: number;
}

const MEMBERS: Member[] = [
  { name: "Oleg M.", email: "oleg@userbase.app", role: "Owner", status: "online", last: "now", hue: 30 },
  { name: "Emma Kowalski", email: "emma@userbase.app", role: "Admin", status: "online", last: "12 min ago", hue: 280 },
  { name: "Jasper Tanaka", email: "jasper@userbase.app", role: "Admin", status: "online", last: "32 min ago", hue: 200 },
  { name: "Aisha Habib", email: "aisha@userbase.app", role: "Member", status: "online", last: "1 hr ago", hue: 120 },
  { name: "Marco Silva", email: "marco@userbase.app", role: "Member", status: "online", last: "3 hr ago", hue: 60 },
  { name: "Nia Vargas", email: "nia@userbase.app", role: "Member", status: "pending", last: "invited", hue: 320 },
  { name: "Priya Ramesh", email: "priya@userbase.app", role: "Member", status: "online", last: "yesterday", hue: 0 },
  { name: "Liam O'Connor", email: "liam@userbase.app", role: "Viewer", status: "suspended", last: "2 weeks ago", hue: 240 },
];

export function Members() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Members</div>
        <div className="set-page-sub">
          People who can access this workspace. 24 of 50 seats used on the Business plan.
        </div>
      </div>

      <div className="set-toolbar">
        <div className="search">
          <I.Search size={13} />
          <input className="search-input" placeholder="Search members…" />
        </div>
        <select className="set-select" style={{ height: 28, width: 130 }} defaultValue="All roles">
          <option>All roles</option>
          <option>Owner</option>
          <option>Admin</option>
          <option>Member</option>
          <option>Viewer</option>
        </select>
        <select className="set-select" style={{ height: 28, width: 130 }} defaultValue="All statuses">
          <option>All statuses</option>
          <option>Online</option>
          <option>Pending</option>
          <option>Suspended</option>
        </select>
        <div style={{ flex: 1 }} />
        <button type="button" className="ds-btn-outline" style={{ height: 28 }}>
          <I.Download size={12} /> Export CSV
        </button>
        <button type="button" className="ds-btn-primary" style={{ height: 28 }}>
          <I.Plus size={12} /> Invite people
        </button>
      </div>

      <div className="set-block" style={{ padding: 0 }}>
        <table className="set-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last seen</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m) => (
              <tr key={m.email}>
                <td>
                  <div className="s-row-user">
                    <span
                      className="s-avatar"
                      style={{
                        background: `oklch(0.94 0.012 ${m.hue})`,
                        color: `oklch(0.42 0.10 ${m.hue})`,
                        borderColor: `oklch(0.88 0.025 ${m.hue})`,
                      }}
                    >
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="s-row-user-text">
                      <span className="s-row-user-name">{m.name}</span>
                      <span className="s-row-user-email">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className={`role-pill ${m.role === "Owner" ? "owner" : ""}`}
                  >
                    {m.role} <I.ChevDown size={10} />
                  </button>
                </td>
                <td>
                  <span>
                    <span className={`s-status-dot ${m.status}`} />
                    {m.status}
                  </span>
                </td>
                <td style={{ color: "var(--fg-tertiary)", fontSize: 11.5 }}>{m.last}</td>
                <td>
                  <button type="button" className="ds-icon-btn">
                    <I.More size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
