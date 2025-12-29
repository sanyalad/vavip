/**
 * BORK-style ╨┐╤А╨╡╨╝╨╕╨░╨╗╤М╨╜╤Л╨╡ easing ╤Д╤Г╨╜╨║╤Ж╨╕╨╕
 * ╨Ю╤Б╨╜╨╛╨▓╨░╨╜╤Л ╨╜╨░ ╨┐╤А╨╕╨╜╤Ж╨╕╨┐╨░╤Е: ╨╝╨╡╨┤╨╗╨╡╨╜╨╜╤Л╨╡, ╨┐╨╗╨░╨▓╨╜╤Л╨╡, ╨╡╤Б╤В╨╡╤Б╤В╨▓╨╡╨╜╨╜╤Л╨╡
 */

export const easing = {
  // ╨Ю╤Б╨╜╨╛╨▓╨╜╨░╤П ╨┐╤А╨╡╨╝╨╕╨░╨╗╤М╨╜╨░╤П ╨║╤А╨╕╨▓╨░╤П BORK (╨┤╨╗╤П ╨▒╨╛╨╗╤М╤И╨╕╨╜╤Б╤В╨▓╨░ transitions)
  premium: [0.4, 0, 0.2, 1] as const,
  
  // ╨Ф╨╗╤П ╨╝╨╡╨┤╨╗╨╡╨╜╨╜╤Л╤Е ╨┐╨╗╨░╨▓╨╜╤Л╤Е ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╣ (hero, ╨║╤А╤Г╨┐╨╜╤Л╨╡ ╤Н╨╗╨╡╨╝╨╡╨╜╤В╤Л)
  smooth: [0.25, 0.1, 0.25, 1] as const,
  
  // ╨Ф╨╗╤П ╨▓╤Л╨╡╨╖╨╢╨░╤О╤Й╨╕╤Е ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓ (drawer, modal)
  enter: [0.23, 0.9, 0.15, 1] as const,
  
  // ╨Ф╨╗╤П ╨╕╤Б╤З╨╡╨╖╨░╤О╤Й╨╕╤Е ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓
  exit: [0.4, 0, 1, 1] as const,
  
  // ╨Ф╨╗╤П spring-╨┐╨╛╨┤╨╛╨▒╨╜╤Л╤Е ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╣ (╨║╨╜╨╛╨┐╨║╨╕, ╨║╨░╤А╤В╨╛╤З╨║╨╕)
  spring: [0.34, 1.56, 0.64, 1] as const,
  
  // ╨Ф╨╗╤П ╨╝╨╕╨║╤А╨╛-╨╕╨╜╤В╨╡╤А╨░╨║╤Ж╨╕╨╣ (hover, tap)
  micro: [0.4, 0, 0.6, 1] as const,
} as const

// CSS ╤Б╤В╤А╨╛╨║╨╕ ╨┤╨╗╤П ╨╕╤Б╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╨╜╨╕╤П ╨▓ CSS
export const easingCSS = {
  premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  enter: 'cubic-bezier(0.23, 0.9, 0.15, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  micro: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const

// Type exports
export type EasingType = keyof typeof easing
export type EasingValue = (typeof easing)[EasingType]


