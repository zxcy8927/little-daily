export function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}
export function motionScrollBehavior(): ScrollBehavior {
  return reducedMotion() ? 'auto' : 'smooth'
}
export function motionDuration(
  speed: 'fast' | 'medium' | 'slow',
  multiple = 1,
) {
  if (reducedMotion()) return 0
  // CSS is the source of truth; fallbacks cover tests and unavailable stylesheets.
  const fallback = { fast: 150, medium: 300, slow: 600 }
  const value =
    typeof document === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement)
          .getPropertyValue(`--motion-${speed}`)
          .trim()
  const match = /^((?:\d+(?:\.\d+)?|\.\d+))(ms|s)$/.exec(value)
  const duration = match
    ? Number(match[1]) * (match[2] === 's' ? 1000 : 1)
    : fallback[speed]
  return duration * multiple
}
