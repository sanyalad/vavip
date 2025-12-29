import { forwardRef, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './ShopShowcase.module.css'

const placeholderItems = [
  {
    title: '╨г╨╖╨╡╨╗ ╨▓╨▓╨╛╨┤╨░',
    subtitle: 'BORK | V01',
    description: '╨Ъ╨╛╨╝╨┐╨░╨║╤В╨╜╤Л╨╣ ╨▒╨╗╨╛╨║ ╨┤╨╗╤П ╨▓╨▓╨╛╨┤╨░ ╨▓╨╛╨┤╤Л ╤Б ╤Д╨╕╨╗╤М╤В╤А╨░╤Ж╨╕╨╡╨╣ ╨╕ ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╨║╨╛╨╣. ╨Ф╨╕╨╖╨░╨╣╨╜-╨┐╨░╨╜╨╡╨╗╤М ╤Б╨╛ ╤Б╨║╤А╤Л╤В╤Л╨╝╨╕ ╨║╤А╨╡╨┐╨╗╨╡╨╜╨╕╤П╨╝╨╕.',
    status: '╨б╨║╨╛╤А╨╛',
    badge: '╨Э╨╛╨▓╤Л╨╣ ╨╝╨░╨║╨╡╤В',
  },
  {
    title: '╨Ъ╨╛╨╗╨╗╨╡╨║╤В╨╛╤А╨╜╤Л╨╣ ╤И╨║╨░╤Д',
    subtitle: 'BORK | M02',
    description: '╨У╨╛╤В╨╛╨▓╤Л╨╣ ╨║ ╨╝╨╛╨╜╤В╨░╨╢╤Г ╨║╨╛╨╝╨┐╨╗╨╡╨║╤В ╨┤╨╗╤П ╨║╨▓╨░╤А╤В╨╕╤А ╨╕ ╨║╨╛╤В╤В╨╡╨┤╨╢╨╡╨╣. ╨Ь╨╕╨╜╨╕╨╝╨░╨╗╨╕╤Б╤В╨╕╤З╨╜╤Л╨╣ ╤Д╨░╤Б╨░╨┤, ╨░╨║╨║╤Г╤А╨░╤В╨╜╤Л╨╡ ╨║╨╗╨╡╨╝╨╝╤Л.',
    status: '╨Ч╨░╨│╨╗╤Г╤И╨║╨░',
    badge: '2 ╨║╨╛╨╜╤В╤Г╤А╨░',
  },
  {
    title: '╨Э╨░╤Б╨╛╤Б╨╜╤Л╨╣ ╨╝╨╛╨┤╤Г╨╗╤М',
    subtitle: 'BORK | C03',
    description: '╨Я╨╛╨┤╨░╤О╤Й╨╕╨╣ ╨▒╨╗╨╛╨║ ╤Б ╨▓╨╕╨▒╤А╨╛╨╕╨╖╨╛╨╗╤П╤Ж╨╕╨╡╨╣ ╨╕ ╤В╨╕╤Е╨╕╨╝╨╕ ╨╜╨░╤Б╨╛╤Б╨░╨╝╨╕. ╨Я╨╛╨┤╨│╨╛╤В╨╛╨▓╨╗╨╡╨╜ ╨┤╨╗╤П ╨│╨╗╨╕╨║╨╛╨╗╤П ╨╕ ╤Б╨╝╨╡╤Б╨╕╤В╨╡╨╗╤М╨╜╤Л╤Е ╤Г╨╖╨╗╨╛╨▓.',
    status: '╨б╨║╨╛╤А╨╛',
    badge: '╨в╨╕╤Е╨╕╨╣ ╤А╨╡╨╢╨╕╨╝',
  },
  {
    title: '╨У╨╕╨┤╤А╨╛╤Б╤В╤А╨╡╨╗╨║╨░',
    subtitle: 'BORK | H04',
    description: '╨С╨░╨╗╨░╨╜╤Б╨╕╤А╨╛╨▓╨║╨░ ╨│╨╕╨┤╤А╨░╨▓╨╗╨╕╨║╨╕ ╨┤╨╗╤П ╨║╨░╤Б╨║╨░╨┤╨╜╤Л╤Е ╨║╨╛╤В╨╗╨╛╨▓. ╨Ф╨╡╨║╨╛╤А╨░╤В╨╕╨▓╨╜╤Л╨╣ ╨║╨╛╨╢╤Г╤Е, ╨║╨╛╨╜╤В╤А╨╛╨╗╤М ╤В╨╡╨╝╨┐╨╡╤А╨░╤В╤Г╤А╤Л.',
    status: '╨Ч╨░╨│╨╗╤Г╤И╨║╨░',
    badge: 'DN40',
  },
  {
    title: '╨Ъ╨╛╨╜╤В╤Г╤А ╤В╤С╨┐╨╗╨╛╨│╨╛ ╨┐╨╛╨╗╨░',
    subtitle: 'BORK | F05',
    description: '╨и╨║╨░╤Д ╤Б ╤А╨░╤Б╨┐╤А╨╡╨┤╨╡╨╗╨╡╨╜╨╕╨╡╨╝ ╨┐╨╛ ╨╖╨╛╨╜╨░╨╝, ╤Б╨╡╤А╨▓╨╛╨┐╤А╨╕╨▓╨╛╨┤╤Л ╨╕ ╨║╨╛╨╜╤В╤А╨╛╨╗╨╗╨╡╤А. ╨У╨╛╤В╨╛╨▓╨╜╨╛╤Б╤В╤М ╨┐╨╛╨┤ ╤Г╨╝╨╜╤Л╨╣ ╨┤╨╛╨╝.',
    status: '╨б╨║╨╛╤А╨╛',
    badge: '6 ╨╖╨╛╨╜',
  },
  {
    title: '╨С╨╛╨╣╨╗╨╡╤А╨╜╤Л╨╣ ╤Г╨╖╨╡╨╗',
    subtitle: 'BORK | W06',
    description: '╨У╨╛╤А╤П╤З╨╡╨╡ ╨▓╨╛╨┤╨╛╤Б╨╜╨░╨▒╨╢╨╡╨╜╨╕╨╡ ╤Б ╤А╨╡╤Ж╨╕╤А╨║╤Г╨╗╤П╤Ж╨╕╨╡╨╣. ╨Ъ╨╛╨╗╨╗╨╡╨║╤В╨╛╤А ╨╕╨╖ ╨╜╨╡╤А╨╢╨░╨▓╨╡╨╣╨║╨╕ ╨╕ ╤Б╨╡╤А╨▓╨╕╤Б╨╜╤Л╨╡ ╨║╤А╨░╨╜╤Л.',
    status: '╨Ч╨░╨│╨╗╤Г╤И╨║╨░',
    badge: '╨Э╨╡╤А╨╢.',
  },
]

const ShopShowcase = forwardRef<HTMLElement, { className?: string }>(function ShopShowcase({ className }, ref) {
  const sectionClass = [styles.catalog, className].filter(Boolean).join(' ')
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const cards = grid.querySelectorAll<HTMLElement>(`.${styles.card}`)
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.cardVisible)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.35, rootMargin: '0px' }
    )

    cards.forEach((card) => {
      observer.observe(card)
    })

    return () => {
      cards.forEach((card) => observer.unobserve(card))
    }
  }, [])

  return (
    <section ref={ref} className={sectionClass} id="home-shop-catalog" aria-labelledby="shop-showcase-title">
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>SAN TECH</p>
          <h2 id="shop-showcase-title" className={styles.title}>
            ╨Ъ╨░╤В╨░╨╗╨╛╨│ ╨╕╨╜╨╢╨╡╨╜╨╡╤А╨╜╤Л╤Е ╤Г╨╖╨╗╨╛╨▓
          </h2>
          <p className={styles.lead}>
            ╨Ь╨░╨║╨╡╤В╤Л ╤Г╨╖╨╗╨╛╨▓ ╨╕ ╨│╨╛╤В╨╛╨▓╤Л╤Е ╤А╨╡╤И╨╡╨╜╨╕╨╣ ╨┤╨╗╤П ╨║╨▓╨░╤А╤В╨╕╤А ╨╕ ╨║╨╛╤В╤В╨╡╨┤╨╢╨╡╨╣. ╨Я╨╛╨║╨░ ╨╖╨░╨│╨╗╤Г╤И╨║╨╕ тАФ ╨▓╨╕╨╖╤Г╨░╨╗╨╕╨╖╨╕╤А╤Г╨╡╨╝ ╨║╨╛╨╝╨┐╨╛╨╜╨╛╨▓╨║╤Г,
            ╨║╨╛╨╝╨┐╨╛╨╜╨╛╨▓╨║╤Г ╨╕ ╨╛╤Д╨╛╤А╨╝╨╗╨╡╨╜╨╕╨╡.
          </p>
          <div className={styles.actions}>
            <Link to="/shop" className={styles.primaryCta}>
              ╨Я╨╡╤А╨╡╨╣╤В╨╕ ╨▓ ╨╝╨░╨│╨░╨╖╨╕╨╜
            </Link>
            <button type="button" className={styles.secondaryCta} aria-label="╨Ъ╨░╤В╨░╨╗╨╛╨│ ╤Б╨║╨╛╤А╨╛ ╨▒╤Г╨┤╨╡╤В ╨┤╨╛╤Б╤В╤Г╨┐╨╡╨╜">
              ╨Ъ╨░╤В╨░╨╗╨╛╨│ PDF тАФ ╤Б╨║╨╛╤А╨╛
            </button>
          </div>
        </div>

        <div ref={gridRef} className={styles.grid}>
          {placeholderItems.map((item, index) => (
            <article
              key={item.title}
              className={styles.card}
              style={{ '--delay': `${index * 0.05}s` } as React.CSSProperties}
            >
              <div className={styles.cardTop}>
                <span className={styles.badge}>{item.badge}</span>
                <span className={styles.code}>{item.subtitle}</span>
              </div>
              <div className={styles.thumb} aria-hidden="true">
                <div className={styles.thumbGlow} />
                <div className={styles.thumbShape} />
                <div className={styles.thumbOverlay} />
                <span className={styles.status}>{item.status}</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.description}</p>
                <div className={styles.chips}>
                  <span className={styles.chip}>╨б╨░╨╜╤В╨╡╤Е╨╜╨╕╤З╨╡╤Б╨║╨╕╨╣ ╤Г╨╖╨╡╨╗</span>
                  <span className={styles.chip}>╨Я╤А╨╡╨╝╨╕╤Г╨╝ ╨╛╤В╨┤╨╡╨╗╨║╨░</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
})

export default ShopShowcase

