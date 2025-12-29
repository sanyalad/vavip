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
  { label: 'ПОЛИТИКА ОБРАБОТКИ И ЗАЩИТЫ ПЕРСОНАЛЬНЫХ ДАННЫХ И ИСПОЛЬЗОВАНИЯ COOKIE', path: '/privacy' },
  { label: 'ДОГОВОР ОФЕРТЫ BIM', path: '/terms' },
  { label: 'ГАРАНТИЯ', path: '/warranty' },
  { label: 'ДОГОВОР НА ПРОЕКТИРОВАНИЕ BIM/ПРОЕКТИРОВАНИЕ ИНЖЕНЕРНЫХ СИСТЕМ', path: '/bim-contract' },
]

const cooperationLinks = [
  { label: 'ДИЗАЙНЕРАМ И АРХИТЕКТОРАМ', path: '/for-designers' },
  { label: 'РУКОВОДИТЕЛЯМ СТРОИТЕЛЬНЫХ КОМПАНИЙ И ПРОЕКТИРОВАНИЮ BIM/ОВ', path: '/for-builders' },
  { label: 'ДИСТРИБЬЮТОРАМ', path: '/for-distributors' },
  { label: 'ДЛЯ ВИЗУАЛА', path: '/for-visual' },
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
            <div className={styles.columns} aria-label="Ссылки">
              <motion.div className={styles.column} variants={columnVariants}>
                <motion.strong variants={linkVariants}>КОНФИДЕНЦИАЛЬНОСТЬ И УСЛОВИЯ</motion.strong>
                {privacyLinks.map(({ label, path }) => (
                  <motion.div key={path} variants={linkVariants}>
                    <Link to={path}>{label}</Link>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div className={styles.column} variants={columnVariants}>
                <motion.strong variants={linkVariants}>СОТРУДНИЧЕСТВО</motion.strong>
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
                  aria-label="Социальные сети"
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
                © 2024 VAVIP. All Rights Reserved
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </>
  )
}
