"use client";

import { I } from "../../icons";

interface ApiKey {
  name: string;
  scope: string;
  key: string;
  last: string;
  status: "green" | "amber";
}

interface Webhook {
  url: string;
  events: string;
  last: string;
  status: "green" | "amber";
}

const KEYS: ApiKey[] = [
  { name: "Production", scope: "read, write", key: "ub_live_…7f9a", last: "2 min ago", status: "green" },
  { name: "CI / Backups", scope: "read", key: "ub_live_…3c1b", last: "1 hr ago", status: "green" },
  { name: "Legacy import", scope: "read, write", key: "ub_live_…0a44", last: "6 months ago", status: "amber" },
];

const HOOKS: Webhook[] = [
  { url: "https://hooks.acme.io/userbase", events: "user.created · user.updated · user.deleted", last: "12s ago", status: "green" },
  { url: "https://api.zapier.com/hooks/catch/8…/c4f", events: "* (all events)", last: "4 min ago", status: "green" },
  { url: "https://internal.acme.io/audit", events: "audit.* · billing.*", last: "3 days ago — last 4xx", status: "amber" },
];

export function Api() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">API &amp; Webhooks</div>
        <div className="set-page-sub">
          Workspace-level API keys and outgoing webhook endpoints. Personal access tokens live in
          your account settings.
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head" style={{ display: "flex", alignItems: "center" }}>
          <div>
            <div className="set-block-title">API keys</div>
            <div className="set-block-sub">3 keys · last rotation 4 days ago</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button type="button" className="ds-btn-primary" style={{ height: 28 }}>
              <I.Plus size={12} /> Create key
            </button>
          </div>
        </div>
        <div>
          {KEYS.map((k) => (
            <div className="api-row" key={k.name}>
              <div className="api-icon">
                <I.Bolt size={14} />
              </div>
              <div>
                <div className="api-name">
                  {k.name}{" "}
                  <span className={`status-pill ${k.status}`} style={{ marginLeft: 6 }}>
                    {k.status === "green" ? "active" : "inactive"}
                  </span>
                </div>
                <div className="api-key">
                  <code>{k.key}</code> · scope: {k.scope}
                </div>
                <div className="api-meta">Last used {k.last}</div>
              </div>
              <div className="set-actions">
                <button type="button" className="ds-btn-outline" style={{ height: 26 }}>
                  <I.Copy size={11} /> Copy
                </button>
                <button type="button" className="ds-btn-outline" style={{ height: 26 }}>
                  Rotate
                </button>
                <button type="button" className="ds-icon-btn">
                  <I.Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head" style={{ display: "flex", alignItems: "center" }}>
          <div>
            <div className="set-block-title">Webhooks</div>
            <div className="set-block-sub">
              POST to your endpoint when workspace events fire. Signed with HMAC-SHA256.
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button type="button" className="ds-btn-primary" style={{ height: 28 }}>
              <I.Plus size={12} /> Add endpoint
            </button>
          </div>
        </div>
        <div>
          {HOOKS.map((w) => (
            <div className="api-row" key={w.url}>
              <div className="api-icon">
                <I.Send size={14} />
              </div>
              <div>
                <div className="api-name" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                  {w.url}{" "}
                  <span className={`status-pill ${w.status}`} style={{ marginLeft: 6 }}>
                    {w.status === "green" ? "healthy" : "failing"}
                  </span>
                </div>
                <div className="api-meta" style={{ marginTop: 4 }}>
                  {w.events}
                </div>
                <div className="api-meta">Last delivery {w.last}</div>
              </div>
              <div className="set-actions">
                <button type="button" className="ds-btn-outline" style={{ height: 26 }}>
                  Test
                </button>
                <button type="button" className="ds-btn-outline" style={{ height: 26 }}>
                  Logs
                </button>
                <button type="button" className="ds-icon-btn">
                  <I.Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Rate limits</div>
          <div className="set-block-sub">Current window usage on the Business plan.</div>
        </div>
        <div className="set-block-body">
          <div className="usage-row">
            <span>Read requests</span>
            <div className="usage-bar">
              <div className="usage-bar-fill" style={{ width: "34%" }} />
            </div>
            <span className="usage-num">3,412 / 10,000</span>
          </div>
          <div className="usage-row">
            <span>Write requests</span>
            <div className="usage-bar">
              <div className="usage-bar-fill warn" style={{ width: "78%" }} />
            </div>
            <span className="usage-num">782 / 1,000</span>
          </div>
          <div className="usage-row">
            <span>Webhook deliveries</span>
            <div className="usage-bar">
              <div className="usage-bar-fill" style={{ width: "12%" }} />
            </div>
            <span className="usage-num">1,204 / 10,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
