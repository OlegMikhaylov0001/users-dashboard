"use client";

export function Danger() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Danger zone</div>
        <div className="set-page-sub">Irreversible actions. Owners only.</div>
      </div>

      <div className="danger-block">
        <div className="set-block-head">
          <div className="set-block-title">Transfer ownership</div>
          <div className="set-block-sub">
            Hand the workspace over to another Owner. You&rsquo;ll be demoted to Admin.
          </div>
        </div>
        <div className="set-block-body">
          <div
            className="set-field"
            style={{ borderBottom: "none", padding: "14px 0 10px" }}
          >
            <div>
              <div className="set-field-label">New owner</div>
              <div className="set-field-hint">Must already be an Admin.</div>
            </div>
            <div
              className="set-field-control"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <select className="set-select" style={{ flex: 1 }} defaultValue="Emma Kowalski · emma@userbase.app">
                <option>Emma Kowalski · emma@userbase.app</option>
                <option>Jasper Tanaka · jasper@userbase.app</option>
              </select>
              <button type="button" className="btn-danger">
                Transfer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="danger-block">
        <div className="set-block-head">
          <div className="set-block-title">Suspend workspace</div>
          <div className="set-block-sub">
            Pauses access for everyone. You can resume from this page within 30 days.
          </div>
        </div>
        <div className="set-block-body">
          <div style={{ display: "flex", alignItems: "center", padding: "14px 0 10px", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 12, color: "var(--fg-secondary)" }}>
              All members will be signed out. The API will return{" "}
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: "var(--bg-hover)",
                  padding: "1px 5px",
                  borderRadius: 3,
                }}
              >
                503 Workspace Suspended
              </code>{" "}
              until resumed.
            </div>
            <button type="button" className="btn-danger">
              Suspend
            </button>
          </div>
        </div>
      </div>

      <div className="danger-block">
        <div className="set-block-head">
          <div className="set-block-title">Delete workspace</div>
          <div className="set-block-sub">
            Permanently delete UserBase, all 208 users, and all data. This cannot be undone.
          </div>
        </div>
        <div className="set-block-body">
          <div
            className="set-field"
            style={{ borderBottom: "none", padding: "14px 0 10px" }}
          >
            <div>
              <div className="set-field-label">Confirm name</div>
              <div className="set-field-hint">
                Type <b>UserBase</b> to enable the delete button.
              </div>
            </div>
            <div className="set-field-control" style={{ display: "flex", gap: 10 }}>
              <input className="set-input" placeholder="UserBase" style={{ flex: 1 }} />
              <button type="button" className="btn-danger primary">
                Delete workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
