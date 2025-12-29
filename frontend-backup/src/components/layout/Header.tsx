import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'
import { useScroll } from '@/hooks/useScroll'
import { uzelCategories } from '@/data/uzelCatalog'
import { useUIStore } from '@/store/uiStore'
import { detectPlatform } from '@/utils/platform'
import { useHeaderBehavior } from '@/hooks/useHeaderBehavior'
import styles from './Header.module.css'

const menuItems = [
  { id: 'contacts', label: '╨Ъ╨Ю╨Э╨в╨Р╨Ъ╨в╨л', href: '/contacts' },
  { id: 'about', label: '╨з╨Б╨а╨Э╨Р╨п ╨Ъ╨Ю╨Ь╨Э╨Р╨в╨Р', href: '/black-room' },
  { id: 'node', label: '╨г╨Ч╨Х╨Ы ╨Т╨Т╨Ю╨Ф╨Р', href: '/catalog/uzel-vvoda' },
  { id: 'bim', label: '╨Я╨а╨Ю╨Х╨Ъ╨в╨Ш╨а╨Ю╨Т╨Р╨Э╨Ш╨Х BIM', href: '/services/bim' },
  { id: 'montage', label: '╨Ь╨Ю╨Э╨в╨Р╨Ц', href: '/services/montazh' },
  { id: 'shop', label: '╨Ь╨Р╨У╨Р╨Ч╨Ш╨Э', href: '/shop' },
]

export default function Header() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { totalItems } = useCartStore()
  const { openAuthDrawer, addToast, openSearch } = useUIStore()
  const { scrollY } = useScroll()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isHomePage = location.pathname === '/'

  const headerRef = useRef<HTMLElement | null>(null)
  const dropdownPanelRef = useRef<HTMLDivElement | null>(null)
  const body = typeof document !== 'undefined' ? document.body : null

  // Check if we're on cart or checkout page (reduced header)
  const isReducedHeaderPage = location.pathname === '/cart' || location.pathname === '/checkout'
  // Check if we're on catalog or shop pages (nav hides on scroll)
  const isCatalogPage = location.pathname.startsWith('/catalog') || location.pathname.startsWith('/shop')

  // Keep CSS var for dropdown positioning in sync with real header height
  const updateHeaderHeight = useCallback(() => {
    const headerEl = headerRef.current
    if (!headerEl) return

    let h = 0
    if (isReducedHeaderPage) {
      const headerTopEl = headerEl.querySelector(`.${styles.headerTop}`) as HTMLElement | null
      h = headerTopEl ? headerTopEl.offsetHeight + 8 : 0
    } else {
      h = headerEl.offsetHeight
    }

    document.documentElement.style.setProperty('--header-h', h + 'px')
  }, [isReducedHeaderPage])

  const {
    isHovered,
    setIsHovered,
    isNavHiddenOnScroll,
    clearHoverTimer,
    scheduleCloseMenu,
    cancelCloseMenu,
    closeMenu,
    revealHeader,
    scheduleHideHeader,
    scheduleMenu,
  } = useHeaderBehavior({
    isContactsPage: location.pathname === '/contacts',
    isCatalogPage,
    scrollY,
    activeMenu,
    setActiveMenu,
    updateHeaderHeight,
  })

  // Ensure hover state can't get "stuck" (when user scrolls without moving mouse)
  useEffect(() => {
    const headerEl = headerRef.current
    if (!headerEl) return

    const onScroll = () => {
      // If pointer isn't over the header, force hover=false
      if (isHovered && !headerEl.matches(':hover')) {
        setIsHovered(false)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHovered, setIsHovered])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!body) return
    if (isMobileMenuOpen) {
      body.classList.add('mobile-menu-scroll-lock')
    } else {
      body.classList.remove('mobile-menu-scroll-lock')
    }
    return () => {
      if (body) {
        body.classList.remove('mobile-menu-scroll-lock')
      }
    }
  }, [isMobileMenuOpen, body])

  const cartCount = totalItems()
  const phoneText = '+7 931 248 70 13'
  const phoneHref = 'tel:+79312487013'

  const copyPhone = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phoneText)
      } else {
        const ta = document.createElement('textarea')
        ta.value = phoneText
        ta.setAttribute('readonly', 'true')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      addToast({ type: 'success', message: '╨Э╨╛╨╝╨╡╤А ╤Б╨║╨╛╨┐╨╕╤А╨╛╨▓╨░╨╜ ╨▓ ╨▒╤Г╤Д╨╡╤А ╨╛╨▒╨╝╨╡╨╜╨░' })
    } catch {
      // ignore clipboard failures (permissions, etc.)
    }
  }, [addToast])

  const handlePhoneClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Detect platform using centralized utility
      const platformInfo = detectPlatform()
      
      // On mobile (Android/iOS), try to open tel: link first
      if (platformInfo.isMobile) {
        // Let the default tel: link behavior happen (opens dialer)
        // Also try to copy to clipboard as fallback
        void copyPhone()
        return
      }
      
      // On desktop (including Mac), try to open tel: link
      // If that fails (e.g., no phone app), copy to clipboard
      e.preventDefault()
      try {
        // Try to open tel: link programmatically
        const telLink = document.createElement('a')
        telLink.href = phoneHref
        telLink.style.display = 'none'
        document.body.appendChild(telLink)
        telLink.click()
        document.body.removeChild(telLink)
        // If we get here, the link was clicked but might not have opened
        // Wait a bit to see if it worked, then copy as fallback
        setTimeout(async () => {
          await copyPhone()
        }, 100)
      } catch {
        // If opening tel: fails, just copy
        await copyPhone()
      }
    },
    [copyPhone, phoneHref],
  )

  // ... keep existing code (phone handlers, etc.)

  // Lock body scroll when dropdown is open (keep header fixed in viewport)
  useEffect(() => {
    if (!body) return

    if (activeMenu) {
      const y = window.scrollY || 0
      body.dataset.scrollLockY = String(y)
      body.style.position = 'fixed'
      body.style.top = `-${y}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.classList.add('dropdown-scroll-lock')
    } else {
      const y = Number(body.dataset.scrollLockY || '0')
      body.classList.remove('dropdown-scroll-lock')
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.dataset.scrollLockY = ''
      window.scrollTo(0, y)
    }

    return () => {
      body.classList.remove('dropdown-scroll-lock')
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.dataset.scrollLockY = ''
    }
  }, [activeMenu, body])

  // Prevent page scroll when dropdown is open (block wheel events)
  // Allow scrolling inside dropdown, block scrolling outside
  useEffect(() => {
    if (!activeMenu) return

    const dropdownPanel = dropdownPanelRef.current
    if (!dropdownPanel) return

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Node | null

      if (dropdownPanel && target && dropdownPanel.contains(target)) {
        const scrollHeight = dropdownPanel.scrollHeight
        const clientHeight = dropdownPanel.clientHeight
        const scrollTop = dropdownPanel.scrollTop
        const canScroll = scrollHeight > clientHeight

        const threshold = 1
        const isAtTop = scrollTop <= threshold
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - threshold

        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.preventDefault()
          e.stopPropagation()
          return
        }

        if (canScroll) return

        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [activeMenu])

  useEffect(() => {
    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [updateHeaderHeight])


  const headerClasses = [
    styles.header,
    // Internal pages: subtle blurred transparency (BORK-like). Home stays fully transparent.
    !isHomePage && !(isHovered || !!activeMenu) && styles.headerBlurred,
    // Becomes solid on hover OR when dropdown is open.
    (isHovered || !!activeMenu) && styles.headerSolid,
    isReducedHeaderPage && styles.headerCartPage,
    // Hide nav on scroll for catalog/contacts pages
    isNavHiddenOnScroll && styles.headerNavHidden,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <header 
        id="main-header"
        data-header
        data-nav-hidden={isNavHiddenOnScroll ? 'true' : 'false'}
        data-active-menu={activeMenu ?? ''}
        className={headerClasses}
        ref={(el) => { headerRef.current = el }}
        onMouseEnter={revealHeader}
        onMouseLeave={(e) => {
          scheduleHideHeader()
          // Close dropdown if mouse leaves header area (but not if moving to dropdown)
          if (activeMenu) {
            const dropdownPanel = dropdownPanelRef.current
            const rt = e.relatedTarget
            const relatedNode = rt instanceof Node ? rt : null

            // If mouse is leaving header and not going to dropdown - close it
            if (!dropdownPanel || !relatedNode || !dropdownPanel.contains(relatedNode)) {
              closeMenu()
            }
          }
        }}
      >
        {/* Top row */}
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            {/* Location button */}
            <button className={styles.iconBtn} type="button" aria-label="╨Т╤Л╨▒╤А╨░╤В╤М ╨╗╨╛╨║╨░╤Ж╨╕╤О">
              <svg className={styles.locationIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1114.5 9 2.5 2.5 0 0112 11.5z"/>
              </svg>
            </button>

            <div className={styles.phoneNumber}>
              <a href={phoneHref} onClick={handlePhoneClick}>
                {phoneText}
              </a>
            </div>
          </div>

          <div className={styles.headerCenter}>
            <Link
              to="/"
              data-intro-anchor="logo"
              onClick={(e) => {
                // Client request: logo acts as a "refresh" (and always returns to home).
                // If we're already on '/', reload; otherwise hard-navigate to '/'.
                e.preventDefault()
                if (window.location.pathname === '/') window.location.reload()
                else window.location.assign('/')
              }}
            >
              <img src="/images/logo.png" alt="╨Ы╨╛╨│╨╛╤В╨╕╨┐ Vavip" data-intro-anchor="logo" />
            </Link>
          </div>

          <div className={styles.headerRight}>
            {/* Cart (separate page like BORK) */}
            <Link to="/cart" aria-label="╨Ъ╨╛╤А╨╖╨╕╨╜╨░" className={styles.iconLink}>
              <motion.svg 
                viewBox="0 0 24 24" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                aria-hidden="true"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <path d="M8 7V5a4 4 0 018 0v2"/>
                <rect x="3" y="7" width="18" height="14" rx="2" ry="2"/>
              </motion.svg>
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount}
                    className={styles.cartBadge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    data-cart-badge
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            
            {/* Search */}
            <button aria-label="╨Я╨╛╨╕╤Б╨║" className={styles.iconLink} onClick={openSearch} type="button">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <circle cx="10.5" cy="10.5" r="7.5"/>
                <line x1="16" y1="16" x2="21" y2="21" stroke="#c0c0c0" strokeWidth="2"/>
              </svg>
            </button>
            
            {/* Account */}
            {isAuthenticated ? (
              <Link to="/account" aria-label="╨Ы╨╕╤З╨╜╤Л╨╣ ╨║╨░╨▒╨╕╨╜╨╡╤В" className={styles.iconLink}>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
                </svg>
              </Link>
            ) : (
              <button
                type="button"
                aria-label="╨Т╤Е╨╛╨┤ / ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П"
                className={styles.iconLink}
                onClick={() => openAuthDrawer('login')}
              >
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.centerDivider} />

        {/* Navigation + dropdowns */}
        <div 
          className={`${styles.navArea} ${activeMenu ? styles.navHovering : ''}`}
          // Important: do NOT close on navArea mouseleave. The dropdown is fixed-position and
          // sits outside navArea's box, so closing here makes it "impossible to catch".
          onMouseEnter={() => {
            clearHoverTimer()
            cancelCloseMenu() // Keep menu open when cursor is in navArea
          }}
          onMouseLeave={(e) => {
            const relatedTarget = e.relatedTarget
            const navArea = e.currentTarget
            if (relatedTarget && relatedTarget instanceof Node && navArea.contains(relatedTarget)) {
              return
            }
            scheduleCloseMenu()
          }}
        >
          <nav className={styles.headerBottom} role="navigation" aria-label="╨У╨╗╨░╨▓╨╜╨╛╨╡ ╨╝╨╡╨╜╤О">
            {menuItems.map((item) => (
                <div
                key={item.id}
                className={styles.menuItemWrapper}
                onMouseEnter={() => {
                  cancelCloseMenu() // Cancel close when hovering menu item
                  setHoveredMenuItem(item.id)
                }}
                onMouseLeave={(e) => {
                  const relatedTarget = e.relatedTarget
                  const navArea = e.currentTarget.closest(`.${styles.navArea}`) as HTMLElement | null

                  if (!navArea) {
                    setHoveredMenuItem(null)
                    return
                  }

                  if (relatedTarget && relatedTarget instanceof Node && navArea.contains(relatedTarget)) {
                    setHoveredMenuItem(null)
                    return
                  }

                  setHoveredMenuItem(null)
                }}
              >
                <Link 
                  to={item.href}
                  className={`${styles.menuItemButton} ${activeMenu === item.id ? styles.active : ''} ${hoveredMenuItem === item.id ? styles.menuItemHovered : ''}`}
                  onMouseEnter={() => {
                    // ╨Т╤Б╨╡ ╨┐╤Г╨╜╨║╤В╤Л ╨╝╨╡╨╜╤О ╨┐╨╛╨║╨░╨╖╤Л╨▓╨░╤О╤В ╨┤╤А╨╛╨┐╨┤╨░╤Г╨╜ ╨┐╨╛ hover
                    cancelCloseMenu() // Cancel any pending close
                    scheduleMenu(item.id)
                    setHoveredMenuItem(item.id)
                  }}
                  onMouseLeave={(e) => {
                    const relatedTarget = e.relatedTarget
                    const navArea = e.currentTarget.closest(`.${styles.navArea}`) as HTMLElement | null

                    if (!navArea) {
                      setHoveredMenuItem(null)
                      clearHoverTimer()
                      scheduleCloseMenu()
                      return
                    }

                    if (relatedTarget && relatedTarget instanceof Node && navArea.contains(relatedTarget)) {
                      setHoveredMenuItem(null)
                      return
                    }

                    clearHoverTimer()
                    setHoveredMenuItem(null)
                    scheduleCloseMenu()
                  }}
                  onClick={() => {
                    closeMenu()
                  }}
                >
                  <span className={styles.menuLabel}>{item.label}</span>
                </Link>
              </div>
            ))}
          </nav>

          {typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={(el) => {
                  dropdownPanelRef.current = el
                }}
                className={`${styles.dropdownPanel} ${activeMenu ? styles.dropdownVisible : ''}`}
                // Keep dropdown open while cursor is inside the panel.
                onMouseEnter={() => clearHoverTimer()}
                // Close only when cursor goes BELOW the dropdown bottom edge.
                onMouseLeave={(e) => {
                  const panel = dropdownPanelRef.current
                  if (!panel) {
                    closeMenu()
                    return
                  }
                  const rect = panel.getBoundingClientRect()
                  // If user moves back up into the header/menu, do not close.
                  if (e.clientY < rect.top) return
                  // Close only when leaving through the bottom boundary.
                  if (e.clientY >= rect.bottom - 2) {
                    closeMenu()
                  }
                }}
              >
                <div className={styles.dropdownOverlay} aria-hidden="true" />
                <div className={styles.dropdownContainer}>
                  {activeMenu === 'node' && (
                    <div className={styles.dropdownContent}>
                      <div className={styles.dropdownHeader}>
                        <div>
                          <p className={styles.dropdownKicker}>╨г╨╖╨╗╤Л ╨▓╨▓╨╛╨┤╨░</p>
                          <h3 className={styles.dropdownTitle}>╨Ъ╨░╤В╨░╨╗╨╛╨│ ╨╕╤Б╨┐╨╛╨╗╨╜╨╡╨╜╨╕╨╣</h3>
                          <p className={styles.dropdownLead}>
                            ╨б╤З╤С╤В╤З╨╕╨║╨╕, ╤Д╨╕╨╗╤М╤В╤А╨░╤Ж╨╕╤П, ╨┐╨╛╨┤╨│╨╛╤В╨╛╨▓╨║╨░ ╨┐╨╛╨┤ ╤Г╨╝╨╜╤Л╨╣ ╨┤╨╛╨╝ ╨╕ ╨┐╤А╨╡╨╝╨╕╨░╨╗╤М╨╜╨░╤П ╨╛╤В╨┤╨╡╨╗╨║╨░.
                          </p>
                          <div className={styles.dropdownActions}>
                            <Link to="/catalog/uzel-vvoda" className={styles.dropdownPrimary}>
                              ╨Ю╤В╨║╤А╤Л╤В╤М ╨║╨░╤В╨░╨╗╨╛╨│
                            </Link>
                            <Link to="/contacts" className={styles.dropdownSecondary}>
                              ╨Ъ╨╛╨╜╤Б╤Г╨╗╤М╤В╨░╤Ж╨╕╤П
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className={styles.dropdownLayout}>
                        <div className={styles.dropdownListBlock}>
                          <p className={styles.dropdownListTitle}>╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╨╕</p>
                          <ul className={styles.dropdownList}>
                            {uzelCategories.map((item) => (
                              <li key={item.slug}>
                                <Link to={`/catalog/uzel-vvoda/${item.slug}`} className={styles.dropdownListItem}>
                                  <div className={styles.dropdownListTexts}>
                                    <span className={styles.dropdownListName}>{item.title}</span>
                                    <span className={styles.dropdownListDesc}>{item.description}</span>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMenu === 'contacts' && (
                    <div className={styles.dropdownContent}>
                      <div className={styles.dropdownHeader}>
                        <div>
                          <p className={styles.dropdownKicker}>╨Ъ╨╛╨╜╤В╨░╨║╤В╤Л</p>
                          <h3 className={styles.dropdownTitle}>╨б╨▓╤П╨╢╨╕╤В╨╡╤Б╤М ╤Б ╨╜╨░╨╝╨╕</h3>
                          <p className={styles.dropdownLead}>
                            ╨Т╤Л╨▒╨╡╤А╨╕╤В╨╡ ╨╛╤В╨┤╨╡╨╗ ╨┤╨╗╤П ╤Б╨▓╤П╨╖╨╕: ╤Г╨╖╨╡╨╗ ╨▓╨▓╨╛╨┤╨░, ╨╝╨╛╨╜╤В╨░╨╢, ╨┐╤А╨╛╨╡╨║╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╨╕╨╗╨╕ ╨╝╨░╨│╨░╨╖╨╕╨╜.
                          </p>
                          <div className={styles.dropdownActions}>
                            <Link to="/contacts" className={styles.dropdownPrimary}>
                              ╨Я╨╡╤А╨╡╨╣╤В╨╕ ╨║ ╨║╨╛╨╜╤В╨░╨║╤В╨░╨╝
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className={styles.dropdownLayout}>
                        <div className={styles.dropdownListBlock}>
                          <p className={styles.dropdownListTitle}>╨Ю╤В╨┤╨╡╨╗╤Л</p>
                          <ul className={styles.dropdownList}>
                            <li>
                              <Link to="/contacts?department=uzel" className={styles.dropdownListItem}>
                                <div className={styles.dropdownListTexts}>
                                  <span className={styles.dropdownListName}>╨г╨╖╨╡╨╗ ╨▓╨▓╨╛╨┤╨░</span>
                                  <span className={styles.dropdownListDesc}>╨Ъ╨╛╨╜╤Б╤Г╨╗╤М╤В╨░╤Ж╨╕╤П ╨╕ ╨╖╨░╨║╨░╨╖</span>
                                </div>
                              </Link>
                            </li>
                            <li>
                              <Link to="/contacts?department=montazh" className={styles.dropdownListItem}>
                                <div className={styles.dropdownListTexts}>
                                  <span className={styles.dropdownListName}>╨Ь╨╛╨╜╤В╨░╨╢</span>
                                  <span className={styles.dropdownListDesc}>╨г╤Б╤В╨░╨╜╨╛╨▓╨║╨░ ╨╕ ╨╛╨▒╤Б╨╗╤Г╨╢╨╕╨▓╨░╨╜╨╕╨╡</span>
                                </div>
                              </Link>
                            </li>
                            <li>
                              <Link to="/contacts?department=bim" className={styles.dropdownListItem}>
                                <div className={styles.dropdownListTexts}>
                                  <span className={styles.dropdownListName}>╨Я╤А╨╛╨╡╨║╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ BIM</span>
                                  <span className={styles.dropdownListDesc}>╨а╨░╨╖╤А╨░╨▒╨╛╤В╨║╨░ ╨┐╤А╨╛╨╡╨║╤В╨╛╨▓</span>
                                </div>
                              </Link>
                            </li>
                            <li>
                              <Link to="/contacts?department=shop" className={styles.dropdownListItem}>
                                <div className={styles.dropdownListTexts}>
                                  <span className={styles.dropdownListName}>╨Ь╨░╨│╨░╨╖╨╕╨╜</span>
                                  <span className={styles.dropdownListDesc}>╨Ч╨░╨║╨░╨╖╤Л ╨╕ ╨┤╨╛╤Б╤В╨░╨▓╨║╨░</span>
                                </div>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMenu && activeMenu !== 'node' && activeMenu !== 'contacts' && (
                    <div className={styles.dropdownContent}>
                      <div className={styles.dropdownSimple}>
                        <p className={styles.dropdownKicker}>╨а╨░╨╖╨┤╨╡╨╗</p>
                        <h3 className={styles.dropdownTitle}>
                          {menuItems.find((i) => i.id === activeMenu)?.label}
                        </h3>
                        <p className={styles.dropdownLead}>╨Я╨╡╤А╨╡╨╣╨┤╨╕╤В╨╡ ╨┐╨╛ ╨║╨╗╨╕╨║╤Г, ╨┐╤А╨╡╨▓╤М╤О ╨┐╨╛╨║╨░╨╖╨░╨╜╨╛ ╨┤╨╗╤П ╨╜╨░╨▓╨╕╨│╨░╤Ж╨╕╨╕.</p>
                        <Link
                          to={menuItems.find((i) => i.id === activeMenu)?.href || '/'}
                          className={styles.dropdownPrimary}
                        >
                          ╨Ю╤В╨║╤А╤Л╤В╤М ╤А╨░╨╖╨┤╨╡╨╗
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>,
              document.body,
            )}
        </div>
      </header>

      {/* Mobile bar */}
      <div className={styles.mobileBar} role="banner" aria-label="╨Ь╨╛╨▒╨╕╨╗╤М╨╜╨░╤П ╤И╨░╨┐╨║╨░ ╤Б╨░╨╣╤В╨░">
        <div className={styles.mobileBarLeft}>
          <button
            className={`${styles.mobileBurgerBtn} ${isMobileMenuOpen ? styles.mobileBurgerBtnActive : ''}`}
            aria-label={isMobileMenuOpen ? "╨Ч╨░╨║╤А╤Л╤В╤М ╨╝╨╡╨╜╤О" : "╨Ю╤В╨║╤А╤Л╤В╤М ╨╝╨╡╨╜╤О"}
            aria-expanded={isMobileMenuOpen}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsMobileMenuOpen(prev => {
                const newState = !prev
                console.log('Burger clicked, menu state:', newState)
                return newState
              })
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className={styles.mobileBarCenter}>
          <Link to="/" aria-label="╨Я╨╡╤А╨╡╨╣╤В╨╕ ╨╜╨░ ╨│╨╗╨░╨▓╨╜╤Г╤О" onClick={() => setIsMobileMenuOpen(false)} data-intro-anchor="logo">
            <img src="/images/logo.png" alt="╨Ы╨╛╨│╨╛╤В╨╕╨┐ Vavip" loading="lazy" data-intro-anchor="logo" />
          </Link>
        </div>
        <div className={styles.mobileBarRight}>
          <a href="tel:+79312487013" className={styles.mobileIconBtn} aria-label="╨Я╨╛╨╖╨▓╨╛╨╜╨╕╤В╤М">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M6.6 10.8c1.6 3 3.6 5 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.1-.2 1 .4 2.1.7 3.2.8.5.1.9.5.9 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3c0-.6.4-1 1-1h3.2c.5 0 .9.4 1 .9.2 1.1.4 2.2.8 3.2.1.4 0 .8-.2 1.1L6.6 10.8z" fill="#fff"/>
            </svg>
          </a>
          <button className={styles.mobileIconBtn} aria-label="╨Я╨╛╨╕╤Б╨║" type="button" onClick={openSearch}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="7.5" stroke="#fff" strokeWidth="2" fill="none"/>
              <line x1="16" y1="16" x2="21" y2="21" stroke="#fff" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className={`${styles.mobileMenuOverlay} ${styles.mobileMenuOverlayOpen}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Menu */}
      <nav
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        aria-label="╨У╨╗╨░╨▓╨╜╨╛╨╡ ╨╝╨╡╨╜╤О"
      >
        <div className={styles.mobileMenuContent}>
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={styles.mobileMenuItem}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              to="/account"
              className={styles.mobileMenuItem}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ╨Ы╨Ш╨з╨Э╨л╨Щ ╨Ъ╨Р╨С╨Ш╨Э╨Х╨в
            </Link>
          ) : (
            <button
              className={styles.mobileMenuItem}
              onClick={() => {
                setIsMobileMenuOpen(false)
                openAuthDrawer('login')
              }}
            >
              ╨Т╨е╨Ю╨Ф / ╨а╨Х╨У╨Ш╨б╨в╨а╨Р╨ж╨Ш╨п
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
