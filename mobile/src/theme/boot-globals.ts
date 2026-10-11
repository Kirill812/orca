// The two per-launch appearance values, written once by appearance-boot.ts (or web-entry/color-scheme.ts)
// and read by mobile-theme.ts. Declared once here so no reader needs a type assertion.
declare global {
  var __orcaColorScheme: string | undefined
  var __orcaHighContrast: boolean | undefined
}

export {}
