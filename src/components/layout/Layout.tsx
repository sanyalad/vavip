import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from '../features/Cart/CartSidebar'
import AuthSidebar from '../auth/AuthSidebar'
import SearchOverlay from '../search/SearchOverlay'
import ToastContainer from '../ui/Toast/ToastContainer'
import HeaderDebug from '../debug/HeaderDebug'
import { useFooterDrawer } from '@/hooks/useFooterDrawer'
import styles from './Layout.module.css'

// Pages that have custom scroll behavior and shouldn't trigger footer on wheel
const CUSTOM_SCROLL_PAGES = ['/black-room']

export default function Layout() {
  const location = useLocation()

  // Home page has its own footer in the video sections wrapper
  const isHomePage = location.pathname === '/'
  // Contacts page uses its own fullscreen layout
  const isContactsPage = location.pathname === '/contacts'
  // Check if current page has custom scroll
  const hasCustomScroll = CUSTOM_SCROLL_PAGES.some(path => location.pathname.startsWith(path))

  const { isFooterOpen, closeFooter } = useFooterDrawer({
    // IMPORTANT: Home has its own footer (inside the video stack).
    // Avoid registering the global wheel listener on Home to prevent conflicts/jerks.
    enableWheelScroll: !hasCustomScroll && !isHomePage && !isContactsPage,
  })

  return (
    <div className={styles.layout}>
      <Header />
      <main className={`${styles.main} ${!isHomePage && !isContactsPage ? styles.mainNotHome : ''}`}>
        <Outlet />
      </main>

      {/* Global Footer Drawer (same behavior as Home). */}
      {!isHomePage && !isContactsPage && (
        <Footer onClose={closeFooter} isOpen={isFooterOpen} />
      )}

      <CartSidebar />
      <AuthSidebar />
      <SearchOverlay />
      <ToastContainer />
      <HeaderDebug />
    </div>
  )
}

