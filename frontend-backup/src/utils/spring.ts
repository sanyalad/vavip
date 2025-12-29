/**
 * ╨д╨╕╨╖╨╕╤З╨╡╤Б╨║╨╕╨╡ spring-╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕ ╤Б ╤Н╤Д╤Д╨╡╨║╤В╨╛╨╝ ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╨╕
 * ╨Ю╤Б╨╜╨╛╨▓╨░╨╜╤Л ╨╜╨░ ╤А╨╡╨░╨╗╤М╨╜╨╛╨╣ ╤Д╨╕╨╖╨╕╨║╨╡: ╨╝╨░╤Б╤Б╨░, ╨╢╨╡╤Б╤В╨║╨╛╤Б╤В╤М, ╨╖╨░╤В╤Г╤Е╨░╨╜╨╕╨╡
 */

export const spring = {
  // ╨Ы╨╡╨│╨║╨░╤П ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╤П - ╨┤╨╗╤П ╨╝╨╡╨╗╨║╨╕╤Е ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓ (╨║╨╜╨╛╨┐╨║╨╕, ╨╕╨║╨╛╨╜╨║╨╕)
  light: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.5,
  },
  
  // ╨б╤А╨╡╨┤╨╜╤П╤П ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╤П - ╨┤╨╗╤П ╨║╨░╤А╤В╨╛╤З╨╡╨║, ╨╝╨╛╨┤╨░╨╗╤М╨╜╤Л╤Е ╨╛╨║╨╛╨╜
  medium: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 1,
  },
  
  // ╨в╤П╨╢╨╡╨╗╨░╤П ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╤П - ╨┤╨╗╤П ╨║╤А╤Г╨┐╨╜╤Л╤Е ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓ (drawer, ╨┐╨░╨╜╨╡╨╗╨╕)
  heavy: {
    type: 'spring' as const,
    stiffness: 150,
    damping: 18,
    mass: 1.5,
  },
  
  // ╨Ю╤З╨╡╨╜╤М ╤В╤П╨╢╨╡╨╗╨░╤П ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╤П - ╨┤╨╗╤П ╨▓╨╕╨┤╨╡╨╛-╤Б╨╡╨║╤Ж╨╕╨╣, hero
  veryHeavy: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
    mass: 2,
  },
  
  // ╨С╨╡╨╖ ╨╖╨░╤В╤Г╤Е╨░╨╜╨╕╤П - ╨┤╨╗╤П bounce ╤Н╤Д╤Д╨╡╨║╤В╨╛╨▓ (╨╛╨┐╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╨╛)
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
    mass: 1,
  },
  
  // ╨Я╨╗╨░╨▓╨╜╨╛╨╡ ╨╖╨░╤В╤Г╤Е╨░╨╜╨╕╨╡ - ╨┤╨╗╤П fade ╤Н╤Д╤Д╨╡╨║╤В╨╛╨▓
  smooth: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 25,
    mass: 1,
  },
} as const

/**
 * ╨Я╨░╤А╨░╨╝╨╡╤В╤А╤Л ╨┤╨╗╤П ╤А╨░╨╖╨╜╤Л╤Е ╤В╨╕╨┐╨╛╨▓ ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╣
 */
export const springPresets = {
  // ╨Ф╨╗╤П ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓, ╨║╨╛╤В╨╛╤А╤Л╨╡ "╨┐╨░╨┤╨░╤О╤В" ╨▓╨╜╨╕╨╖ (╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╤П)
  gravityDown: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 22,
    mass: 1.2,
  },
  
  // ╨Ф╨╗╤П ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨╛╨▓, ╨║╨╛╤В╨╛╤А╤Л╨╡ "╨┐╨╛╨┤╨╜╨╕╨╝╨░╤О╤В╤Б╤П" ╨▓╨▓╨╡╤А╤Е (╨┐╤А╨╛╤В╨╕╨▓ ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╨╕)
  gravityUp: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 0.8, // ╨Ы╨╡╨│╤З╨╡ ╨┤╨╗╤П ╨┐╨╛╨┤╤К╨╡╨╝╨░
  },
  
  // ╨Ф╨╗╤П ╨│╨╛╤А╨╕╨╖╨╛╨╜╤В╨░╨╗╤М╨╜╤Л╤Е ╨┤╨▓╨╕╨╢╨╡╨╜╨╕╨╣ (╨╝╨╡╨╜╤М╤И╨╡ ╨│╤А╨░╨▓╨╕╤В╨░╤Ж╨╕╨╕)
  horizontal: {
    type: 'spring' as const,
    stiffness: 250,
    damping: 23,
    mass: 1,
  },
} as const

// Type exports
export type SpringType = keyof typeof spring
export type SpringPresetType = keyof typeof springPresets
export type SpringConfig = (typeof spring)[SpringType]


