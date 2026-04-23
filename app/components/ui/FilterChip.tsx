"use client";

import { useState, useRef, useEffect } from "react";

interface FilterChipProps {
  label: string;
  activeLabel: string;
  options: string[];
  onSelect: (v: string) => void;
  onClear: () => void;
}

export function FilterChip({ label, activeLabel, options, onSelect, onClear }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const active = Boolean(activeLabel);

  useEffect(() => {
    function h(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  const visible = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] border transition-colors whitespace-nowrap",
          active
            ? "border-[#185FA5] text-[#185FA5] bg-[#E6F1FB] dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600"
            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300",
        ].join(" ")}
      >
        {active ? activeLabel : label}
        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg min-w-[160px] max-w-[240px] overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full px-2 py-1.5 text-[13px] rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30"
              />
            </div>
          )}
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                  !active
                    ? "text-[#185FA5] font-medium bg-[#E6F1FB] dark:bg-blue-900/20 dark:text-blue-300"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            </li>
            {visible.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onSelect(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                    activeLabel === opt
                      ? "text-[#185FA5] font-medium bg-[#E6F1FB] dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-zinc-400">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
