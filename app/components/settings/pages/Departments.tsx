"use client";

import { I } from "../../icons";

const DEPTS: [string, number, string][] = [
  ["Engineering", 96, "#6F50D9"],
  ["Design", 18, "#0E8EA8"],
  ["Marketing", 23, "#C66837"],
  ["Sales", 29, "#0F8C6D"],
  ["Human Resources", 12, "#C8456F"],
  ["Finance", 11, "#3F75D6"],
  ["Operations", 9, "#7B7B7B"],
  ["Legal", 5, "#5A5A5A"],
  ["Customer Support", 5, "#A95FB6"],
];

export function Departments() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Departments</div>
        <div className="set-page-sub">
          Used to group users in the table and charts. Drag to reorder — order is preserved in
          filter dropdowns.
        </div>
      </div>

      <div className="set-toolbar">
        <div className="search">
          <I.Search size={13} />
          <input className="search-input" placeholder="Search departments…" />
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="ds-btn-primary" style={{ height: 28 }}>
          <I.Plus size={12} /> New department
        </button>
      </div>

      <div className="set-block">
        <div className="editable-list">
          {DEPTS.map(([name, count, color]) => (
            <div className="editable-row" key={name}>
              <span className="editable-handle">⠿</span>
              <div>
                <span className="editable-name">{name}</span>
                <span className="editable-meta" style={{ marginLeft: 8 }}>
                  {count} users
                </span>
              </div>
              <span className="tag-chip" style={{ background: `${color}1a`, color }}>
                <span className="tag-color" style={{ background: color }} />
                {color}
              </span>
              <div className="set-actions">
                <button type="button" className="ds-icon-btn" title="Rename">
                  <I.Edit size={12} />
                </button>
                <button type="button" className="ds-icon-btn" title="Delete">
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
