import { describe, expect, it } from 'vitest'
import { selectTerminalTheme } from './terminal-theme-selection'
import { LIGHT_TERMINAL_THEME } from './terminal-webview-html/theme'

const hostDark = { mode: 'dark', theme: { background: '#000000', foreground: '#ffffff' } } as never

describe('selectTerminalTheme', () => {
  it('sends the light payload in light mode whatever the host published', () => {
    for (const host of [hostDark, undefined]) {
      expect(selectTerminalTheme(true, host)).toEqual({
        mode: 'light',
        theme: LIGHT_TERMINAL_THEME
      })
    }
  })

  it('passes the host theme through in dark mode', () => {
    expect(selectTerminalTheme(false, hostDark)).toBe(hostDark)
    expect(selectTerminalTheme(false, undefined)).toBeUndefined()
  })
})
