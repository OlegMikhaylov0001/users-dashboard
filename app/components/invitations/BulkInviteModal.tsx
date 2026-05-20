"use client";

import { I } from "../icons";

interface Props {
  onClose: () => void;
}

export function BulkInviteModal({ onClose }: Props) {
  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-head">
          <div className="inv-modal-icon">
            <I.Download size={15} style={{ transform: "scaleY(-1)" }} />
          </div>
          <div>
            <div className="inv-modal-title">Bulk invite via CSV</div>
            <div className="inv-modal-sub">Upload a list — we&rsquo;ll preview before sending.</div>
          </div>
          <button type="button" className="inv-modal-close" onClick={onClose}>
            <I.X size={14} />
          </button>
        </div>

        <div className="inv-modal-body">
          <div className="inv-dropzone">
            <div className="inv-dropzone-icon">
              <I.Download size={17} style={{ transform: "scaleY(-1)" }} />
            </div>
            <div className="inv-dropzone-title">Drop a CSV here or click to choose</div>
            <div className="inv-dropzone-sub">Max 500 rows · ~12 KB</div>
            <div className="inv-dropzone-format">email, role, department</div>
          </div>

          <div className="inv-field">
            <div className="inv-field-label">
              Preview{" "}
              <span style={{ color: "var(--fg-muted)", fontWeight: 400, marginLeft: 4 }}>
                4 of 4 rows · 1 invalid
              </span>
            </div>
            <div className="inv-csv-preview">
              <div className="inv-csv-preview-head">
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                  email
                </span>
                <span style={{ width: 80, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                  role
                </span>
                <span style={{ width: 100, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                  department
                </span>
                <span style={{ width: 24 }}></span>
              </div>
              <div className="inv-csv-preview-row">
                <span>nia.vargas@acme.io</span>
                <span>member</span>
                <span>HR</span>
                <span style={{ color: "var(--green)" }}>
                  <I.Check size={12} stroke={2.5} />
                </span>
              </div>
              <div className="inv-csv-preview-row">
                <span>theo.gunnarsson@acme.io</span>
                <span>admin</span>
                <span>Engineering</span>
                <span style={{ color: "var(--green)" }}>
                  <I.Check size={12} stroke={2.5} />
                </span>
              </div>
              <div className="inv-csv-preview-row">
                <span>ruth.mwangi@acme.io</span>
                <span>member</span>
                <span>Finance</span>
                <span style={{ color: "var(--green)" }}>
                  <I.Check size={12} stroke={2.5} />
                </span>
              </div>
              <div className="inv-csv-preview-row error">
                <span>marco@invalid</span>
                <span>member</span>
                <span>(unknown)</span>
                <span style={{ color: "oklch(0.5 0.18 25)" }}>
                  <I.X size={12} />
                </span>
                <span className="err-msg">
                  Row 4: invalid email and unknown department &ldquo;(unknown)&rdquo;
                </span>
              </div>
            </div>
          </div>

          <div className="inv-grid-2">
            <div className="inv-field">
              <div className="inv-field-label">Default role for missing</div>
              <select className="inv-select" defaultValue="Member">
                <option>Member</option>
                <option>Viewer</option>
                <option>Skip row</option>
              </select>
            </div>
            <div className="inv-field">
              <div className="inv-field-label">If invalid</div>
              <select className="inv-select" defaultValue="Skip and continue">
                <option>Skip and continue</option>
                <option>Abort import</option>
              </select>
            </div>
          </div>
        </div>

        <div className="inv-modal-foot">
          <div className="hint">
            Need a template?{" "}
            <a
              href="#"
              className="console-link"
              style={{ color: "var(--accent-fg)", fontWeight: 500 }}
            >
              Download CSV template →
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
