import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

/* ── Module icons: carpentry / engineering tools ───────────────────── */

/** Costing — carpenter's L-square with measurement ticks (measure & estimate) */
export const CostingIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 3v15a1 1 0 0 0 1 1h15" />
    <path d="M5 7h2.5M5 11h2.5M5 15h2.5" />
    <path d="M9 16.5V19M13 16.5V19M17 16.5V19" />
  </svg>
);

/** Quotation — drafting compass (plan / proposal) */
export const QuotationIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M11 6 6.5 19.5M13 6l4.5 13.5" />
    <path d="m6.5 19.5-1.2 1.8M17.5 19.5l1.2 1.8" />
    <path d="M10 12.5h4" />
  </svg>
);

/** Invoice — engineering job-sheet clipboard */
export const InvoiceIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <rect x="9" y="2.2" width="6" height="3.4" rx="1.2" />
    <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
  </svg>
);

/** Hammer — for a future module */
export const HammerIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14.5 5.5 18 9l-2 2-3.5-3.5z" />
    <path d="m13 8-8 8a2 2 0 1 0 2.8 2.8l8-8" />
    <path d="M12.5 3.5 19.5 10.5" />
  </svg>
);

/** Saw — for a future module */
export const SawIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 7h12l4 4" />
    <path d="M3 7v3l2-1 2 1 2-1 2 1 2-1 2 1V7" />
    <path d="M15 11l4 4a2 2 0 0 1-2.8 2.8L13 14" />
  </svg>
);

/** Toolbox — "More modules" */
export const ToolboxIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="8" width="18" height="11" rx="2" />
    <path d="M3 12h18M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M10.5 12v2h3v-2" />
  </svg>
);

/* ── Nav icons ─────────────────────────────────────────────────────── */

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
);

/** Documents — rolled blueprint */
export const DocsIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4h9a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V6" />
    <path d="M6 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h1" />
    <path d="M10 9h5M10 12.5h5M10 16h3" />
  </svg>
);

/** Settings — engineering gear */
export const SettingsIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/* ── Smart-command icons ───────────────────────────────────────────── */

export const PencilIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);

export const MicIcon = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
);

export const CameraIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8.5 13.2 11l2.3.8-2.3.8L12 15l-1.2-2.4L8.5 11.8 10.8 11z" /></svg>
);

export const SendIcon = (p: P) => (
  <svg {...base} {...p}><path d="M7 17 17 7M9 7h8v8" /></svg>
);

export const ChevronRight = (p: P) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>
);

export const BackIcon = (p: P) => (
  <svg {...base} {...p}><path d="m15 6-6 6 6 6" /></svg>
);

/** kept for compatibility */
export const PlusIcon = ToolboxIcon;
