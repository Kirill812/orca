import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  loadFloatingVoiceButtonEnabled,
  loadFloatingVoiceButtonSizePercent,
  saveFloatingVoiceButtonEnabled,
  saveFloatingVoiceButtonSizePercent
} from '../storage/preferences'
import {
  DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT,
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
} {
  const [enabled, setEnabled] = useState(true)
  const [sizePercent, setSizePercent] = useState<FloatingVoiceButtonSizePercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT
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
      return () => {
        active = false
      }
    }, [])
  )

  return { enabled, sizePercent }
}

/** Settings screen's own load/save state — separate from the session hook
 *  above since the settings screen isn't part of the session route stack. */
export function useFloatingVoiceButtonSettingsScreenState(): {
  enabled: boolean
  sizePercent: FloatingVoiceButtonSizePercent
  loaded: boolean
  setEnabled: (next: boolean) => void
  setSizePercent: (next: FloatingVoiceButtonSizePercent) => void
} {
  const [enabled, setEnabledState] = useState(true)
  const [sizePercent, setSizePercentState] = useState<FloatingVoiceButtonSizePercent>(
    DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT
  )
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    void Promise.all([loadFloatingVoiceButtonEnabled(), loadFloatingVoiceButtonSizePercent()]).then(
      ([loadedEnabled, loadedSizePercent]) => {
        if (!active) {
          return
        }
        setEnabledState(loadedEnabled)
        setSizePercentState(loadedSizePercent)
        setLoaded(true)
      }
    )
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

  return { enabled, sizePercent, loaded, setEnabled, setSizePercent }
}
