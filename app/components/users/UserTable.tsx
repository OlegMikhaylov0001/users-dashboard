"use client";

import Image from "next/image";
import type { User } from "../../types";
import { initials, paletteFor } from "../../lib/palette";
import { I } from "../icons";
import { cn } from "../../lib/utils";

export type TableSortKey = "name" | "role" | "department" | "title" | "age" | "city";

interface UserTableProps {
  users: User[];
  sort: { key: TableSortKey; dir: "asc" | "desc" };
  onSort: (key: TableSortKey) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
  cursorId: number | null;
  onOpen: (user: User) => void;
}

function SortableHead({
  k,
  current,
  onSort,
  children,
}: {
  k: TableSortKey;
  current: { key: TableSortKey; dir: "asc" | "desc" };
  onSort: (k: TableSortKey) => void;
  children: React.ReactNode;
}) {
  const isActive = current.key === k;
  return (
    <th>
      <span className="th-inner" onClick={() => onSort(k)}>
        {children}
        {isActive &&
          (current.dir === "asc" ? (
            <I.ChevUp size={10} className="sort-asc" />
          ) : (
            <I.ChevDown size={10} className="sort-desc" />
          ))}
      </span>
    </th>
  );
}

function Avatar({ user }: { user: User }) {
  const pal = paletteFor(user.firstName, false);
  return (
    <div className="avatar" style={{ background: pal.bg, color: pal.fg, borderColor: pal.bg }}>
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={22}
          height={22}
          unoptimized
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        initials(user)
      )}
    </div>
  );
}

export function UserTable({
  users,
  sort,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  cursorId,
  onOpen,
}: UserTableProps) {
  const allChecked = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someChecked = !allChecked && users.some((u) => selectedIds.has(u.id));

  return (
    <table className="table">
      <thead>
        <tr>
          <th className="col-check">
            <button
              type="button"
              className="ds-icon-btn"
              onClick={onToggleAll}
              title={allChecked ? "Deselect all" : "Select all"}
              style={{ width: 14, height: 14 }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "1.5px solid var(--border-strong)",
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  background: allChecked || someChecked ? "var(--accent)" : "var(--bg-elev)",
                  borderColor: allChecked || someChecked ? "var(--accent)" : "var(--border-strong)",
                  color: "white",
                }}
              >
                {allChecked && <I.Check size={10} />}
                {someChecked && !allChecked && (
                  <div style={{ width: 7, height: 1.5, background: "currentColor", borderRadius: 1 }} />
                )}
              </div>
            </button>
          </th>
          <SortableHead k="name" current={sort} onSort={onSort}>User</SortableHead>
          <SortableHead k="role" current={sort} onSort={onSort}>Role</SortableHead>
          <SortableHead k="department" current={sort} onSort={onSort}>Department</SortableHead>
          <SortableHead k="title" current={sort} onSort={onSort}>Title</SortableHead>
          <SortableHead k="age" current={sort} onSort={onSort}>Age</SortableHead>
          <SortableHead k="city" current={sort} onSort={onSort}>Location</SortableHead>
          <th style={{ width: 28 }}></th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => {
          const isSel = selectedIds.has(u.id);
          const isCursor = cursorId === u.id;
          return (
            <tr
              key={u.id}
              className={cn(isSel && "selected", isCursor && "cursor")}
              onClick={() => onOpen(u)}
            >
              <td
                className="col-check"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(u.id);
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "1.5px solid var(--border-strong)",
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    background: isSel ? "var(--accent)" : "var(--bg-elev)",
                    borderColor: isSel ? "var(--accent)" : "var(--border-strong)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {isSel && <I.Check size={10} />}
                </div>
              </td>
              <td>
                <div className="cell-user">
                  <Avatar user={u} />
                  <div className="cell-user-text">
                    <div className="cell-user-name">{u.firstName} {u.lastName}</div>
                    <div className="cell-user-email">{u.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={cn("role-badge", u.role)}>
                  <span className="role-dot" />
                  {u.role}
                </span>
              </td>
              <td>
                <span className="dept-tag">{u.company.department}</span>
              </td>
              <td className="muted">{u.company.title}</td>
              <td className="tabular">{u.age}</td>
              <td className="muted">{u.address.city}, {u.address.country}</td>
              <td>
                <button
                  type="button"
                  className="ds-icon-btn"
                  onClick={(e) => e.stopPropagation()}
                  title="More"
                >
                  <I.More size={13} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
