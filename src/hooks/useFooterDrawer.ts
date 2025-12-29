import { useState, useRef, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'

/** Trigger subtle haptic feedback on supported devices */
function triggerHaptic(style: 'light' | 'medium' = 'light') {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(style === 'light' ? 8 : 15)
    }
  } catch {
    // Haptic not available
  }
}

export interface UseFooterDrawerOptions {
  /** Enable wheel scroll to open/close footer */
  enableWheelScroll?: boolean
}

export interface UseFooterDrawerReturn {
  isFooterOpen: boolean
  isAnimating: boolean
  openFooter: () => void
  closeFooter: () => void
}

/**
 * Hook for managing footer drawer with GSAP animations
 * Handles opening/closing animations and wheel scroll events
 */
export function useFooterDrawer(
  options: UseFooterDrawerOptions = {}
): UseFooterDrawerReturn {
  const { enableWheelScroll = true } = options

  const [isFooterOpen, setIsFooterOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Refs for checking state in event handlers without re-renders
  const isFooterOpenRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const openFooterRef = useRef<(() => void) | null>(null)
  const closeFooterRef = useRef<(() => void) | null>(null)
  const bottomArmedRef = useRef(false)
  const bottomArmTimerRef = useRef<number | null>(null)

  // Keep refs in sync with state
  isFooterOpenRef.current = isFooterOpen
  isAnimatingRef.current = isAnimating

  const openFooter = useCallback(() => {
    if (isFooterOpenRef.current || isAnimatingRef.current) return

    triggerHaptic('medium')

    setIsAnimating(true)
    setIsFooterOpen(true)
    isFooterOpenRef.current = true

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const footer = document.querySelector('[data-footer]') as HTMLElement
      const backdrop = document.querySelector('[data-footer-backdrop]') as HTMLElement

      if (footer && backdrop) {
        // Kill any existing animations first
        gsap.killTweensOf([footer, backdrop])

        gsap.set(footer, {
          clearProps: 'transform',
          visibility: 'visible',
          opacity: 1,
          yPercent: 100,
          zIndex: 1260,
          display: 'block',
        })

        gsap.set(backdrop, { visibility: 'visible', opacity: 0 })

        footer.offsetHeight

        // Premium motion: gentle overshoot (BORK-like)
        gsap.timeline({
          onComplete: () => setIsAnimating(false),
        })
          .to(
            backdrop,
            {
              opacity: 1,
              duration: 0.45,
              ease: 'power2.out',
            },
            0,
          )
          .set(backdrop, { pointerEvents: 'auto' }, 0)
          .to(
            footer,
            {
              yPercent: 0,
              duration: 0.78,
              ease: 'back.out(1.15)',
              force3D: true,
            },
            0,
          )
      } else {
        setIsAnimating(false)
      }
    })
  }, [])

  const closeFooter = useCallback(() => {
    if (!isFooterOpenRef.current || isAnimatingRef.current) return

    triggerHaptic('light')

    setIsAnimating(true)

    const footer = document.querySelector('[data-footer]') as HTMLElement
    const backdrop = document.querySelector('[data-footer-backdrop]') as HTMLElement

    if (footer && backdrop) {
      // Kill any existing animations first
      gsap.killTweensOf([footer, backdrop])

      gsap.timeline({
        onComplete: () => {
          setIsFooterOpen(false)
          isFooterOpenRef.current = false
          setIsAnimating(false)
        },
      })
        .to(
          footer,
          {
            yPercent: 100,
            duration: 0.65,
            ease: 'back.in(1.05)',
            force3D: true,
          },
          0,
        )
        .to(
          backdrop,
          {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
          },
          0.08,
        )
        .set(backdrop, { pointerEvents: 'none', visibility: 'hidden' })
    } else {
      setIsFooterOpen(false)
      isFooterOpenRef.current = false
      setIsAnimating(false)
    }
  }, [])

  // Store functions in refs for use in effects
  openFooterRef.current = openFooter
  closeFooterRef.current = closeFooter

  // Close footer by ESC and swipe-down (touch devices)
  useEffect(() => {
    if (!isFooterOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFooterRef.current?.()
      }
    }

    const footer = document.querySelector('[data-footer]') as HTMLElement | null
    if (!footer) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }

    let startY = 0
    let lastY = 0
    let tracking = false

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches?.length) return
      // Only allow swipe-to-close when footer content is at top
      if (footer.scrollTop > 0) return
      tracking = true
      startY = e.touches[0].clientY
      lastY = startY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || !e.touches?.length) return
      lastY = e.touches[0].clientY
    }

    const onTouchEnd = () => {
      if (!tracking) return
      tracking = false
      const dy = lastY - startY
      // Downward swipe threshold
      if (dy > 60) {
        closeFooterRef.current?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    footer.addEventListener('touchstart', onTouchStart, { passive: true })
    footer.addEventListener('touchmove', onTouchMove, { passive: true })
    footer.addEventListener('touchend', onTouchEnd)
    footer.addEventListener('touchcancel', onTouchEnd)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      footer.removeEventListener('touchstart', onTouchStart)
      footer.removeEventListener('touchmove', onTouchMove)
      footer.removeEventListener('touchend', onTouchEnd)
      footer.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [isFooterOpen])

  // Handle wheel scroll to open footer
  useEffect(() => {
    if (!enableWheelScroll) return

    const handleWheel = (e: WheelEvent) => {
      // Check if dropdown is open - if so, don't handle wheel events
      const isDropdownOpen = document.body.classList.contains('dropdown-scroll-lock')
      if (isDropdownOpen) return

      // Don't handle if animating
      if (isAnimatingRef.current) return

      // If footer is open and scrolling up, close it (only when user is not scrolling inside footer content)
      if (isFooterOpenRef.current) {
        bottomArmedRef.current = false

        if (e.deltaY < 0 && closeFooterRef.current) {
          const footer = document.querySelector('[data-footer]') as HTMLElement | null
          const target = e.target as Node | null

          // If wheel happens inside the footer and the footer can still scroll up, don't close.
          if (footer && target && footer.contains(target)) {
            if (footer.scrollTop > 0) return
          }

          closeFooterRef.current()
        }
        return
      }

      const windowHeight = window.innerHeight

      // Smart bottom detection: trigger only at the actual end of content.
      // (No big SAFE_OFFSET that creates "air" and then disappears.)
      const EDGE = 8

      const bottomMarker = document.querySelector('[data-catalog-bottom]') as HTMLElement | null
      const catalogEl = document.querySelector('#catalog') as HTMLElement | null
      const scrolledToBottom = (() => {
        const el = bottomMarker || catalogEl
        if (el) {
          const rect = el.getBoundingClientRect()
          return rect.bottom <= windowHeight - EDGE
        }
        const documentHeight = document.documentElement.scrollHeight
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        return scrollTop + windowHeight >= documentHeight - EDGE
      })()
      // Reset arm if user is not actually at the bottom
      if (!scrolledToBottom) {
        bottomArmedRef.current = false
        if (bottomArmTimerRef.current) {
          window.clearTimeout(bottomArmTimerRef.current)
          bottomArmTimerRef.current = null
        }
        return
      }

      // Intent gating: require an extra "push" at the bottom so footer doesn't interrupt browsing
      if (e.deltaY > 0 && scrolledToBottom && openFooterRef.current) {
        // Prevent the tiny "extra" page scroll at the threshold (feels like a jump)
        e.preventDefault()

        if (!bottomArmedRef.current) {
          bottomArmedRef.current = true
          if (bottomArmTimerRef.current) window.clearTimeout(bottomArmTimerRef.current)
          bottomArmTimerRef.current = window.setTimeout(() => {
            bottomArmedRef.current = false
            bottomArmTimerRef.current = null
          }, 1100)
          return
        }

        bottomArmedRef.current = false
        if (bottomArmTimerRef.current) {
          window.clearTimeout(bottomArmTimerRef.current)
          bottomArmTimerRef.current = null
        }
        openFooterRef.current()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (bottomArmTimerRef.current) {
        window.clearTimeout(bottomArmTimerRef.current)
        bottomArmTimerRef.current = null
      }
      bottomArmedRef.current = false
    }
  }, [enableWheelScroll])

  return {
    isFooterOpen,
    isAnimating,
    openFooter,
    closeFooter,
  }
}

