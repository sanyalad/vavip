import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import styles from './NotFound.module.css'

export default function NotFoundPage() {
  return (
    <motion.div
      className={styles.notFound}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>╨б╤В╤А╨░╨╜╨╕╤Ж╨░ ╨╜╨╡ ╨╜╨░╨╣╨┤╨╡╨╜╨░</h2>
        <p className={styles.text}>
          ╨Ъ ╤Б╨╛╨╢╨░╨╗╨╡╨╜╨╕╤О, ╨╖╨░╨┐╤А╨░╤И╨╕╨▓╨░╨╡╨╝╨░╤П ╤Б╤В╤А╨░╨╜╨╕╤Ж╨░ ╨╜╨╡ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╨╡╤В ╨╕╨╗╨╕ ╨▒╤Л╨╗╨░ ╤Г╨┤╨░╨╗╨╡╨╜╨░.
        </p>
        <Link to="/">
          <Button>╨Т╨╡╤А╨╜╤Г╤В╤М╤Б╤П ╨╜╨░ ╨│╨╗╨░╨▓╨╜╤Г╤О</Button>
        </Link>
      </div>
    </motion.div>
  )
}












