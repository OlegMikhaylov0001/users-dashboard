import { createContext } from "react";
import type { User } from "../types";
import type { Filters } from "../hooks/useDashboard";

export interface DashboardCtxValue {
  users: User[];
  setFilter: (key: keyof Filters, val: string) => void;
  applyPreset: (department: string) => void;
  clear: () => void;
  onAgeChange: (v: [number, number] | null) => void;
  setSelected: (user: User | null) => void;
  getCurrentFilters: () => Filters & { ageFilter: [number, number] | null };
}

export const DashboardCtx = createContext<DashboardCtxValue | null>(null);
