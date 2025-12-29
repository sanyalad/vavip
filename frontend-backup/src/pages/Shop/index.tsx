import { useMemo, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { productsApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import Button from '@/components/ui/Button'
import { fallbackProducts, shopCategories } from '@/data/fallbackProducts'
import PageTransition from '@/components/animations/PageTransition'
import shopHeroBg from '@/assets/shop-hero-bg.jpg'
import styles from './Shop.module.css'

export default function ShopPage() {
  const [search] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const { addItem, openCart } = useCartStore()
  const lastAddedIdRef = useRef<number | null>(null)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { page, search, category }],
    queryFn: () => productsApi.getProducts({ page, search, category, per_page: 12 }),
  })

  // Use fallback products if API returns empty or no data
  const displayProducts = useMemo(() => {
    if (productsData?.products && productsData.products.length > 0) {
      return productsData
    }
    // Return fallback products formatted as API response
    let shopProducts = fallbackProducts.filter(p => p.id >= 910000) // Only shop products (IDs >= 910000)
    
    // Filter by category if selected
    if (category) {
      const catObj = shopCategories.find(c => c.slug === category)
      if (catObj) {
        shopProducts = shopProducts.filter(p => p.category_id === catObj.id)
      }
    }
    
    return {
      products: shopProducts,
      current_page: 1,
      pages: 1,
      has_next: false,
      has_prev: false,
      total: shopProducts.length,
    }
  }, [productsData, category])

  // Use API categories or fallback to static categories
  const { data: apiCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  })

  const categories = apiCategories && apiCategories.length > 0 ? apiCategories : shopCategories

  const currentCategoryName = useMemo(() => {
    if (!category) return null
    const found = categories?.find((c: any) => c.slug === category)
    return found?.name || null
  }, [categories, category])

  const handleAddToCart = (product: any) => {
    addItem(product)
    openCart()
    lastAddedIdRef.current = product.id
  }

  // Try to load PNG from public/images/products/ first, then fallback to API image
  const getImageUrl = (imageUrl: string | null | undefined, productSlug?: string) => {
    if (!imageUrl) return null
    // If it's already a full URL, use it
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Try to find in public/images/products/ first
    if (productSlug) {
      // Priority: PNG -> API image
      const publicPath = `/images/products/${productSlug}.png`
      return publicPath
    }
    return imageUrl
  }

  return (
    <PageTransition>
      <div className={styles.shop} id="catalog">
        {/* Hero section like CatalogHero */}
        <div className={styles.shopHero}>
          <div className={styles.heroImage}>
            <img
              src={shopHeroBg}
              alt=""
              className={styles.heroImg}
              loading="eager"
            />
          </div>
          <div className={styles.heroGradient} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{currentCategoryName || '╨Ь╨░╨│╨░╨╖╨╕╨╜'}</h1>
            <p className={styles.heroSubtitle}>╨Ш╨╜╨╢╨╡╨╜╨╡╤А╨╜╨╛╨╡ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.shopLayout}>
            {/* Sidebar categories like UzelCatalog */}
            <aside className={styles.sidebar} aria-label="╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╨╕">
              <h2 className={styles.sidebarTitle}>╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╨╕</h2>
              <ul className={styles.categoryList}>
                <li>
                  <button
                    type="button"
                    className={`${styles.categoryLink} ${!category ? styles.categoryLinkActive : ''}`}
                    onClick={() => setCategory('')}
                  >
                    ╨Т╤Б╨╡ ╤В╨╛╨▓╨░╤А╤Л
                  </button>
                </li>
                {categories?.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`${styles.categoryLink} ${category === cat.slug ? styles.categoryLinkActive : ''}`}
                      onClick={() => setCategory(cat.slug)}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main section with products */}
            <section className={styles.mainSection} aria-label="╨б╨┐╨╕╤Б╨╛╨║ ╤В╨╛╨▓╨░╤А╨╛╨▓">
              <div className={styles.sectionTop}>
                <p className={styles.sectionLead}>╨Ъ╨╛╨╝╨┐╨╗╨╡╨║╤В╤Г╤О╤Й╨╕╨╡ ╨╕ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡.</p>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className={styles.loading}>╨Ч╨░╨│╤А╤Г╨╖╨║╨░...</div>
              ) : (
                <>
                  <div className={styles.borkGrid}>
                    {displayProducts?.products.map((product, index) => (
                      <motion.article
                        key={product.id}
                        className={styles.borkCard}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{ 
                          delay: (index % 6) * 0.08, 
                          duration: 0.55, 
                          ease: [0.22, 0.9, 0.25, 1] 
                        }}
                      >
                        <Link to={`/shop/product/${product.slug}`} className={styles.borkCardLink} aria-label={product.name}>
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
                                src={getImageUrl(product.main_image, product.slug) || `/images/products/${product.slug}.png`}
                                alt={product.name}
                                className={styles.borkCardImage}
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
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
                            <h3 className={styles.borkName}>{product.name}</h3>
                            <div className={styles.borkPriceRow}>
                              <span className={styles.borkPrice}>{product.price.toLocaleString('ru-RU')} тВ╜</span>
                              {product.old_price && (
                                <span className={styles.borkOldPrice}>{product.old_price.toLocaleString('ru-RU')} тВ╜</span>
                              )}
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          className={styles.borkPlus}
                          aria-label={product.stock_quantity === 0 ? '╨Э╨╡╤В ╨▓ ╨╜╨░╨╗╨╕╤З╨╕╨╕' : '╨Ф╨╛╨▒╨░╨▓╨╕╤В╤М ╨▓ ╨║╨╛╤А╨╖╨╕╨╜╤Г'}
                          disabled={product.stock_quantity === 0}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddToCart(product)
                          }}
                        >
                          +
                        </button>
                      </motion.article>
                    ))}
                  </div>

              {/* Exact bottom marker for footer trigger */}
              <div className={styles.catalogBottomMarker} data-catalog-bottom aria-hidden="true" />

              {/* Pagination */}
              {displayProducts && displayProducts.pages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!displayProducts.has_prev}
                  >
                    ╨Э╨░╨╖╨░╨┤
                  </Button>
                  <span className={styles.pageInfo}>
                    ╨б╤В╤А╨░╨╜╨╕╤Ж╨░ {displayProducts.current_page} ╨╕╨╖ {displayProducts.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!displayProducts.has_next}
                  >
                    ╨Т╨┐╨╡╤А╨╡╨┤
                  </Button>
                </div>
              )}
            </>
          )}
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
