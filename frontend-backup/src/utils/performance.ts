/**
 * ╨г╤В╨╕╨╗╨╕╤В╤Л ╨┤╨╗╤П ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│╨░ ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨┤╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╨╕ ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╣
 * ╨Ш╤Б╨┐╨╛╨╗╤М╨╖╤Г╤О╤В╤Б╤П ╤В╨╛╨╗╤М╨║╨╛ ╨▓ development ╤А╨╡╨╢╨╕╨╝╨╡
 */

/**
 * FPS Monitor - ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│ ╨║╨░╨┤╤А╨╛╨▓ ╨▓ ╤Б╨╡╨║╤Г╨╜╨┤╤Г
 * ╨Я╨╛╨║╨░╨╖╤Л╨▓╨░╨╡╤В ╨┐╤А╨╡╨┤╤Г╨┐╤А╨╡╨╢╨┤╨╡╨╜╨╕╨╡ ╨╡╤Б╨╗╨╕ FPS < 55
 */
export function startFPSMonitor() {
  if (import.meta.env.MODE === 'production') return

  let lastTime = performance.now()
  let frameCount = 0
  let fps = 60

  function checkFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      
      if (fps < 55) {
        console.warn(`тЪая╕П Low FPS detected: ${fps}`)
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(checkFPS)
  }
  
  requestAnimationFrame(checkFPS)
  
  // ╨Т╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╨╝ ╤Д╤Г╨╜╨║╤Ж╨╕╤О ╨┤╨╗╤П ╨┐╨╛╨╗╤Г╤З╨╡╨╜╨╕╤П ╤В╨╡╨║╤Г╤Й╨╡╨│╨╛ FPS
  return () => fps
}

/**
 * Layout Shift Monitor - ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│ layout shifts
 */
export function startLayoutShiftMonitor() {
  if (import.meta.env.MODE === 'production') return
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // @ts-expect-error - CLS entry type
        if (entry.value > 0.1) {
          console.warn('тЪая╕П Large layout shift detected:', entry)
        }
      }
    })
    
    observer.observe({ type: 'layout-shift', buffered: true })
    
    return () => observer.disconnect()
  } catch {
    // PerformanceObserver not supported
  }
}

/**
 * Long Task Monitor - ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│ ╨┤╨╛╨╗╨│╨╕╤Е ╨╖╨░╨┤╨░╤З (>50ms)
 */
export function startLongTaskMonitor() {
  if (import.meta.env.MODE === 'production') return
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`тЪая╕П Long task detected: ${entry.duration.toFixed(0)}ms`, entry)
        }
      }
    })
    
    observer.observe({ type: 'longtask', buffered: true })
    
    return () => observer.disconnect()
  } catch {
    // PerformanceObserver not supported
  }
}

/**
 * ╨Ш╨╜╨╕╤Ж╨╕╨░╨╗╨╕╨╖╨░╤Ж╨╕╤П ╨▓╤Б╨╡╤Е ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╛╨▓ ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨┤╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╨╕
 */
export function initPerformanceMonitoring() {
  if (import.meta.env.MODE === 'production') return

  console.log('ЁЯФН Performance monitoring started')
  
  const stopFPS = startFPSMonitor()
  const stopLayoutShift = startLayoutShiftMonitor()
  const stopLongTask = startLongTaskMonitor()
  
  return () => {
    stopFPS?.()
    stopLayoutShift?.()
    stopLongTask?.()
    console.log('ЁЯФН Performance monitoring stopped')
  }
}

export default initPerformanceMonitoring


