import { useState, useEffect, useCallback, useRef } from 'react'

interface ScrollState {
  scrollY: number
  scrollX: number
  direction: 'up' | 'down' | null
  isAtTop: boolean
  isAtBottom: boolean
}

/**
 * Find the actual scroll container (handles iframes, overflow containers, etc.)
 */
function findScrollContainer(): HTMLElement | Window {
  const docEl = document.documentElement
  if (docEl.scrollHeight > docEl.clientHeight + 10) {
    return window
  }
  if (document.body.scrollHeight > document.body.clientHeight + 10) {
    return window
  }
  // Check common containers
  const candidates = [
    document.querySelector('main'),
    document.querySelector('[data-scroll-container]'),
    document.getElementById('root'),
  ].filter(Boolean) as HTMLElement[]

  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight + 10) {
      const style = getComputedStyle(el)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el
      }
    }
  }
  return window
}

export function useScroll(threshold = 50): ScrollState {
  const [state, setState] = useState<ScrollState>({
    scrollY: 0,
    scrollX: 0,
    direction: null,
    isAtTop: true,
    isAtBottom: false,
  })

  const lastScrollY = useRef(0)
  const containerRef = useRef<HTMLElement | Window | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      let currentScrollY = 0
      let maxScroll = 0

      const container = containerRef.current || findScrollContainer()
      containerRef.current = container

      if (container === window) {
        currentScrollY = window.scrollY || window.pageYOffset || 0
        maxScroll = document.documentElement.scrollHeight - window.innerHeight
      } else {
        const el = container as HTMLElement
        currentScrollY = el.scrollTop
        maxScroll = el.scrollHeight - el.clientHeight
      }

      const dir: 'up' | 'down' | null =
        currentScrollY > lastScrollY.current + 2
          ? 'down'
          : currentScrollY < lastScrollY.current - 2
            ? 'up'
            : state.direction

      setState({
        scrollY: currentScrollY,
        scrollX: container === window ? window.scrollX : 0,
        direction: dir,
        isAtTop: currentScrollY <= threshold,
        isAtBottom: currentScrollY >= maxScroll - threshold,
      })

      lastScrollY.current = currentScrollY
    }

    // Use capture to catch scroll events from any target
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      document.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [threshold, state.direction])

  return state
}

// Hook for scroll progress (0-1)
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const currentProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      setProgress(Math.min(1, Math.max(0, currentProgress)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

// Hook for section visibility (Intersection Observer)
export function useSectionInView(
  threshold = 0.5
): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isInView]
}

// Hook for scroll locking
export function useScrollLock() {
  const lock = useCallback(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
  }, [])

  const unlock = useCallback(() => {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }, [])

  return { lock, unlock }
}

// Hook for smooth scroll to element
export function useSmoothScroll() {
  const scrollTo = useCallback((elementId: string, offset = 0) => {
    const element = document.getElementById(elementId)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { scrollTo, scrollToTop }
}












