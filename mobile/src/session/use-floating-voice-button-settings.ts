import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  loadFloatingVoiceButtonEnabled,
  loadFloatingVoiceButtonOpacityPercent,
  loadFloatingVoiceButtonSizePercent,
  saveFloatingVoiceButtonEnabled,
  saveFloatingVoiceButtonOpacityPercent,
  saveFloatingVoiceButtonSizePercent
} from './floating-voice-button-storage'
import {
  DEFAULT_FLOATING_VOICE_BUTTON_OPACITY_PERCENT,
  DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT,
  type FloatingVoiceButtonOpacityPercent,
  type FloatingVoiceButtonSizePercent
} from './floating-voice-button-geometry'

/**
 * Settings → Chat UI writes these; the session screen (terminal dock + Chat
 * UI, both live under the one session route) reloads on focus so flipping the
 * switch and coming back applies immediately without remounting the screen —
 * same pattern as useMobileSessionPreferenceFocus for terminal text scale.
 */
export function useFloatingVoiceButtonSessionSettings(): {
  enabled: boolean
  sizePercent: FloatingVoiceButtonSizePercent
  opacityPercent: FloatingVoiceButtonOpacityPercent
} {
  const [enabled, setEnabled] = useState(true)
  const [sizePercent, setSizePercent] = useState<FloatingVoiceButtonSizePercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT
  )
  const [opacityPercent, setOpacityPercent] = useState<FloatingVoiceButtonOpacityPercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_OPACITY_PERCENT
  )

  useFocusEffect(
    useCallback(() => {
      let active = true
      void loadFloatingVoiceButtonEnabled().then((value) => {
        if (active) {
          setEnabled(value)
        }
      })
      void loadFloatingVoiceButtonSizePercent().then((value) => {
        if (active) {
          setSizePercent(value)
        }
      })
      void loadFloatingVoiceButtonOpacityPercent().then((value) => {
        if (active) {
          setOpacityPercent(value)
        }
      })
      return () => {
        active = false
      }
    }, [])
  )

  return { enabled, sizePercent, opacityPercent }
}

/** Settings screen's own load/save state — separate from the session hook
 *  above since the settings screen isn't part of the session route stack. */
export function useFloatingVoiceButtonSettingsScreenState(): {
  enabled: boolean
  sizePercent: FloatingVoiceButtonSizePercent
  opacityPercent: FloatingVoiceButtonOpacityPercent
  loaded: boolean
  setEnabled: (next: boolean) => void
  setSizePercent: (next: FloatingVoiceButtonSizePercent) => void
  setOpacityPercent: (next: FloatingVoiceButtonOpacityPercent) => void
} {
  const [enabled, setEnabledState] = useState(true)
  const [sizePercent, setSizePercentState] = useState<FloatingVoiceButtonSizePercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT
  )
  const [opacityPercent, setOpacityPercentState] = useState<FloatingVoiceButtonOpacityPercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_OPACITY_PERCENT
  )
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    void Promise.all([
      loadFloatingVoiceButtonEnabled(),
      loadFloatingVoiceButtonSizePercent(),
      loadFloatingVoiceButtonOpacityPercent()
    ]).then(([loadedEnabled, loadedSizePercent, loadedOpacityPercent]) => {
      if (!active) {
        return
      }
      setEnabledState(loadedEnabled)
      setSizePercentState(loadedSizePercent)
      setOpacityPercentState(loadedOpacityPercent)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next)
    void saveFloatingVoiceButtonEnabled(next)
  }, [])

  const setSizePercent = useCallback((next: FloatingVoiceButtonSizePercent) => {
    setSizePercentState(next)
    void saveFloatingVoiceButtonSizePercent(next)
  }, [])

  const setOpacityPercent = useCallback((next: FloatingVoiceButtonOpacityPercent) => {
    setOpacityPercentState(next)
    void saveFloatingVoiceButtonOpacityPercent(next)
  }, [])

  return {
    enabled,
    sizePercent,
    opacityPercent,
    loaded,
    setEnabled,
    setSizePercent,
    setOpacityPercent
  }
}
