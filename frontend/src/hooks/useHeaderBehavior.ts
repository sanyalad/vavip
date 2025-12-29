import { useCallback, useEffect, useRef, useState } from 'react'

type UseHeaderBehaviorParams = {
  isContactsPage: boolean
  isCatalogPage: boolean
  scrollY: number
  activeMenu: string | null
  setActiveMenu: (id: string | null) => void
  updateHeaderHeight: () => void
}

// Threshold to trigger nav hide (pixels)
const NAV_HIDE_SCROLL_THRESHOLD = 80

export function useHeaderBehavior({
  isContactsPage,
  isCatalogPage,
  scrollY,
  activeMenu,
  setActiveMenu,
  updateHeaderHeight,
}: UseHeaderBehaviorParams) {
  // Header top bar is ALWAYS visible
  const [isHidden] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isNavRevealed, setIsNavRevealed] = useState(false)
  // Nav hides on scroll down on catalog/contacts/shop pages
  const [isNavHiddenOnScroll, setIsNavHiddenOnScroll] = useState(false)

  const lastScrollY = useRef(0)
  const hoverTimerRef = useRef<number | null>(null)
  const closeMenuTimerRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)
  const navHideTimerRef = useRef<number | null>(null)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const cancelCloseMenu = useCallback(() => {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current)
      closeMenuTimerRef.current = null
    }
  }, [])

  const scheduleCloseMenu = useCallback(() => {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current)
    }
    closeMenuTimerRef.current = window.setTimeout(() => {
      if (!hoverTimerRef.current) {
        setActiveMenu(null)
      }
      closeMenuTimerRef.current = null
    }, 200)
  }, [setActiveMenu])

  const closeMenu = useCallback(() => {
    clearHoverTimer()
    cancelCloseMenu()
    setActiveMenu(null)
  }, [clearHoverTimer, cancelCloseMenu, setActiveMenu])

  const stopRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  const revealHeader = useCallback(() => {
    stopRevealTimer()
    setIsHovered(true)
    if (isContactsPage) setIsNavRevealed(true)
  }, [stopRevealTimer, isContactsPage])

  const scheduleHideHeader = useCallback(() => {
    stopRevealTimer()
    revealTimerRef.current = window.setTimeout(() => {
      setIsHovered(false)
      if (isContactsPage && !activeMenu) setIsNavRevealed(false)
      revealTimerRef.current = null
    }, 120)
  }, [stopRevealTimer, isContactsPage, activeMenu])

  const scheduleMenu = useCallback(
    (id: string | null) => {
      clearHoverTimer()
      cancelCloseMenu()
      hoverTimerRef.current = window.setTimeout(() => {
        setActiveMenu(id)

        if (id) {
          requestAnimationFrame(() => {
            updateHeaderHeight()
            requestAnimationFrame(updateHeaderHeight)
          })
        }

        hoverTimerRef.current = null
      }, 140)
    },
    [clearHoverTimer, cancelCloseMenu, setActiveMenu, updateHeaderHeight],
  )

  // Scroll-based nav hiding for catalog/contacts/shop pages
  // Nav hides on scroll down (after threshold), shows on scroll up
  useEffect(() => {
    // Apply to catalog, shop, and contacts pages
    const shouldHideNavOnScroll = isCatalogPage || isContactsPage

    if (!shouldHideNavOnScroll) {
      setIsNavHiddenOnScroll(false)
      lastScrollY.current = scrollY
      return
    }

    // Don't hide nav when dropdown is open
    if (activeMenu) {
      setIsNavHiddenOnScroll(false)
      lastScrollY.current = scrollY
      return
    }

    // At top of page, always show nav
    if (scrollY < NAV_HIDE_SCROLL_THRESHOLD) {
      setIsNavHiddenOnScroll(false)
      lastScrollY.current = scrollY
      return
    }

    // Robust direction detection (don't depend on external hook)
    const delta = scrollY - lastScrollY.current
    const EPS = 2

    if (delta > EPS) {
      setIsNavHiddenOnScroll(true)
    } else if (delta < -EPS) {
      setIsNavHiddenOnScroll(false)
    }

    lastScrollY.current = scrollY
  }, [scrollY, isCatalogPage, isContactsPage, activeMenu])

  // Recompute header height when dropdown/nav visibility changes to avoid seams
  useEffect(() => {
    if (activeMenu) {
      updateHeaderHeight()
      requestAnimationFrame(() => {
        updateHeaderHeight()
        requestAnimationFrame(updateHeaderHeight)
      })
    } else {
      requestAnimationFrame(updateHeaderHeight)
    }
  }, [activeMenu, updateHeaderHeight])

  useEffect(() => {
    if (isContactsPage || isCatalogPage) {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateHeaderHeight)
      })
    }
  }, [isNavRevealed, isNavHiddenOnScroll, isContactsPage, isCatalogPage, updateHeaderHeight])

  return {
    // state
    isHidden,
    isHovered,
    isNavRevealed,
    isNavHiddenOnScroll,

    // refs
    navHideTimerRef,

    // actions
    clearHoverTimer,
    scheduleCloseMenu,
    cancelCloseMenu,
    closeMenu,
    revealHeader,
    scheduleHideHeader,
    scheduleMenu,

    // state setters (rarely needed)
    setIsHovered,
    setIsNavRevealed,
  }
}
