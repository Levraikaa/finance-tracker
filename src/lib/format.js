/* Helpers de formatage — locale fr-FR / euro */

export function formatCurrency(value, { compact = false, sign = false } = {}) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(value))

  if (sign && value !== 0) return `${value > 0 ? '+' : '−'}${formatted}`
  return value < 0 ? `−${formatted}` : formatted
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('fr-FR', options).format(value)
}

/** Montant en roupies indonésiennes, ex. « 6 000 000 IDR ». */
export function formatIdr(value) {
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
      Math.round(Number(value) || 0),
    ) + ' IDR'
  )
}

export function formatPercent(ratio, digits = 0) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(ratio)
}

export function formatDate(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('fr-FR', opts).format(new Date(iso))
}

export function formatDateShort(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(
    new Date(iso),
  )
}

/** Libellé de groupe journalier : « Aujourd'hui », « Hier » ou « Lundi 12 juin ». */
export function formatDayLabel(iso) {
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  const label = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMonthLabel(iso) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(new Date(iso))
    .replace('.', '')
}

/** Clé de regroupement mensuel, ex. "2026-05" */
export function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Génère un id court unique. */
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
