import { useEffect, useLayoutEffect, useState, useRef, useCallback, type CSSProperties } from 'react'
import { useUIStore } from '@/store/uiStore'
import styles from './IntroLoader.module.css'

// Timeline (single coherent): appear -> fly to header logo
const LOGO_APPEAR_TIME = 450
const LOGO_FLY_TIME = 650

// Simplified mobile timeline
const MOBILE_LOGO_TIME = 280
const MOBILE_FLY_TIME = 420

export default function IntroLoader() {
  const { setIntroComplete } = useUIStore()
  const [phase, setPhase] = useState<'logo' | 'fly' | 'hidden'>('logo')
  const loaderRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [flyVars, setFlyVars] = useState<CSSProperties>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 768)
    }
  }, [])

  // Compute exact flight target based on the real header logo position (desktop/tablet).
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (phase !== 'fly') return
    if (window.innerWidth <= 768) return

    const logoEl = loaderRef.current?.querySelector('[data-intro-logo]') as HTMLElement | null
    const targetEl = document.querySelector('img[data-intro-anchor="logo"]') as HTMLElement | null

    if (!logoEl || !targetEl) return

    const startRect = logoEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    const startCx = startRect.left + startRect.width / 2
    const startCy = startRect.top + startRect.height / 2

    const targetCx = targetRect.left + targetRect.width / 2
    const targetCy = targetRect.top + targetRect.height / 2

    const dx = targetCx - startCx
    const dy = targetCy - startCy
    const scale = targetRect.width / startRect.width

    setFlyVars({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - CSS vars
      ['--intro-to-x' as any]: `${dx.toFixed(2)}px`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - CSS vars
      ['--intro-to-y' as any]: `${dy.toFixed(2)}px`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - CSS vars
      ['--intro-to-scale' as any]: `${scale.toFixed(4)}`,
    })
  }, [phase])

  // Single-run intro sequence
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth <= 768

    // Block scroll + hide content until reveal
    document.body.classList.add('intro-active')
    document.body.classList.remove('intro-revealed')

    if (prefersReducedMotion) {
      const t = window.setTimeout(() => {
        setPhase('hidden')
        document.body.classList.remove('intro-active')
        document.body.classList.add('intro-revealed')
        setIntroComplete(true)
      }, 200)
      timersRef.current = [t]
      return () => {
        clearTimeout(t)
        document.body.classList.remove('intro-active')
      }
    }

    if (mobile) {
      const flyTimer = window.setTimeout(() => {
        setPhase('fly')
        // Reveal content slightly after fly starts
        window.setTimeout(() => document.body.classList.add('intro-revealed'), 60)
      }, MOBILE_LOGO_TIME)

      const hideTimer = window.setTimeout(() => {
        setPhase('hidden')
        document.body.classList.remove('intro-active')
        document.body.classList.add('intro-revealed')
        setIntroComplete(true)
        window.scrollTo(0, 0)
      }, MOBILE_LOGO_TIME + MOBILE_FLY_TIME)

      timersRef.current = [flyTimer, hideTimer]
    } else {
      const flyTimer = window.setTimeout(() => {
        setPhase('fly')
        // Reveal content slightly after fly starts
        window.setTimeout(() => document.body.classList.add('intro-revealed'), 80)
      }, LOGO_APPEAR_TIME)

      const hideTimer = window.setTimeout(() => {
        setPhase('hidden')
        document.body.classList.remove('intro-active')
        document.body.classList.add('intro-revealed')
        setIntroComplete(true)
        window.scrollTo(0, 0)
      }, LOGO_APPEAR_TIME + LOGO_FLY_TIME)

      timersRef.current = [flyTimer, hideTimer]
    }

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('intro-active')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIntroComplete]) // Run only once on mount

  // Fallback timeout - runs once, checks current phase via ref
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fallbackTimer = window.setTimeout(() => {
      if (phaseRef.current !== 'hidden') {
        setPhase('hidden')
        if (typeof document !== 'undefined' && document.body) {
          document.body.classList.remove('intro-active')
          document.body.classList.add('intro-revealed')
        }
        setIntroComplete(true)
      }
    }, 3500)

    return () => clearTimeout(fallbackTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIntroComplete])

  const skipIntro = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    setPhase('hidden')
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('intro-active')
      document.body.classList.add('intro-revealed')
    }
    setIntroComplete(true)
  }, [setIntroComplete])

  if (phase === 'hidden') return null

  const loaderClasses = [styles.loader, phase === 'fly' && styles.flyUp, isMobile && styles.mobile]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={loaderRef}
      className={loaderClasses}
      id="intro-loader"
      role="presentation"
      onClick={skipIntro}
      style={flyVars}
    >
      <div className={styles.logoContainer}>
        <div className={styles.logoGlow} />

        {/* Ring pulse effect */}
        {!isMobile && <div className={styles.ring} />}

        {/* Particles */}
        {!isMobile && (
          <div className={styles.particles}>
            <span className={styles.particle} />
            <span className={styles.particle} />
            <span className={styles.particle} />
            <span className={styles.particle} />
            <span className={styles.particle} />
            <span className={styles.particle} />
          </div>
        )}

        <img src="/images/logo.png" alt="" className={styles.logo} aria-hidden="true" data-intro-logo />

        {/* Shimmer effect for desktop */}
        {!isMobile && <div className={styles.shimmer} />}
      </div>
    </div>
  )
}
