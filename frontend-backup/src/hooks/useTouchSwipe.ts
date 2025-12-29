import { useRef, useCallback } from 'react'

interface UseTouchSwipeOptions {
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  enabled?: boolean
}

export function useTouchSwipe({
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: UseTouchSwipeOptions) {
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)
  const isSwipingRef = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    touchStartY.current = e.touches[0].clientY
    touchEndY.current = null
    isSwipingRef.current = false
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || touchStartY.current === null) return
    touchEndY.current = e.touches[0].clientY
  }, [enabled])

  const handleTouchEnd = useCallback(() => {
    if (!enabled || isSwipingRef.current) return
    if (touchStartY.current === null || touchEndY.current === null) return

    const deltaY = touchStartY.current - touchEndY.current

    if (Math.abs(deltaY) >= threshold) {
      isSwipingRef.current = true
      if (deltaY > 0 && onSwipeUp) {
        onSwipeUp()
      } else if (deltaY < 0 && onSwipeDown) {
        onSwipeDown()
      }
      
      // Reset after animation
      setTimeout(() => {
        isSwipingRef.current = false
      }, 800)
    }

    touchStartY.current = null
    touchEndY.current = null
  }, [enabled, threshold, onSwipeUp, onSwipeDown])

  const bindToElement = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {}

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { bindToElement }
}
