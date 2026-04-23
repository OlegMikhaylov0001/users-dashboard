"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "../types";
import { DarkCtx } from "./dark-ctx";
import { useDark } from "../hooks/useDark";
import { useDashboard } from "../hooks/useDashboard";
import { useIsMobile } from "../hooks/useIsMobile";
import { ACCENT, PER_PAGE } from "../lib/palette";
import { RoleDonut, AgeHistogram, DeptBar, GenderBreakdown } from "./Charts";
import { Sidebar } from "./Sidebar";
import { StatsCards } from "./StatsCards";
import { FilterChip } from "./ui/FilterChip";
import { AgeRangeChip } from "./ui/AgeSlider";
import { Pagination } from "./ui/Pagination";
import { UserCard } from "./users/UserCard";
import { UserRow } from "./users/UserRow";
import { UserModal } from "./users/UserModal";
import type { ViewMode } from "../hooks/useDashboard";

// ── types ─────────────────────────────────────────────────────────────────────

interface DashboardProps {
  users: User[];
  departments: string[];
  titles: string[];
  countries: string[];
  states: string[];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Dashboard({ users, departments, titles, countries, states }: DashboardProps) {
  const isDark    = useDark();
  const isMobile  = useIsMobile();
  const db        = useDashboard(users);

  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const closeSidebar = () => setSidebarOpen(false);

  // Reset infinite-scroll counter whenever the filtered list changes
  useEffect(() => {
    setMobileVisibleCount(PER_PAGE);
  }, [db.filtered]);

  // Infinite scroll — observe the sentinel element at list bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMobileVisibleCount((c) => c + PER_PAGE);
        }
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile]); // stable dep — functional updater avoids stale closures

  const mobileUsers  = db.filtered.slice(0, mobileVisibleCount);
  const hasMoreItems = mobileVisibleCount < db.filtered.length;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <DarkCtx.Provider value={isDark}>
      <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">

        {/* ── Topbar — h-14 (56px) so sidebar can use top-14 on mobile ── */}
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          </button>

          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" />
            </svg>
            <input
              type="text"
              value={db.filters.q}
              onChange={(e) => db.setFilter("q", e.target.value)}
              placeholder="Search by name, email or username…"
              className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:border-[#185FA5]"
              style={{ "--tw-ring-color": `${ACCENT}30` } as React.CSSProperties}
            />
          </div>

          {/* View toggle */}
          <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shrink-0">
            {(["grid", "list"] as ViewMode[]).map((v) => (
              <button key={v} type="button" onClick={() => db.setView(v)}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  db.view === v
                    ? "bg-zinc-100 dark:bg-zinc-700"
                    : "bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}>
                {v === "grid" ? (
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M2 8h12M2 12h12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content row ── */}
        <div className="flex flex-1 min-h-0">

          {/* Mobile backdrop — starts below topbar (top-14) */}
          {sidebarOpen && (
            <div
              className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/40 lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Sidebar — fixed below topbar on mobile, static on lg+ */}
          <div className={[
            "fixed top-14 bottom-0 left-0 z-40",
            "transition-transform duration-200 ease-in-out",
            "lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}>
            <Sidebar
              totalUsers={users.length}
              filters={db.filters}
              showCharts={db.showCharts}
              onClear={db.clear}
              onToggleCharts={() => db.setShowCharts((v) => !v)}
              onFilterRole={(role) => db.setFilter("role", role)}
              onApplyPreset={db.applyPreset}
              onClose={closeSidebar}
            />
          </div>

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* Filter bar – primary */}
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex-wrap">
              <FilterChip label="All roles"   activeLabel={db.filters.role}       options={["admin", "moderator", "user"]}
                onSelect={(v) => db.setFilter("role", v)}       onClear={() => db.setFilter("role", "")} />
              <FilterChip label="Department"  activeLabel={db.filters.department}  options={departments}
                onSelect={(v) => db.setFilter("department", v)} onClear={() => db.setFilter("department", "")} />
              <FilterChip label="All genders" activeLabel={db.filters.gender}      options={["male", "female"]}
                onSelect={(v) => db.setFilter("gender", v)}     onClear={() => db.setFilter("gender", "")} />
              {db.hasFilters && (
                <button type="button" onClick={db.clear}
                  className="text-[13px] text-zinc-400 hover:text-red-500 transition-colors px-1">
                  Clear all
                </button>
              )}
              <button type="button" onClick={() => db.setShowMore((v) => !v)}
                className="ml-auto text-[13px] text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-600 px-2.5 py-1 rounded-full hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors whitespace-nowrap">
                {db.showMore ? "↑ Less" : "+ More filters"}
              </button>
            </div>

            {/* Filter bar – secondary */}
            {db.showMore && (
              <div className="flex items-center gap-2 px-4 sm:px-5 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/20 shrink-0 flex-wrap">
                <FilterChip label="Job title" activeLabel={db.filters.title}   options={titles}
                  onSelect={(v) => db.setFilter("title", v)}   onClear={() => db.setFilter("title", "")} />
                <AgeRangeChip
                  value={db.ageFilter}
                  onChange={db.onAgeChange}
                  globalMin={db.ageRange.min}
                  globalMax={db.ageRange.max}
                />
                <FilterChip label="Country" activeLabel={db.filters.country} options={countries}
                  onSelect={(v) => db.setFilter("country", v)} onClear={() => db.setFilter("country", "")} />
                <FilterChip label="State"   activeLabel={db.filters.state}   options={states}
                  onSelect={(v) => db.setFilter("state", v)}   onClear={() => db.setFilter("state", "")} />
              </div>
            )}

            {/* Stats */}
            <StatsCards stats={db.stats} />

            {/* Charts strip */}
            {db.showCharts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                {[
                  { title: "Role distribution", content: <RoleDonut users={db.filtered} /> },
                  { title: "Gender balance",    content: <GenderBreakdown users={db.filtered} /> },
                  { title: "Age distribution",  content: <AgeHistogram users={db.filtered} /> },
                  { title: "Departments",       content: <DeptBar users={db.filtered} maxItems={6} /> },
                ].map(({ title, content }) => (
                  <div key={title} className="bg-white dark:bg-zinc-900 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                      {title}
                    </p>
                    {content}
                  </div>
                ))}
              </div>
            )}

            {/* List header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <span className="text-[13px] text-zinc-400 dark:text-zinc-500">
                <strong className="text-zinc-600 dark:text-zinc-300 font-medium">{db.filtered.length}</strong>
                <span className="hidden sm:inline"> users</span>
              </span>
              <div className="flex items-center gap-1.5 text-[13px] text-zinc-400 dark:text-zinc-500">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={db.sort}
                  onChange={(e) => { db.setSort(e.target.value as Parameters<typeof db.setSort>[0]); db.setPage(1); }}
                  className="border-none bg-transparent text-[13px] text-zinc-600 dark:text-zinc-300 cursor-pointer outline-none font-medium"
                >
                  <option value="firstName">First name A→Z</option>
                  <option value="lastName">Last name A→Z</option>
                  <option value="age">Age ↑</option>
                  <option value="dept">Department</option>
                </select>
              </div>
            </div>

            {/* ── User list ── */}
            <div className="flex-1 overflow-y-auto">
              {db.filtered.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[13px] text-zinc-400">
                  No users found
                </div>
              ) : isMobile ? (
                /* ─ Mobile: infinite scroll ─ */
                <>
                  <ul className={db.view === "grid"
                    ? "grid grid-cols-1 gap-2.5 p-4"
                    : "divide-y divide-zinc-100 dark:divide-zinc-800"
                  }>
                    {mobileUsers.map((u) =>
                      db.view === "grid" ? (
                        <li key={u.id}>
                          <UserCard user={u} selected={db.selected?.id === u.id} onClick={() => db.toggleSelected(u)} />
                        </li>
                      ) : (
                        <li key={u.id}>
                          <UserRow user={u} selected={db.selected?.id === u.id} onClick={() => db.toggleSelected(u)} />
                        </li>
                      ),
                    )}
                  </ul>
                  {/* Sentinel — triggers next batch when visible */}
                  {hasMoreItems && <div ref={sentinelRef} className="h-10" />}
                  {/* End-of-list indicator */}
                  {!hasMoreItems && mobileUsers.length > 0 && (
                    <p className="text-center text-[13px] text-zinc-400 py-5">
                      All {db.filtered.length} users loaded
                    </p>
                  )}
                </>
              ) : (
                /* ─ Desktop: pagination ─ */
                db.view === "grid" ? (
                  <ul className="grid grid-cols-2 gap-2.5 p-5">
                    {db.pageUsers.map((u) => (
                      <li key={u.id}>
                        <UserCard user={u} selected={db.selected?.id === u.id} onClick={() => db.toggleSelected(u)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {db.pageUsers.map((u) => (
                      <li key={u.id}>
                        <UserRow user={u} selected={db.selected?.id === u.id} onClick={() => db.toggleSelected(u)} />
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

            {/* Pagination — desktop only */}
            {!isMobile && (
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <span className="text-[13px] text-zinc-400">
                  Page {db.safePage} of {db.totalPages}
                </span>
                <Pagination page={db.safePage} totalPages={db.totalPages} onChange={db.setPage} />
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {db.selected && <UserModal user={db.selected} onClose={() => db.setSelected(null)} />}
      </div>
    </DarkCtx.Provider>
  );
}
