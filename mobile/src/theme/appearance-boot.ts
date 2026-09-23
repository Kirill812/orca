import { Appearance, StyleSheet } from 'react-native'
import { readAppearancePrefs } from './appearance-prefs'
import { scaleTextStyles } from './scale-text-styles'

// Why a boot module: mobile-theme.ts picks its palette once, at import time, and cannot import
// react-native itself; and ~100 screens build their StyleSheets at import time. index.js imports
// this before the router so every palette read and StyleSheet.create below sees the user's choice.
// Both therefore apply from the next app launch, which Settings → Display says.
const prefs = readAppearancePrefs()

const boot = globalThis as { __orcaColorScheme?: string; __orcaHighContrast?: boolean }
boot.__orcaColorScheme =
  prefs.theme === 'system' ? (Appearance.getColorScheme() ?? 'dark') : prefs.theme
boot.__orcaHighContrast = prefs.contrast === 'high'

if (prefs.textScale !== 1) {
  // ponytail: covers text styled via StyleSheet.create (nearly all of it); inline fontSize
  // literals stay unscaled. Stacks with the Android/iOS system font size.
  const create = StyleSheet.create
  StyleSheet.create = ((styles) =>
    create(scaleTextStyles(styles, prefs.textScale))) as typeof create
}
