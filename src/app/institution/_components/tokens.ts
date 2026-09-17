/**
 * Institution area — design tokens.
 *
 * NOT a new design system. Every value below is lifted from what the product
 * already uses so a college screen looks like the same app as the dashboard a
 * user was on a minute ago:
 *
 *   #2557a7 / #1e4a94 / #eef4ff   the brand blue, its pressed state and its
 *                                 tint — the single most-used colour in the
 *                                 repo (Sidebar active pill, primary Button)
 *   #eef2fb                       the dashboard page ground (CoverLetterDashboardShell)
 *   slate ink ramp + #e2e8f0      already the text/border ramp across the app
 *
 * TYPE SCALE. The body base is 14px/22px (globals.css). Screens here are dense
 * tables, so the scale steps DOWN from that for data and up for titles. Every
 * step fixes size, weight AND colour — hierarchy is never carried by size
 * alone, because size alone disappears at a glance and for low-vision users.
 *
 *   pageTitle   20 / 600 / ink.strong    one per screen
 *   sectionTitle 14 / 600 / ink.strong   a card or region heading
 *   microLabel  11 / 600 / +0.06em caps / ink.muted   column + field labels
 *   body        13 / 400 / ink.body      table cells, prose
 *   caption     12 / 400 / ink.muted     secondary line under a value
 *   metric      26 / 600 / tabular-nums  the number on a stat tile
 */

export const INK = {
  strong: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
} as const;

export const BRAND = {
  base: '#2557a7',
  hover: '#1e4a94',
  tint: '#eef4ff',
  ring: 'rgba(37,87,167,0.35)',
} as const;

export const LINE = {
  hair: '#e2e8f0',
  soft: '#f0f0f0',
} as const;

export const SURFACE = {
  card: '#ffffff',
  page: '#eef2fb',
  zebra: '#f8fafc',
} as const;

/**
 * A single focus treatment used by every interactive element in this area, so
 * keyboard users get one consistent, always-visible ring. Applied as a class
 * string rather than a token object because it composes with `cn()`.
 */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/**
 * Motion: one duration, one easing, and nothing that runs on page entry. A
 * faculty member entering their fortieth progress row must never wait on an
 * animation. `motion-reduce:transition-none` honours prefers-reduced-motion.
 */
export const TRANSITION = 'transition-colors duration-150 motion-reduce:transition-none';

/** Numeric columns align on the decimal — non-negotiable for scanning a column. */
export const TABULAR = 'tabular-nums';

export const CARD =
  'rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
