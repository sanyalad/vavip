import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './Footer.module.css'

const socialLinks = [
  { name: 'telegram', url: 'https://t.me/karen_vavip' },
  { name: 'instagram', url: 'https://instagram.com/karen_vavip' },
  { name: 'vk', url: 'https://vk.com/karen_vavip' },
  { name: 'pinterest', url: 'https://pinterest.com/karen_vavip' },
  { name: 'youtube', url: 'https://youtube.com/@karenvavip' },
]

// Footer links based on screenshot
const privacyLinks = [
  { label: '╨Я╨Ю╨Ы╨Ш╨в╨Ш╨Ъ╨Р ╨Ю╨С╨а╨Р╨С╨Ю╨в╨Ъ╨Ш ╨Ш ╨Ч╨Р╨й╨Ш╨в╨л ╨Я╨Х╨а╨б╨Ю╨Э╨Р╨Ы╨м╨Э╨л╨е ╨Ф╨Р╨Э╨Э╨л╨е ╨Ш ╨Ш╨б╨Я╨Ю╨Ы╨м╨Ч╨Ю╨Т╨Р╨Э╨Ш╨п COOKIE', path: '/privacy' },
  { label: '╨Ф╨Ю╨У╨Ю╨Т╨Ю╨а ╨Ю╨д╨Х╨а╨в╨л BIM', path: '/terms' },
  { label: '╨У╨Р╨а╨Р╨Э╨в╨Ш╨п', path: '/warranty' },
  { label: '╨Ф╨Ю╨У╨Ю╨Т╨Ю╨а ╨Э╨Р ╨Я╨а╨Ю╨Х╨Ъ╨в╨Ш╨а╨Ю╨Т╨Р╨Э╨Ш╨Х BIM/╨Я╨а╨Ю╨Х╨Ъ╨в╨Ш╨а╨Ю╨Т╨Р╨Э╨Ш╨Х ╨Ш╨Э╨Ц╨Х╨Э╨Х╨а╨Э╨л╨е ╨б╨Ш╨б╨в╨Х╨Ь', path: '/bim-contract' },
]

const cooperationLinks = [
  { label: '╨Ф╨Ш╨Ч╨Р╨Щ╨Э╨Х╨а╨Р╨Ь ╨Ш ╨Р╨а╨е╨Ш╨в╨Х╨Ъ╨в╨Ю╨а╨Р╨Ь', path: '/for-designers' },
  { label: '╨а╨г╨Ъ╨Ю╨Т╨Ю╨Ф╨Ш╨в╨Х╨Ы╨п╨Ь ╨б╨в╨а╨Ю╨Ш╨в╨Х╨Ы╨м╨Э╨л╨е ╨Ъ╨Ю╨Ь╨Я╨Р╨Э╨Ш╨Щ ╨Ш ╨Я╨а╨Ю╨Х╨Ъ╨в╨Ш╨а╨Ю╨Т╨Р╨Э╨Ш╨о BIM/╨Ю╨Т', path: '/for-builders' },
  { label: '╨Ф╨Ш╨б╨в╨а╨Ш╨С╨м╨о╨в╨Ю╨а╨Р╨Ь', path: '/for-distributors' },
  { label: '╨Ф╨Ы╨п ╨Т╨Ш╨Ч╨г╨Р╨Ы╨Р', path: '/for-visual' },
]

const columnVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const linkVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
}

const socialVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

interface FooterProps {
  slideIn?: boolean
  onClose?: () => void
  isOpen?: boolean
}

export default function Footer({ slideIn = false, onClose, isOpen = false }: FooterProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        data-footer-backdrop
        className={styles.backdrop}
        onClick={onClose}
      />

      {/* Footer */}
      <footer
        data-footer
        className={`${styles.footer} ${slideIn ? styles.slideIn : ''} ${isOpen ? styles.drawerOpen : ''}`}
      >
        <motion.div
          className={styles.inner}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className={styles.footerContent}>
            <div className={styles.columns} aria-label="╨б╤Б╤Л╨╗╨║╨╕">
              <motion.div className={styles.column} variants={columnVariants}>
                <motion.strong variants={linkVariants}>╨Ъ╨Ю╨Э╨д╨Ш╨Ф╨Х╨Э╨ж╨Ш╨Р╨Ы╨м╨Э╨Ю╨б╨в╨м ╨Ш ╨г╨б╨Ы╨Ю╨Т╨Ш╨п</motion.strong>
                {privacyLinks.map(({ label, path }) => (
                  <motion.div key={path} variants={linkVariants}>
                    <Link to={path}>{label}</Link>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div className={styles.column} variants={columnVariants}>
                <motion.strong variants={linkVariants}>╨б╨Ю╨в╨а╨г╨Ф╨Э╨Ш╨з╨Х╨б╨в╨Т╨Ю</motion.strong>
                {cooperationLinks.map(({ label, path }) => (
                  <motion.div key={path} variants={linkVariants}>
                    <Link to={path}>{label}</Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className={styles.footerDivider}
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: 'left' }}
            />

            <motion.div
              className={styles.footerBottomWrapper}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className={styles.footerBottom}>
                <motion.div
                  className={styles.verticalTextFooter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <img src="/images/vavip_logo_text.png" alt="Vavip" />
                </motion.div>
                <motion.div
                  className={styles.socialIcons}
                  aria-label="╨б╨╛╤Ж╨╕╨░╨╗╤М╨╜╤Л╨╡ ╤Б╨╡╤В╨╕"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {socialLinks.map(({ name, url }, index) => (
                    <motion.a
                      key={name}
                      href={url}
                      className={styles.socialIcon}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      variants={socialVariants}
                      whileHover={{
                        scale: 1.15,
                        y: -3,
                        boxShadow: '0 6px 20px rgba(255, 255, 255, 0.15)',
                      }}
                      whileTap={{ scale: 0.95 }}
                      custom={index}
                    >
                      <img src={`/images/icons/${name}.svg`} alt="" aria-hidden="true" />
                    </motion.a>
                  ))}
                </motion.div>
              </div>
              <motion.div
                className={styles.copyrightText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                ┬й 2024 VAVIP. All Rights Reserved
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </>
  )
}
