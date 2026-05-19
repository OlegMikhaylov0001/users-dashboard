"use client";

import { useEffect, useRef, useState } from "react";
import { I } from "../icons";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipProps {
  label: string;
  value: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  onClear: () => void;
  searchable?: boolean;
}

export function FilterChip({ label, value, options, onSelect, onClear, searchable = false }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const active = Boolean(value);
  const display = active ? options.find((o) => o.value === value)?.label ?? label : label;

  const filtered = searchable && q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, r.left) });
    const onDoc = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={"filter-chip" + (active ? " active" : "")}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{display}</span>
        {active ? (
          <span
            className="filter-chip-x"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <I.X size={11} />
          </span>
        ) : (
          <I.ChevDown size={11} style={{ opacity: 0.6 }} />
        )}
      </button>
      {open && pos && (
        <div ref={popRef} className="popover" style={{ top: pos.top, left: pos.left, width: searchable ? 240 : 200 }}>
          {searchable && (
            <div className="popover-search">
              <input
                autoFocus
                placeholder={`Search ${label.toLowerCase()}…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          <div style={{ maxHeight: 260, overflow: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--fg-tertiary)" }}>No results</div>
            )}
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                className={"popover-item" + (o.value === value ? " active" : "")}
                onClick={() => {
                  onSelect(o.value);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span style={{ flex: 1 }}>{o.label}</span>
                {o.value === value && <I.Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
