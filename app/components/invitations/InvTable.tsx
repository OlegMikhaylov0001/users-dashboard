"use client";

import { I } from "../icons";
import { emailInitials, statusLabel, type InvRow, type InvTab } from "./data";

interface Props {
  rows: InvRow[];
  tab: InvTab;
}

export function InvTable({ rows, tab }: Props) {
  return (
    <div className="inv-table-wrap">
      <table className="inv-table">
        <thead>
          <tr>
            <th style={{ width: 28, paddingRight: 0 }}>
              <span className="inv-check" />
            </th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Invited by</th>
            <th>{tab === "accepted" ? "Accepted" : tab === "expired" ? "Expired" : "Expires"}</th>
            <th>Status</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email}>
              <td style={{ paddingRight: 0 }}>
                <span className="inv-check" />
              </td>
              <td>
                <div className="inv-email">
                  <div className="inv-email-bubble">{emailInitials(r.email)}</div>
                  <div className="inv-email-text">
                    <span className="inv-email-addr">{r.email}</span>
                    {r.msg && <span className="inv-email-msg">{r.msg}</span>}
                  </div>
                </div>
              </td>
              <td>
                <span className={`role-pill ${r.role === "Admin" ? "owner" : ""}`}>{r.role}</span>
              </td>
              <td
                style={{ color: r.dept === "—" ? "var(--fg-muted)" : "var(--fg-secondary)" }}
              >
                {r.dept}
              </td>
              <td>
                <div className="inv-by">
                  <span
                    className="inv-by-avatar"
                    style={{
                      background: `oklch(0.94 0.012 ${r.byHue})`,
                      color: `oklch(0.42 0.10 ${r.byHue})`,
                    }}
                  >
                    {r.byInitials}
                  </span>
                  <span>{r.by}</span>
                  <span style={{ color: "var(--fg-tertiary)", fontSize: 11 }}>· {r.sent}</span>
                </div>
              </td>
              <td>
                <span
                  className={`inv-expires ${r.soon ? "soon" : ""} ${
                    r.status === "expired" ? "overdue" : ""
                  }`}
                >
                  {r.accepted || r.expires}
                </span>
              </td>
              <td>
                <span className={`inv-status ${r.status}`}>
                  {r.status === "reminded" && <I.Bell size={9} />}
                  {r.status === "accepted" && <I.Check size={9} stroke={3} />}
                  {statusLabel(r.status)}
                </span>
              </td>
              <td className="col-actions">
                {tab === "pending" && (
                  <div className="inv-row-actions">
                    <button type="button" className="inv-row-action" title="Copy link">
                      <I.Copy size={11} /> Copy
                    </button>
                    <button type="button" className="inv-row-action">
                      <I.Send size={11} /> Resend
                    </button>
                    <button type="button" className="inv-row-action danger">
                      <I.X size={11} /> Revoke
                    </button>
                  </div>
                )}
                {tab === "accepted" && (
                  <div className="inv-row-actions">
                    <button type="button" className="inv-row-action">
                      <I.ArrowUpRight size={11} /> View profile
                    </button>
                  </div>
                )}
                {tab === "expired" && (
                  <div className="inv-row-actions">
                    <button type="button" className="inv-row-action">
                      <I.Send size={11} /> Reinvite
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
