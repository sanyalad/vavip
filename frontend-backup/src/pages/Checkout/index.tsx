import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from './Checkout.module.css'

const checkoutSchema = z.object({
  customer_name: z.string().min(2, '╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╨╕╨╝╤П'),
  customer_email: z.string().email('╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ email').optional().or(z.literal('')),
  customer_phone: z.string().min(10, '╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ ╤В╨╡╨╗╨╡╤Д╨╛╨╜'),
  delivery_address: z.string().min(10, '╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╨░╨┤╤А╨╡╤Б ╨┤╨╛╤Б╤В╨░╨▓╨║╨╕'),
  delivery_method: z.enum(['courier', 'pickup', 'post']),
  payment_method: z.enum(['card', 'cash']),
  customer_note: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCartStore()
  const { addToast, openAuthDrawer } = useUIStore()
  const total = totalPrice()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery_method: 'courier',
      payment_method: 'card',
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (payload) => {
      if (payload?.access_token && payload?.refresh_token && payload?.user) {
        useAuthStore.getState().login(payload.user, payload.access_token, payload.refresh_token)
        if (payload.auto_account_created) {
          addToast({
            type: 'success',
            message: '╨Р╨║╨║╨░╤Г╨╜╤В ╤Б╨╛╨╖╨┤╨░╨╜ ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╤З╨╡╤Б╨║╨╕. ╨Я╨░╤А╨╛╨╗╤М ╨▒╤Г╨┤╨╡╤В ╨╛╤В╨┐╤А╨░╨▓╨╗╨╡╨╜ ╨╜╨░ ╨╜╨╛╨╝╨╡╤А ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨░.',
            duration: 5200,
          })
        }
      }
      clearCart()
      addToast({ type: 'success', message: '╨Ч╨░╨║╨░╨╖ ╤Г╤Б╨┐╨╡╤И╨╜╨╛ ╨╛╤Д╨╛╤А╨╝╨╗╨╡╨╜!' })
      navigate(`/account/orders`)
    },
    onError: (err: any) => {
      const status = err?.response?.status
      const code = err?.response?.data?.code
      if (status === 409 && code === 'PHONE_EXISTS') {
        addToast({ type: 'info', message: '╨Э╨╛╨╝╨╡╤А ╤Г╨╢╨╡ ╨╖╨░╤А╨╡╨│╨╕╤Б╤В╤А╨╕╤А╨╛╨▓╨░╨╜ тАФ ╨▓╨╛╨╣╨┤╨╕╤В╨╡, ╤З╤В╨╛╨▒╤Л ╨╛╤Д╨╛╤А╨╝╨╕╤В╤М ╨╖╨░╨║╨░╨╖.' })
        openAuthDrawer('login')
        return
      }
      addToast({ type: 'error', message: '╨Ю╤И╨╕╨▒╨║╨░ ╨┐╤А╨╕ ╨╛╤Д╨╛╤А╨╝╨╗╨╡╨╜╨╕╨╕ ╨╖╨░╨║╨░╨╖╨░' })
    },
  })

  const onSubmit = (data: CheckoutFormData) => {
    createOrderMutation.mutate({
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      ...data,
    })
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <motion.div
      className={styles.checkout}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.container}>
        <h1 className={styles.title}>╨Ю╤Д╨╛╤А╨╝╨╗╨╡╨╜╨╕╨╡ ╨╖╨░╨║╨░╨╖╨░</h1>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.content}>
          <div className={styles.form}>
            {/* Contact Info */}
            <section className={styles.section}>
              <h2>╨Ъ╨╛╨╜╤В╨░╨║╤В╨╜╤Л╨╡ ╨┤╨░╨╜╨╜╤Л╨╡</h2>
              <p className={styles.autoAccountNote}>
                ╨Х╤Б╨╗╨╕ ╨▓╤Л ╨╜╨╡ ╨░╨▓╤В╨╛╤А╨╕╨╖╨╛╨▓╨░╨╜╤Л, ╨░╨║╨║╨░╤Г╨╜╤В ╨▒╤Г╨┤╨╡╤В ╤Б╨╛╨╖╨┤╨░╨╜ ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╤З╨╡╤Б╨║╨╕ ╨┐╨╛ ╨╜╨╛╨╝╨╡╤А╤Г ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨░.
                ╨Я╨░╤А╨╛╨╗╤М ╨┐╤А╨╕╨┤╤С╤В ╨╜╨░ ╤В╨╡╨╗╨╡╤Д╨╛╨╜.
              </p>
              <div className={styles.fields}>
                <Input
                  label="╨Ш╨╝╤П"
                  placeholder="╨Ш╨▓╨░╨╜ ╨Ш╨▓╨░╨╜╨╛╨▓"
                  error={errors.customer_name?.message}
                  {...register('customer_name')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="ivan@example.com"
                  error={errors.customer_email?.message}
                  {...register('customer_email')}
                />
                <Input
                  label="╨в╨╡╨╗╨╡╤Д╨╛╨╜"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  error={errors.customer_phone?.message}
                  {...register('customer_phone')}
                />
              </div>
            </section>

            {/* Delivery */}
            <section className={styles.section}>
              <h2>╨Ф╨╛╤Б╤В╨░╨▓╨║╨░</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input type="radio" value="courier" {...register('delivery_method')} />
                  <span className={styles.radioLabel}>
                    <strong>╨Ъ╤Г╤А╤М╨╡╤А╨╛╨╝</strong>
                    <small>╨Ф╨╛╤Б╤В╨░╨▓╨║╨░ ╨┐╨╛ ╨░╨┤╤А╨╡╤Б╤Г</small>
                  </span>
                </label>
                <label className={styles.radio}>
                  <input type="radio" value="pickup" {...register('delivery_method')} />
                  <span className={styles.radioLabel}>
                    <strong>╨б╨░╨╝╨╛╨▓╤Л╨▓╨╛╨╖</strong>
                    <small>╨Ш╨╖ ╨╜╨░╤И╨╡╨│╨╛ ╨╛╤Д╨╕╤Б╨░</small>
                  </span>
                </label>
                <label className={styles.radio}>
                  <input type="radio" value="post" {...register('delivery_method')} />
                  <span className={styles.radioLabel}>
                    <strong>╨Я╨╛╤З╤В╨░ ╨а╨╛╤Б╤Б╨╕╨╕</strong>
                    <small>╨Ф╨╛╤Б╤В╨░╨▓╨║╨░ ╨┐╨╛ ╨▓╤Б╨╡╨╣ ╨а╨╛╤Б╤Б╨╕╨╕</small>
                  </span>
                </label>
              </div>
              <Input
                label="╨Р╨┤╤А╨╡╤Б ╨┤╨╛╤Б╤В╨░╨▓╨║╨╕"
                placeholder="╨│. ╨Ь╨╛╤Б╨║╨▓╨░, ╤Г╨╗. ╨Я╤А╨╕╨╝╨╡╤А╨╜╨░╤П, ╨┤. 1, ╨║╨▓. 1"
                error={errors.delivery_address?.message}
                {...register('delivery_address')}
              />
            </section>

            {/* Payment */}
            <section className={styles.section}>
              <h2>╨Ю╨┐╨╗╨░╤В╨░</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input type="radio" value="card" {...register('payment_method')} />
                  <span className={styles.radioLabel}>
                    <strong>╨Ъ╨░╤А╤В╨╛╨╣ ╨╛╨╜╨╗╨░╨╣╨╜</strong>
                    <small>Visa, Mastercard, ╨Ь╨Ш╨а</small>
                  </span>
                </label>
                <label className={styles.radio}>
                  <input type="radio" value="cash" {...register('payment_method')} />
                  <span className={styles.radioLabel}>
                    <strong>╨Я╤А╨╕ ╨┐╨╛╨╗╤Г╤З╨╡╨╜╨╕╨╕</strong>
                    <small>╨Э╨░╨╗╨╕╤З╨╜╤Л╨╝╨╕ ╨╕╨╗╨╕ ╨║╨░╤А╤В╨╛╨╣</small>
                  </span>
                </label>
              </div>
            </section>

            {/* Note */}
            <section className={styles.section}>
              <h2>╨Ъ╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╣ ╨║ ╨╖╨░╨║╨░╨╖╤Г</h2>
              <textarea
                className={styles.textarea}
                placeholder="╨Я╨╛╨╢╨╡╨╗╨░╨╜╨╕╤П ╨║ ╨╖╨░╨║╨░╨╖╤Г..."
                rows={3}
                {...register('customer_note')}
              />
            </section>
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2>╨Т╨░╤И ╨╖╨░╨║╨░╨╖</h2>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.product.id} className={styles.item}>
                  <span className={styles.itemName}>
                    {item.product.name} ├Ч {item.quantity}
                  </span>
                  <span>
                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} тВ╜
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotal}>
              <span>╨Ш╤В╨╛╨│╨╛</span>
              <span>{total.toLocaleString('ru-RU')} тВ╜</span>
            </div>
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={createOrderMutation.isPending}
            >
              ╨Ю╤Д╨╛╤А╨╝╨╕╤В╤М ╨╖╨░╨║╨░╨╖
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

