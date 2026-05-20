"use client";

import { I } from "../../icons";

interface Perm {
  name: string;
  hint: string;
  owner: boolean;
  admin: boolean;
  member: boolean;
  viewer: boolean;
}

const PERMS: Perm[] = [
  { name: "View users", hint: "See the users table", owner: true, admin: true, member: true, viewer: true },
  { name: "Edit user details", hint: "Update name, role, department", owner: true, admin: true, member: false, viewer: false },
  { name: "Invite people", hint: "Send workspace invitations", owner: true, admin: true, member: false, viewer: false },
  { name: "Manage departments", hint: "Add, rename, delete departments", owner: true, admin: true, member: false, viewer: false },
  { name: "Manage tags", hint: "Create and apply workspace tags", owner: true, admin: true, member: true, viewer: false },
  { name: "View billing", hint: "See plan and invoices", owner: true, admin: false, member: false, viewer: false },
  { name: "Manage API keys", hint: "Create and revoke workspace keys", owner: true, admin: true, member: false, viewer: false },
  { name: "Delete workspace", hint: "Irreversible. Owners only.", owner: true, admin: false, member: false, viewer: false },
];

function Cell({ on }: { on: boolean }) {
  return on ? (
    <span className="perm-check">
      <I.Check size={11} stroke={3} />
    </span>
  ) : (
    <span className="perm-dash">—</span>
  );
}

export function Roles() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Roles &amp; permissions</div>
        <div className="set-page-sub">
          Four built-in roles. Custom roles available on Enterprise plans.
        </div>
      </div>
      <div className="set-block" style={{ padding: 0 }}>
        <table className="perm-matrix">
          <thead>
            <tr>
              <th>Permission</th>
              <th className="role-col">Owner</th>
              <th className="role-col">Admin</th>
              <th className="role-col">Member</th>
              <th className="role-col">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {PERMS.map((p) => (
              <tr key={p.name}>
                <td>
                  <div className="perm-name">{p.name}</div>
                  <div className="perm-hint">{p.hint}</div>
                </td>
                <td className="role-col">
                  <Cell on={p.owner} />
                </td>
                <td className="role-col">
                  <Cell on={p.admin} />
                </td>
                <td className="role-col">
                  <Cell on={p.member} />
                </td>
                <td className="role-col">
                  <Cell on={p.viewer} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="ds-btn-outline">
        <I.Plus size={12} /> Create custom role{" "}
        <span className="set-nav-item-pill pro" style={{ marginLeft: 6 }}>
          Enterprise
        </span>
      </button>
    </div>
  );
}
