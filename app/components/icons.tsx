import * as React from "react";

interface IconProps {
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

function makeIcon(content: React.ReactNode) {
  const Component = ({ size = 14, stroke = 1.6, className, style }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {content}
    </svg>
  );
  return Component;
}

export const I = {
  Search: makeIcon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  Users: makeIcon(<><circle cx="9" cy="8" r="4" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" /><path d="M16 4a4 4 0 0 1 0 8" /><path d="M21 21v-1a6 6 0 0 0-3-5.2" /></>),
  Chart: makeIcon(<><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 6-7" /></>),
  Shield: makeIcon(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />),
  Bookmark: makeIcon(<path d="M6 3h12v18l-6-4-6 4V3Z" />),
  Plus: makeIcon(<path d="M12 5v14M5 12h14" />),
  ChevDown: makeIcon(<path d="M6 9l6 6 6-6" />),
  ChevUp: makeIcon(<path d="M18 15l-6-6-6 6" />),
  ChevRight: makeIcon(<path d="M9 6l6 6-6 6" />),
  X: makeIcon(<path d="M18 6 6 18M6 6l12 12" />),
  Check: makeIcon(<path d="m5 12 5 5L20 7" />),
  Settings: makeIcon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  Bell: makeIcon(<><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" /><path d="M10 21a2 2 0 0 0 4 0" /></>),
  Hash: makeIcon(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  Tag: makeIcon(<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" /></>),
  Inbox: makeIcon(<><path d="M22 13H16l-2 3h-4l-2-3H2" /><path d="M5.4 5.4 2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6L18.6 5.4A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.9 1.4Z" /></>),
  Download: makeIcon(<path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />),
  Moon: makeIcon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />),
  Sun: makeIcon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  Mail: makeIcon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  Phone: makeIcon(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" />),
  Building: makeIcon(<><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" /><path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2M2 21h20" /></>),
  Calendar: makeIcon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>),
  Copy: makeIcon(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
  Send: makeIcon(<path d="m22 2-7 20-4-9-9-4 20-7Z" />),
  Edit: makeIcon(<path d="M17 3a2.8 2.8 0 1 1 4 4L7 21H3v-4L17 3Z" />),
  ArrowUpRight: makeIcon(<path d="M7 17 17 7M9 7h8v8" />),
  Star: makeIcon(<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6L12 16.7 6.6 19.6l1-6L3.4 9.4l6-.9L12 3Z" />),
  More: makeIcon(<><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>),

  /* Chat widget redesign icons */
  Sparkle: makeIcon(
    <>
      <path d="M12 3l1.6 4.5L18 9l-4.4 1.5L12 15l-1.6-4.5L6 9l4.4-1.5L12 3Z" />
      <path d="M19 15l.7 1.7L21.4 17l-1.7.7L19 19l-.7-1.7L16.6 17l1.7-.6L19 15Z" />
    </>,
  ),
  Stop: makeIcon(<rect x="6" y="6" width="12" height="12" rx="2" />),
  ArrowRight: makeIcon(<path d="M5 12h14M13 5l7 7-7 7" />),
  ArrowLeft: makeIcon(<path d="M19 12H5M11 5l-7 7 7 7" />),
  Undo: makeIcon(<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" />),
  Filter: makeIcon(<path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />),
  Trash: makeIcon(
    <>
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    </>,
  ),
  User: makeIcon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </>,
  ),
  Stats: makeIcon(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  Slash: makeIcon(<path d="M16 4 8 20" />),
  HelpCircle: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7" />
      <circle cx="12" cy="17" r="0.7" fill="currentColor" />
    </>,
  ),
  Coin: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a3 3 0 1 0 0 5M12 6.5V8M12 16v1.5" />
    </>,
  ),
  Eye: makeIcon(
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>,
  ),
  EyeOff: makeIcon(
    <>
      <path d="m3 3 18 18" />
      <path d="M10.5 6.3A10 10 0 0 1 22 12s-1.5 2.6-4 4.5" />
      <path d="M6.5 6.5C4 8.2 2 12 2 12s4 7 10 7c1.6 0 3.1-.5 4.4-1.2" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>,
  ),
  Warn: makeIcon(
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 10v5M12 18v0" />
    </>,
  ),
  Refresh: makeIcon(<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />),

  /* Invitations page icons */
  Clock: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  ),
  Globe: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>,
  ),
};

export type IconName = keyof typeof I;
