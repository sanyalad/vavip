import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersApi } from '@/services/api'
import { Order, OrderStatus } from '@/types'
import styles from './Account.module.css'

const statusLabels: Record<OrderStatus, string> = {
  pending: '╨Ю╨╢╨╕╨┤╨░╨╡╤В',
  confirmed: '╨Я╨╛╨┤╤В╨▓╨╡╤А╨╢╨┤╨╡╨╜',
  processing: '╨Т ╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨╡',
  shipped: '╨Ю╤В╨┐╤А╨░╨▓╨╗╨╡╨╜',
  delivered: '╨Ф╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜',
  cancelled: '╨Ю╤В╨╝╨╡╨╜╨╡╨╜',
}

const statusColors: Record<OrderStatus, string> = {
  pending: '#a5aab5',     // graphite
  confirmed: '#c0c0c0',   // silver
  processing: '#9aa0aa',  // graphite-alt
  shipped: '#b6bcc7',     // light graphite
  delivered: '#d1d5db',   // light silver
  cancelled: '#7a7f88',   // dark graphite
}

export default function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders(),
  })

  if (isLoading) {
    return <div className={styles.loading}>╨Ч╨░╨│╤А╤Г╨╖╨║╨░...</div>
  }

  return (
    <div className={styles.section}>
      <h1 className={styles.sectionTitle}>╨Ь╨╛╨╕ ╨╖╨░╨║╨░╨╖╤Л</h1>

      {orders?.length === 0 ? (
        <div className={styles.empty}>
          <p>╨г ╨▓╨░╤Б ╨┐╨╛╨║╨░ ╨╜╨╡╤В ╨╖╨░╨║╨░╨╖╨╛╨▓</p>
          <Link to="/shop">
            <button className={styles.linkButton}>╨Я╨╡╤А╨╡╨╣╤В╨╕ ╨▓ ╨╝╨░╨│╨░╨╖╨╕╨╜</button>
          </Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders?.map((order: Order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <span className={styles.orderNumber}>
                    ╨Ч╨░╨║╨░╨╖ #{order.order_number}
                  </span>
                  <span className={styles.orderDate}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('ru-RU')
                      : ''}
                  </span>
                </div>
                <span
                  className={styles.orderStatus}
                  style={{ backgroundColor: statusColors[order.status] }}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className={styles.orderItems}>
                {order.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_name} />
                    )}
                    <div className={styles.orderItemInfo}>
                      <span>{item.product_name}</span>
                      <span className={styles.orderItemQty}>
                        {item.quantity} ├Ч {item.price.toLocaleString('ru-RU')} тВ╜
                      </span>
                    </div>
                  </div>
                ))}
                {order.items && order.items.length > 3 && (
                  <p className={styles.moreItems}>
                    + ╨╡╤Й╨╡ {order.items.length - 3} ╤В╨╛╨▓╨░╤А(╨╛╨▓)
                  </p>
                )}
              </div>

              <div className={styles.orderFooter}>
                <span className={styles.orderTotal}>
                  ╨Ш╤В╨╛╨│╨╛: {order.total.toLocaleString('ru-RU')} тВ╜
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}






