import { useEffect, useMemo, useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, monthKey } from '../../lib/format.js'

/* Carte « Moyenne nourriture / jour » — moyenne des dépenses de
   catégorie « Alimentation » sur le mois AFFICHÉ (`month`), propre à chaque
   mois. Le diviseur dépend du mois : jours écoulés pour le mois en cours,
   nombre total de jours pour un mois passé (mois complet). Recalcul chaque
   jour : on resynchronise l'horloge à minuit pour le mois en cours. */
export default function FoodAverageCard({ month }) {
  const { transactions } = useFinance()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    const ms = Math.max(1000, next.getTime() - now.getTime())
    const id = setTimeout(() => setNow(new Date()), ms)
    return () => clearTimeout(id)
  }, [now])

  const { total, days, average } = useMemo(() => {
    const key = monthKey(month)
    const foodTotal = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === 'alimentation' &&
          monthKey(t.date) === key,
      )
      .reduce((s, t) => s + t.amount, 0)

    const y = month.getFullYear()
    const m = month.getMonth()
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    /* Mois en cours → jours écoulés jusqu'à aujourd'hui ; autre mois → mois
       entier (un mois passé est complet, un mois futur n'a pas de dépense). */
    const divisor = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth

    return {
      total: foodTotal,
      days: divisor,
      average: foodTotal / divisor,
    }
  }, [transactions, month, now])

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#131929',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
      }}
    >
      <p
        className="font-display text-[11px] font-semibold uppercase"
        style={{
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        Moy. nourriture / jour
      </p>
      <p className="mt-2 font-num text-3xl font-bold tracking-tight text-white">
        {formatCurrency(average)}
        <span className="ml-1 text-base font-semibold text-white/80">
          /jour
        </span>
      </p>
      <p
        className="mt-1 text-xs"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        Basé sur {days} jour{days > 1 ? 's' : ''}
        {total > 0 && ` · ${formatCurrency(total)} dépensés`}
      </p>
    </div>
  )
}
