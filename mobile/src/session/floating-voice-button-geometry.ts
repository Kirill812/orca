// Pure geometry/logic for the floating voice button: size options, position
// normalization/clamping, and drag-vs-tap detection. No RN imports so this is
// plain-Vitest testable without mocking gesture-handler or reanimated.

/** Diameter of the inline mic button it replaces (MobileTerminalInputActions'
 *  `dictationButton` style) — the floating button's 100% size reference. */
export const INLINE_MIC_BUTTON_SIZE_PX = 34

export const FLOATING_VOICE_BUTTON_SIZE_OPTIONS = [50, 75, 100, 150, 200, 250, 300] as const

export type FloatingVoiceButtonSizePercent = (typeof FLOATING_VOICE_BUTTON_SIZE_OPTIONS)[number]

export const DEFAULT_FLOATING_VOICE_BUTTON_SIZE_PERCENT: FloatingVoiceButtonSizePercent = 200

export function isFloatingVoiceButtonSizePercent(
  value: unknown
): value is FloatingVoiceButtonSizePercent {
  return (
    typeof value === 'number' &&
    (FLOATING_VOICE_BUTTON_SIZE_OPTIONS as readonly number[]).includes(value)
  )
}

/** Diameter in px for a given size percent (50-300% of the inline button). */
export function floatingVoiceButtonDiameter(percent: number): number {
  return Math.round((INLINE_MIC_BUTTON_SIZE_PX * percent) / 100)
}

// Movement under this many px is a tap/hold-press, not a drag. Gesture.Pan's
// own minDistance already filters sub-pixel jitter; this is the threshold that
// decides intent once the pan has activated.
export const FLOATING_VOICE_BUTTON_DRAG_THRESHOLD_PX = 12

export function isFloatingVoiceButtonDragTap(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) < FLOATING_VOICE_BUTTON_DRAG_THRESHOLD_PX
}

export type FloatingVoiceButtonInsets = {
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

export type FloatingVoiceButtonPoint = {
  readonly x: number
  readonly y: number
}

/** Clamps a top-left px position so the button (given `diameter`) stays fully
 *  inside the container and clear of the safe area on every edge. Falls back
 *  to the top-left safe corner when the container is too small to fit it. */
export function clampFloatingVoiceButtonPosition(params: {
  x: number
  y: number
  diameter: number
  containerWidth: number
  containerHeight: number
  insets: FloatingVoiceButtonInsets
}): FloatingVoiceButtonPoint {
  const { diameter, containerWidth, containerHeight, insets } = params
  const minX = insets.left
  const minY = insets.top
  const maxX = Math.max(minX, containerWidth - insets.right - diameter)
  const maxY = Math.max(minY, containerHeight - insets.bottom - diameter)
  return {
    x: clamp(params.x, minX, maxX),
    y: clamp(params.y, minY, maxY)
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

export type FloatingVoiceButtonNormalizedPosition = {
  readonly xFrac: number
  readonly yFrac: number
}

// Why fractions of the container rather than raw px: the button must stay put
// (proportionally) across rotation, keyboard, and different screen sizes — the
// stored value is denormalized against whatever the current layout is and
// re-clamped on every read, so it can never land off-screen or under a keyboard
// that grew since the value was saved.
export function normalizeFloatingVoiceButtonPosition(params: {
  x: number
  y: number
  containerWidth: number
  containerHeight: number
}): FloatingVoiceButtonNormalizedPosition {
  const { containerWidth, containerHeight } = params
  return {
    xFrac: containerWidth > 0 ? clamp(params.x / containerWidth, 0, 1) : 0,
    yFrac: containerHeight > 0 ? clamp(params.y / containerHeight, 0, 1) : 0
  }
}

export function denormalizeFloatingVoiceButtonPosition(params: {
  position: FloatingVoiceButtonNormalizedPosition
  diameter: number
  containerWidth: number
  containerHeight: number
  insets: FloatingVoiceButtonInsets
}): FloatingVoiceButtonPoint {
  const { position, containerWidth, containerHeight } = params
  return clampFloatingVoiceButtonPosition({
    x: position.xFrac * containerWidth,
    y: position.yFrac * containerHeight,
    diameter: params.diameter,
    containerWidth,
    containerHeight,
    insets: params.insets
  })
}

export function isFloatingVoiceButtonNormalizedPosition(
  value: unknown
): value is FloatingVoiceButtonNormalizedPosition {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { xFrac, yFrac } = value as Record<string, unknown>
  return (
    typeof xFrac === 'number' &&
    typeof yFrac === 'number' &&
    Number.isFinite(xFrac) &&
    Number.isFinite(yFrac) &&
    xFrac >= 0 &&
    xFrac <= 1 &&
    yFrac >= 0 &&
    yFrac <= 1
  )
}

// Default resting spot when the user has never dragged the button: lower
// right, clear of the composer/dock which sit at the very bottom.
export const DEFAULT_FLOATING_VOICE_BUTTON_POSITION: FloatingVoiceButtonNormalizedPosition = {
  xFrac: 0.86,
  yFrac: 0.62
}
