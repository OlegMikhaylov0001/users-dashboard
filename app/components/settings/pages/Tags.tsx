"use client";

import { I } from "../../icons";

const TAGS: [string, string, number][] = [
  ["high-performer", "oklch(0.65 0.15 155)", 18],
  ["flight-risk", "oklch(0.7 0.15 75)", 4],
  ["new-hire", "oklch(0.58 0.18 282)", 12],
  ["contractor", "oklch(0.6 0.15 240)", 7],
  ["remote", "oklch(0.55 0.06 270)", 102],
  ["onsite", "oklch(0.58 0.07 200)", 89],
  ["leadership", "oklch(0.6 0.18 25)", 5],
];

export function Tags() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Tags</div>
        <div className="set-page-sub">
          Apply tags to users for ad-hoc grouping. Tags can be combined with filters in the table.
        </div>
      </div>

      <div className="set-toolbar">
        <div className="search">
          <I.Search size={13} />
          <input className="search-input" placeholder="Search tags…" />
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="ds-btn-primary" style={{ height: 28 }}>
          <I.Plus size={12} /> New tag
        </button>
      </div>

      <div className="set-block">
        <div className="editable-list">
          {TAGS.map(([name, color, count]) => (
            <div className="editable-row" key={name}>
              <span className="editable-handle">⠿</span>
              <div>
                <span
                  className="tag-chip"
                  style={{
                    background: `color-mix(in oklab, ${color} 16%, var(--bg-elev))`,
                    color,
                  }}
                >
                  <span className="tag-color" style={{ background: color }} />
                  {name}
                </span>
                <span className="editable-meta" style={{ marginLeft: 10 }}>
                  {count} users
                </span>
              </div>
              <span />
              <div className="set-actions">
                <button type="button" className="ds-icon-btn">
                  <I.Edit size={12} />
                </button>
                <button type="button" className="ds-icon-btn">
                  <I.Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
