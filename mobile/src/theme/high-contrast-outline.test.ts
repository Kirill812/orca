import { describe, expect, it } from 'vitest'
import { outlineFilledButtons } from './high-contrast-outline'
import { highContrastLightColors as p } from './palettes'

describe('outlineFilledButtons', () => {
  it('turns a primary fill into a transparent body with a thick dark border', () => {
    const out = outlineFilledButtons({ cta: { backgroundColor: p.textPrimary, padding: 8 } }, p)
    expect(out.cta).toEqual({
      backgroundColor: 'transparent',
      padding: 8,
      borderWidth: 2,
      borderColor: p.textPrimary
    })
  })

  it('gives secondary fills a 1px border, destructive fills a red one, and keeps thicker borders', () => {
    const out = outlineFilledButtons(
      {
        chip: { backgroundColor: p.bgRaised, borderWidth: 3 },
        danger: { backgroundColor: p.statusRed }
      },
      p
    )
    expect(out.chip).toMatchObject({ backgroundColor: 'transparent', borderWidth: 3 })
    expect(out.danger).toMatchObject({ borderWidth: 1, borderColor: p.statusRed })
  })

  it('drops the fill on press states without adding a border, and leaves other styles alone', () => {
    const plain = { backgroundColor: p.bgBase, color: p.textPrimary }
    const out = outlineFilledButtons({ rowPressed: { backgroundColor: p.bgRaised }, plain }, p)
    expect(out.rowPressed).toEqual({ backgroundColor: 'transparent' })
    expect(out.plain).toBe(plain)
  })
})
