import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { openAuthDrawer, isAuthDrawerOpen } = useUIStore()
  const hasOpenedRef = useRef(false)

  const returnTo = useMemo(() => {
    const fromPath = (location.state as any)?.from?.pathname as string | undefined
    if (!fromPath) return '/'
    if (fromPath.startsWith('/checkout')) return '/cart'
    if (fromPath.startsWith('/account')) return '/'
    if (fromPath.startsWith('/dashboard')) return '/'
    if (fromPath === '/login' || fromPath === '/register') return '/'
    return fromPath
  }, [location.state])

  useEffect(() => {
    openAuthDrawer('register')
    hasOpenedRef.current = true
  }, [openAuthDrawer])

  useEffect(() => {
    if (!hasOpenedRef.current) return
    if (!isAuthDrawerOpen) {
      navigate(returnTo, { replace: true })
    }
  }, [isAuthDrawerOpen, navigate, returnTo])

  return (
    <div className={styles.auth}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>╨а╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П</h1>
            <p>╨Ю╨║╨╜╨╛ ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╨╕ ╨╛╤В╨║╤А╤Л╨╗╨╛╤Б╤М ╤Б╨┐╤А╨░╨▓╨░. ╨Х╤Б╨╗╨╕ ╨▓╤Л ╨╖╨░╨║╤А╤Л╨╗╨╕ ╨╡╨│╨╛ тАФ ╨╝╨╛╨╢╨╜╨╛ ╨╛╤В╨║╤А╤Л╤В╤М ╤Б╨╜╨╛╨▓╨░.</p>
          </div>
          <div className={styles.form}>
            <Button fullWidth onClick={() => openAuthDrawer('register')}>
              ╨Ю╤В╨║╤А╤Л╤В╤М ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤О
            </Button>
            <Link to="/" style={{ display: 'block' }}>
              <Button variant="ghost" fullWidth>
                ╨Э╨░ ╨│╨╗╨░╨▓╨╜╤Г╤О
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
