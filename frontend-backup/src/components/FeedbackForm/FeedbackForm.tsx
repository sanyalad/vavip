import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { feedbackApi } from '@/services/api/feedback'
import { useUIStore } from '@/store/uiStore'
import styles from './FeedbackForm.module.css'

const contactSchema = z.object({
  name: z.string().trim().min(1, '╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╨╕╨╝╤П').max(100, '╨Ш╨╝╤П ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨╗╨╕╨╜╨╜╨╛╨╡'),
  phone: z.string().trim().max(20, '╨в╨╡╨╗╨╡╤Д╨╛╨╜ ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨╗╨╕╨╜╨╜╤Л╨╣').optional(),
  email: z.string().trim().email('╨Э╨╡╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ email').max(255, 'Email ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨╗╨╕╨╜╨╜╤Л╨╣'),
  subject: z.string().trim().max(200, '╨в╨╡╨╝╨░ ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨╗╨╕╨╜╨╜╨░╤П').optional(),
  message: z.string().trim().min(1, '╨Т╨▓╨╡╨┤╨╕╤В╨╡ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡').max(1000, '╨б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨╗╨╕╨╜╨╜╨╛╨╡'),
})

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }))
      }
    },
    [errors]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      try {
        const validated = contactSchema.parse(formData)
        
        await feedbackApi.submitFeedback({
          name: validated.name,
          email: validated.email,
          phone: validated.phone || undefined,
          subject: validated.subject || undefined,
          message: validated.message,
          source_page: 'contacts',
        })

        addToast({ type: 'success', message: '╨б╨┐╨░╤Б╨╕╨▒╨╛! ╨Т╨░╤И╨╡ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╨╛╤В╨┐╤А╨░╨▓╨╗╨╡╨╜╨╛.' })
        
        // ╨Ю╤З╨╕╤Б╤В╨║╨░ ╤Д╨╛╤А╨╝╤Л
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        })
        setErrors({})

        // ╨Ч╨░╨║╤А╤Л╤В╨╕╨╡ ╤Д╨╛╤А╨╝╤Л
        setTimeout(() => {
          onClose()
        }, 500)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message
            }
          })
          setErrors(fieldErrors)
        } else {
          console.error('Error submitting feedback:', error)
          addToast({ type: 'error', message: '╨Я╤А╨╛╨╕╨╖╨╛╤И╨╗╨░ ╨╛╤И╨╕╨▒╨║╨░. ╨Я╨╛╨┐╤А╨╛╨▒╤Г╨╣╤В╨╡ ╨┐╨╛╨╖╨╢╨╡.' })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, addToast, onClose]
  )

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Form Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>╨Ю╨▒╤А╨░╤В╨╜╨░╤П ╤Б╨▓╤П╨╖╤М</h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="╨Ч╨░╨║╤А╤Л╤В╤М"
              >
                ├Ч
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="╨Ш╨╝╤П *"
                  required
                  disabled={isSubmitting}
                />
                {errors.name && <p className={styles.error}>{errors.name}</p>}
              </div>

              <div className={styles.formGroup}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Email *"
                  required
                  disabled={isSubmitting}
                />
                {errors.email && <p className={styles.error}>{errors.email}</p>}
              </div>

              <div className={styles.formGroup}>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="╨в╨╡╨╗╨╡╤Д╨╛╨╜"
                  disabled={isSubmitting}
                />
                {errors.phone && <p className={styles.error}>{errors.phone}</p>}
              </div>

              <div className={styles.formGroup}>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="╨б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ *"
                  rows={5}
                  required
                  disabled={isSubmitting}
                />
                {errors.message && <p className={styles.error}>{errors.message}</p>}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  ╨Ю╤В╨╝╨╡╨╜╨░
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '╨Ю╤В╨┐╤А╨░╨▓╨║╨░...' : '╨Ю╤В╨┐╤А╨░╨▓╨╕╤В╤М'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Render modal in portal to ensure it's above all content
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

