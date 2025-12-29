import { useRef, useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import styles from './RotaryDial.module.css'

interface RotaryDialProps {
  phoneNumber: string
  onDigitClick?: (digit: string) => void
  interactive?: boolean
}

export function RotaryDial({
  phoneNumber = '+7 (999) 123-45-67',
  onDigitClick,
  interactive = true,
}: RotaryDialProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [rotation, setRotation] = useState(0)
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragVelocity, setDragVelocity] = useState(0)

  // Refs ╨┤╨╗╤П ╨┤╤А╨░╨│╨░
  const dragStartRef = useRef({ x: 0, y: 0, rotation: 0 })
  const dragLastRef = useRef({ x: 0, y: 0, time: 0 })
  const dragRafRef = useRef<number | null>(null)
  const inertiaRafRef = useRef<number | null>(null)

  // ╨Ш╨╖╨▓╨╗╨╡╨║╨░╨╡╨╝ ╤В╨╛╨╗╤М╨║╨╛ ╤Ж╨╕╤Д╤А╤Л
  const digits = phoneNumber.replace(/\D/g, '').split('')

  // ╨Ъ╨░╨╢╨┤╨╛╨╣ ╤Ж╨╕╤Д╤А╨╡ ╤Б╨▓╨╛╨╣ angle (0-9)
  const getRotationAngle = (digit: string): number => {
    const num = parseInt(digit)
    return (num * 36) % 360
  }

  // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╨▒╨╗╨╕╨╢╨░╨╣╤И╤Г╤О ╤Ж╨╕╤Д╤А╤Г ╨╜╨░ ╨╛╤Б╨╜╨╛╨▓╨╡ ╤В╨╡╨║╤Г╤Й╨╡╨│╨╛ ╨┐╨╛╨▓╨╛╤А╨╛╤В╨░
  const getClosestDigitAngle = useCallback(
    (currentRotation: number): { angle: number; digit: string } => {
      const normalized = ((currentRotation % 360) + 360) % 360

      let closestDiff = Infinity
      let closestAngle = 0
      let closestDigit = '0'

      digits.forEach((digit) => {
        const angle = getRotationAngle(digit)
        let diff = Math.abs(angle - normalized)

        // ╨г╤З╨╕╤В╤Л╨▓╨░╨╡╨╝ ╨╛╨▒╨╡╤А╤В╤Л╨▓╨░╨╜╨╕╨╡ (╨╜╨░╨┐╤А╨╕╨╝╨╡╤А, 350┬░ ╨▒╨╗╨╕╨╖╨║╨╛ ╨║ 0┬░)
        if (diff > 180) {
          diff = 360 - diff
        }

        if (diff < closestDiff) {
          closestDiff = diff
          closestAngle = angle
          closestDigit = digit
        }
      })

      return { angle: closestAngle, digit: closestDigit }
    },
    [digits]
  )

  // Snap to nearest digit (╤Б ╤Н╤Д╤Д╨╡╨║╤В╨╛╨╝ ╤Б╤В╨░╤А╨╛╨│╨╛ ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨░)
  const snapToNearestDigit = useCallback(
    (currentRotation: number, velocity: number = 0) => {
      const { angle, digit } = getClosestDigitAngle(currentRotation)

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╨║╤А╨░╤В╤З╨░╨╣╤И╨╕╨╣ ╨┐╤Г╤В╤М
      let deltaRotation = angle - (currentRotation % 360)
      if (deltaRotation > 180) {
        deltaRotation -= 360
      } else if (deltaRotation < -180) {
        deltaRotation += 360
      }

      // targetRotation is implicitly: currentRotation + deltaRotation
      setIsAnimating(true)
      setSelectedDigit(digit)

      // Easing: ease-out-cubic ╨┤╨╗╤П ╨╜╨░╤В╤Г╤А╨░╨╗╤М╨╜╨╛╨│╨╛ feel
      const startTime = performance.now()
      const duration = 300 + Math.abs(velocity) * 100 // ╨з╨╡╨╝ ╨▒╤Л╤Б╤В╤А╨╡╨╡ ╨┤╤А╨░╨│, ╤В╨╡╨╝ ╨▒╤Л╤Б╤В╤А╨╡╨╡ snap
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutCubic(progress)

        const currentRotationValue = currentRotation + deltaRotation * eased
        setRotation(currentRotationValue)

        if (progress < 1) {
          dragRafRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          setIsDragging(false)
          onDigitClick?.(digit)
        }
      }

      dragRafRef.current = requestAnimationFrame(animate)
    },
    [getClosestDigitAngle, onDigitClick]
  )

  // Inertia decay (╨║╨╛╨│╨┤╨░ ╨╛╤В╨┐╤Г╤Б╤В╨╕╨╗╨╕ ╨╝╤Л╤И╨║╤Г ╤Б velocity)
  const applyInertia = useCallback(
    (velocity: number, currentRotation: number) => {
      if (Math.abs(velocity) < 0.5) {
        snapToNearestDigit(currentRotation, velocity)
        return
      }

      let currentVel = velocity
      let currentRot = currentRotation

      const inertiaLoop = (_time: number) => {
        if (!inertiaRafRef.current) return

        // Decay coefficient (╤В╤А╨╡╨╜╨╕╨╡)
        const decay = 0.92
        currentVel *= decay

        // ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╨┐╨╛╨▓╨╛╤А╨╛╤В
        currentRot += currentVel

        setRotation(currentRot)

        // ╨Х╤Б╨╗╨╕ ╤Б╨║╨╛╤А╨╛╤Б╤В╤М ╤Г╨┐╨░╨╗╨░ ╨╜╨╕╨╢╨╡ ╨┐╨╛╤А╨╛╨│╨░ - snap to digit
        if (Math.abs(currentVel) < 0.5) {
          snapToNearestDigit(currentRot, 0)
          return
        }

        inertiaRafRef.current = requestAnimationFrame(inertiaLoop)
      }

      inertiaRafRef.current = requestAnimationFrame(inertiaLoop)
    },
    [snapToNearestDigit]
  )

  // === MOUSE/TOUCH EVENTS ===

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || isAnimating) return

      setIsDragging(true)

      // ╨Ю╤В╨╝╨╡╨╜╤П╨╡╨╝ ╨╗╤О╨▒╤Л╨╡ inertia animations
      if (inertiaRafRef.current) {
        cancelAnimationFrame(inertiaRafRef.current)
        inertiaRafRef.current = null
      }
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      // center calculated from rect for angle computation
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      dragStartRef.current = {
        x,
        y,
        rotation,
      }

      dragLastRef.current = {
        x,
        y,
        time: performance.now(),
      }

      setDragVelocity(0)
    },
    [interactive, isAnimating, rotation]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !interactive) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╤Г╨│╨╛╨╗ ╨╛╤В ╤Ж╨╡╨╜╤В╤А╨░
      const startAngle = Math.atan2(
        dragStartRef.current.y - centerY,
        dragStartRef.current.x - centerX
      )
      const currentAngle = Math.atan2(y - centerY, x - centerX)

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╨┤╨╡╨╗╤М╤В╨░ ╤Г╨│╨╗╨░ ╨▓ ╨│╤А╨░╨┤╤Г╤Б╨░╤Е
      let deltaAngle = (currentAngle - startAngle) * (180 / Math.PI)

      // ╨Я╤А╨╡╨╛╨▒╤А╨░╨╖╤Г╨╡╨╝ ╨▓ ╨┐╨╛╨╗╨╛╨╢╨╕╤В╨╡╨╗╤М╨╜╨╛╨╡ ╨╖╨╜╨░╤З╨╡╨╜╨╕╨╡ ╨┤╨╗╤П ╨┐╤А╨░╨▓╨╕╨╗╤М╨╜╨╛╨│╨╛ ╨╜╨░╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╤П
      // ╨Э╨░ ╤А╨╛╤В╨░╤А╨╜╨╛╨╝ ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨╡ ╨▓╤А╨░╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ ╤З╨░╤Б╨╛╨▓╨╛╨╣ ╤Б╤В╤А╨╡╨╗╨║╨╡ = ╨╛╨▒╤А╨░╤В╨╜╨╛╨╡ ╨╜╨░╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡
      // (╨┐╨╛╤В╨╛╨╝╤Г ╤З╤В╨╛ ╨┤╨╕╨░╨╗ "╨╛╤В╨▓╨╛╨┤╨╕╤В╤Б╤П" ╨╜╨░╨╖╨░╨┤ ╨┐╨╛╤Б╨╗╨╡ ╨╛╤В╨┐╤Г╤Б╨║╨░╨╜╨╕╤П)
      const newRotation = dragStartRef.current.rotation - deltaAngle

      setRotation(newRotation)

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ velocity
      const now = performance.now()
      const timeDelta = now - dragLastRef.current.time
      const distDelta = Math.hypot(x - dragLastRef.current.x, y - dragLastRef.current.y)

      if (timeDelta > 0) {
        const velocity = distDelta / timeDelta
        setDragVelocity(velocity)
      }

      dragLastRef.current = { x, y, time: now }
    },
    [isDragging, interactive]
  )

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return

      setIsDragging(false)

      // ╨Я╤А╨╕╨╝╨╡╨╜╤П╨╡╨╝ inertia ╤Б velocity
      const velocity = dragVelocity > 5 ? dragVelocity / 10 : 0 // ╨Э╨╛╤А╨╝╨░╨╗╨╕╨╖╤Г╨╡╨╝ velocity
      applyInertia(velocity, rotation)
    },
    [isDragging, dragVelocity, rotation, applyInertia]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current)
      if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current)
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.phoneNumber}>{phoneNumber}</div>

      <div
        className={styles.dialWrapper}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className={clsx(styles.dialPlate, {
            [styles.dragging]: isDragging,
            [styles.animating]: isAnimating,
          })}
          ref={dialRef}
          style={{
            '--dial-rotation': `${rotation}deg`,
          } as React.CSSProperties}
        >
          {/* ╨Т╨╜╨╡╤И╨╜╨╕╨╣ ╨║╤А╤Г╨│ ╤Б ╨╛╤Б╤В╨░╨╜╨╛╨▓╨║╨░╨╝╨╕ (╨╜╨╡╨┐╨╛╨┤╨▓╨╕╨╢╨╜╤Л╨╣) */}
          <div className={styles.dialStopsContainer}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className={styles.stop} />
            ))}
          </div>

          {/* ╨Ф╨╕╨░╨╗ ╤Б ╤Ж╨╕╤Д╤А╨░╨╝╨╕ (╨▓╤А╨░╤Й╨░╤О╤Й╨╕╨╣╤Б╤П) */}
          <div className={styles.dialInner}>
            {digits.map((digit, idx) => (
              <div
                key={idx}
                className={clsx(styles.dialDigit, {
                  [styles.selected]: selectedDigit === digit,
                })}
                style={{
                  '--digit-angle': `${getRotationAngle(digit)}deg`,
                } as React.CSSProperties}
              >
                <span className={styles.digitText}>{digit}</span>
              </div>
            ))}

            {/* ╨ж╨╡╨╜╤В╤А╨░╨╗╤М╨╜╤Л╨╣ ╤И╤В╨╕╤Д╤В */}
            <div className={styles.centerPin} />
          </div>

          {/* ╨Я╨░╨╗╨╡╤Ж-╨╛╨│╤А╨░╨╜╨╕╤З╨╕╤В╨╡╨╗╤М (╨╖╨░ ╨┐╤А╨╡╨┤╨╡╨╗╨░╨╝╨╕ ╨┤╨╕╨░╨╗╨░) */}
          <div className={styles.fingerStop} />
        </div>
      </div>

      {/* ╨Ш╨╜╤Б╤В╤А╤Г╨║╤Ж╨╕╤П */}
      <div className={styles.dialHint}>╨Я╨╛╤В╤П╨╜╨╕╤В╨╡ ╤Ж╨╕╤Д╨╡╤А╨▒╨╗╨░╤В</div>
    </div>
  )
}

