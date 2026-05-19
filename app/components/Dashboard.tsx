"use client";

import { useMemo, useState } from "react";
import type { User } from "../types";
import { DashboardCtx } from "./dashboard-ctx";
import { useDashboard, type SortKey } from "../hooks/useDashboard";
import { Sidebar } from "./Sidebar";
import { FilterChip } from "./ui/FilterChip";
import { UserTable, type TableSortKey } from "./users/UserTable";
import { SidePanel } from "./users/SidePanel";
import { ChatWidget } from "./ChatWidget";
import { I } from "./icons";

interface DashboardProps {
  users: User[];
  departments: string[];
  titles: string[];
  countries: string[];
  states: string[];
}

const SAVED_PRESETS = [
  { id: "eng", name: "Engineering", department: "Engineering" },
  { id: "hr", name: "HR team", department: "Human Resources" },
  { id: "marketing", name: "Marketing", department: "Marketing" },
  { id: "leaders", name: "Leadership", role: "admin" as const },
];

type Tab = "all" | "admin" | "moderator" | "female" | "male";

// Map table sort keys to internal useDashboard SortKey
function toInternalSort(k: TableSortKey): SortKey {
  if (k === "name") return "firstName";
  if (k === "department") return "dept";
  if (k === "age") return "age";
  return "firstName"; // role/title/city — fall back to firstName for now
}

export default function Dashboard({ users, departments, titles, countries, states }: DashboardProps) {
  const db = useDashboard(users);
  const [tab, setTab] = useState<Tab>("all");
  const [active, setActive] = useState<"users" | "charts" | "admins">("users");
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [tableSort, setTableSort] = useState<{ key: TableSortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cursorId, setCursorId] = useState<number | null>(null);

  const adminsCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);

  const savedViews = useMemo(
    () =>
      SAVED_PRESETS.map((p) => {
        const count = users.filter((u) =>
          p.department ? u.company.department === p.department : u.role === p.role,
        ).length;
        return { id: p.id, name: p.name, count, department: p.department, role: p.role };
      }),
    [users],
  );

  const applySaved = (id: string) => {
    const v = savedViews.find((x) => x.id === id);
    if (!v) return;
    db.clear();
    if (v.department) db.applyPreset(v.department);
    else if (v.role) db.setFilter("role", v.role);
    setActiveSavedId(id);
  };

  // Apply tab on top of regular filters
  const tabFiltered = useMemo(() => {
    let list = db.filtered;
    if (tab === "admin") list = list.filter((u) => u.role === "admin");
    else if (tab === "moderator") list = list.filter((u) => u.role === "moderator");
    else if (tab === "female") list = list.filter((u) => u.gender === "female");
    else if (tab === "male") list = list.filter((u) => u.gender === "male");
    // Custom sort by city — fall through to default useDashboard sort otherwise
    if (tableSort.key === "city") {
      list = [...list].sort((a, b) => a.address.city.localeCompare(b.address.city));
    } else if (tableSort.key === "role") {
      list = [...list].sort((a, b) => a.role.localeCompare(b.role));
    } else if (tableSort.key === "title") {
      list = [...list].sort((a, b) => a.company.title.localeCompare(b.company.title));
    }
    if (tableSort.dir === "desc") list = list.reverse();
    return list;
  }, [db.filtered, tab, tableSort]);

  const counts = useMemo(
    () => ({
      all: db.filtered.length,
      admin: db.filtered.filter((u) => u.role === "admin").length,
      moderator: db.filtered.filter((u) => u.role === "moderator").length,
      female: db.filtered.filter((u) => u.gender === "female").length,
      male: db.filtered.filter((u) => u.gender === "male").length,
    }),
    [db.filtered],
  );

  const onTableSort = (key: TableSortKey) => {
    if (key === tableSort.key) {
      setTableSort({ key, dir: tableSort.dir === "asc" ? "desc" : "asc" });
    } else {
      setTableSort({ key, dir: "asc" });
    }
    db.setSort(toInternalSort(key));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (tabFiltered.every((u) => selectedIds.has(u.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(tabFiltered.map((u) => u.id)));
  };

  // Side panel nav helpers
  const openIdx = db.selected ? tabFiltered.findIndex((u) => u.id === db.selected!.id) : -1;
  const onNext = openIdx >= 0 && openIdx < tabFiltered.length - 1
    ? () => db.setSelected(tabFiltered[openIdx + 1])
    : undefined;
  const onPrev = openIdx > 0
    ? () => db.setSelected(tabFiltered[openIdx - 1])
    : undefined;

  // KPIs for charts strip
  const total = tabFiltered.length;
  const avgAge = total ? Math.round(tabFiltered.reduce((s, u) => s + u.age, 0) / total) : 0;
  const deptCounts: Record<string, number> = {};
  tabFiltered.forEach((u) => {
    deptCounts[u.company.department] = (deptCounts[u.company.department] ?? 0) + 1;
  });
  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];
  const femaleCount = tabFiltered.filter((u) => u.gender === "female").length;
  const fPct = total ? Math.round((femaleCount / total) * 100) : 0;
  const buckets = [0, 0, 0, 0, 0];
  tabFiltered.forEach((u) => {
    const b = u.age < 26 ? 0 : u.age < 36 ? 1 : u.age < 46 ? 2 : u.age < 56 ? 3 : 4;
    buckets[b]++;
  });
  const maxB = Math.max(...buckets, 1);

  return (
    <DashboardCtx.Provider
      value={{
        users,
        setFilter: db.setFilter,
        applyPreset: db.applyPreset,
        clear: () => {
          db.clear();
          setActiveSavedId(null);
        },
        onAgeChange: db.onAgeChange,
        setSelected: db.setSelected,
        getCurrentFilters: () => ({ ...db.filters, ageFilter: db.ageFilter }),
      }}
    >
      <div className="app">
        <Sidebar
          totalUsers={users.length}
          adminsCount={adminsCount}
          savedViews={savedViews}
          activeSavedId={activeSavedId}
          onApplySaved={applySaved}
          onClearFilters={() => {
            db.clear();
            setActiveSavedId(null);
          }}
          active={active}
          onSelectActive={setActive}
        />

        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title">
              <span style={{ color: "var(--fg-tertiary)", fontWeight: 500 }}>Workspace</span>
              <span className="topbar-crumb-sep">/</span>
              <span>Users</span>
              <span className="topbar-count tabular">{tabFiltered.length}</span>
            </div>
            <div className="topbar-right">
              <div className="topbar-search">
                <I.Search size={13} />
                <input
                  type="text"
                  placeholder="Search name, email, username…"
                  value={db.filters.q}
                  onChange={(e) => db.setFilter("q", e.target.value)}
                />
                {db.filters.q && (
                  <button
                    type="button"
                    className="ds-icon-btn"
                    onClick={() => db.setFilter("q", "")}
                    title="Clear"
                  >
                    <I.X size={11} />
                  </button>
                )}
                {!db.filters.q && <span className="ds-kbd">/</span>}
              </div>
              <button type="button" className="ds-btn-ghost" title="Export CSV (coming soon)">
                <I.Download size={12} />
                Export
              </button>
              <button
                type="button"
                className="ds-icon-btn"
                title="Toggle theme"
                onClick={() => {
                  const html = document.documentElement;
                  const next = html.dataset.theme === "dark" ? "light" : "dark";
                  html.dataset.theme = next;
                }}
              >
                <I.Moon size={13} />
              </button>
              <button type="button" className="ds-btn-primary">
                <I.Plus size={12} />
                Invite
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="filterbar">
            <div className="view-tabs">
              {(
                [
                  { id: "all", label: "All", count: counts.all },
                  { id: "admin", label: "Admins", count: counts.admin },
                  { id: "moderator", label: "Mods", count: counts.moderator },
                  { id: "female", label: "Female", count: counts.female },
                  { id: "male", label: "Male", count: counts.male },
                ] as Array<{ id: Tab; label: string; count: number }>
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"view-tab" + (tab === t.id ? " active" : "")}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  <span className="view-tab-dot">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="filter-divider" />
            <FilterChip
              label="Role"
              value={db.filters.role}
              options={[
                { value: "admin", label: "Admin" },
                { value: "moderator", label: "Moderator" },
                { value: "user", label: "User" },
              ]}
              onSelect={(v) => db.setFilter("role", v)}
              onClear={() => db.setFilter("role", "")}
            />
            <FilterChip
              label="Department"
              value={db.filters.department}
              options={departments.map((d) => ({ value: d, label: d }))}
              onSelect={(v) => db.setFilter("department", v)}
              onClear={() => db.setFilter("department", "")}
              searchable
            />
            <FilterChip
              label="Gender"
              value={db.filters.gender}
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
              ]}
              onSelect={(v) => db.setFilter("gender", v)}
              onClear={() => db.setFilter("gender", "")}
            />
            <FilterChip
              label="Title"
              value={db.filters.title}
              options={titles.map((t) => ({ value: t, label: t }))}
              onSelect={(v) => db.setFilter("title", v)}
              onClear={() => db.setFilter("title", "")}
              searchable
            />
            <FilterChip
              label="Country"
              value={db.filters.country}
              options={countries.map((c) => ({ value: c, label: c }))}
              onSelect={(v) => db.setFilter("country", v)}
              onClear={() => db.setFilter("country", "")}
              searchable
            />
            <FilterChip
              label="State"
              value={db.filters.state}
              options={states.map((s) => ({ value: s, label: s }))}
              onSelect={(v) => db.setFilter("state", v)}
              onClear={() => db.setFilter("state", "")}
              searchable
            />
            {db.hasFilters && (
              <button
                type="button"
                className="ds-btn-ghost"
                onClick={() => {
                  db.clear();
                  setActiveSavedId(null);
                }}
              >
                Reset
              </button>
            )}
            <div className="filter-spacer" />
            <button type="button" className="ds-btn-outline" style={{ whiteSpace: "nowrap" }}>
              <I.Star size={11} />
              Save view
            </button>
          </div>

          {/* Charts strip */}
          <div className="charts-strip">
            <div className="chart-card">
              <div className="chart-label">Total · filtered</div>
              <div className="chart-value">
                {tabFiltered.length}
                <span className="chart-value-sub">/ {users.length}</span>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-label">Admins</div>
              <div className="chart-value">
                {tabFiltered.filter((u) => u.role === "admin").length}
                <span className="chart-value-sub">{total ? Math.round((tabFiltered.filter((u) => u.role === "admin").length / total) * 100) : 0}%</span>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-label">Avg age · top dept</div>
              <div className="chart-value" style={{ fontSize: 14 }}>
                {avgAge} y
                <span className="chart-value-sub" style={{ marginLeft: 8 }}>·</span>
                <span className="chart-value-sub" style={{ marginLeft: 4, color: "var(--fg-secondary)" }}>
                  {topDept[0]}
                </span>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-label">Gender · age dist</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fPct}
                  <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>%F</span>
                </div>
                <svg width="80" height="22" viewBox="0 0 80 22" aria-hidden>
                  {buckets.map((b, i) => (
                    <rect
                      key={i}
                      x={i * 16 + 1}
                      y={22 - (b / maxB) * 20}
                      width="14"
                      height={(b / maxB) * 20}
                      rx="1.5"
                      fill="var(--accent)"
                      opacity={0.35 + (b / maxB) * 0.55}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Table + side panel */}
          <div className="table-wrap">
            <div className="table-scroll">
              {tabFiltered.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--fg-tertiary)" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-secondary)" }}>
                    No users match these filters
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 4 }}>
                    Try clearing filters or adjusting search.
                  </div>
                  <button
                    type="button"
                    className="ds-btn-outline"
                    onClick={() => {
                      db.clear();
                      setActiveSavedId(null);
                      setTab("all");
                    }}
                    style={{ marginTop: 14 }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <UserTable
                  users={tabFiltered}
                  sort={tableSort}
                  onSort={onTableSort}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleAll={toggleAll}
                  cursorId={cursorId}
                  onOpen={(u) => {
                    db.setSelected(u);
                    setCursorId(u.id);
                  }}
                />
              )}
            </div>
            {db.selected && (
              <SidePanel
                user={db.selected}
                onClose={() => db.setSelected(null)}
                onNext={onNext}
                onPrev={onPrev}
              />
            )}
          </div>

          {/* Status bar */}
          <div className="statusbar">
            <span>
              <span className="dot" />
              Synced just now
            </span>
            <span>
              Showing <b style={{ color: "var(--fg-secondary)" }}>{tabFiltered.length}</b> of {users.length}
            </span>
            {db.hasFilters && (
              <span style={{ color: "var(--accent-fg)" }}>
                {Object.values(db.filters).filter((v) => v).length + (db.ageFilter ? 1 : 0)} filter
                {Object.values(db.filters).filter((v) => v).length + (db.ageFilter ? 1 : 0) > 1 ? "s" : ""} active
              </span>
            )}
            <span className="spacer" />
            <span>
              <kbd>↑↓</kbd> nav
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      </div>

      {/* Chat assistant — kept as-is on the light app theme */}
      <ChatWidget />
    </DashboardCtx.Provider>
  );
}
