"use client";

interface RowProps {
  title: string;
  hint: string;
  email?: boolean;
  push?: boolean;
  slack?: boolean;
}

function Row({ title, hint, email = true, push = false, slack = false }: RowProps) {
  return (
    <div className="set-field">
      <div>
        <div className="set-field-label">{title}</div>
        <div className="set-field-hint">{hint}</div>
      </div>
      <div
        className="set-field-control"
        style={{ display: "flex", gap: 28, justifyContent: "flex-end" }}
      >
        {(["Email", "In-app", "Slack"] as const).map((label, idx) => {
          const on = [email, push, slack][idx];
          return (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--fg-tertiary)",
                }}
              >
                {label}
              </span>
              <div className={`s-toggle ${on ? "on" : ""}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Notifications() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Notifications</div>
        <div className="set-page-sub">
          What workspace events trigger a notification, and how it reaches you.
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Members</div>
        </div>
        <div className="set-block-body">
          <Row title="New member joined" hint="When someone accepts an invitation." email push slack />
          <Row title="Member role changed" hint="Promotion, demotion, or role removal." email />
          <Row title="Member deactivated" hint="When access is revoked." email push />
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Workspace</div>
        </div>
        <div className="set-block-body">
          <Row title="Plan limit approaching" hint="When usage hits 80% of any plan limit." email push slack />
          <Row title="API key created" hint="Audit-trail signal for security." email />
          <Row title="Audit log digest" hint="Weekly summary of admin actions, sent Monday 09:00." email />
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Delivery</div>
          <div className="set-block-sub">
            Tweak the rhythm of email batches and which Slack channel hears about workspace activity.
          </div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Email digest</div>
              <div className="set-field-hint">How often non-urgent emails are batched.</div>
            </div>
            <div className="set-field-control">
              <div className="s-seg">
                <button type="button">Off</button>
                <button type="button">Daily</button>
                <button type="button" className="on">Weekly</button>
                <button type="button">Monthly</button>
              </div>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Slack channel</div>
              <div className="set-field-hint">Channel where Slack alerts are posted.</div>
            </div>
            <div className="set-field-control">
              <div className="set-input-row">
                <span className="prefix">#</span>
                <input defaultValue="user-base-alerts" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
