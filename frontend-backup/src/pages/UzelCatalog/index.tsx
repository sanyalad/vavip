import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import styles from './UzelCatalog.module.css'
import { uzelCategories } from '@/data/uzelCatalog'
import { useCartStore } from '@/store/cartStore'
import { getFallbackProductBySlug } from '@/data/fallbackProducts'
import CatalogHero from '@/components/shop/CatalogHero'
import PageTransition from '@/components/animations/PageTransition'

const placeholderProducts = [
  {
    slug: 'v01-meter',
    title: 'V01 | ╨г╨╖╨╡╨╗ ╤Б ╤Б╤З╨╡╤В╤З╨╕╨║╨╛╨╝',
    category: 'with-meter',
    desc: '╨б╤З╤С╤В╤З╨╕╨║, ╤Д╨╕╨╗╤М╤В╤А, ╨╛╨▒╤А╨░╤В╨╜╤Л╨╣ ╨║╨╗╨░╨┐╨░╨╜, ╨┤╨╡╨╝╨┐╤Д╨╡╤А, ╤Б╨╡╤А╨▓╨╛╨┐╤А╨╕╨▓╨╛╨┤╤Л. ╨Я╨╛╨┤╨│╨╛╤В╨╛╨▓╨║╨░ ╨┐╨╛╨┤ ╤Г╨╝╨╜╤Л╨╣ ╨┤╨╛╨╝.',
    badge: '╨г╤З╤С╤В + ╤Г╨╝╨╜╤Л╨╣ ╨┤╨╛╨╝',
    price: '9 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v02-clean',
    title: 'V02 | ╨г╨╖╨╡╨╗ ╨▒╨╡╨╖ ╤Б╤З╨╡╤В╤З╨╕╨║╨░',
    category: 'no-meter',
    desc: '╨Ъ╨╛╨╝╨┐╨░╨║╤В╨╜╨░╤П ╨▓╤А╨╡╨╖╨║╨░ ╨▒╨╡╨╖ ╤Г╤З╨╡╤В╨░. ╨Ч╨░╨┐╨╛╤А╨╜╨░╤П ╨░╤А╨╝╨░╤В╤Г╤А╨░, ╤Д╨╕╨╗╤М╤В╤А, ╨░╨╜╤В╨╕╨▓╨╕╨▒╤А╨░╤Ж╨╕╨╛╨╜╨╜╤Л╨╡ ╨║╨╛╨╝╨┐╨╡╨╜╤Б╨░╤В╨╛╤А╤Л.',
    badge: '╨Ъ╨╛╨╝╨┐╨░╨║╤В',
    price: '10 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v03-cold',
    title: 'V03 | ╨г╨╖╨╡╨╗ ╨е╨Т╨б',
    category: 'cold-only',
    desc: '╨в╨╛╨╗╤М╨║╨╛ ╤Е╨╛╨╗╨╛╨┤╨╜╨╛╨╡ ╨▓╨╛╨┤╨╛╤Б╨╜╨░╨▒╨╢╨╡╨╜╨╕╨╡. ╨Ч╨░╤Й╨╕╤В╨░ ╨╛╤В ╨│╨╕╨┤╤А╨╛╤Г╨┤╨░╤А╨░, ╤Д╨╕╨╗╤М╤В╤А ╤В╨╛╨╜╨║╨╛╨╣ ╨╛╤З╨╕╤Б╤В╨║╨╕.',
    badge: '╨е╨Т╨б',
    price: '15 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v04-dual',
    title: 'V04 | ╨г╨╖╨╡╨╗ ╨У╨Т╨б + ╨е╨Т╨б',
    category: 'dual-circuit',
    desc: '╨Ф╨▓╨░ ╨║╨╛╨╜╤В╤Г╤А╨░, ╨▒╨░╨╗╨░╨╜╤Б╨╕╤А╨╛╨▓╨║╨░, ╨╛╨▒╤А╨░╤В╨╜╤Л╨╡ ╨║╨╗╨░╨┐╨░╨╜╤Л, ╤Д╨╕╨╗╤М╤В╤А╨░╤Ж╨╕╤П. ╨У╨╛╤В╨╛╨▓ ╨║ ╤В╨╡╨┐╨╗╨╛╨╛╨▒╨╝╨╡╨╜╨╜╨╕╨║╤Г.',
    badge: '╨Ф╨▓╨░ ╨║╨╛╨╜╤В╤Г╤А╨░',
    price: '12 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v05-smart',
    title: 'V05 | ╨г╨╖╨╡╨╗ ╤Б ╨┐╨╛╨┤╨│╨╛╤В╨╛╨▓╨║╨╛╨╣ ╨┐╨╛╨┤ ╤Г╨╝╨╜╤Л╨╣ ╨┤╨╛╨╝',
    category: 'smart-ready',
    desc: '╨Ь╨╡╤Б╤В╨░ ╨┐╨╛╨┤ ╨┤╨░╤В╤З╨╕╨║╨╕ ╨┐╤А╨╛╤В╨╡╤З╨║╨╕, ╤Б╨╡╤А╨▓╨╛╨┐╤А╨╕╨▓╨╛╨┤╤Л, ╨║╨░╨▒╨╡╨╗╤М-╨║╨░╨╜╨░╨╗╤Л. ╨б╨▒╨╛╤А╨║╨░ ╨╜╨░ ╨║╨╗╨╕╨┐╤Б╨░╤Е.',
    badge: 'Smart ready',
    price: '17 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v06-premium',
    title: 'V06 | ╨Я╤А╨╡╨╝╨╕╨░╨╗╤М╨╜╨░╤П ╨╛╤В╨┤╨╡╨╗╨║╨░',
    category: 'premium-finish',
    desc: '╨Ч╨░╨║╤А╤Л╤В╤Л╨╣ ╤Д╨░╤Б╨░╨┤, ╤Б╨║╤А╤Л╤В╤Л╨╡ ╨║╤А╨╡╨┐╨╗╨╡╨╜╨╕╤П, ╨┐╨╛╤А╨╛╤И╨║╨╛╨▓╨░╤П ╨╛╨║╤А╨░╤Б╨║╨░. ╨Ь╨╕╨╜╨╕╨╝╤Г╨╝ ╨▓╨╕╨╖╤Г╨░╨╗╤М╨╜╨╛╨│╨╛ ╤И╤Г╨╝╨░.',
    badge: 'Premium',
    price: '19 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v07-compact',
    title: 'V07 | ╨Ъ╨╛╨╝╨┐╨░╨║╤В╨╜╤Л╨╣ ╤Г╨╖╨╡╨╗',
    category: 'no-meter',
    desc: '╨Ь╨╕╨╜╨╕╨╝╨░╨╗╤М╨╜╤Л╨╡ ╨│╨░╨▒╨░╤А╨╕╤В╤Л. ╨г╨╖╨╡╨╗ ╨▒╨╡╨╖ ╤Г╤З╨╡╤В╨░ ╨┤╨╗╤П ╨╛╨│╤А╨░╨╜╨╕╤З╨╡╨╜╨╜╨╛╨│╨╛ ╨┐╤А╨╛╤Б╤В╤А╨░╨╜╤Б╤В╨▓╨░ ╨╝╨╛╨╜╤В╨░╨╢╨░.',
    badge: 'Compact',
    price: '8 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v08-service',
    title: 'V08 | ╨г╨╖╨╡╨╗ ╤Б ╤Б╨╡╤А╨▓╨╕╤Б╨╜╤Л╨╝╨╕ ╨║╤А╨░╨╜╨░╨╝╨╕',
    category: 'with-meter',
    desc: '╨г╨┤╨╛╨▒╨╜╨╛╨╡ ╨╛╨▒╤Б╨╗╤Г╨╢╨╕╨▓╨░╨╜╨╕╨╡: ╤Б╨╡╤А╨▓╨╕╤Б╨╜╤Л╨╡ ╤В╨╛╤З╨║╨╕, ╤А╨░╨╖╨▒╨╛╤А╨╜╨░╤П ╨│╨╡╨╛╨╝╨╡╤В╤А╨╕╤П, ╨▒╤Л╤Б╤В╤А╤Л╨╣ ╨┤╨╛╤Б╤В╤Г╨┐ ╨║ ╤Д╨╕╨╗╤М╤В╤А╤Г.',
    badge: 'Service',
    price: '14 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v09-antiwater',
    title: 'V09 | ╨Р╨╜╤В╨╕╨│╨╕╨┤╤А╨╛╤Г╨┤╨░╤А',
    category: 'cold-only',
    desc: '╨Ч╨░╤Й╨╕╤В╨░ ╨╛╤В ╨│╨╕╨┤╤А╨╛╤Г╨┤╨░╤А╨░ ╨╕ ╨▓╨╕╨▒╤А╨░╤Ж╨╕╨╣. ╨б╤В╨░╨▒╨╕╨╗╤М╨╜╨░╤П ╤А╨░╨▒╨╛╤В╨░ ╨┐╤А╨╕ ╤Б╨║╨░╤З╨║╨░╤Е ╨┤╨░╨▓╨╗╨╡╨╜╨╕╤П.',
    badge: 'Anti-shock',
    price: '13 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v10-dual-pro',
    title: 'V10 | ╨Ф╨▓╨░ ╨║╨╛╨╜╤В╤Г╤А╨░ PRO',
    category: 'dual-circuit',
    desc: '╨Ф╨▓╨░ ╨║╨╛╨╜╤В╤Г╤А╨░, ╨▒╨░╨╗╨░╨╜╤Б╨╕╤А╨╛╨▓╨║╨░, ╨┤╨╛╨┐╨╛╨╗╨╜╨╕╤В╨╡╨╗╤М╨╜╤Л╨╡ ╤Г╨╖╨╗╤Л ╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╜╨╛╤Б╤В╨╕ ╨╕ ╤Д╨╕╨╗╤М╤В╤А╨░╤Ж╨╕╨╕.',
    badge: 'PRO',
    price: '21 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v11-smart-plus',
    title: 'V11 | Smart ready +',
    category: 'smart-ready',
    desc: '╨Я╨╛╨┤╨│╨╛╤В╨╛╨▓╨║╨░ ╨┐╨╛╨┤ ╨┤╨░╤В╤З╨╕╨║╨╕ ╨┐╤А╨╛╤В╨╡╤З╨║╨╕ ╨╕ ╤Б╨╡╤А╨▓╨╛╨┐╤А╨╕╨▓╨╛╨┤╤Л + ╤Г╨╗╤Г╤З╤И╨╡╨╜╨╜╨░╤П ╤В╤А╨░╤Б╤Б╨╕╤А╨╛╨▓╨║╨░ ╨║╨░╨▒╨╡╨╗╨╡╨╣.',
    badge: 'Smart+',
    price: '23 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
  {
    slug: 'v12-premium-black',
    title: 'V12 | Premium Black',
    category: 'premium-finish',
    desc: '╨Ч╨░╨║╤А╤Л╤В╤Л╨╡ ╨┐╨░╨╜╨╡╨╗╨╕, ╨╝╨╛╨╜╨╛╤Е╤А╨╛╨╝╨╜╨░╤П ╨│╨╡╨╛╨╝╨╡╤В╤А╨╕╤П, ╨░╨║╤Ж╨╡╨╜╤В ╨╜╨░ ╨│╤А╨░╤Д╨╕╤В/╤Б╨╡╤А╨╡╨▒╤А╨╛.',
    badge: 'Black',
    price: '25 ╤В.╤А.',
    tag: '╨Э╨╛╨▓╨╕╨╜╨║╨░',
  },
]

export default function UzelCatalogPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>()
  const { addItem, openCart } = useCartStore()

  const selectedCategory =
    uzelCategories.find((c) => c.slug === categorySlug)?.slug || uzelCategories[0]?.slug
  const selectedCategoryTitle = useMemo(
    () => uzelCategories.find((c) => c.slug === selectedCategory)?.title || '╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╤П',
    [selectedCategory],
  )

  const filteredProducts = useMemo(() => {
    return placeholderProducts.filter((p) => {
      const matchCategory = !selectedCategory || p.category === selectedCategory
      return matchCategory
    })
  }, [selectedCategory])

  const addBySlug = (slug: string) => {
    const p = getFallbackProductBySlug(slug)
    if (!p) return
    addItem(p, 1)
    openCart()
  }

  return (
    <PageTransition>
      <div className={styles.catalogPage}>
        <CatalogHero title={selectedCategoryTitle} subtitle="╨г╨Ч╨Х╨Ы ╨Т╨Т╨Ю╨Ф╨Р" />

        <div className={styles.borkContainer}>
          <div className={styles.borkLayout}>
            <aside className={styles.borkSidebar} aria-label="╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╨╕">
              <ul className={styles.borkCategoryList}>
                {uzelCategories.map((cat) => {
                  const isActive = cat.slug === selectedCategory
                  return (
                    <li key={cat.slug}>
                      <Link
                        to={`/catalog/uzel-vvoda/${cat.slug}`}
                        className={`${styles.borkCategoryLink} ${isActive ? styles.borkCategoryLinkActive : ''}`}
                      >
                        {cat.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </aside>

              <section className={styles.borkSection} aria-label="╨б╨┐╨╕╤Б╨╛╨║ ╨║╨╛╨╝╨┐╨╗╨╡╨║╤В╨╛╨▓">
                <div className={styles.borkSectionTop}>
                  <p className={styles.borkSectionLead}>╨Ъ╨╛╨╝╨┐╨╗╨╡╨║╤В╨░╤Ж╨╕╨╕ ╨╕ ╨▓╨░╤А╨╕╨░╨╜╤В╤Л ╨╕╤Б╨┐╨╛╨╗╨╜╨╡╨╜╨╕╤П.</p>
                </div>

                <div className={styles.borkGrid}>
                  {filteredProducts.map((product, index) => (
                    <motion.article
                      key={product.slug}
                      className={styles.borkCard}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.23, 0.9, 0.15, 1] }}
                    >
                      <Link to={`/shop/product/${product.slug}`} className={styles.borkCardLink} aria-label={product.title}>
                        <div 
                          className={styles.borkTile}
                          onMouseMove={(e) => {
                            const el = e.currentTarget
                            const rect = el.getBoundingClientRect()
                            const px = (e.clientX - rect.left) / rect.width
                            const py = (e.clientY - rect.top) / rect.height
                            const dx = (px - 0.5) * 2
                            const dy = (py - 0.5) * 2

                            const max = 8
                            const ry = dx * max
                            const rx = -dy * max

                            el.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`)
                            el.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`)
                            el.style.setProperty('--tilt-mx', `${(px * 100).toFixed(1)}%`)
                            el.style.setProperty('--tilt-my', `${(py * 100).toFixed(1)}%`)
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget
                            el.style.setProperty('--tilt-rx', '0deg')
                            el.style.setProperty('--tilt-ry', '0deg')
                            el.style.setProperty('--tilt-mx', '50%')
                            el.style.setProperty('--tilt-my', '50%')
                          }}
                        >
                          <div className={styles.borkTileMark} aria-hidden="true">
                            VAVIP
                          </div>
                          <div className={styles.borkCardMedia} aria-hidden="true">
                            <img
                              src={`/images/products/${product.slug}.png`}
                              alt={product.title}
                              className={styles.borkCardImage}
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to SVG if image doesn't exist
                                const target = e.target as HTMLImageElement
                                // Try alternative paths
                                if (!target.dataset.triedAlt) {
                                  target.dataset.triedAlt = 'true'
                                  // Try with double extension (in case user added .png.png)
                                  target.src = `/images/products/${product.slug}.png.png`
                                  return
                                }
                                target.style.display = 'none'
                                const svg = target.nextElementSibling as SVGSVGElement
                                if (svg) {
                                  svg.style.display = 'block'
                                }
                              }}
                            />
                            <svg className={styles.nodeSvg} viewBox="0 0 120 120" role="presentation" style={{ display: 'none' }}>
                              <path d="M25 60h70" />
                              <path d="M60 25v70" />
                              <path d="M38 48h44" />
                              <path d="M38 72h44" />
                              <circle cx="60" cy="60" r="10" />
                              <circle cx="25" cy="60" r="6" />
                              <circle cx="95" cy="60" r="6" />
                              <circle cx="60" cy="25" r="6" />
                              <circle cx="60" cy="95" r="6" />
                            </svg>
                          </div>
                        </div>

                        <div className={styles.borkInfo}>
                          <h3 className={styles.borkName}>{product.title}</h3>
                          <div className={styles.borkPriceRow}>
                            <span className={styles.borkPrice}>{product.price}</span>
                            <span className={styles.borkTag}>{product.tag}</span>
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        className={styles.borkPlus}
                        aria-label="╨Ф╨╛╨▒╨░╨▓╨╕╤В╤М ╨▓ ╨║╨╛╤А╨╖╨╕╨╜╤Г"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          addBySlug(product.slug)
                        }}
                      >
                        +
                      </button>
                    </motion.article>
                  ))}
                </div>

                {/* Exact bottom marker for footer trigger */}
                <div data-catalog-bottom aria-hidden="true" />
              </section>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
