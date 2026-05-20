"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { User } from "../../types";
import { I } from "../icons";
import { initials, paletteFor } from "../../lib/palette";
import { cn } from "../../lib/utils";
import { useClickOutside } from "../../hooks/useClickOutside";
import Image from "next/image";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (user: User) => void;
  onExecuteCommand: (commandId: string) => void;
}

const COMMANDS = [
  { id: "filter_admin", label: "Filter: Admins only", description: "Показать только администраторов", icon: "Shield" as const },
  { id: "clear_filters", label: "Clear: Reset all filters", description: "Сбросить все активные фильтры", icon: "Trash" as const },
  { id: "toggle_theme", label: "Theme: Toggle Dark/Light Mode", description: "Переключить темную/светлую тему", icon: "Moon" as const },
  { id: "export_csv", label: "Export: Download list as CSV", description: "Скачать текущий список в формате CSV", icon: "Download" as const },
  { id: "open_assistant", label: "Assistant: Open AI Chat Widget", description: "Открыть ИИ-помощника для общения", icon: "Sparkle" as const },
];

export function CommandPalette({ isOpen, onClose, users, onSelectUser, onExecuteCommand }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => { if (isOpen) onClose(); });

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) { setQuery(""); setSelectedIndex(0); }
  }

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS;
    const cleanQ = q.startsWith(">") ? q.slice(1).trim() : q;
    if (!cleanQ) return COMMANDS;
    return COMMANDS.filter(c => c.label.toLowerCase().includes(cleanQ) || c.description.toLowerCase().includes(cleanQ));
  }, [query]);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.startsWith(">")) return [];
    if (!q) return users.slice(0, 5);
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return fullName.includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.company.department.toLowerCase().includes(q) || u.address.city.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [query, users]);

  const mergedList = useMemo(() => {
    const items: Array<{ type: "command"; data: typeof COMMANDS[number] } | { type: "user"; data: User }> = [];
    filteredCommands.forEach((c) => items.push({ type: "command", data: c }));
    filteredUsers.forEach((u) => items.push({ type: "user", data: u }));
    return items;
  }, [filteredCommands, filteredUsers]);

  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (mergedList.length ? (prev + 1) % mergedList.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (mergedList.length ? (prev - 1 + mergedList.length) % mergedList.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mergedList[selectedIndex]) {
        const item = mergedList[selectedIndex];
        if (item.type === "command") onExecuteCommand(item.data.id);
        else onSelectUser(item.data);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop">
      <div className="cmd-container" ref={containerRef}>
        <div className="cmd-header">
          <I.Search size={16} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command (e.g. > filter) or search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="cmd-esc-badge">ESC</span>
        </div>

        <div className="cmd-body">
          {mergedList.length === 0 ? (
            <div className="cmd-empty">No results found for &ldquo;{query}&rdquo;</div>
          ) : (
            <div className="cmd-list">
              {filteredCommands.length > 0 && (
                <div className="cmd-group">
                  <div className="cmd-group-title">Commands</div>
                  {filteredCommands.map((c, i) => {
                    const globalIdx = i;
                    const isSel = selectedIndex === globalIdx;
                    const IconComponent = I[c.icon];
                    return (
                      <div
                        key={c.id}
                        className={cn("cmd-item", isSel && "active")}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => {
                          onExecuteCommand(c.id);
                          onClose();
                        }}
                      >
                        <div className="cmd-item-icon-wrap">
                          <IconComponent size={14} />
                        </div>
                        <div className="cmd-item-text">
                          <div className="cmd-item-label">{c.label}</div>
                          <div className="cmd-item-desc">{c.description}</div>
                        </div>
                        {isSel && <span className="cmd-enter-badge">↵ Enter</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredUsers.length > 0 && (
                <div className="cmd-group">
                  <div className="cmd-group-title">
                    {query.trim() ? "Users matched" : "Recent Users"}
                  </div>
                  {filteredUsers.map((u, i) => {
                    const globalIdx = filteredCommands.length + i;
                    const isSel = selectedIndex === globalIdx;
                    const pal = paletteFor(u.firstName, false);
                    return (
                      <div
                        key={u.id}
                        className={cn("cmd-item", isSel && "active")}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                      >
                        <div
                          className="avatar sm"
                          style={{
                            background: pal.bg,
                            color: pal.fg,
                            borderColor: pal.bg,
                            width: 24,
                            height: 24,
                            fontSize: 10,
                          }}
                        >
                          {u.image ? (
                            <Image src={u.image} alt="" width={24} height={24} unoptimized />
                          ) : (
                            initials(u)
                          )}
                        </div>
                        <div className="cmd-item-text">
                          <div className="cmd-item-label">
                            {u.firstName} {u.lastName}{" "}
                            <span className="cmd-item-sub">@{u.username}</span>
                          </div>
                          <div className="cmd-item-desc">
                            {u.company.title} &middot; {u.company.department} &middot; {u.address.city}
                          </div>
                        </div>
                        {isSel && <span className="cmd-enter-badge">↵ Enter</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <span className="cmd-help-item"><kbd>↑↓</kbd> Navigate</span>
          <span className="cmd-help-item"><kbd>↵</kbd> Select</span>
          <span className="cmd-help-item"><kbd>Esc</kbd> Close</span>
          <span className="cmd-help-item" style={{ marginLeft: "auto" }}>
            Type <kbd>&gt;</kbd> for commands only
          </span>
        </div>
      </div>
    </div>
  );
}
