import { describe, expect, it } from 'vitest'
import { scaleTextStyles } from './scale-text-styles'
import { parseAppearancePrefs } from './appearance-prefs-parse'

describe('scaleTextStyles', () => {
  it('scales fontSize and lineHeight only, rounded to half points', () => {
    const out = scaleTextStyles(
      { title: { fontSize: 18, lineHeight: 24, padding: 8 }, box: { width: 10 } },
      1.15
    )
    expect(out).toEqual({
      title: { fontSize: 20.5, lineHeight: 27.5, padding: 8 },
      box: { width: 10 }
    })
  })

  it('returns the input untouched at 100%', () => {
    const styles = { a: { fontSize: 12 } }
    expect(scaleTextStyles(styles, 1)).toBe(styles)
  })
})

describe('parseAppearancePrefs', () => {
  it('falls back to defaults on garbage and unknown values', () => {
    expect(parseAppearancePrefs(null)).toEqual({
      theme: 'system',
      contrast: 'normal',
      textScale: 1
    })
    expect(parseAppearancePrefs('{nope')).toEqual({
      theme: 'system',
      contrast: 'normal',
      textScale: 1
    })
    expect(parseAppearancePrefs('{"theme":"sepia","contrast":"max","textScale":7}')).toEqual({
      theme: 'system',
      contrast: 'normal',
      textScale: 1
    })
  })

  it('keeps valid values', () => {
    expect(parseAppearancePrefs('{"theme":"light","contrast":"high","textScale":1.3}')).toEqual({
      theme: 'light',
      contrast: 'high',
      textScale: 1.3
    })
  })
})
