"use client";

import { useEffect, useContext } from "react";
import Link from "next/link";
import type { User } from "../../types";
import { DarkCtx } from "../dark-ctx";
import { paletteFor, initials } from "../../lib/palette";
import { RoleBadge } from "../ui/RoleBadge";

// ── DetailField ───────────────────────────────────────────────────────────────

interface DetailFieldProps {
  label: string;
  value: string | number;
  href?: string;
}

function DetailField({ label, value, href }: DetailFieldProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {href ? (
        <a href={href} className="text-[14px] text-[#185FA5] dark:text-blue-400 hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className="text-[14px] text-zinc-900 dark:text-zinc-100 break-words">{value}</p>
      )}
    </div>
  );
}

// ── UserModal ─────────────────────────────────────────────────────────────────

interface UserModalProps {
  user: User;
  onClose: () => void;
}

export function UserModal({ user, onClose }: UserModalProps) {
  const isDark = useContext(DarkCtx);
  const { bg, fg } = paletteFor(user.firstName, isDark);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    /* Fixed overlay — escapes parent overflow:hidden via position:fixed */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-700">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-semibold shrink-0"
            style={{ background: bg, color: fg }}
          >
            {initials(user)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[13px] text-zinc-400">@{user.username}</p>
          </div>
          <RoleBadge role={user.role} />
          <button
            type="button"
            onClick={onClose}
            className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body — 2-col grid */}
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4 max-h-[60vh] overflow-y-auto">
          <DetailField label="Email"        value={user.email}     href={`mailto:${user.email}`} />
          <DetailField label="Phone"        value={user.phone}     href={`tel:${user.phone}`} />
          <DetailField label="Age / gender" value={`${user.age} y.o. · ${user.gender}`} />
          <DetailField label="Birth date"   value={user.birthDate} />
          <DetailField label="Blood type"   value={user.bloodGroup} />
          <DetailField label="Company"      value={user.company.name} />
          <DetailField label="Department"   value={user.company.department} />
          <DetailField label="Job title"    value={user.company.title} />
          <DetailField label="City"         value={`${user.address.city}, ${user.address.state}`} />
          <DetailField label="Country"      value={user.address.country} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Close
          </button>
          <Link
            href={`/users/${user.id}`}
            className="text-[13px] text-[#185FA5] dark:text-blue-400 hover:underline font-medium"
          >
            View full profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
