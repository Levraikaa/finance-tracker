import { useEffect, useRef } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { useIdrRate } from './useIdrRate.js'
import { monthKey } from '../lib/format.js'

/* Au chargement de l'app, vérifie chaque abonnement enregistré :
   si on est au jour de prélèvement ou après dans le mois courant
   et qu'il n'a pas déjà été débité, crée une transaction réelle.
   L'historique des débits déjà appliqués est stocké en localStorage
   sous la clé `kaa_abonnements_debits` (forme : { subId: ['2026-06', …] }). */
const SUBS_KEY = 'kaa_abonnements'
const DEBITS_KEY = 'kaa_abonnements_debits'

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota dépassé ou stockage bloqué — sans gravité */
  }
}

const daysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate()

export function useSubscriptionAutoDebit() {
  const { recordAutoDebit } = useFinance()
  const fx = useIdrRate()
  /* Garde-fou contre la double exécution sous StrictMode (deux montages
     consécutifs) : la clé combine le mois courant et le statut FX. */
  const lastRun = useRef('')

  useEffect(() => {
    /* On attend la résolution du taux IDR : un échec définitif autorise
       quand même le traitement des abonnements en EUR. */
    if (fx.status === 'loading') return

    const subs = readJson(SUBS_KEY, [])
    if (!Array.isArray(subs) || subs.length === 0) return

    const now = new Date()
    const curMonthKey = monthKey(now)
    const runKey = `${curMonthKey}:${fx.status}`
    if (lastRun.current === runKey) return
    lastRun.current = runKey

    const lastDay = daysInMonth(now.getFullYear(), now.getMonth())
    const today = now.getDate()

    let log = readJson(DEBITS_KEY, {})
    let mutated = false

    for (const sub of subs) {
      if (!sub || typeof sub !== 'object') continue
      const amount = Number(sub.amount)
      if (!Number.isFinite(amount) || amount <= 0) continue

      /* Jour effectif : un sub au 31 dans un mois de 30 jours se
         déclenche le 30. */
      const targetDay = Math.min(Math.max(parseInt(sub.day, 10) || 1, 1), lastDay)
      if (today < targetDay) continue

      const already = Array.isArray(log[sub.id]) && log[sub.id].includes(curMonthKey)
      if (already) continue

      /* Conversion IDR → EUR si nécessaire. Si le taux est indisponible,
         on saute (on réessayera au prochain chargement). */
      let eurAmount = amount
      if (sub.currency === 'IDR') {
        if (fx.status !== 'ok' || typeof fx.rate !== 'number' || fx.rate <= 0) {
          continue
        }
        eurAmount = amount * fx.rate
      }
      if (!Number.isFinite(eurAmount) || eurAmount <= 0) continue

      recordAutoDebit({
        name: sub.name,
        amount: eurAmount,
        method: sub.method,
      })

      log = {
        ...log,
        [sub.id]: [...(log[sub.id] ?? []), curMonthKey],
      }
      mutated = true
    }

    if (mutated) writeJson(DEBITS_KEY, log)
  }, [recordAutoDebit, fx.status, fx.rate])
}
