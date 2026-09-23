type StyleMap = Record<string, unknown>

export type OutlinePalette = {
  textPrimary: string
  surfaceBright: string
  accentBlue: string
  mergeGreen: string
  statusRed: string
  bgRaised: string
}

// Why skip borders on pressed/active variants: they are merged over a base style, so adding a
// border there would shift the layout on every press; they just lose their fill.
const PRESS_STATE = /pressed|active/i

/**
 * High contrast (e-ink): turns every filled button style into an outlined one. A solid fill costs
 * an e-ink panel a full-area redraw and ghosts on press; a transparent body with a black border
 * stays crisp. Primary/selected fills get a thicker border so "selected" survives without a fill.
 */
export function outlineFilledButtons<T extends StyleMap>(styles: T, palette: OutlinePalette): T {
  const strong = new Set([
    palette.textPrimary,
    palette.surfaceBright,
    palette.accentBlue,
    palette.mergeGreen
  ])
  const filled = new Set([...strong, palette.statusRed, palette.bgRaised])
  const outlined: StyleMap = {}
  for (const [name, style] of Object.entries(styles)) {
    const background =
      style !== null && typeof style === 'object' ? (style as StyleMap).backgroundColor : undefined
    if (typeof background !== 'string' || !filled.has(background)) {
      outlined[name] = style
      continue
    }
    const next: StyleMap = { ...(style as StyleMap), backgroundColor: 'transparent' }
    if (!PRESS_STATE.test(name)) {
      const current = typeof next.borderWidth === 'number' ? next.borderWidth : 0
      next.borderWidth = Math.max(current, strong.has(background) ? 2 : 1)
      next.borderColor = background === palette.statusRed ? palette.statusRed : palette.textPrimary
    }
    outlined[name] = next
  }
  return outlined as T
}
