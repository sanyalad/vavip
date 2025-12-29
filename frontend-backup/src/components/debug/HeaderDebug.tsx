import { useEffect, useState, useRef } from 'react'

/**
 * Find the actual scroll container (handles iframes, overflow containers, etc.)
 */
function findScrollContainer(): HTMLElement | Window {
  // 1. Check if documentElement is scrollable
  const docEl = document.documentElement
  if (docEl.scrollHeight > docEl.clientHeight) {
    return window
  }

  // 2. Check body
  if (document.body.scrollHeight > document.body.clientHeight) {
    return window
  }

  // 3. Look for common scroll containers
  const candidates = [
    document.querySelector('main'),
    document.querySelector('[data-scroll-container]'),
    document.querySelector('.layout'),
    document.getElementById('root'),
  ].filter(Boolean) as HTMLElement[]

  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight) {
      const style = getComputedStyle(el)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el
      }
    }
  }

  return window
}

/**
 * Debug badge showing Header/nav state
 * Only renders in development mode
 */
export default function HeaderDebug() {
  const [data, setData] = useState({
    scrollY: 0,
    scrollMax: 0,
    direction: 'none',
    isNavHidden: false,
    activeMenu: '',
    container: 'window',
    bodyFixed: false,
  })

  const lastYRef = useRef(0)

  useEffect(() => {
    let direction = 'none'

    const update = () => {
      const container = findScrollContainer()
      let scrollY = 0
      let scrollMax = 0
      let containerName = 'window'

      if (container === window) {
        scrollY = window.scrollY || window.pageYOffset || 0
        scrollMax = document.documentElement.scrollHeight - window.innerHeight
        containerName = 'window'
      } else {
        const el = container as HTMLElement
        scrollY = el.scrollTop
        scrollMax = el.scrollHeight - el.clientHeight
        containerName = el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '')
      }

      if (scrollY > lastYRef.current + 2) direction = 'down'
      else if (scrollY < lastYRef.current - 2) direction = 'up'
      lastYRef.current = scrollY

      const header = document.querySelector('[data-header]') as HTMLElement | null
      const isNavHidden = (header?.dataset.navHidden ?? 'false') === 'true'
      const activeMenu = header?.dataset.activeMenu || ''

      const bodyFixed = getComputedStyle(document.body).position === 'fixed'

      setData({
        scrollY: Math.round(scrollY),
        scrollMax: Math.round(scrollMax),
        direction,
        isNavHidden,
        activeMenu,
        container: containerName,
        bodyFixed,
      })
    }

    update()

    // Listen on multiple targets
    window.addEventListener('scroll', update, { passive: true, capture: true })
    document.addEventListener('scroll', update, { passive: true, capture: true })

    const interval = window.setInterval(update, 200)

    return () => {
      window.removeEventListener('scroll', update, { capture: true })
      document.removeEventListener('scroll', update, { capture: true })
      window.clearInterval(interval)
    }
  }, [])

  // Only show in development
  if (import.meta.env.PROD) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 10,
        padding: '8px 10px',
        borderRadius: 6,
        pointerEvents: 'none',
        lineHeight: 1.6,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,255,0,0.25)',
        maxWidth: 180,
      }}
    >
      <div>scrollY: {data.scrollY} / {data.scrollMax}</div>
      <div>dir: {data.direction}</div>
      <div>navHidden: {data.isNavHidden ? 'тЬУ' : 'тЬЧ'}</div>
      <div>menu: {data.activeMenu || 'тАФ'}</div>
      <div>container: {data.container}</div>
      <div>bodyFixed: {data.bodyFixed ? 'тЬУ' : 'тЬЧ'}</div>
    </div>
  )
}
