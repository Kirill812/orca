import { useFloatingVoiceButtonSessionSettings } from './use-floating-voice-button-settings'
import type { FloatingVoiceButtonSizePercent } from './floating-voice-button-geometry'

/** Settings → Chat UI's floating voice button prefs, merged into the session
 *  controller so both the terminal dock and the Chat UI overlay can read them
 *  without their own AsyncStorage reads. */
export function useMobileSessionFloatingVoice(): {
  floatingVoiceEnabled: boolean
  floatingVoiceSizePercent: FloatingVoiceButtonSizePercent
} {
  const { enabled, sizePercent } = useFloatingVoiceButtonSessionSettings()
  return { floatingVoiceEnabled: enabled, floatingVoiceSizePercent: sizePercent }
}
