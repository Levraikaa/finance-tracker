import { useMemo } from 'react'
import { ArrowUpRight, History } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'
import { monthAgoComparison } from '../../lib/selectors.js'

/* Une mesure comparée : valeur d'aujourd'hui + écart vs il y a un mois. */
function CompareTile({ label, now, then, delta }) {
  const up = delta >= 0
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-num text-2xl font-bold tabular-nums text-ink">
          {formatCurrency(now)}
        </span>
        <span
          className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-num text-xs font-semibold tabular-nums"
          style={{
            color: up ? '#00E5A0' : '#FF4D6A',
            background: `${up ? '#00E5A0' : '#FF4D6A'}1a`,
          }}
        >
          <ArrowUpRight className={`h-3.5 w-3.5 ${up ? '' : 'rotate-90'}`} />
          {up ? '+' : '−'}
          {formatCurrency(Math.abs(delta))}
        </span>
      </div>
      <p className="mt-1 font-num text-xs text-faint">
        il y a un mois : {formatCurrency(then)}
      </p>
    </div>
  )
}

/* Carte « Comparé à il y a un mois » — solde bancaire (exact) + Pocket Global
   (reconstitué) à la même date le mois précédent, vs aujourd'hui. */
export default function MonthComparisonCard({ pocketGlobal }) {
  const { transactions, bankAdjustments, startingBalance } = useFinance()

  const cmp = useMemo(
    () =>
      monthAgoComparison(
        transactions,
        bankAdjustments,
        startingBalance,
        pocketGlobal,
      ),
    [transactions, bankAdjustments, startingBalance, pocketGlobal],
  )

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <History className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">
            Comparé à il y a un mois
          </h2>
          <p className="text-xs text-muted">
            {formatDate(cmp.targetDate, { day: 'numeric', month: 'long' })} →
            aujourd'hui
          </p>
        </div>
      </div>

      {cmp.hasHistory ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CompareTile
            label="Solde bancaire"
            now={cmp.bankNow}
            then={cmp.bankThen}
            delta={cmp.bankDelta}
          />
          <CompareTile
            label="Pocket Global"
            now={cmp.pgNow}
            then={cmp.pgThen}
            delta={cmp.pgDelta}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
          Pas encore de données il y a un mois — la comparaison apparaîtra le
          mois prochain.
        </p>
      )}
    </div>
  )
}
