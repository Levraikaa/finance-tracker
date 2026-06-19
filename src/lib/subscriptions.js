import { formatCurrency, uid } from './format.js'

/* Source unique de vérité pour les abonnements récurrents.
   Clé localStorage et structure partagées par SubscriptionsSection,
   le hook de rappel et l'auto-débit. */
export const SUBSCRIPTIONS_KEY = 'kaa_abonnements'
export const DEFAULT_SUBSCRIPTION_CATEGORY = 'abonnements'

/* Pré-remplissage : abonnements de référence (montants à 0 jusqu'à
   saisie par l'utilisateur). */
const DEFAULTS = [
  { name: 'Loyer', amount: 0, currency: 'EUR', day: 1, method: 'compte', category: 'abonnements' },
  { name: 'Scooter', amount: 0, currency: 'IDR', day: 5, method: 'cash', category: 'transport' },
  { name: 'Revolut Metal', amount: 0, currency: 'EUR', day: 10, method: 'compte', category: 'abonnements' },
  { name: 'Forfait téléphone', amount: 0, currency: 'EUR', day: 15, method: 'compte', category: 'abonnements' },
  { name: 'iTunes', amount: 0, currency: 'EUR', day: 20, method: 'compte', category: 'abonnements' },
  { name: 'Salle de sport', amount: 0, currency: 'EUR', day: 1, method: 'compte', category: 'sport' },
]

export const seedSubscriptions = () => DEFAULTS.map((s) => ({ id: uid(), ...s }))

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

/* Prochaine date de prélèvement (>= aujourd'hui) d'un abonnement, à partir
   de son `day` (jour du mois, borné au dernier jour du mois concerné). Si le
   jour est déjà passé ce mois-ci, on bascule sur le mois suivant. */
export function nextDebitInfo(sub, now = new Date()) {
  const day = Math.min(Math.max(parseInt(sub.day, 10) || 1, 1), 31)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetThis = Math.min(day, daysInMonth(now.getFullYear(), now.getMonth()))

  let next
  if (now.getDate() <= targetThis) {
    next = new Date(now.getFullYear(), now.getMonth(), targetThis)
  } else {
    const ny = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
    const nm = (now.getMonth() + 1) % 12
    next = new Date(ny, nm, Math.min(day, daysInMonth(ny, nm)))
  }

  const daysUntil = Math.round((next - startToday) / 86400000)
  return { nextDate: next, daysUntil, isToday: daysUntil === 0 }
}

/* Abonnements dont le prélèvement tombe aujourd'hui ou dans <= withinDays
   jours. Un abonnement à montant 0 n'est pas un vrai débit -> exclu.
   Résultat enrichi (nextDate / daysUntil / isToday) et trié du plus
   imminent au plus lointain. */
export function getUpcomingSubscriptions(subs, now = new Date(), withinDays = 3) {
  if (!Array.isArray(subs)) return []
  return subs
    .filter((s) => s && typeof s === 'object' && Number(s.amount) > 0)
    .map((s) => ({ ...s, ...nextDebitInfo(s, now) }))
    .filter((s) => s.daysUntil >= 0 && s.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/* Montant affiché dans la devise d'origine de l'abonnement. */
export function formatSubscriptionAmount(sub) {
  if (sub.currency === 'IDR') {
    return (
      new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
        sub.amount,
      ) + ' IDR'
    )
  }
  return formatCurrency(sub.amount)
}

/* « Aujourd'hui » / « Dans 1 jour » / « Dans X jours ». */
export function daysUntilLabel(daysUntil) {
  if (daysUntil <= 0) return "Aujourd'hui"
  return `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
}
