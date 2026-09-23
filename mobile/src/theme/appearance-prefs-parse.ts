export type ThemePreference = 'system' | 'light' | 'dark'
export type ContrastPreference = 'normal' | 'high'
export type AppearancePrefs = {
  theme: ThemePreference
  contrast: ContrastPreference
  textScale: number
}

export const TEXT_SCALES = [0.85, 1, 1.15, 1.3, 1.5] as const
export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  theme: 'system',
  contrast: 'normal',
  textScale: 1
}

export function parseAppearancePrefs(raw: string | null): AppearancePrefs {
  try {
    const parsed = JSON.parse(raw ?? '{}') as Partial<AppearancePrefs>
    return {
      theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : 'system',
      contrast: parsed.contrast === 'high' ? 'high' : 'normal',
      textScale: (TEXT_SCALES as readonly number[]).includes(parsed.textScale as number)
        ? (parsed.textScale as number)
        : 1
    }
  } catch {
    return DEFAULT_APPEARANCE_PREFS
  }
}
