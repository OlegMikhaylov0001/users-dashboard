"use client";

interface Integration {
  logo: "slack" | "github" | "gcal" | "webhook";
  name: string;
  desc: string;
  status: "connected" | "off";
  meta: string;
}

const INTEGRATIONS: Integration[] = [
  {
    logo: "slack",
    name: "Slack",
    desc: "Post workspace alerts to a channel and let admins manage users with /userbase commands.",
    status: "connected",
    meta: "#user-base-alerts",
  },
  {
    logo: "github",
    name: "GitHub",
    desc: "Auto-deprovision users when their GitHub access is revoked.",
    status: "connected",
    meta: "org: acme-inc",
  },
  {
    logo: "gcal",
    name: "Google Calendar",
    desc: "Show \"Out of office\" status on user profiles using calendar events.",
    status: "off",
    meta: "Not connected",
  },
  {
    logo: "webhook",
    name: "Zapier",
    desc: "6,000+ apps. Trigger workflows from user events.",
    status: "off",
    meta: "Not connected",
  },
];

export function Integrations() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Integrations</div>
        <div className="set-page-sub">
          Pre-built apps that sync with the workspace. Custom integrations live under API &amp;
          Webhooks.
        </div>
      </div>

      <div className="int-grid">
        {INTEGRATIONS.map((i) => (
          <div className="int-card" key={i.name}>
            <div className="int-card-head">
              <div className={`int-logo ${i.logo}`}>{i.name[0]}</div>
              <div>
                <div className="int-name">{i.name}</div>
                <div className="int-desc">{i.desc}</div>
              </div>
            </div>
            <div className="int-card-foot">
              <span className={`int-status ${i.status === "off" ? "off" : ""}`}>
                {i.status === "off" ? "Not connected" : "Connected"}
              </span>
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>· {i.meta}</span>
              <div style={{ marginLeft: "auto" }}>
                {i.status === "off" ? (
                  <button
                    type="button"
                    className="ds-btn-primary"
                    style={{ height: 26, fontSize: 11.5 }}
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ds-btn-outline"
                    style={{ height: 26, fontSize: 11.5 }}
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
