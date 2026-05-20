"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { User } from "../types";
import { type Filters, applyFilters, useDashboard } from "./useDashboard";

export interface CustomPreset {
  id: string;
  name: string;
  filters: Filters;
  ageFilter: [number, number] | null;
}

export const SAVED_PRESETS = [
  { id: "eng", name: "Engineering", department: "Engineering" },
  { id: "hr", name: "HR team", department: "Human Resources" },
  { id: "marketing", name: "Marketing", department: "Marketing" },
  { id: "leaders", name: "Leadership", role: "admin" as const },
];

export function useCustomViews(
  users: User[],
  db: ReturnType<typeof useDashboard>
) {
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [customViews, setCustomViews] = useState<CustomPreset[]>([]);

  // Load from local storage on client side to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userbase_custom_views");
      if (saved) {
        try {
          setCustomViews(JSON.parse(saved) as CustomPreset[]);
        } catch (e) {
          console.error("Failed to parse custom views from localStorage", e);
        }
      }
    }
  }, []);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  const savedViews = useMemo(() => {
    const defaults = SAVED_PRESETS.map((p) => ({
      id: p.id,
      name: p.name,
      count: users.filter((u) =>
        p.department ? u.company.department === p.department : u.role === p.role
      ).length,
      department: p.department,
      role: p.role,
      isCustom: false as const,
    }));

    const customs = customViews.map((cv) => ({
      id: cv.id,
      name: cv.name,
      count: applyFilters(users, cv.filters, cv.ageFilter).length,
      filters: cv.filters,
      ageFilter: cv.ageFilter,
      isCustom: true as const,
    }));

    return [...defaults, ...customs];
  }, [users, customViews]);

  const applySaved = useCallback((id: string) => {
    const v = savedViews.find((x) => x.id === id);
    if (!v) return;
    db.clear();
    if (v.isCustom) {
      Object.entries(v.filters).forEach(([key, val]) => {
        db.setFilter(key as keyof Filters, val as string);
      });
      if (v.ageFilter) {
        db.onAgeChange(v.ageFilter);
      }
    } else {
      if (v.department) db.applyPreset(v.department);
      else if (v.role) db.setFilter("role", v.role);
    }
    setActiveSavedId(id);
  }, [savedViews, db]);

  const handleSaveView = useCallback(() => {
    if (!newViewName.trim() || !db.hasFilters) return;
    const newPreset: CustomPreset = {
      id: "custom_" + Date.now(),
      name: newViewName.trim(),
      filters: { ...db.filters },
      ageFilter: db.ageFilter,
    };
    const updated = [...customViews, newPreset];
    setCustomViews(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("userbase_custom_views", JSON.stringify(updated));
    }
    setShowSaveModal(false);
    setNewViewName("");
    setActiveSavedId(newPreset.id);
  }, [newViewName, db.filters, db.ageFilter, db.hasFilters, customViews]);

  const handleDeleteCustomView = useCallback((id: string) => {
    const updated = customViews.filter((cv) => cv.id !== id);
    setCustomViews(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("userbase_custom_views", JSON.stringify(updated));
    }
    if (activeSavedId === id) {
      setActiveSavedId(null);
      db.clear();
    }
  }, [customViews, activeSavedId, db]);

  const resetActivePreset = useCallback(() => {
    setActiveSavedId(null);
  }, []);

  return {
    activeSavedId,
    setActiveSavedId,
    customViews,
    savedViews,
    showSaveModal,
    setShowSaveModal,
    newViewName,
    setNewViewName,
    applySaved,
    handleSaveView,
    handleDeleteCustomView,
    resetActivePreset,
  };
}
