import type { User } from "../types";

export const PER_PAGE = 8;
export const ACCENT = "#185FA5";

type PEntry = { bg: string; fg: string; dBg: string; dFg: string };

export const PALETTE: PEntry[] = [
  { bg: "#E6F1FB", fg: "#185FA5", dBg: "rgba(24,95,165,0.22)",  dFg: "#60A5FA" },
  { bg: "#EAF3DE", fg: "#3B6D11", dBg: "rgba(59,109,17,0.22)",  dFg: "#86EFAC" },
  { bg: "#FAEEDA", fg: "#854F0B", dBg: "rgba(133,79,11,0.22)",  dFg: "#FCD34D" },
  { bg: "#EEEDFE", fg: "#534AB7", dBg: "rgba(83,74,183,0.22)",  dFg: "#A5B4FC" },
  { bg: "#E1F5EE", fg: "#0F6E56", dBg: "rgba(15,110,86,0.22)",  dFg: "#6EE7B7" },
  { bg: "#FBEAF0", fg: "#993556", dBg: "rgba(153,53,86,0.22)",  dFg: "#F9A8D4" },
  { bg: "#FAECE7", fg: "#993C1D", dBg: "rgba(153,60,29,0.22)",  dFg: "#FCA5A5" },
  { bg: "#F1EFE8", fg: "#5F5E5A", dBg: "rgba(95,94,90,0.22)",   dFg: "#D4D4D8" },
];

export function paletteFor(name: string, isDark: boolean): { bg: string; fg: string } {
  const p = PALETTE[((name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)) % PALETTE.length];
  return isDark ? { bg: p.dBg, fg: p.dFg } : { bg: p.bg, fg: p.fg };
}

export function initials(user: User): string {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
}
