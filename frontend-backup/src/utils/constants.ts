// API URLs
export const API_URL = import.meta.env.VITE_API_URL || '/api'
export const WS_URL = import.meta.env.VITE_WS_URL || ''

// App constants
export const APP_NAME = 'Vavip'
export const APP_DESCRIPTION = '╨Я╤А╨╡╨╝╨╕╨░╨╗╤М╨╜╤Л╨╡ ╨╕╨╜╨╢╨╡╨╜╨╡╤А╨╜╤Л╨╡ ╤Б╨╕╤Б╤В╨╡╨╝╤Л, ╨┐╤А╨╛╨╡╨║╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ BIM, ╨╝╨╛╨╜╤В╨░╨╢ ╨╕ ╨┐╤А╨╛╨┤╨░╨╢╨░ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╤П'

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Animation durations (ms)
export const ANIMATION_FAST = 150
export const ANIMATION_BASE = 300
export const ANIMATION_SLOW = 500

// Breakpoints (px)
export const BREAKPOINTS = {
  mobile: 720,
  tablet: 1024,
  desktop: 1400,
} as const

// Order statuses
export const ORDER_STATUSES = {
  pending: '╨Ю╨╢╨╕╨┤╨░╨╡╤В',
  confirmed: '╨Я╨╛╨┤╤В╨▓╨╡╤А╨╢╨┤╨╡╨╜',
  processing: '╨Т ╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨╡',
  shipped: '╨Ю╤В╨┐╤А╨░╨▓╨╗╨╡╨╜',
  delivered: '╨Ф╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜',
  cancelled: '╨Ю╤В╨╝╨╡╨╜╨╡╨╜',
} as const

// Payment statuses
export const PAYMENT_STATUSES = {
  pending: '╨Ю╨╢╨╕╨┤╨░╨╡╤В ╨╛╨┐╨╗╨░╤В╤Л',
  paid: '╨Ю╨┐╨╗╨░╤З╨╡╨╜',
  failed: '╨Ю╤И╨╕╨▒╨║╨░ ╨╛╨┐╨╗╨░╤В╤Л',
  refunded: '╨Т╨╛╨╖╨▓╤А╨░╤Й╨╡╨╜',
} as const

// Delivery methods
export const DELIVERY_METHODS = {
  courier: '╨Ъ╤Г╤А╤М╨╡╤А╤Б╨║╨░╤П ╨┤╨╛╤Б╤В╨░╨▓╨║╨░',
  pickup: '╨б╨░╨╝╨╛╨▓╤Л╨▓╨╛╨╖',
  post: '╨Я╨╛╤З╤В╨░ ╨а╨╛╤Б╤Б╨╕╨╕',
} as const

// Payment methods
export const PAYMENT_METHODS = {
  card: '╨Ъ╨░╤А╤В╨╛╨╣ ╨╛╨╜╨╗╨░╨╣╨╜',
  cash: '╨Э╨░╨╗╨╕╤З╨╜╤Л╨╝╨╕ ╨┐╤А╨╕ ╨┐╨╛╨╗╤Г╤З╨╡╨╜╨╕╨╕',
} as const












