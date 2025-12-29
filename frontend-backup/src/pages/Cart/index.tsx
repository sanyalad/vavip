import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import Button from '@/components/ui/Button'
import styles from './Cart.module.css'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const total = totalPrice()

  if (items.length === 0) {
    return (
      <motion.div
        className={styles.empty}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <h1>╨Ъ╨╛╤А╨╖╨╕╨╜╨░ ╨┐╤Г╤Б╤В╨░</h1>
        <p>╨Ф╨╛╨▒╨░╨▓╤М╤В╨╡ ╤В╨╛╨▓╨░╤А╤Л ╨╕╨╖ ╨╝╨░╨│╨░╨╖╨╕╨╜╨░</p>
        <Link to="/shop">
          <Button>╨Я╨╡╤А╨╡╨╣╤В╨╕ ╨▓ ╨╝╨░╨│╨░╨╖╨╕╨╜</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={styles.cart}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.container}>
        <h1 className={styles.title}>╨Ъ╨╛╤А╨╖╨╕╨╜╨░</h1>

        <div className={styles.content}>
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.product.id} className={styles.item}>
                <div className={styles.itemImage}>
                  {item.product.main_image ? (
                    <img src={item.product.main_image} alt={item.product.name} />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <Link to={`/shop/product/${item.product.slug}`} className={styles.itemName}>
                    {item.product.name}
                  </Link>
                  <p className={styles.itemPrice}>
                    {item.product.price.toLocaleString('ru-RU')} тВ╜
                  </p>
                </div>
                <div className={styles.quantity}>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    тИТ
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <p className={styles.itemTotal}>
                  {(item.product.price * item.quantity).toLocaleString('ru-RU')} тВ╜
                </p>
                <button
                  className={styles.removeButton}
                  onClick={() => removeItem(item.product.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2>╨Ш╤В╨╛╨│╨╛</h2>
            <div className={styles.summaryRow}>
              <span>╨в╨╛╨▓╨░╤А╤Л ({items.length})</span>
              <span>{total.toLocaleString('ru-RU')} тВ╜</span>
            </div>
            <div className={styles.summaryRow}>
              <span>╨Ф╨╛╤Б╤В╨░╨▓╨║╨░</span>
              <span>╨С╨╡╤Б╨┐╨╗╨░╤В╨╜╨╛</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>╨Ъ ╨╛╨┐╨╗╨░╤В╨╡</span>
              <span>{total.toLocaleString('ru-RU')} тВ╜</span>
            </div>
            <Link to="/checkout">
              <Button fullWidth size="lg">
                ╨Ю╤Д╨╛╤А╨╝╨╕╤В╤М ╨╖╨░╨║╨░╨╖
              </Button>
            </Link>
            <Button variant="ghost" fullWidth onClick={clearCart}>
              ╨Ю╤З╨╕╤Б╤В╨╕╤В╤М ╨║╨╛╤А╨╖╨╕╨╜╤Г
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}












