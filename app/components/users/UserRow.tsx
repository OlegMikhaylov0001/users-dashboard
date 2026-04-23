"use client";

import { useContext } from "react";
import type { User } from "../../types";
import { DarkCtx } from "../dark-ctx";
import { paletteFor, initials } from "../../lib/palette";
import { RoleBadge } from "../ui/RoleBadge";
import { DeptChip } from "../ui/DeptChip";

interface UserRowProps {
  user: User;
  selected: boolean;
  onClick: () => void;
}

export function UserRow({ user, selected, onClick }: UserRowProps) {
  const isDark = useContext(DarkCtx);
  const { bg, fg } = paletteFor(user.firstName, isDark);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 transition-colors text-left",
        selected
          ? "bg-blue-50 dark:bg-blue-900/15 border-l-2 border-[#185FA5] dark:border-blue-400"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent",
      ].join(" ")}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
        style={{ background: bg, color: fg }}
      >
        {initials(user)}
      </div>

      {/* Content — collapses to name/email on mobile, expands to 3-col grid on sm+ */}
      <div className="flex-1 min-w-0">
        {/* Mobile layout */}
        <div className="sm:hidden">
          <p className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[13px] text-zinc-400 truncate">{user.email}</p>
        </div>

        {/* Desktop layout (sm+) */}
        <div className="hidden sm:grid grid-cols-3 gap-3 items-center">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[13px] text-zinc-400 truncate">{user.email}</p>
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate">{user.company.title}</p>
          {user.company.department ? <DeptChip dept={user.company.department} /> : <span />}
        </div>
      </div>

      <RoleBadge role={user.role} />
    </button>
  );
}
