import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { productsApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import Button from '@/components/ui/Button'
import { getFallbackProductBySlug } from '@/data/fallbackProducts'
import styles from './Product.module.css'

export default function ProductPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'about' | 'spec'>('about')
  const { addItem, openCart } = useCartStore()

  const fallbackProduct = useMemo(() => {
    if (!slug) return null
    return getFallbackProductBySlug(slug)
  }, [slug])

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProduct(slug!),
    enabled: !!slug,
  })

  if (isLoading && !fallbackProduct) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  const resolvedProduct = product || fallbackProduct

  if ((error || !resolvedProduct) && !fallbackProduct) {
    return (
      <div className={styles.error}>
        <h1>╨в╨╛╨▓╨░╤А ╨╜╨╡ ╨╜╨░╨╣╨┤╨╡╨╜</h1>
        <p>╨Ъ ╤Б╨╛╨╢╨░╨╗╨╡╨╜╨╕╤О, ╨╖╨░╨┐╤А╨░╤И╨╕╨▓╨░╨╡╨╝╤Л╨╣ ╤В╨╛╨▓╨░╤А ╨╜╨╡ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╨╡╤В.</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (!resolvedProduct) return
    addItem(resolvedProduct, quantity)
    openCart()
  }

  const handleBuyOneClick = () => {
    if (!resolvedProduct) return
    addItem(resolvedProduct, quantity)
    navigate('/checkout')
  }

  const images = resolvedProduct?.images || []
  
  // Get main image - prioritize public PNG, then API images
  const mainImage = useMemo(() => {
    const productSlug = resolvedProduct?.slug
    if (productSlug) {
      // Always try public PNG first
      return `/images/products/${productSlug}.png`
    }
    // Fallback to API image
    return images[selectedImage]?.url || resolvedProduct?.main_image || null
  }, [resolvedProduct?.slug, images, selectedImage, resolvedProduct?.main_image])
  const skuLabel = useMemo(() => {
    if (!resolvedProduct?.sku) return null
    return String(resolvedProduct.sku).toUpperCase()
  }, [resolvedProduct?.sku])

  return (
    <motion.div
      className={styles.product}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.pdp}>
        <div className={styles.pdpLayout}>
          {/* Gallery (left) */}
          <div className={styles.galleryArea}>
            <div className={styles.galleryFrame}>
              {mainImage ? (
                <img 
                  className={styles.galleryImage} 
                  src={mainImage} 
                  alt={resolvedProduct?.name || '╨в╨╛╨▓╨░╤А'}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    // Try alternative paths
                    if (!target.dataset.triedAlt) {
                      target.dataset.triedAlt = 'true'
                      // Try with double extension (in case user added .png.png)
                      const productSlug = resolvedProduct?.slug
                      if (productSlug && target.src.includes('.png') && !target.src.includes('.png.png')) {
                        target.src = `/images/products/${productSlug}.png.png`
                        return
                      }
                    }
                    // Fallback to API image if public PNG doesn't exist
                    const apiImage = images[selectedImage]?.url || resolvedProduct?.main_image
                    if (apiImage && !target.src.includes(apiImage)) {
                      target.src = apiImage
                    } else {
                      target.style.display = 'none'
                      const placeholder = target.parentElement?.querySelector(`.${styles.placeholder}`)
                      if (!placeholder) {
                        const placeholderDiv = document.createElement('div')
                        placeholderDiv.className = styles.placeholder
                        placeholderDiv.textContent = '╨Э╨╡╤В ╨╕╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╤П'
                        target.parentElement?.appendChild(placeholderDiv)
                      }
                    }
                  }}
                />
              ) : (
                <div className={styles.placeholder}>╨Э╨╡╤В ╨╕╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╤П</div>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbnails} aria-label="╨У╨░╨╗╨╡╤А╨╡╤П">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`${styles.thumbnail} ${index === selectedImage ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`╨Ш╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╨╡ ${index + 1}`}
                  >
                    <img src={img.url} alt="" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details (right) */}
          <aside className={styles.detailsArea} aria-label="╨Ш╨╜╤Д╨╛╤А╨╝╨░╤Ж╨╕╤П ╨╛ ╤В╨╛╨▓╨░╤А╨╡">
            <div className={styles.detailsInner}>
              <div className={styles.metaTop}>
                <span className={styles.metaLine}>{resolvedProduct?.category?.name || '╨Ъ╨░╤В╨░╨╗╨╛╨│'}</span>
                {skuLabel && <span className={styles.metaCode}>{skuLabel}</span>}
              </div>

              <h1 className={styles.title}>{resolvedProduct?.name}</h1>

              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>{resolvedProduct?.price?.toLocaleString('ru-RU')} тВ╜</span>
                {resolvedProduct?.old_price && (
                  <span className={styles.oldPrice}>{resolvedProduct.old_price.toLocaleString('ru-RU')} тВ╜</span>
                )}
              </div>

              <div className={styles.actionsRow}>
                <div className={styles.qty}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="╨г╨╝╨╡╨╜╤М╤И╨╕╤В╤М ╨║╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛"
                  >
                    тИТ
                  </button>
                  <span aria-label="╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="╨г╨▓╨╡╨╗╨╕╤З╨╕╤В╤М ╨║╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛">
                    +
                  </button>
                </div>

                <div className={styles.buyWrap}>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleAddToCart}
                    disabled={!!resolvedProduct && resolvedProduct.stock_quantity === 0}
                    className={styles.buyPrimary}
                  >
                    {!!resolvedProduct && resolvedProduct.stock_quantity === 0 ? '╨Э╨╡╤В ╨▓ ╨╜╨░╨╗╨╕╤З╨╕╨╕' : '╨Т ╨║╨╛╤А╨╖╨╕╨╜╤Г'}
                  </Button>

                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={handleBuyOneClick}
                    className={styles.buyOneClick}
                    disabled={!!resolvedProduct && resolvedProduct.stock_quantity === 0}
                  >
                    ╨Ъ╤Г╨┐╨╕╤В╤М ╨▓ 1 ╨║╨╗╨╕╨║
                  </Button>
                </div>
              </div>

              <div className={styles.tabs} role="tablist" aria-label="╨Ш╨╜╤Д╨╛╤А╨╝╨░╤Ж╨╕╤П">
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'about' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('about')}
                  role="tab"
                  aria-selected={activeTab === 'about'}
                >
                  ╨Ю╨┐╨╕╤Б╨░╨╜╨╕╨╡
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'spec' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('spec')}
                  role="tab"
                  aria-selected={activeTab === 'spec'}
                >
                  ╨е╨░╤А╨░╨║╤В╨╡╤А╨╕╤Б╤В╨╕╨║╨╕
                </button>
              </div>

              {activeTab === 'about' ? (
                <div className={styles.tabPanel} role="tabpanel">
                  {resolvedProduct?.description ? (
                    <div dangerouslySetInnerHTML={{ __html: resolvedProduct.description }} />
                  ) : (
                    <p className={styles.muted}>╨Ю╨┐╨╕╤Б╨░╨╜╨╕╨╡ ╨┐╨╛╤П╨▓╨╕╤В╤Б╤П ╨┐╨╛╨╖╨╢╨╡.</p>
                  )}
                </div>
              ) : (
                <div className={styles.tabPanel} role="tabpanel">
                  {resolvedProduct?.attributes && resolvedProduct.attributes.length > 0 ? (
                    <dl className={styles.specList}>
                      {resolvedProduct.attributes.map((attr) => (
                        <div key={attr.id} className={styles.specRow}>
                          <dt>{attr.name}</dt>
                          <dd>{attr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className={styles.muted}>╨е╨░╤А╨░╨║╤В╨╡╤А╨╕╤Б╤В╨╕╨║╨╕ ╨┐╨╛╤П╨▓╤П╤В╤Б╤П ╨┐╨╛╨╖╨╢╨╡.</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  )
}






