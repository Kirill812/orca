type StyleMap = Record<string, unknown>

/** Multiplies every numeric fontSize and lineHeight in a StyleSheet.create() input by `scale`. */
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
    scaled[name] = next
  }
  return scaled as T
}
