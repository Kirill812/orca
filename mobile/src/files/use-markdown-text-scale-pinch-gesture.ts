import { useMemo, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import type { ComposedGesture } from 'react-native-gesture-handler'
import { clampMarkdownTextScale, snapMarkdownTextScale } from './markdown-text-scales'

/**
 * Pinch-to-zoom for the Markdown preview. Mirrors the chat transcript's pinch
 * (`useMobileNativeChatPinchGesture`), but the committed scale is owned by the
 * caller (not this hook) so the toolbar picker and the pinch gesture read and
 * write the exact same state — pinching updates the toolbar's summary live,
 * and picking a toolbar value is what a pinch would have landed on anyway.
 */
export function useMarkdownTextScalePinchGesture(
  scale: number,
  onLiveScale: (scale: number) => void,
  onCommit: (scale: number) => void
): ComposedGesture {
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const pinchBase = useRef(scale)

  return useMemo(
    () =>
      Gesture.Simultaneous(
        Gesture.Native(),
        Gesture.Pinch()
          // Why: run on the JS thread, not a reanimated UI-thread worklet — touching
          // React state/refs from there crashes the app (see the chat pinch gesture).
          .runOnJS(true)
          .onStart(() => {
            pinchBase.current = scaleRef.current
          })
          .onUpdate((e) => {
            onLiveScale(clampMarkdownTextScale(pinchBase.current * e.scale))
          })
          .onEnd(() => {
            const snapped = snapMarkdownTextScale(scaleRef.current)
            onLiveScale(snapped)
            onCommit(snapped)
          })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onLiveScale, onCommit]
  )
}
