export const money = (n) => `৳ ${Number(n || 0).toLocaleString('en-US')}`

export const STATUS_COLOR = {
  pending: 'warning',
  confirmed: 'primary',
  checked_in: 'info',
  checked_out: 'success',
  cancelled: 'secondary',
}

const THEMES = [
  ['#14213d', '#3a5fa8'],
  ['#1b4332', '#52b788'],
  ['#6a040f', '#e85d04'],
  ['#3c096c', '#9d4edd'],
]

export const roomTheme = (id = 0) => {
  const t = THEMES[id % THEMES.length]
  return `linear-gradient(135deg, ${t[0]}, ${t[1]})`
}

export function roomIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('suite') || n.includes('presidential')) return 'bi-gem'
  if (n.includes('double') || n.includes('family') || n.includes('twin')) return 'bi-people-fill'
  if (n.includes('single')) return 'bi-person-fill'
  return 'bi-door-open-fill'
}
