"use client";

import { useContext } from "react";
import type { User } from "../../types";
import { DarkCtx } from "../dark-ctx";
import { paletteFor, initials } from "../../lib/palette";
import { RoleBadge } from "../ui/RoleBadge";
import { DeptChip } from "../ui/DeptChip";

interface UserCardProps {
  user: User;
  selected: boolean;
  onClick: () => void;
}

export function UserCard({ user, selected, onClick }: UserCardProps) {
  const isDark = useContext(DarkCtx);
  const { bg, fg } = paletteFor(user.firstName, isDark);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left p-3.5 rounded-xl border transition-all",
        selected
          ? "border-[#185FA5] dark:border-blue-500 ring-1 ring-[#185FA5]/20 dark:ring-blue-500/20"
          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
          style={{ background: bg, color: fg }}
        >
          {initials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[13px] text-zinc-400 truncate">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="4" r="2" />
            <path d="M2 10c0-2 1.8-3 4-3s4 1 4 3" />
          </svg>
          {user.age} y.o.
        </span>
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{user.gender}</span>
        {user.company.department && <DeptChip dept={user.company.department} />}
      </div>
    </button>
  );
}
