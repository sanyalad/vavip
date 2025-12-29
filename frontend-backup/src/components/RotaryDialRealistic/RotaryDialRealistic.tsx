import { useRef, useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import styles from './RotaryDialRealistic.module.css'

interface RotaryDialRealisticProps {
  phoneNumber: string
  onDigitClick?: (digit: string) => void
}

export function RotaryDialRealistic({
  phoneNumber = '+7 (999) 123-45-67',
  onDigitClick,
}: RotaryDialRealisticProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dialRef = useRef<HTMLDivElement>(null)

  const [offsetY, setOffsetY] = useState(0) // ╨б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ ╨╛╤Б╨╕ Y (╨▓╨▓╨╡╤А╤Е-╨▓╨╜╨╕╨╖)
  const [isDragging, setIsDragging] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [dragVelocity, setDragVelocity] = useState(0)

  // Refs ╨┤╨╗╤П ╨┤╤А╨░╨│╨░
  const dragStartRef = useRef({ y: 0, offsetY: 0 })
  const dragLastRef = useRef({ y: 0, time: 0 })
  const returnRafRef = useRef<number | null>(null)

  // ╨Ш╨╖╨▓╨╗╨╡╨║╨░╨╡╨╝ ╤В╨╛╨╗╤М╨║╨╛ ╤Ж╨╕╤Д╤А╤Л
  const digits = phoneNumber.replace(/\D/g, '').split('')

  // ╨Я╨╛╨╖╨╕╤Ж╨╕╤П ╨║╨░╨╢╨┤╨╛╨╣ ╨║╨╜╨╛╨┐╨║╨╕ ╨╜╨░ ╨╛╤Б╨╕ Y (╨▓ ╨┐╨╕╨║╤Б╨╡╨╗╤П╤Е ╨╛╤В ╤Ж╨╡╨╜╤В╤А╨░)
  // 0 ╨▓ ╤Ж╨╡╨╜╤В╤А╨╡, 1 ╨╜╨░ +70px, 2 ╨╜╨░ -70px, ╨╕ ╤В.╨┤.
  const getButtonPosition = useCallback(
    (index: number): number => {
      const centerIndex = Math.floor(digits.length / 2)
      return (index - centerIndex) * 70 // 70px ╨╝╨╡╨╢╨┤╤Г ╨║╨╜╨╛╨┐╨║╨░╨╝╨╕
    },
    [digits.length]
  )

  // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ ╨║╨░╨║╨░╤П ╤Ж╨╕╤Д╤А╨░ ╨▓ "╨╛╨║╨╜╨╡" (╨▓ ╤Ж╨╡╨╜╤В╤А╨╡ ╤Н╨║╤А╨░╨╜╨░)
  const getSelectedDigit = useCallback(
    (currentOffset: number): { digit: string; index: number } => {
      let closestIndex = 0
      let closestDiff = Infinity

      digits.forEach((_digit, idx) => {
        const buttonPos = getButtonPosition(idx)
        const diff = Math.abs(buttonPos + currentOffset) // buttonPos + offset = ╨┐╨╛╨╖╨╕╤Ж╨╕╤П ╨╜╨░ ╤Н╨║╤А╨░╨╜╨╡
        if (diff < closestDiff) {
          closestDiff = diff
          closestIndex = idx
        }
      })

      return { digit: digits[closestIndex], index: closestIndex }
    },
    [digits, getButtonPosition]
  )

  // === RETURN TO HOME (╤Г╤Б╨║╨╛╤А╨╡╨╜╨╜╨╛╨╡ ╨▓╨╛╨╖╤А╨░╤Й╨╡╨╜╨╕╨╡) ===
  const returnToHome = useCallback(
    (velocity: number = 0) => {
      if (returnRafRef.current) {
        cancelAnimationFrame(returnRafRef.current)
      }

      setIsReturning(true)
      const startTime = performance.now()
      const startOffset = offsetY
      const targetOffset = 0

      // ╨Х╤Б╨╗╨╕ ╨▒╤Л╨╗╨░ ╤Б╨║╨╛╤А╨╛╤Б╤В╤М - ╤Г╤З╨╕╤В╤Л╨▓╨░╨╡╨╝ ╨╡╤С ╨┤╨╗╤П ╨▒╨╛╨╗╨╡╨╡ ╨┤╨╛╨╗╨│╨╛╨│╨╛ ╨▓╨╛╨╖╨▓╤А╨░╤В╨░
      let duration = 400 + Math.abs(velocity) * 50

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutCubic(progress)

        const newOffset = startOffset + (targetOffset - startOffset) * eased
        setOffsetY(newOffset)

        if (progress < 1) {
          returnRafRef.current = requestAnimationFrame(animate)
        } else {
          setOffsetY(0)
          setIsReturning(false)
          // ╨Т╤Л╨╖╤Л╨▓╨░╨╡╨╝ callback ╤Б ╨▓╤Л╨▒╤А╨░╨╜╨╜╨╛╨╣ ╤Ж╨╕╤Д╤А╨╛╨╣ ╨┐╨╛╤Б╨╗╨╡ ╨▓╨╛╨╖╨▓╤А╨░╤В╨░
          const selected = getSelectedDigit(0)
          onDigitClick?.(selected.digit)
        }
      }

      returnRafRef.current = requestAnimationFrame(animate)
    },
    [offsetY, getSelectedDigit, onDigitClick]
  )

  // === POINTER DOWN ===
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReturning) return

      setIsDragging(true)

      dragStartRef.current = {
        y: e.clientY,
        offsetY,
      }

      dragLastRef.current = {
        y: e.clientY,
        time: performance.now(),
      }

      if (returnRafRef.current) {
        cancelAnimationFrame(returnRafRef.current)
        returnRafRef.current = null
      }
    },
    [offsetY, isReturning]
  )

  // === POINTER MOVE ===
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return

      const deltaY = e.clientY - dragStartRef.current.y
      const newOffset = dragStartRef.current.offsetY + deltaY

      // ╨Ю╨│╤А╨░╨╜╨╕╤З╨╕╨▓╨░╨╡╨╝ ╤Б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ (╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╤Г╤Е╨╛╨┤╨╕╨╗╨╛ ╤Б╨╗╨╕╤И╨║╨╛╨╝ ╨┤╨░╨╗╨╡╨║╨╛)
      const maxOffset = 300
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, newOffset))

      setOffsetY(clampedOffset)

      // ╨Т╤Л╤З╨╕╤Б╨╗╤П╨╡╨╝ velocity
      const now = performance.now()
      const timeDelta = now - dragLastRef.current.time
      const distDelta = Math.abs(e.clientY - dragLastRef.current.y)

      if (timeDelta > 0 && timeDelta < 100) {
        setDragVelocity(distDelta / timeDelta)
      }

      dragLastRef.current = { y: e.clientY, time: now }
    },
    [isDragging]
  )

  // === POINTER UP ===
  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return

      setIsDragging(false)

      // ╨Э╨░╤З╨╕╨╜╨░╨╡╨╝ ╨▓╨╛╨╖╨▓╤А╨░╤В ╤Б ╤Г╤З╨╡╤В╨╛╨╝ ╤Б╨║╨╛╤А╨╛╤Б╤В╨╕
      returnToHome(dragVelocity)
    },
    [isDragging, dragVelocity, returnToHome]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (returnRafRef.current) {
        cancelAnimationFrame(returnRafRef.current)
      }
    }
  }, [])

  const selectedDigit = getSelectedDigit(offsetY)

  return (
    <div className={styles.container}>
      {/* ╨Э╨╛╨╝╨╡╤А ╤В╨╡╨╗╨╡╤Д╨╛╨╜╨░ */}
      <div className={styles.phoneNumber}>{phoneNumber}</div>

      {/* ╨Ю╤Б╨╜╨╛╨▓╨╜╨╛╨╣ ╨┤╨╕╨░╨╗ ╤Б 3D ╤Н╤Д╤Д╨╡╨║╤В╨╛╨╝ */}
      <div
        className={styles.dialWrapper}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* ╨Т╨╕╨╖╤Г╨░╨╗╤М╨╜╤Л╨╣ ╤Д╤А╨╡╨╣╨╝ ╨┤╨╕╨░╨╗╨░ (╤Б╤В╨░╤В╨╕╤З╨╜╤Л╨╣) */}
        <div className={styles.dialFrame}>
          {/* ╨ж╨╡╨╜╤В╤А╨░╨╗╤М╨╜╨╛╨╡ ╨╛╨║╨╜╨╛ ╨│╨┤╨╡ ╨▓╨╕╨┤╨╜╨░ ╨▓╤Л╨▒╤А╨░╨╜╨╜╨░╤П ╤Ж╨╕╤Д╤А╨░ */}
          <div className={styles.selectionWindow}>
            <div className={styles.selectedDigitDisplay}>{selectedDigit.digit}</div>
          </div>

          {/* ╨Ъ╨╜╨╛╨┐╨║╨╕, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╨║╤А╤Г╤В╤П╤В╤Б╤П */}
          <div
            className={clsx(styles.dialButtonsAxis, {
              [styles.dragging]: isDragging,
              [styles.returning]: isReturning,
            })}
            ref={dialRef}
            style={{
              '--offset-y': `${offsetY}px`,
            } as React.CSSProperties}
          >
            {digits.map((digit, idx) => {
              const isSelected = selectedDigit.digit === digit
              const buttonPositionY = getButtonPosition(idx)

              return (
                <button
                  key={idx}
                  className={clsx(styles.dialButton, {
                    [styles.selected]: isSelected,
                  })}
                  style={{
                    '--button-index': idx,
                    '--button-position': `${buttonPositionY}px`,
                  } as React.CSSProperties}
                  disabled={isDragging || isReturning}
                >
                  <span className={styles.digitText}>{digit}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ╨Ш╨╜╤Б╤В╤А╤Г╨║╤Ж╨╕╤П */}
      <div className={styles.dialHint}>╨Я╨╛╤В╤П╨╜╨╕╤В╨╡ ╨║╨╜╨╛╨┐╨║╨╕</div>
    </div>
  )
}

