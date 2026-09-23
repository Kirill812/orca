import { Appearance } from 'react-native'

// Why a boot module: mobile-theme.ts picks its palette once, at import time, and cannot import
// react-native itself. index.js imports this before the router so every StyleSheet sees it.
;(globalThis as { __orcaColorScheme?: string }).__orcaColorScheme =
  Appearance.getColorScheme() ?? 'dark'
