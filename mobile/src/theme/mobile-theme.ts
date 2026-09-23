// Orca mobile design tokens — matches desktop graphite/dark palette, plus a light
// palette for light-mode devices (and e-ink readers, where a dark UI is unusable).
// All screen files should import from here instead of using inline hex values.

export const darkColors = {
  bgBase: '#111111',
  bgPanel: '#1a1a1a',
  bgRaised: '#242424',
  borderSubtle: '#2a2a2a',
  editorSurface: '#1e1e1e',

  textPrimary: '#e0e0e0',
  textSecondary: '#a1a1a1',
  textMuted: '#8c8c8c',

  // Crisp near-white surface for the single primary action on a screen (the
  // worktree FAB). Brighter than textPrimary so it reads as a solid button, not
  // disabled chrome, while staying monochrome (STYLEGUIDE: color is for state).
  surfaceBright: '#f5f5f5',

  accentBlue: '#3b82f6',
  // Text/icon color on a filled accent (accentBlue) button, where the muted
  // textPrimary would lack contrast against the saturated fill.
  onAccent: '#ffffff',

  statusGreen: '#22c55e',
  statusAmber: '#f59e0b',
  statusRed: '#ef4444',
  // Merge CTA fill + its on-fill text, mirroring the desktop ChecksPanel's
  // bg-green-600 "Squash and merge" button (green-600 / white).
  mergeGreen: '#16a34a',
  onMergeGreen: '#ffffff',
  // Merged-PR purple, mirroring the desktop ReviewIcon's purple-400/70 tone.
  statusPurple: '#a78bfa',
  gitDecorationAdded: '#81b88b',
  gitDecorationDeleted: '#c74e39',
  diffAddedBg: 'rgba(129, 184, 139, 0.1)',
  diffDeletedBg: 'rgba(199, 78, 57, 0.11)',

  syntaxComment: '#6a9955',
  syntaxKeyword: '#569cd6',
  syntaxString: '#ce9178',
  syntaxNumber: '#b5cea8',
  syntaxType: '#4ec9b0',
  syntaxFunction: '#dcdcaa',
  syntaxVariable: '#9cdcfe',
  syntaxMeta: '#c586c0',

  // Terminal WebView background (Tokyonight) — separate from app chrome
  terminalBg: '#1a1b26'
}

// Why pure white and near-black: on e-ink, white is the uninked state and faint greys
// dither into noise, so the light palette favours solid, high-contrast values.
export const lightColors: typeof darkColors = {
  bgBase: '#ffffff',
  bgPanel: '#f5f5f5',
  bgRaised: '#ebebeb',
  borderSubtle: '#d4d4d4',
  editorSurface: '#ffffff',

  textPrimary: '#111111',
  textSecondary: '#404040',
  textMuted: '#595959',

  // Inverted: the primary action reads as a solid dark button on a light screen.
  surfaceBright: '#1a1a1a',

  accentBlue: '#2563eb',
  onAccent: '#ffffff',

  statusGreen: '#15803d',
  statusAmber: '#b45309',
  statusRed: '#dc2626',
  mergeGreen: '#16a34a',
  onMergeGreen: '#ffffff',
  statusPurple: '#7c3aed',
  gitDecorationAdded: '#2e7d32',
  gitDecorationDeleted: '#c62828',
  diffAddedBg: 'rgba(46, 125, 50, 0.14)',
  diffDeletedBg: 'rgba(198, 40, 40, 0.14)',

  // VS Code Light+ syntax colours.
  syntaxComment: '#008000',
  syntaxKeyword: '#0000ff',
  syntaxString: '#a31515',
  syntaxNumber: '#098658',
  syntaxType: '#267f99',
  syntaxFunction: '#795e26',
  syntaxVariable: '#001080',
  syntaxMeta: '#af00db',

  terminalBg: '#ffffff'
}

// Why a global instead of importing Appearance here: this module is also bundled into the
// terminal WebView document script, where react-native does not exist. color-scheme-boot.ts
// sets it before any screen module evaluates, and there it falls back to dark.
// ponytail: scheme is fixed per app launch (StyleSheets are built at import time); switching
// the OS theme applies on the next cold start.
export const isLightTheme =
  (globalThis as { __orcaColorScheme?: string }).__orcaColorScheme === 'light'

export const colors = isLightTheme ? lightColors : darkColors

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const

export const radii = {
  row: 6,
  card: 14,
  button: 6,
  input: 6,
  camera: 8
} as const

export const typography = {
  titleSize: 18,
  bodySize: 14,
  metaSize: 12,
  monoFamily: 'monospace' as const
} as const
