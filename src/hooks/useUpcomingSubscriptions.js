import { useMemo } from 'react'
import {
  SUBSCRIPTIONS_KEY,
  getUpcomingSubscriptions,
} from '../lib/subscriptions.js'

/* Abonnements imminents (prélèvement aujourd'hui ou dans <= withinDays jours).
   Lecture seule de localStorage au chargement — n'écrit jamais, pour ne pas
   entrer en conflit avec l'état de SubscriptionsSection. */
export function useUpcomingSubscriptions(withinDays = 3) {
  return useMemo(() => {
    let subs = []
    try {
      const raw = localStorage.getItem(SUBSCRIPTIONS_KEY)
      subs = raw ? JSON.parse(raw) : []
    } catch {
      subs = []
    }
    return getUpcomingSubscriptions(subs, new Date(), withinDays)
  }, [withinDays])
}
