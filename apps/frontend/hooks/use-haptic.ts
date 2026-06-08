export function useHaptic() {
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    const patterns: Record<typeof intensity, number> = {
      light: 10,
      medium: 20,
      heavy: 40,
    }
    navigator.vibrate(patterns[intensity])
  }

  return { triggerHaptic }
}
