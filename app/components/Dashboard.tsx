"use client";

import { useMemo, useState } from "react";
import type { User } from "../types";
import { DashboardCtx } from "./dashboard-ctx";
import { useDashboard, type SortKey, type Filters } from "../hooks/useDashboard";
import { useCustomViews } from "../hooks/useCustomViews";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcut";
import { Sidebar } from "./Sidebar";
import { UserTable, type TableSortKey } from "./users/UserTable";
import { SidePanel } from "./users/SidePanel";
import { ChatWidget } from "./ChatWidget";
import { CommandPalette } from "./ui/CommandPalette";
import { AnalyticsView } from "./users/AnalyticsView";
import { Topbar } from "./dashboard/Topbar";
import { Filterbar, type Tab } from "./dashboard/Filterbar";
import { ChartsStrip } from "./dashboard/ChartsStrip";
import { Statusbar } from "./dashboard/Statusbar";

interface DashboardProps {
  users: User[];
  departments: string[];
  titles: string[];
  countries: string[];
  states: string[];
}

function toInternalSort(k: TableSortKey): SortKey {
  if (k === "name") return "firstName";
  if (k === "department") return "dept";
  if (k === "age") return "age";
  return "firstName";
}

export default function Dashboard({ users, departments, titles, countries, states }: DashboardProps) {
  const db = useDashboard(users);
  const cv = useCustomViews(users, db);
  const [tab, setTab] = useState<Tab>("all");
  const [active, setActive] = useState<"users" | "charts" | "admins">("users");
  const [tableSort, setTableSort] = useState<{ key: TableSortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cursorId, setCursorId] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global key listener for ⌘K / Ctrl+K encapsulated via custom hook
  useKeyboardShortcut("k", () => setIsSearchOpen((prev) => !prev), { metaOrCtrl: true });

  const handleSelectUser = (u: User) => {
    db.setSelected(u);
    setCursorId(u.id);
  };

  const handleExecuteCommand = (cmdId: string) => {
    if (cmdId === "filter_admin") {
      db.clear();
      db.setFilter("role", "admin");
    } else if (cmdId === "clear_filters") {
      db.clear();
      cv.resetActivePreset();
    } else if (cmdId === "toggle_theme") {
      const html = document.documentElement;
      const next = html.dataset.theme === "dark" ? "light" : "dark";
      html.dataset.theme = next;
    } else if (cmdId === "export_csv") {
      handleExportCSV();
    } else if (cmdId === "open_assistant") {
      const btn = document.querySelector(".chat-trigger") as HTMLButtonElement;
      if (btn) btn.click();
    }
  };

  const adminsCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);

  // Apply tab filters on top of regular filter sets
  const tabFiltered = useMemo(() => {
    let list = db.filtered;
    if (tab === "admin") list = list.filter((u) => u.role === "admin");
    else if (tab === "moderator") list = list.filter((u) => u.role === "moderator");
    else if (tab === "female") list = list.filter((u) => u.gender === "female");
    else if (tab === "male") list = list.filter((u) => u.gender === "male");
    
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

  const counts = useMemo(() => ({
    all: db.filtered.length,
    admin: db.filtered.filter((u) => u.role === "admin").length,
    moderator: db.filtered.filter((u) => u.role === "moderator").length,
    female: db.filtered.filter((u) => u.gender === "female").length,
    male: db.filtered.filter((u) => u.gender === "male").length,
  }), [db.filtered]);

  const onTableSort = (key: TableSortKey) => {
    const nextDir = key === tableSort.key && tableSort.dir === "asc" ? "desc" : "asc";
    setTableSort({ key, dir: nextDir });
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

  const openIdx = db.selected ? tabFiltered.findIndex((u) => u.id === db.selected!.id) : -1;
  const onNext = openIdx >= 0 && openIdx < tabFiltered.length - 1 ? () => db.setSelected(tabFiltered[openIdx + 1]) : undefined;
  const onPrev = openIdx > 0 ? () => db.setSelected(tabFiltered[openIdx - 1]) : undefined;

  const handleExportCSV = () => {
    if (tabFiltered.length === 0) return;
    const headers = ["ID", "First Name", "Last Name", "Email", "Username", "Phone", "Age", "Gender", "Role", "Department", "Title", "City", "Country"];
    const rows = tabFiltered.map((u) => [
      u.id, u.firstName, u.lastName, u.email, u.username, u.phone, u.age, u.gender, u.role, u.company.department, u.company.title, u.address.city, u.address.country
    ]);
    const csvString = [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardCtx.Provider value={{
      users,
      setFilter: db.setFilter,
      applyPreset: db.applyPreset,
      clear: () => { db.clear(); cv.resetActivePreset(); },
      onAgeChange: db.onAgeChange,
      setSelected: db.setSelected,
      getCurrentFilters: () => ({ ...db.filters, ageFilter: db.ageFilter }),
    }}>
      <div className="app">
        <Sidebar
          totalUsers={users.length}
          adminsCount={adminsCount}
          savedViews={cv.savedViews}
          activeSavedId={cv.activeSavedId}
          onApplySaved={cv.applySaved}
          onClearFilters={() => { db.clear(); cv.resetActivePreset(); }}
          active={active}
          onSelectActive={setActive}
          onDeleteCustomView={cv.handleDeleteCustomView}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <div className="main">
          <Topbar
            totalCount={tabFiltered.length}
            searchQuery={db.filters.q}
            onSearchChange={(q) => db.setFilter("q", q)}
            onExportCSV={handleExportCSV}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          <Filterbar
            tab={tab}
            setTab={setTab}
            counts={counts}
            filters={db.filters}
            setFilter={db.setFilter}
            clearFilters={() => { db.clear(); cv.resetActivePreset(); }}
            hasFilters={db.hasFilters}
            departments={departments}
            titles={titles}
            countries={countries}
            states={states}
            showSaveModal={cv.showSaveModal}
            setShowSaveModal={cv.setShowSaveModal}
            newViewName={cv.newViewName}
            setNewViewName={cv.setNewViewName}
            handleSaveView={cv.handleSaveView}
          />

          <ChartsStrip users={users} filteredUsers={tabFiltered} />

          <div className="table-wrap">
            <div className="table-scroll">
              {active === "charts" ? (
                <AnalyticsView users={tabFiltered} />
              ) : tabFiltered.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--fg-tertiary)" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-secondary)" }}>No users match these filters</div>
                  <div style={{ fontSize: 12.5, marginTop: 4 }}>Try clearing filters or adjusting search.</div>
                  <button type="button" className="ds-btn-outline" onClick={() => { db.clear(); cv.resetActivePreset(); setTab("all"); }} style={{ marginTop: 14 }}>
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
                  onOpen={handleSelectUser}
                />
              )}
            </div>
            {db.selected && (
              <SidePanel user={db.selected} onClose={() => db.setSelected(null)} onNext={onNext} onPrev={onPrev} />
            )}
          </div>

          <Statusbar
            totalCount={users.length}
            filteredCount={tabFiltered.length}
            hasFilters={db.hasFilters}
            filters={db.filters}
            ageFilter={db.ageFilter}
          />
        </div>
      </div>

      <ChatWidget />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        users={users}
        onSelectUser={handleSelectUser}
        onExecuteCommand={handleExecuteCommand}
      />
    </DashboardCtx.Provider>
  );
}
