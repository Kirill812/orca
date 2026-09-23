import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { Mic } from 'lucide-react-native'
import { colors } from '../theme/mobile-theme'
import {
  loadFloatingVoiceButtonPosition,
  saveFloatingVoiceButtonPosition
} from '../storage/preferences'
import {
  DEFAULT_FLOATING_VOICE_BUTTON_POSITION,
  clampFloatingVoiceButtonPosition,
  denormalizeFloatingVoiceButtonPosition,
  floatingVoiceButtonDiameter,
  isFloatingVoiceButtonDragTap,
  normalizeFloatingVoiceButtonPosition,
  type FloatingVoiceButtonPoint
} from './floating-voice-button-geometry'

// A tap held this long (with no drag) cancels an in-flight dictation instead
// of toggling a new one — mirrors MobileTerminalInputActions' onLongPress.
const LONG_PRESS_CANCEL_MS = 500

export type FloatingVoiceButtonProps = {
  /** Renders nothing when off — the caller still owns showing the inline button. */
  visible: boolean
  sizePercent: number
  mode: string | undefined
  /** Recording or starting — drawn with the active ring, like the inline button. */
  active: boolean
  processing?: boolean
  disabled?: boolean
  onTap: () => void
  onPressIn?: () => void
  onPressOut?: () => void
  onLongPressCancel?: () => void
}

/**
 * Draggable floating mic button, overlaid above the terminal session and Chat
 * UI screens (see FloatingVoiceButtonOverlay). Position persists normalized
 * (fractions of the container) so it survives rotation/keyboard/screen-size
 * changes; drag vs. tap is a movement-threshold check on release, same idea as
 * the inline button's Pressable but done by hand since a Pan gesture doesn't
 * get onPress for free.
 */
export function FloatingVoiceButtonOverlay(props: FloatingVoiceButtonProps) {
  const insets = useSafeAreaInsets()
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setContainerSize((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height }
    )
  }, [])

  if (!props.visible) {
    return null
  }
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {containerSize ? (
        <FloatingVoiceButtonDraggable {...props} containerSize={containerSize} insets={insets} />
      ) : null}
    </View>
  )
}

function FloatingVoiceButtonDraggable({
  sizePercent,
  mode,
  active,
  processing = false,
  disabled = false,
  onTap,
  onPressIn,
  onPressOut,
  onLongPressCancel,
  containerSize,
  insets
}: FloatingVoiceButtonProps & {
  containerSize: { width: number; height: number }
  insets: { top: number; bottom: number; left: number; right: number }
}) {
  const diameter = floatingVoiceButtonDiameter(sizePercent)
  const [pos, setPos] = useState<FloatingVoiceButtonPoint | null>(null)
  const posRef = useRef(pos)
  posRef.current = pos
  const dragStart = useRef<FloatingVoiceButtonPoint | null>(null)
  // Why not Date.now(): react/purity flags wall-clock reads reachable from the
  // gesture chain (it can't see they run outside render); a timer-driven flag
  // gets the same "held long enough" answer without an impure call in scope.
  const heldLongEnough = useRef(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the saved position once, then re-clamp it to the current container
  // any time the container or the button's own size changes (rotation,
  // keyboard, or the size picker).
  useEffect(() => {
    let cancelled = false
    void loadFloatingVoiceButtonPosition().then((saved) => {
      if (cancelled) {
        return
      }
      setPos(
        denormalizeFloatingVoiceButtonPosition({
          position: saved ?? DEFAULT_FLOATING_VOICE_BUTTON_POSITION,
          diameter,
          containerWidth: containerSize.width,
          containerHeight: containerSize.height,
          insets
        })
      )
    })
    return () => {
      cancelled = true
    }
  }, [
    diameter,
    containerSize.width,
    containerSize.height,
    insets.top,
    insets.bottom,
    insets.left,
    insets.right
  ])

  const pan = Gesture.Pan()
    // Why runOnJS: the callbacks call React state setters and AsyncStorage —
    // touching those from a UI-thread worklet crashes (see the pinch-gesture
    // hook's comment for the same reasoning).
    .runOnJS(true)
    .onBegin(() => {
      dragStart.current = posRef.current
      heldLongEnough.current = false
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      longPressTimer.current = setTimeout(() => {
        heldLongEnough.current = true
      }, LONG_PRESS_CANCEL_MS)
      if (mode === 'hold' && !disabled) {
        onPressIn?.()
      }
    })
    .onUpdate((e) => {
      if (!dragStart.current) {
        return
      }
      setPos(
        clampFloatingVoiceButtonPosition({
          x: dragStart.current.x + e.translationX,
          y: dragStart.current.y + e.translationY,
          diameter,
          containerWidth: containerSize.width,
          containerHeight: containerSize.height,
          insets
        })
      )
    })
    .onEnd((e) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      const tap = isFloatingVoiceButtonDragTap(e.translationX, e.translationY)
      if (tap) {
        // Snap back exactly — a tap shouldn't nudge the button from jitter.
        if (dragStart.current) {
          setPos(dragStart.current)
        }
        if (!disabled && mode !== 'hold') {
          if (heldLongEnough.current && (active || processing) && onLongPressCancel) {
            onLongPressCancel()
          } else {
            onTap()
          }
        }
      } else if (posRef.current) {
        void saveFloatingVoiceButtonPosition(
          normalizeFloatingVoiceButtonPosition({
            x: posRef.current.x,
            y: posRef.current.y,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height
          })
        )
      }
      if (mode === 'hold' && !disabled) {
        onPressOut?.()
      }
      dragStart.current = null
    })

  if (!pos) {
    return null
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="button"
          accessibilityLabel={
            processing
              ? 'Cancel voice dictation'
              : active
                ? 'Stop voice dictation'
                : 'Start voice dictation'
          }
          style={[
            styles.button,
            {
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              left: pos.x,
              top: pos.y
            },
            active && styles.buttonActive,
            disabled && styles.buttonDisabled
          ]}
        >
          {processing ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Mic
              size={Math.round(diameter * 0.45)}
              color={active ? colors.textPrimary : colors.textSecondary}
              strokeWidth={2.4}
            />
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    backgroundColor: colors.bgRaised,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    // Clear border over a heavy shadow keeps it visible on light/e-ink
    // screens per the design brief; a light native elevation still helps it
    // read as floating above the content.
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  buttonActive: {
    backgroundColor: colors.bgPanel,
    borderColor: colors.textSecondary
  },
  buttonDisabled: {
    opacity: 0.45
  }
})
