type StyleMap = Record<string, unknown>

/**
 * Multiplies every numeric fontSize and lineHeight in a StyleSheet.create() input by `scale`.
 * When text grows, a fixed `height` becomes a `minHeight` so rows, tabs and pills grow with their
 * text instead of clipping it; squares (icons, dots, round buttons) and thin rules keep their size.
 */
export function scaleTextStyles<T extends StyleMap>(styles: T, scale: number): T {
  if (scale === 1) {
    return styles
  }
  const scaled: StyleMap = {}
  for (const [name, style] of Object.entries(styles)) {
    if (style === null || typeof style !== 'object') {
      scaled[name] = style
      continue
    }
    const next: StyleMap = { ...(style as StyleMap) }
    for (const key of ['fontSize', 'lineHeight']) {
      if (typeof next[key] === 'number') {
        next[key] = Math.round((next[key] as number) * scale * 2) / 2
      }
    }
    const height = next.height
    if (scale > 1 && typeof height === 'number' && height >= 16 && next.width !== height) {
      delete next.height
      next.minHeight = Math.max(height, typeof next.minHeight === 'number' ? next.minHeight : 0)
    }
    scaled[name] = next
  }
  return scaled as T
}
