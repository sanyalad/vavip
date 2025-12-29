import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './BlackRoom.module.css'
import PageTransition from '@/components/animations/PageTransition'

const philosophy = [
  { title: 'Чистоплотность', desc: 'безопасность от хаоса' },
  { title: 'Перфекционизм', desc: 'инструмент живых' },
  { title: 'Дисциплина', desc: 'архитектура свободы' },
  { title: 'Чёрный', desc: 'метод отключения лишнего' },
]

const principles = [
  'Если ты не умеешь уходить от того, что не соответствует — не входи.',
  'Если ты не можешь отвечать телом за решения — не входи.',
  'Если ты не чувствуешь предел — не входи.',
]

const thresholds = [
  { id: 1, title: 'Порог 1: держать чёрный' },
  { id: 2, title: 'Порог 2: порядок как второй язык' },
  { id: 3, title: 'Порог 3: уважение как каркас решения' },
]

const history = [
  { year: '1995', text: 'энергия сформировалась' },
  { year: '200x', text: 'порог невозврата' },
  { year: '20xx', text: 'рождение Vavip' },
]

// Section count for navigation
const SECTION_COUNT = 11

export default function BlackRoomPage() {
  const [activeThreshold, setActiveThreshold] = useState<number | null>(null)
  const [thresholdInputs, setThresholdInputs] = useState<Record<number, string>>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])
  const isScrollingRef = useRef(false)
  const lastScrollTime = useRef(0)
  const touchStartY = useRef<number | null>(null)
  const accumulatedDelta = useRef(0)
  const scrollCooldown = useRef(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Disable normal scroll, enable page scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.background = '#000'

    return () => {
      document.body.style.overflow = ''
      document.body.style.background = ''
    }
  }, [])

  const scrollToSectionSmooth = useCallback((idx: number) => {
    if (idx < 0 || idx >= SECTION_COUNT) return
    if (isScrollingRef.current) return
    
    isScrollingRef.current = true
    scrollCooldown.current = true
    setCurrentSection(idx)
    
    const targetSection = sectionsRef.current[idx]
    if (targetSection && containerRef.current) {
      containerRef.current.scrollTo({
        top: targetSection.offsetTop,
        behavior: 'smooth'
      })
    }
    
    // Extended cooldown for aggressive trackpad scrolling
    setTimeout(() => {
      isScrollingRef.current = false
    }, 900)
    
    // Extra cooldown to prevent rapid-fire scroll events
    setTimeout(() => {
      scrollCooldown.current = false
      accumulatedDelta.current = 0
    }, 1200)
  }, [])

  // Scroll resistance effect - custom wheel handler with delta accumulation
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Hard block during cooldown
    if (scrollCooldown.current || isScrollingRef.current) {
      accumulatedDelta.current = 0
      return
    }
    
    const now = Date.now()
    const timeSinceLastScroll = now - lastScrollTime.current
    
    // Time-based resistance
    if (timeSinceLastScroll < 1000) {
      return
    }
    
    // Accumulate delta - require significant scroll intent
    accumulatedDelta.current += e.deltaY
    
    // Threshold: need accumulated delta of at least 80 pixels
    const SCROLL_THRESHOLD = 80
    
    if (Math.abs(accumulatedDelta.current) < SCROLL_THRESHOLD) {
      return
    }
    
    const direction = accumulatedDelta.current > 0 ? 1 : -1
    const nextSection = Math.max(0, Math.min(SECTION_COUNT - 1, currentSection + direction))
    
    if (nextSection !== currentSection) {
      lastScrollTime.current = now
      accumulatedDelta.current = 0
      scrollToSectionSmooth(nextSection)
    } else {
      // Reset if at boundary
      accumulatedDelta.current = 0
    }
  }, [currentSection, scrollToSectionSmooth])

  // Touch swipe handlers for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartY.current === null) return
    if (isScrollingRef.current) return
    
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY.current - touchEndY
    
    if (Math.abs(deltaY) >= 50) {
      const direction = deltaY > 0 ? 1 : -1
      const nextSection = Math.max(0, Math.min(SECTION_COUNT - 1, currentSection + direction))
      
      if (nextSection !== currentSection) {
        scrollToSectionSmooth(nextSection)
      }
    }
    
    touchStartY.current = null
  }, [currentSection, scrollToSectionSmooth])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    
    if (isMobile) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
    }
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchEnd, isMobile])

  // Track current section on scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const viewportHeight = window.innerHeight
      
      sectionsRef.current.forEach((section, idx) => {
        if (section) {
          const sectionTop = section.offsetTop
          
          if (scrollTop + viewportHeight / 2 > sectionTop && 
              scrollTop + viewportHeight / 2 < sectionTop + section.offsetHeight) {
            if (currentSection !== idx && !isScrollingRef.current) {
              setCurrentSection(idx)
            }
          }
        }
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentSection])

  const scrollToNext = () => {
    if (currentSection < SECTION_COUNT - 1) {
      scrollToSectionSmooth(currentSection + 1)
    }
  }

  const scrollToSection = (idx: number) => {
    scrollToSectionSmooth(idx)
  }

  // Button click auto-scroll to next section
  const handleUnderstoodClick = () => {
    scrollToNext()
  }

  return (
    <PageTransition>
      <div ref={containerRef} className={styles.blackRoom}>
        {/* Silver Navigation Dots */}
        <nav className={styles.silverNav} aria-label="Навигация по разделам">
          {Array.from({ length: SECTION_COUNT }).map((_, idx) => (
            <button
              key={idx}
              className={`${styles.navDot} ${currentSection === idx ? styles.navDotActive : ''}`}
              onClick={() => scrollToSection(idx)}
              aria-label={`Перейти к разделу ${idx + 1}`}
            />
          ))}
          <div 
            className={styles.navLine} 
            style={{ 
              height: `${(currentSection / (SECTION_COUNT - 1)) * 100}%` 
            }} 
          />
        </nav>

        {/* 1. Entry Screen */}
        <section 
          ref={el => sectionsRef.current[0] = el}
          className={`${styles.section} ${styles.sectionEntry}`}
        >
          <span className={styles.entryCursor}>▮</span>
          <button className={styles.entryButton} onClick={scrollToNext}>
            войти
          </button>
        </section>

        {/* 2. Terminal Messages */}
        <section ref={el => sectionsRef.current[1] = el} className={styles.section}>
          <div className={styles.terminalBlock}>
            <p className={styles.terminalLine}>шум блокирован</p>
            <p className={styles.terminalLine}>внешние значения отключены</p>
            <p className={styles.terminalLine}>частота восприятия настроена</p>
          </div>
          <div className={styles.scrollIndicator}>
            <span>{isMobile ? 'свайп вверх' : 'скролл'}</span>
          </div>
        </section>

        {/* 3. Rules */}
        <section ref={el => sectionsRef.current[2] = el} className={styles.section}>
          <div className={styles.rulesBlock}>
            <p className={styles.ruleLine}>ЗДЕСЬ НЕТ <strong>ОБЪЯСНЕНИЙ.</strong></p>
            <p className={styles.ruleLine}>ЗДЕСЬ НЕТ <strong>УГОВАРИВАНИЙ.</strong></p>
            <p className={styles.ruleLine}>ЗДЕСЬ НЕТ <strong>ВЫВЕСОК.</strong></p>
          </div>
        </section>

        {/* 4. Core */}
        <section ref={el => sectionsRef.current[3] = el} className={styles.section}>
          <p className={styles.coreText}>
            Vavip — следствие нетерпимости к хаосу.
          </p>
        </section>

        {/* 5. Leader */}
        <section ref={el => sectionsRef.current[4] = el} className={`${styles.section} ${styles.leaderSection}`}>
          <div className={styles.leaderSilhouette} />
          <p className={styles.leaderQuote}>
            не объясняю то, что можно почувствовать
          </p>
        </section>

        {/* 6. Philosophy */}
        <section ref={el => sectionsRef.current[5] = el} className={styles.section}>
          <div className={styles.philosophyGrid}>
            {philosophy.map(({ title, desc }) => (
              <div key={title} className={styles.philosophyBlock}>
                <h3 className={styles.philosophyTitle}>{title}</h3>
                <p className={styles.philosophyDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Team Principles */}
        <section ref={el => sectionsRef.current[6] = el} className={styles.section}>
          <div className={styles.principlesBlock}>
            {principles.map((principle, idx) => (
              <p key={idx} className={styles.principle}>
                {principle}
              </p>
            ))}
            <button className={styles.understoodButton} onClick={handleUnderstoodClick}>
              понял
            </button>
          </div>
        </section>

        {/* 8. Thresholds */}
        <section ref={el => sectionsRef.current[7] = el} className={styles.section}>
          <div className={styles.thresholdsGrid}>
            {thresholds.map(({ id, title }) => (
              <div
                key={id}
                className={`${styles.threshold} ${activeThreshold === id ? styles.active : ''}`}
                onClick={() => setActiveThreshold(activeThreshold === id ? null : id)}
              >
                <span className={styles.thresholdTitle}>{title}</span>
                {activeThreshold === id && (
                  <div className={styles.thresholdForm}>
                    <input
                      type="text"
                      className={styles.thresholdInput}
                      placeholder="Напишите одно предложение."
                      value={thresholdInputs[id] || ''}
                      onChange={(e) => setThresholdInputs({ ...thresholdInputs, [id]: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className={styles.thresholdHint}>
                      То, что вы готовы доказать действием.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 9. History */}
        <section ref={el => sectionsRef.current[8] = el} className={styles.section}>
          <div className={styles.historyTimeline}>
            {history.map(({ year, text }) => (
              <div key={year} className={styles.historyItem}>
                <span className={styles.historyYear}>{year}</span>
                <span className={styles.historyText}>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Appeal */}
        <section ref={el => sectionsRef.current[9] = el} className={styles.section}>
          <div className={styles.appealBlock}>
            <p className={styles.appealText}>Мы никого не убеждаем.</p>
            <p className={styles.appealText}>Мы никому не доказываем.</p>
            <p className={styles.appealText}>Мы существуем — этого достаточно.</p>
            <p className={styles.appealHighlight}>
              Если тебе нужно больше — создавай.
            </p>
          </div>
        </section>

        {/* 11. Exit */}
        <section ref={el => sectionsRef.current[10] = el} className={`${styles.section} ${styles.exitSection}`}>
          <Link to="/" className={styles.exitButton}>
            Вернуться к миру
          </Link>
          <p className={styles.exitHint}>(если он ещё подходит тебе)</p>
        </section>
      </div>
    </PageTransition>
  )
}
