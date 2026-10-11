// Why one root knob: every block type multiplies its own base font/line-height
// by the same `textScale` rather than each having a bespoke scaled variant —
// one number scales headings, prose, code, quotes and table cells together.
export function scaledTextStyle(
  fontSize: number,
  lineHeight: number | undefined,
  textScale: number
): { fontSize: number; lineHeight?: number } | null {
  if (textScale === 1) {
    return null
  }
  return lineHeight == null
    ? { fontSize: fontSize * textScale }
    : { fontSize: fontSize * textScale, lineHeight: lineHeight * textScale }
}

// Why: at the default scale, keep `style` the same plain object callers already got
// (some tests read style props without RN's StyleSheet.flatten) instead of always
// wrapping it in a single-purpose array.
export function withScale<T>(base: T, scale: object | null): T | [T, object] {
  return scale ? [base, scale] : base
}

// Base sizes mirror mobile-markdown-styles.ts; inline spans (bold/italic/links)
// inherit fontSize from their wrapping Text, so only styles that set their own
// fontSize need an explicit scaled variant.
export function getMarkdownBlockScales(textScale: number) {
  return {
    prose: scaledTextStyle(13, 19, textScale),
    heading: scaledTextStyle(14, 20, textScale),
    headingLarge: scaledTextStyle(15, 21, textScale),
    quote: scaledTextStyle(13, 19, textScale),
    codeLanguage: scaledTextStyle(10, undefined, textScale),
    codeText: scaledTextStyle(12, 17, textScale),
    imageCaption: scaledTextStyle(11, undefined, textScale),
    tableCell: scaledTextStyle(12, 17, textScale),
    tableTruncated: scaledTextStyle(12, undefined, textScale),
    listMarker: scaledTextStyle(13, 19, textScale),
    list: scaledTextStyle(13, 19, textScale)
  }
}
