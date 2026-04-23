const ROLE_STYLES: Record<string, string> = {
  admin:     "bg-[#FCEBEB] text-[#A32D2D] dark:bg-red-900/30    dark:text-red-400",
  moderator: "bg-[#FAEEDA] text-[#854F0B] dark:bg-amber-900/30  dark:text-amber-400",
  user:      "bg-[#E6F1FB] text-[#185FA5] dark:bg-blue-900/30   dark:text-blue-400",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
        ROLE_STYLES[role] ?? ROLE_STYLES.user
      }`}
    >
      {role}
    </span>
  );
}
