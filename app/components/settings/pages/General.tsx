"use client";

import { useState } from "react";

const SWATCHES: [string, string][] = [
  ["#6F50D9", "indigo"],
  ["#3F75D6", "blue"],
  ["#0E8EA8", "teal"],
  ["#0F8C6D", "green"],
  ["#C66837", "orange"],
  ["#C8456F", "pink"],
];

export function General() {
  const [accent, setAccent] = useState("#6F50D9");

  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">General</div>
        <div className="set-page-sub">
          Basic workspace settings — name, identity, defaults. Visible to everyone in the workspace.
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Workspace</div>
          <div className="set-block-sub">Public identity used across the dashboard and emails.</div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Logo</div>
              <div className="set-field-hint">A 1:1 PNG or SVG, 256×256+ recommended.</div>
            </div>
            <div className="set-field-control">
              <div className="set-logo-upload">
                <div className="set-logo">U</div>
                <div className="set-logo-actions">
                  <button type="button" className="ds-btn-outline">Upload</button>
                  <button type="button" className="ds-btn-ghost">Remove</button>
                </div>
              </div>
            </div>
          </div>

          <div className="set-field">
            <div>
              <div className="set-field-label">Workspace name</div>
              <div className="set-field-hint">Shown in the sidebar and email subjects.</div>
            </div>
            <div className="set-field-control">
              <input className="set-input" defaultValue="UserBase" />
            </div>
          </div>

          <div className="set-field">
            <div>
              <div className="set-field-label">URL slug</div>
              <div className="set-field-hint">
                Used in workspace URLs. Lowercase letters, numbers and hyphens.
              </div>
            </div>
            <div className="set-field-control">
              <div className="set-input-row">
                <span className="prefix">userbase.app/</span>
                <input defaultValue="acme" />
              </div>
            </div>
          </div>

          <div className="set-field">
            <div>
              <div className="set-field-label">Description</div>
              <div className="set-field-hint">Optional one-liner shown on the workspace home.</div>
            </div>
            <div className="set-field-control">
              <textarea
                className="set-textarea"
                defaultValue="Internal user directory for Acme Corp — 208 humans across 9 departments."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Brand</div>
          <div className="set-block-sub">Accent color used throughout the dashboard.</div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Accent color</div>
              <div className="set-field-hint">Applies live across all surfaces.</div>
            </div>
            <div className="set-field-control">
              <div className="swatch-row">
                {SWATCHES.map(([c, name]) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch ${accent === c ? "active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setAccent(c)}
                    title={name}
                    aria-label={`Accent color ${name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Defaults</div>
          <div className="set-block-sub">What new members see when they first land in the workspace.</div>
        </div>
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Default view</div>
              <div className="set-field-hint">First page after sign-in.</div>
            </div>
            <div className="set-field-control">
              <select className="set-select" defaultValue="Users">
                <option>Users</option>
                <option>Charts</option>
                <option>Admins</option>
              </select>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Default density</div>
              <div className="set-field-hint">Compact fits more rows. Roomy is easier to scan.</div>
            </div>
            <div className="set-field-control">
              <div className="s-seg">
                <button type="button">Compact</button>
                <button type="button" className="on">Cozy</button>
                <button type="button">Roomy</button>
              </div>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Region</div>
              <div className="set-field-hint">Determines data residency.</div>
            </div>
            <div className="set-field-control">
              <select className="set-select" defaultValue="🇺🇸 United States (us-east-1)">
                <option>🇺🇸 United States (us-east-1)</option>
                <option>🇪🇺 Europe (eu-west-2)</option>
                <option>🇸🇬 Asia Pacific (ap-southeast-1)</option>
              </select>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Time zone</div>
              <div className="set-field-hint">Used for &ldquo;Last seen&rdquo; and audit log timestamps.</div>
            </div>
            <div className="set-field-control">
              <select className="set-select" defaultValue="(UTC+00:00) Coordinated Universal Time">
                <option>(UTC+00:00) Coordinated Universal Time</option>
                <option>(UTC−05:00) Eastern Time</option>
                <option>(UTC−08:00) Pacific Time</option>
                <option>(UTC+01:00) Central European Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
