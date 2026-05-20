"use client";

import { I } from "../../icons";

export function Appearance() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Appearance</div>
        <div className="set-page-sub">Personal preferences — only applies to your account.</div>
      </div>
      <div className="set-block">
        <div className="set-block-body">
          <div className="set-field">
            <div>
              <div className="set-field-label">Theme</div>
              <div className="set-field-hint">Auto follows your operating system.</div>
            </div>
            <div className="set-field-control">
              <div className="s-seg">
                <button type="button">
                  <I.Sun size={11} /> Light
                </button>
                <button type="button">Auto</button>
                <button type="button">
                  <I.Moon size={11} /> Dark
                </button>
              </div>
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Row density</div>
              <div className="set-field-hint">Affects only the users table.</div>
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
              <div className="set-field-label">Show charts strip</div>
              <div className="set-field-hint">The 4-card chart row above the users table.</div>
            </div>
            <div className="set-field-control" style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="s-toggle on" />
            </div>
          </div>
          <div className="set-field">
            <div>
              <div className="set-field-label">Reduce motion</div>
              <div className="set-field-hint">Disables panel and modal animations.</div>
            </div>
            <div className="set-field-control" style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="s-toggle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
