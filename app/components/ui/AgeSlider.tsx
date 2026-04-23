"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const ACCENT = "#185FA5";

// ── AgeSlider (manual drag — no overlapping inputs) ───────────────────────────

interface AgeSliderProps {
  lo: number;
  hi: number;
  min: number;
  max: number;
  onChangeLo: (v: number) => void;
  onChangeHi: (v: number) => void;
}

export function AgeSlider({ lo, hi, min, max, onChangeLo, onChangeHi }: AgeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"lo" | "hi" | null>(null);
  const state = useRef({ lo, hi, min, max, onChangeLo, onChangeHi });
  state.current = { lo, hi, min, max, onChangeLo, onChangeHi };

  const range = max - min || 1;
  const pLo = ((lo - min) / range) * 100;
  const pHi = ((hi - min) / range) * 100;

  const getVal = useCallback((clientX: number) => {
    if (!trackRef.current) return state.current.min;
    const { left, width } = trackRef.current.getBoundingClientRect();
    return Math.round(
      state.current.min +
        Math.max(0, Math.min(1, (clientX - left) / width)) *
          (state.current.max - state.current.min),
    );
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const v = getVal(cx);
      const { lo, hi, min, max, onChangeLo, onChangeHi } = state.current;
      if (dragging.current === "lo") onChangeLo(Math.max(min, Math.min(v, hi - 1)));
      else onChangeHi(Math.min(max, Math.max(v, lo + 1)));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [getVal]);

  const startDrag = (thumb: "lo" | "hi") => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = thumb;
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging.current) return;
    const v = getVal(e.clientX);
    const { lo, hi, min, max } = state.current;
    if (Math.abs(v - lo) <= Math.abs(v - hi))
      state.current.onChangeLo(Math.max(min, Math.min(v, hi - 1)));
    else state.current.onChangeHi(Math.min(max, Math.max(v, lo + 1)));
  };

  return (
    <div className="relative h-5">
      <div
        ref={trackRef}
        className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-zinc-200 dark:bg-zinc-600 rounded-full cursor-pointer"
        onClick={onTrackClick}
      >
        <div
          className="absolute inset-y-0 rounded-full"
          style={{ left: `${pLo}%`, right: `${100 - pHi}%`, background: ACCENT }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm cursor-grab active:cursor-grabbing select-none z-10"
        style={{ left: `calc(${pLo}% - 8px)`, borderColor: ACCENT }}
        onMouseDown={startDrag("lo")}
        onTouchStart={startDrag("lo")}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm cursor-grab active:cursor-grabbing select-none z-10"
        style={{ left: `calc(${pHi}% - 8px)`, borderColor: ACCENT }}
        onMouseDown={startDrag("hi")}
        onTouchStart={startDrag("hi")}
      />
    </div>
  );
}

// ── AgeRangeChip ──────────────────────────────────────────────────────────────

interface AgeRangeChipProps {
  value: [number, number] | null;
  onChange: (v: [number, number] | null) => void;
  globalMin: number;
  globalMax: number;
}

export function AgeRangeChip({ value, onChange, globalMin, globalMax }: AgeRangeChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lo = value?.[0] ?? globalMin;
  const hi = value?.[1] ?? globalMax;
  const active = value !== null;

  useEffect(() => {
    function h(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, []);

  const setLo = useCallback(
    (v: number) => onChange(v === globalMin && hi === globalMax ? null : [v, hi]),
    [hi, globalMin, globalMax, onChange],
  );

  const setHi = useCallback(
    (v: number) => onChange(lo === globalMin && v === globalMax ? null : [lo, v]),
    [lo, globalMin, globalMax, onChange],
  );

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
        {active ? `Age: ${lo}–${hi}` : "Age"}
        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-4 w-56">
          <div className="flex justify-between text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            <span>{lo} y.o.</span>
            <span>{hi} y.o.</span>
          </div>
          <AgeSlider lo={lo} hi={hi} min={globalMin} max={globalMax} onChangeLo={setLo} onChangeHi={setHi} />
          {active && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-3 text-[13px] text-zinc-400 hover:text-red-500 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
