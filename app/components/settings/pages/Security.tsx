"use client";

import { I } from "../../icons";

interface Session {
  icon: string;
  name: string;
  loc: string;
  when: string;
  current?: boolean;
}

const SESSIONS: Session[] = [
  { icon: "💻", name: "MacBook Pro · Chrome 127", loc: "Belgrade · 89.216.84.…", when: "Active now", current: true },
  { icon: "📱", name: "iPhone 15 · Safari", loc: "Belgrade · 89.216.84.…", when: "3 hr ago" },
  { icon: "💻", name: "Linux · Firefox 130", loc: "Amsterdam · 145.32.…", when: "2 days ago" },
  { icon: "💻", name: "Windows · Edge 126", loc: "Berlin · 188.40.…", when: "6 days ago" },
];

export function Security() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Security</div>
        <div className="set-page-sub">
          Workspace-wide security policies. Affects everyone, not just you.
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Sign-in</div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Single sign-on (SSO)</div>
              <div className="set-field-hint">
                SAML 2.0 connection. Enforces login via your identity provider.
              </div>
            </div>
            <div
              className="set-field-control"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <span className="status-pill green">Active · Okta</span>
              <button type="button" className="ds-btn-outline" style={{ height: 28 }}>
                Configure
              </button>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Require 2FA</div>
              <div className="set-field-hint">
                All members must enable two-factor authentication.
              </div>
            </div>
            <div className="set-field-control" style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="s-toggle on" />
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Allowed email domains</div>
              <div className="set-field-hint">Restrict who can be invited. Empty = anyone.</div>
            </div>
            <div className="set-field-control">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                <span
                  className="tag-chip"
                  style={{ background: "var(--bg-hover)", color: "var(--fg-secondary)" }}
                >
                  acme.io <I.X size={9} />
                </span>
                <span
                  className="tag-chip"
                  style={{ background: "var(--bg-hover)", color: "var(--fg-secondary)" }}
                >
                  userbase.app <I.X size={9} />
                </span>
              </div>
              <input className="set-input" placeholder="Add domain and press Enter…" />
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Sessions</div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Idle timeout</div>
              <div className="set-field-hint">
                Sign members out after this period of inactivity.
              </div>
            </div>
            <div className="set-field-control">
              <select className="set-select" defaultValue="2 hours">
                <option>Never</option>
                <option>30 minutes</option>
                <option>2 hours</option>
                <option>8 hours</option>
                <option>24 hours</option>
              </select>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Maximum session length</div>
              <div className="set-field-hint">
                Force re-authentication after this many days.
              </div>
            </div>
            <div className="set-field-control">
              <div className="set-input-row">
                <input defaultValue="30" type="number" />
                <span className="suffix">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head" style={{ display: "flex", alignItems: "center" }}>
          <div>
            <div className="set-block-title">Active sessions</div>
            <div className="set-block-sub">
              4 devices currently signed in across your account.
            </div>
          </div>
          <button
            type="button"
            className="ds-btn-outline"
            style={{ marginLeft: "auto", height: 28 }}
          >
            Sign out all
          </button>
        </div>
        <table className="set-table">
          <tbody>
            {SESSIONS.map((s) => (
              <tr key={s.name}>
                <td style={{ width: 32 }}>{s.icon}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {s.name}{" "}
                    {s.current && (
                      <span className="status-pill green" style={{ marginLeft: 6 }}>
                        this device
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>{s.loc}</div>
                </td>
                <td style={{ color: "var(--fg-tertiary)", fontSize: 11.5 }}>{s.when}</td>
                <td style={{ textAlign: "right" }}>
                  {!s.current && (
                    <button type="button" className="ds-btn-ghost">
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
