"use client";

import { useState, useMemo, useCallback } from "react";
import type { User } from "../types";
import { PER_PAGE } from "../lib/palette";

// ── types ─────────────────────────────────────────────────────────────────────

export type SortKey = "firstName" | "lastName" | "age" | "dept";
export type ViewMode = "grid" | "list";

export interface Filters {
  q: string;
  role: string;
  department: string;
  title: string;
  gender: string;
  country: string;
  state: string;
}

export const EMPTY_FILTERS: Filters = {
  q: "", role: "", department: "", title: "", gender: "", country: "", state: "",
};

// ── pure helpers ──────────────────────────────────────────────────────────────

export function statPct(n: number, total: number) {
  return total ? `${Math.round((n / total) * 100)}%` : "0%";
}

function applyFilters(users: User[], filters: Filters, ageFilter: [number, number] | null): User[] {
  let r = users;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    r = r.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.username}`.toLowerCase().includes(q),
    );
  }
  if (filters.role)       r = r.filter((u) => u.role === filters.role);
  if (filters.gender)     r = r.filter((u) => u.gender === filters.gender);
  if (filters.department) r = r.filter((u) => u.company.department === filters.department);
  if (filters.title)      r = r.filter((u) => u.company.title === filters.title);
  if (filters.country)    r = r.filter((u) => u.address.country === filters.country);
  if (filters.state)      r = r.filter((u) => u.address.state === filters.state);
  if (ageFilter)          r = r.filter((u) => u.age >= ageFilter[0] && u.age <= ageFilter[1]);
  return r;
}

function sortUsers(users: User[], sort: SortKey): User[] {
  return [...users].sort((a, b) => {
    if (sort === "lastName") return a.lastName.localeCompare(b.lastName);
    if (sort === "age")      return a.age - b.age;
    if (sort === "dept")     return a.company.department.localeCompare(b.company.department);
    return a.firstName.localeCompare(b.firstName);
  });
}

export function computeStats(filtered: User[]) {
  const total = filtered.length;
  if (!total) return { total: 0, admins: 0, moderators: 0, avgAge: 0, topDept: "—", femalePct: 0 };

  const admins     = filtered.filter((u) => u.role === "admin").length;
  const moderators = filtered.filter((u) => u.role === "moderator").length;
  const avgAge     = Math.round(filtered.reduce((s, u) => s + u.age, 0) / total);

  const deptMap = new Map<string, number>();
  filtered.forEach((u) => deptMap.set(u.company.department, (deptMap.get(u.company.department) ?? 0) + 1));
  const topDept   = [...deptMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const femalePct = Math.round((filtered.filter((u) => u.gender === "female").length / total) * 100);

  return { total, admins, moderators, avgAge, topDept, femalePct };
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(users: User[]) {
  const [filters, setFilters]       = useState<Filters>(EMPTY_FILTERS);
  const [ageFilter, setAgeFilter]   = useState<[number, number] | null>(null);
  const [sort, setSort]             = useState<SortKey>("firstName");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<User | null>(null);
  const [view, setView]             = useState<ViewMode>("grid");
  const [showCharts, setShowCharts] = useState(false);
  const [showMore, setShowMore]     = useState(false);

  // ── age bounds ──────────────────────────────────────────────────────────────

  const ageRange = useMemo(() => {
    const ages = users.map((u) => u.age);
    return { min: Math.min(...ages), max: Math.max(...ages) };
  }, [users]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const setFilter = useCallback((key: keyof Filters, val: string) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
    setSelected(null);
  }, []);

  const applyPreset = useCallback((department: string) => {
    setFilters({ ...EMPTY_FILTERS, department });
    setAgeFilter(null);
    setPage(1);
    setSelected(null);
  }, []);

  const clear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setAgeFilter(null);
    setPage(1);
    setSelected(null);
  }, []);

  const onAgeChange = useCallback((v: [number, number] | null) => {
    setAgeFilter(v);
    setPage(1);
    setSelected(null);
  }, []);

  const toggleSelected = useCallback((user: User) => {
    setSelected((prev) => (prev?.id === user.id ? null : user));
  }, []);

  // ── derived data ─────────────────────────────────────────────────────────────

  const filtered = useMemo(
    () => sortUsers(applyFilters(users, filters, ageFilter), sort),
    [users, filters, ageFilter, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageUsers  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const hasFilters = Boolean(
    filters.q || filters.role || filters.department || filters.title ||
    filters.gender || filters.country || filters.state || ageFilter,
  );

  return {
    // ui state
    view, setView,
    showCharts, setShowCharts,
    showMore, setShowMore,
    // filter state
    filters, ageFilter, sort, setSort,
    hasFilters,
    // selection
    selected, toggleSelected, setSelected,
    // pagination
    page, setPage, safePage, totalPages,
    // actions
    setFilter, applyPreset, clear, onAgeChange,
    // computed
    ageRange, filtered, pageUsers, stats,
  };
}
