"use client";

import { useContext } from "react";
import { DarkCtx } from "../dark-ctx";
import { paletteFor } from "../../lib/palette";

export function DeptChip({ dept }: { dept: string }) {
  const isDark = useContext(DarkCtx);
  const { bg, fg } = paletteFor(dept, isDark);
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: bg, color: fg }}
    >
      {dept}
    </span>
  );
}
