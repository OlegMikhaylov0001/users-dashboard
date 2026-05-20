"use client";

import { I } from "../icons";

interface Props {
  onClose: () => void;
}

export function InviteComposer({ onClose }: Props) {
  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-head">
          <div className="inv-modal-icon">
            <I.Mail size={15} />
          </div>
          <div>
            <div className="inv-modal-title">Send invitations</div>
            <div className="inv-modal-sub">26 seats remaining on the Business plan</div>
          </div>
          <button type="button" className="inv-modal-close" onClick={onClose}>
            <I.X size={14} />
          </button>
        </div>

        <div className="inv-modal-body">
          <div className="inv-field">
            <div className="inv-field-label">Email addresses</div>
            <div className="inv-chip-input">
              <span className="inv-email-chip">
                nia.vargas@acme.io{" "}
                <span className="x">
                  <I.X size={9} />
                </span>
              </span>
              <span className="inv-email-chip">
                theo.gunnarsson@acme.io{" "}
                <span className="x">
                  <I.X size={9} />
                </span>
              </span>
              <span className="inv-email-chip">
                ruth.mwangi@acme.io{" "}
                <span className="x">
                  <I.X size={9} />
                </span>
              </span>
              <span className="inv-email-chip error">
                marco@invalid{" "}
                <span className="x">
                  <I.X size={9} />
                </span>
              </span>
              <input placeholder="Add another email and press Enter…" defaultValue="" />
              <div className="inv-chip-input-info">
                <span>
                  <b style={{ color: "var(--fg-secondary)" }}>3 valid</b> · 1 invalid
                </span>
                <span style={{ marginLeft: "auto" }}>
                  Separate with comma, space, or newline
                </span>
              </div>
            </div>
          </div>

          <div className="inv-grid-2">
            <div className="inv-field">
              <div className="inv-field-label">Role</div>
              <select className="inv-select" defaultValue="Member · can edit users">
                <option>Member · can edit users</option>
                <option>Admin · can manage workspace</option>
                <option>Viewer · read-only</option>
              </select>
            </div>
            <div className="inv-field">
              <div className="inv-field-label">
                Department{" "}
                <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>(optional)</span>
              </div>
              <select className="inv-select" defaultValue="— No department —">
                <option>— No department —</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Sales</option>
                <option>Human Resources</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
            </div>
          </div>

          <div className="inv-field">
            <div className="inv-field-label">
              Personal message{" "}
              <span style={{ color: "var(--fg-muted)", fontWeight: 400, marginLeft: 4 }}>
                (optional)
              </span>
            </div>
            <textarea
              className="inv-textarea"
              defaultValue="Hey — welcome to the team. Ping me on Slack if you need anything getting set up."
              placeholder="A note that will appear in the invitation email."
            />
          </div>

          <div className="inv-grid-2">
            <div className="inv-field">
              <div className="inv-field-label">Expires in</div>
              <select className="inv-select" defaultValue="14">
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days (default)</option>
                <option value="30">30 days</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div className="inv-field">
              <div className="inv-field-label">Notify on accept</div>
              <select className="inv-select" defaultValue="Just me">
                <option>Just me</option>
                <option>Me + workspace admins</option>
                <option>No one</option>
              </select>
            </div>
          </div>

          <div className="inv-preview">
            <b>3 invitations</b> will be sent now. Recipients can accept until{" "}
            <b>Nov 14, 2026</b>. They&rsquo;ll join as <b>Member · Engineering</b> and you&rsquo;ll
            be notified when they accept.
          </div>
        </div>

        <div className="inv-modal-foot">
          <div className="hint">
            Prefer a link?{" "}
            <a
              href="#"
              className="console-link"
              style={{ color: "var(--accent-fg)", fontWeight: 500 }}
            >
              Share an invite link →
            </a>
          </div>
          <button type="button" className="btn-md-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-md-primary">
            <I.Send size={12} /> Send 3 invitations
          </button>
        </div>
      </div>
    </div>
  );
}
