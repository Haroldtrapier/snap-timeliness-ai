import type { SVGProps } from "react";

// Inline SVG icon set ported from the prototype.
// 1.6px stroke weight, rounded caps — decorative by default
// (aria-hidden); pass an aria-label to make one meaningful.
const stroke: SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  // Decorative unless the caller provides a label/role.
  const hidden = props["aria-label"] || props.role ? undefined : true;
  return { ...stroke, "aria-hidden": hidden, ...props };
}

export const Icon = {
  Check: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base(p)}><path d="M4 12l5 5L20 6" /></svg>
  ),
  CheckCircle: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  Arrow: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  ArrowDown: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base(p)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
  ),
  Plus: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Info: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </svg>
  ),
  Doc: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  ),
  Upload: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
    </svg>
  ),
  Calendar: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  Clock: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Bell: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M6 11a6 6 0 0 1 12 0c0 5 2 5 2 7H4c0-2 2-2 2-7zM10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Home: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.5-1.8-4.5-4-4.5" />
    </svg>
  ),
  User: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  Building: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M4 21h16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </svg>
  ),
  Heart: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M20.8 6.3a5 5 0 0 0-8.8-3 5 5 0 0 0-8.8 3c0 5 8.8 11 8.8 11s8.8-6 8.8-11z" />
    </svg>
  ),
  Briefcase: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
    </svg>
  ),
  Lock: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Shield: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  ),
  ShieldCheck: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15c-.4.9-.1 1.9.7 2.4l-2.1 2.1c-.6-.8-1.5-1.1-2.4-.7-.9.4-1.5 1.3-1.5 2.2H11c0-.9-.6-1.8-1.5-2.2-.9-.4-1.8-.1-2.4.7L5 17.4c.8-.5 1.1-1.5.7-2.4-.4-.9-1.3-1.5-2.2-1.5V10c.9 0 1.8-.6 2.2-1.5C6.1 7.6 5.8 6.6 5 6.1l2.1-2.1c.5.8 1.5 1.1 2.4.7C10.4 4.3 11 3.4 11 2.5h3c0 .9.6 1.8 1.5 2.2.9.4 1.9.1 2.4-.7l2.1 2.1c-.8.5-1.1 1.5-.7 2.4.4.9 1.3 1.5 2.2 1.5v3c-.9 0-1.8.6-2.2 1.5z" />
    </svg>
  ),
  Folder: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  Grid: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Inbox: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  List: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  ),
  Filter: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base(p)}>
      <path d="M3 5h18l-7 9v6l-4-2v-4z" />
    </svg>
  ),
  Pin: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z" />
    </svg>
  ),
  Translate: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M4 5h10M9 3v2M12 14l4-9 4 9M13.5 11h5M4 7c0 4 4 7 7 7M4 14c3 0 6-1.5 7.5-4" />
    </svg>
  ),
  Alert: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18.5h.01" />
    </svg>
  ),
  Flag: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M4 21V4h12l-2 4 2 4H4" />
    </svg>
  ),
  Bolt: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  Chat: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.8-.3-4-.8L3 21l1.8-4.3C3.7 15.4 3 13.8 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
    </svg>
  ),
  Phone: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
    </svg>
  ),
  Mail: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  ),
  Map: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 22s8-7.6 8-13a8 8 0 1 0-16 0c0 5.4 8 13 8 13z" />
      <circle cx="12" cy="9" r="3" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Star: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 2l3 7 7 .8-5.3 4.7L18 22l-6-3.5L6 22l1.3-7.5L2 9.8 9 9z" />
    </svg>
  ),
  Sprout: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base(p)}>
      <path d="M12 22V11M12 11c0-4 3-7 7-7-.3 4-3 7-7 7zM12 11C12 7 9 4 5 4c.3 4 3 7 7 7z" />
    </svg>
  ),
  Hand: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 8V3.5a1.5 1.5 0 0 1 3 0V11M15 9a1.5 1.5 0 0 1 3 0v3M6 13V8a1.5 1.5 0 0 1 3 0v4M18 13v3a6 6 0 0 1-6 6h-1c-2 0-3.5-.6-4.5-2L3 14.5C2.5 13.5 3 12.5 4 12c1-.4 2 0 2.5 1L8 15" />
    </svg>
  ),
  Scale: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M12 3v18M5 21h14M5 7l-3 8c1.6 1.3 4.4 1.3 6 0L5 7zM19 7l-3 8c1.6 1.3 4.4 1.3 6 0l-3-8zM12 3L5 7M12 3l7 4" />
    </svg>
  ),
  Identity: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M5.5 17c.7-1.8 2-3 3.5-3s2.8 1.2 3.5 3M15 9h4M15 13h4M15 16h3" />
    </svg>
  ),
  Refresh: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base(p)}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  Send: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base({ strokeWidth: 1.8, ...p })}>
      <path d="M4 12l16-8-6 18-3-7z" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
