import { useState, useRef, useCallback } from 'react'
import { AuroraBackground } from '@/components/animations/AuroraBackground'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { FeedbackForm } from '@/components/FeedbackForm'
import Footer from '@/components/layout/Footer'
import { useGSAPPageTransition } from '@/hooks/useGSAPPageTransition'
import { useFooterDrawer } from '@/hooks/useFooterDrawer'
import { handlePhoneClick as handlePhoneClickUtil } from '@/utils/phone'
import { useUIStore } from '@/store/uiStore'
import { phoneNumber, phoneNumberClean, workingHours, socialLinks } from '@/config/contacts'
import styles from './Contacts.module.css'

export default function ContactsPage() {
  const { addToast } = useUIStore()
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  // Footer drawer management
  const { isFooterOpen, closeFooter } = useFooterDrawer()
  useGSAPPageTransition(pageRef, {
    duration: 0.3,
    ease: 'power1.out',
    fromOpacity: 0,
    toOpacity: 1,
  })


  // Handle phone click
  const handlePhoneClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      await handlePhoneClickUtil(e, {
        phoneNumber,
        phoneNumberClean,
        onSuccess: (message) => addToast({ type: 'success', message }),
      })
    },
    [addToast]
  )

  return (
    <div ref={pageRef} className={`${styles.contactsPage} ${isFooterOpen ? styles.footerOpen : ''}`}>
      {/* Aurora Background */}
      <AuroraBackground />

      {/* Page Title */}
      <h1 className={styles.pageTitle}>╨Ъ╨╛╨╜╤В╨░╨║╤В╤Л</h1>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.twoColumnLayout}>
          {/* Left Block - Contacts */}
          <div className={styles.leftBlock}>
            <div className={styles.contentWrapper}>
              <a
                href={`tel:${phoneNumberClean}`}
                onClick={handlePhoneClick}
                className={styles.phoneNumber}
              >
                {phoneNumber}
              </a>

              <p className={styles.blockDescription}>{workingHours}</p>

              <div className={styles.actions}>
              <MagneticButton
                  variant="pill"
                  size="md"
                  onClick={() => setContactModalOpen(true)}
                >
                  ╨Ю╨▒╤А╨░╤В╨╜╨░╤П ╤Б╨▓╤П╨╖╤М
                </MagneticButton>

                <div className={styles.socialIcons}>
                  {socialLinks.map(({ name, url }) => (
                    <a
                      key={name}
                      href={url}
                      className={styles.socialIcon}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                    >
                      <img src={`/images/icons/${name}.svg`} alt={name} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Block - Offices */}
          <div className={styles.rightBlock}>
            <div className={styles.contentWrapper}>
              <a
                href="#"
                className={styles.phoneNumber}
                onClick={(e) => e.preventDefault()}
              >
                ╨б╨░╨╜╨║╤В-╨Я╨╡╤В╨╡╤А╨▒╤Г╤А╨│, ╤Г╨╗. ╨Я╤А╨╕╨╝╨╡╤А╨╜╨░╤П, ╨┤. 1
              </a>

              <p className={styles.blockDescription}>
                ╨Я╨╛╤Б╨╡╤В╨╕╤В╨╡ ╨╜╨░╤И╨╕ ╨╛╤Д╨╕╤Б╤Л ╨┤╨╗╤П ╨╗╨╕╤З╨╜╨╛╨╣ ╨║╨╛╨╜╤Б╤Г╨╗╤М╤В╨░╤Ж╨╕╨╕ ╨╕ ╨╛╤Д╨╛╤А╨╝╨╗╨╡╨╜╨╕╤П ╨╖╨░╨║╨░╨╖╨░
              </p>

              <div className={styles.actions}>
              <MagneticButton variant="pill-outline" size="md">
                  ╨Т╤Б╨╡ ╨╛╤Д╨╕╤Б╤Л
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Overlay */}
      <Footer onClose={closeFooter} isOpen={isFooterOpen} />

      {/* Contact Modal */}
      <FeedbackForm
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  )
}
