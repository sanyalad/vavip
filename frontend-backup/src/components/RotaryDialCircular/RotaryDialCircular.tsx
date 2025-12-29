import { useRef, useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import styles from './RotaryDialCircular.module.css'

interface RotaryDialCircularProps {
  phoneNumber: string
  onDigitClick?: (digit: string) => void
}

export function RotaryDialCircular({
  phoneNumber = '+7 (999) 123-45-67',
  onDigitClick,
}: RotaryDialCircularProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dialPlateRef = useRef<HTMLDivElement>(null)

  const [rotation, setRotation] = useState(0) // ╨Т ╨│╤А╨░╨┤╤Г╤Б╨░╤Е
  const [isDragging, setIsDragging] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [_dragVelocity, setDragVelocity] = useState(0)

  // Refs ╨┤╨╗╤П ╨┤╤А╨░╨│╨░
  const dragStartRef = useRef({ angle: 0, rotation: 0, time: 0 })
  const dragLastRef = useRef({ angle: 0, time: 0 })
  const returnRafRef = useRef<number | null>(null)

  // ╨Ш╨╖╨▓╨╗╨╡╨║╨░╨╡╨╝ ╤В╨╛╨╗╤М╨║╨╛ ╤Ж╨╕╤Д╤А╤Л (10 ╤Ж╨╕╤Д╤А = 0-9)
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  // === ANGULAR POSITIONING ===

  /**
   * ╨г╨│╨╛╨╗ ╨║╨╜╨╛╨┐╨║╨╕ ╨╜╨░ ╨┤╨╕╨░╨╗╨╡
   * 0┬░ = ╨▓╨▓╨╡╤А╤Е╤Г (12 ╤З╨░╤Б╨╛╨▓)
   * 36┬░ = ╤Б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨║╨╜╨╛╨┐╨║╨░ (╨┐╨╛ ╤З╨░╤Б╨╛╨▓╨╛╨╣)
   */
  const getButtonAngle = useCallback((index: number): number => {
    return (index * 36) % 360
  }, [])

  /**
   * ╨Ъ╨░╨║╨░╤П ╤Ж╨╕╤Д╤А╨░ ╨╜╨░╤Е╨╛╨┤╨╕╤В╤Б╤П ╨▓ "╨╛╨║╨╜╨╡" (╨▓╨▓╨╡╤А╤Е╤Г, ╨▓ ╨┐╨╛╨╖╨╕╤Ж╨╕╨╕ 0┬░)
   */
  const getSelectedDigit = useCallback(
    (currentRotation: number): { digit: string; index: number } => {
      let closestIndex = 0
      let closestDiff = Infinity

      digits.forEach((_digit, idx) => {
        const buttonAngle = getButtonAngle(idx)
        // ╨Э╨╛╤А╨╝╨░╨╗╨╕╨╖╤Г╨╡╨╝ ╤Г╨│╨╛╨╗ ╤Б ╤Г╤З╨╡╤В╨╛╨╝ ╨▓╤А╨░╤Й╨╡╨╜╨╕╤П
        let diff = Math.abs(((buttonAngle - currentRotation) % 360 + 360) % 360)
        // ╨Ъ╤А╨░╤В╤З╨░╨╣╤И╨╡╨╡ ╤А╨░╤Б╤Б╤В╨╛╤П╨╜╨╕╨╡ (╨╜╨╡ ╨▒╨╛╨╗╨╡╨╡ 180┬░)
        if (diff > 180) diff = 360 - diff

        if (diff < closestDiff) {
          closestDiff = diff
          closestIndex = idx
        }
      })

      return { digit: digits[closestIndex], index: closestIndex }
    },
    [digits, getButtonAngle]
  )

  /**
   * ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╤Г╨│╨╛╨╗ ╨╛╤В ╤Ж╨╡╨╜╤В╤А╨░ ╨║╨╛╨╜╤В╨╡╨╣╨╜╨╡╤А╨░ ╨┤╨╛ ╤В╨╛╤З╨║╨╕
   */
  const getAngleFromCenter = useCallback(
    (x: number, y: number): number => {
      if (!containerRef.current) return 0

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const dx = x - (rect.left + centerX)
      const dy = y - (rect.top + centerY)

      // atan2 ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В ╤Г╨│╨╗╤Л ╨▓ ╨┤╨╕╨░╨┐╨░╨╖╨╛╨╜╨╡ [-╧А, ╧А]
      // ╨Я╤А╨╡╨╛╨▒╤А╨░╨╖╤Г╨╡╨╝ ╨▓ [0, 360) ╨╕ ╨╜╨╛╤А╨╝╨░╨╗╨╕╨╖╤Г╨╡╨╝ (0┬░ = ╨▓╨▓╨╡╤А╤Е╤Г)
      let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
      if (angle < 0) angle += 360

      return angle
    },
    []
  )

  /**
   * SPRING PHYSICS RETURN - ╨║╨░╨║ ╨╜╨░ ╨╜╨░╤Б╤В╨╛╤П╤Й╨╡╨╝ ╤А╨╛╤В╨░╤А╨╜╨╛╨╝ ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨╡
   * 
   * ╨б╨╕╤Б╤В╨╡╨╝╨░ ╤А╨░╨▒╨╛╤В╨░╨╡╤В ╤В╨░╨║:
   * 1. currentRotation тЖТ targetRotation (36┬░ ╤И╨░╨│)
   * 2. ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╤А╨░╨╖╨╜╨╕╤Ж╤Г (delta)
   * 3. ╨Я╤А╨╕╨╝╨╡╨╜╤П╨╡╨╝ spring force: force = -spring * delta - damping * velocity
   * 4. ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ velocity ╨╕ position
   * 5. ╨Ч╨░╤В╤Г╤Е╨░╨╡╨╝ ╨┐╨╛╨║╨░ ╨╜╨╡ ╨┤╨╛╤Б╤В╨╕╨│╨╜╨╡╨╝ ╤Ж╨╡╨╗╨╡╨▓╨╛╨╣ ╨┐╨╛╨╖╨╕╤Ж╨╕╨╕
   */
  const returnToHome = useCallback(() => {
    if (returnRafRef.current) {
      cancelAnimationFrame(returnRafRef.current)
    }

    setIsReturning(true)

    // ╨Ю╨┐╤А╨╡╨┤╨╡╨╗╤П╨╡╨╝ ╤Ж╨╡╨╗╨╡╨▓╨╛╨╣ ╤Г╨│╨╛╨╗ (snap ╨╜╨░ ╨▒╨╗╨╕╨╢╨░╨╣╤И╤Г╤О ╤Ж╨╕╤Д╤А╤Г, ╨║╤А╨░╤В╨╜╨╛ 36┬░)
    const selectedIndex = getSelectedDigit(rotation).index
    const targetRotation = selectedIndex * 36

    // Spring physics parameters
    const springStiffness = 0.25  // ╨Ц╨╡╤Б╤В╨║╨╛╤Б╤В╤М ╨┐╤А╤Г╨╢╨╕╨╜╤Л (╨▓╤Л╤И╨╡ = ╨▒╤Л╤Б╤В╤А╨╡╨╡ ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В╤Б╤П)
    const dampingRatio = 0.55     // ╨Ф╨╡╨╝╨┐╤Д╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ (╨▓╤Л╤И╨╡ = ╨╝╨╡╨╜╤М╤И╨╡ ╨┐╤А╤Г╨╢╨╕╨╜╨╕╤В)

    // ╨Э╨░╤З╨░╨╗╤М╨╜╤Л╨╡ ╤Г╤Б╨╗╨╛╨▓╨╕╤П
    let currentRot = rotation
    let currentVel = 0  // ╨в╨╡╨║╤Г╤Й╨░╤П ╤Б╨║╨╛╤А╨╛╤Б╤В╤М ╨▓╤А╨░╤Й╨╡╨╜╨╕╤П

    const animate = () => {
      const dt = 16 / 1000  // ╨Я╤А╨╕╨╝╨╡╤А╨╜╨╛ 60fps = 16ms

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╨▓╨╡╨║╤В╨╛╤А ╨║ ╤Ж╨╡╨╗╨╕ (╨║╤А╨░╤В╤З╨░╨╣╤И╨╕╨╣ ╨┐╤Г╤В╤М)
      let delta = targetRotation - currentRot
      
      // ╨Э╨╛╤А╨╝╨░╨╗╨╕╨╖╤Г╨╡╨╝ ╨▓ ╨┤╨╕╨░╨┐╨░╨╖╨╛╨╜ [-180, 180] ╨┤╨╗╤П ╨║╤А╨░╤В╤З╨░╨╣╤И╨╡╨│╨╛ ╨┐╤Г╤В╨╕
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360

      // Spring force (╨┐╤А╨╕╤В╤П╨│╨╕╨▓╨░╨╡╤В ╨║ ╤Ж╨╡╨╗╨╕)
      const springForce = -springStiffness * delta

      // Damping force (╤Б╨╛╨┐╤А╨╛╤В╨╕╨▓╨╗╨╡╨╜╨╕╨╡ ╨┤╨▓╨╕╨╢╨╡╨╜╨╕╤О)
      const dampingForce = -dampingRatio * currentVel

      // ╨Ш╤В╨╛╨│╨╛╨▓╨░╤П ╤Б╨╕╨╗╨░
      const totalForce = springForce + dampingForce

      // ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╤Б╨║╨╛╤А╨╛╤Б╤В╤М (F = ma, a = F/m, v = v + a*t)
      currentVel += totalForce * dt

      // ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╨┐╨╛╨╖╨╕╤Ж╨╕╤О
      currentRot += currentVel * dt

      // ╨Э╨╛╤А╨╝╨░╨╗╨╕╨╖╤Г╨╡╨╝ rotation ╨▓ ╨┤╨╕╨░╨┐╨░╨╖╨╛╨╜ [0, 360)
      currentRot = ((currentRot % 360) + 360) % 360

      setRotation(currentRot)

      // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Б╤Е╨╛╨┤╨╕╨╝╨╛╤Б╤В╤М (╨║╨╛╨│╨┤╨░ ╨┤╨▓╨╕╨╢╨╡╨╜╨╕╨╡ ╨┐╤А╨░╨║╤В╨╕╤З╨╡╤Б╨║╨╕ ╨┐╤А╨╡╨║╤А╨░╤В╨╕╨╗╨╛╤Б╤М)
      const positionError = Math.abs(delta)
      const velocityError = Math.abs(currentVel)

      // ╨Х╤Б╨╗╨╕ ╨╛╤В╨║╨╗╨╛╨╜╨╡╨╜╨╕╨╡ ╨╕ ╤Б╨║╨╛╤А╨╛╤Б╤В╤М ╨┤╨╛╤Б╤В╨░╤В╨╛╤З╨╜╨╛ ╨╝╨░╨╗╤Л - ╨╖╨░╨▓╨╡╤А╤И╨░╨╡╨╝
      if (positionError < 0.1 && velocityError < 0.1) {
        setRotation(targetRotation)
        setIsReturning(false)
        const { digit } = getSelectedDigit(targetRotation)
        onDigitClick?.(digit)
        return
      }

      returnRafRef.current = requestAnimationFrame(animate)
    }

    returnRafRef.current = requestAnimationFrame(animate)
  }, [rotation, getSelectedDigit, onDigitClick])

  // === POINTER DOWN ===
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReturning) return

      setIsDragging(true)
      const angle = getAngleFromCenter(e.clientX, e.clientY)

      dragStartRef.current = {
        angle,
        rotation,
        time: performance.now(),
      }

      dragLastRef.current = {
        angle,
        time: performance.now(),
      }

      if (returnRafRef.current) {
        cancelAnimationFrame(returnRafRef.current)
        returnRafRef.current = null
      }
    },
    [rotation, isReturning, getAngleFromCenter]
  )

  // === POINTER MOVE ===
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return

      const currentAngle = getAngleFromCenter(e.clientX, e.clientY)
      const deltaAngle = currentAngle - dragStartRef.current.angle

      // ╨Э╨╛╨▓╤Л╨╣ ╨┐╨╛╨▓╨╛╤А╨╛╤В ╨┤╨╕╨░╨╗╨░
      const newRotation = dragStartRef.current.rotation + deltaAngle

      // ╨Ю╨│╤А╨░╨╜╨╕╤З╨╕╨▓╨░╨╡╨╝ ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╤Г╤Е╨╛╨┤╨╕╨╗╨╛ ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨░╨╗╨╡╨║╨╛ (max 2 full rotations)
      const clampedRotation =
        newRotation % 360 < 0
          ? ((newRotation % 360) + 360) % 360
          : (newRotation % 360)

      setRotation(clampedRotation)

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ velocity ╨┤╨╗╤П ╨▒╨╛╨╗╨╡╨╡ ╨┐╨╗╨░╨▓╨╜╨╛╨│╨╛ ╨▓╨╛╨╖╨▓╤А╨░╤В╨░
      const now = performance.now()
      const timeDelta = now - dragLastRef.current.time
      const angleDelta = Math.abs(currentAngle - dragLastRef.current.angle)

      if (timeDelta > 0 && timeDelta < 100) {
        setDragVelocity(angleDelta / timeDelta)
      }

      dragLastRef.current = { angle: currentAngle, time: now }
    },
    [isDragging, getAngleFromCenter]
  )

  // === POINTER UP ===
  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return

      setIsDragging(false)
      // ╨Ч╨░╨┐╤Г╤Б╨║╨░╨╡╨╝ ╨▓╨╛╨╖╨▓╤А╨░╤В ╤Б spring physics (dragVelocity ╨▒╨╛╨╗╤М╤И╨╡ ╨╜╨╡ ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В╤Б╤П)
      returnToHome()
    },
    [isDragging, returnToHome]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (returnRafRef.current) {
        cancelAnimationFrame(returnRafRef.current)
      }
    }
  }, [])

  const selectedDigit = getSelectedDigit(rotation)

  return (
    <div className={styles.container}>
      {/* ╨Ы╨Х╨Т╨Р╨п ╨Ъ╨Ю╨Ы╨Ю╨Э╨Ъ╨Р - ╨ж╨Ш╨д╨Х╨а╨С╨Ы╨Р╨в */}
      <div className={styles.dialSection}>
        <div
          className={styles.dialWrapper}
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className={styles.dialFrame}>
            {/* ╨Ш╨╜╨┤╨╕╨║╨░╤В╨╛╤А ╨▓╨▓╨╡╤А╤Е╤Г */}
            <div className={styles.selectionIndicator} />

            {/* ╨Т╤А╨░╤Й╨░╤О╤Й╨╕╨╣╤Б╤П ╨┤╨╕╨░╨╗ */}
            <div
              className={clsx(styles.dialPlate, {
                [styles.dragging]: isDragging,
                [styles.returning]: isReturning,
              })}
              ref={dialPlateRef}
              style={{
                '--rotation': `${rotation}deg`,
              } as React.CSSProperties}
            >
              {/* ╨Ъ╨╜╨╛╨┐╨║╨╕-╨║╤А╤Г╨╢╨║╨╕ */}
              {digits.map((digit, idx) => {
                const isSelected = selectedDigit.digit === digit
                const buttonAngle = getButtonAngle(idx)

                return (
                  <button
                    key={idx}
                    className={clsx(styles.dialButton, {
                      [styles.selected]: isSelected,
                    })}
                    style={{
                      '--button-angle': `${buttonAngle}deg`,
                    } as React.CSSProperties}
                    disabled={isDragging || isReturning}
                    aria-label={`Digit ${digit}`}
                  >
                    <span className={styles.digitText}>{digit}</span>
                  </button>
                )
              })}

              {/* ╨ж╨╡╨╜╤В╤А╨░╨╗╤М╨╜╤Л╨╣ ╤И╤В╨╕╤Д╤В */}
              <div className={styles.centerPin} />
            </div>
          </div>
        </div>
      </div>

      {/* ╨Я╨а╨Р╨Т╨Р╨п ╨Ъ╨Ю╨Ы╨Ю╨Э╨Ъ╨Р - ╨Ъ╨Ю╨Э╨в╨Х╨Э╨в */}
      <div className={styles.contentSection}>
        <div className={styles.phoneNumber}>{phoneNumber}</div>
        <div className={styles.hint}>╨Ъ╤А╤Г╤В╨╕╤В╨╡ ╨┤╨╕╨░╨╗</div>
      </div>
    </div>
  )
}

