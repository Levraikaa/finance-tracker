import { useMemo } from 'react'
import { ArrowRight, TrendingDown, Wallet } from 'lucide-react'
import StatCard from './StatCard.jsx'
import PocketGlobalCard from './PocketGlobalCard.jsx'
import FoodAverageCard from './FoodAverageCard.jsx'
import MonthlyGoalCard from './MonthlyGoalCard.jsx'
import YearlyChart from './YearlyChart.jsx'
import CategoryDonut from './CategoryDonut.jsx'
import TransactionTable from './TransactionTable.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { getCryptoMeta, portfolioValue } from '../../lib/cryptos.js'
import { formatCurrency, formatPercent, monthKey } from '../../lib/format.js'
import {
  budgetStatus,
  categoryBreakdown,
  delta,
  filterByMonth,
  monthEndProjection,
  totals,
  trackingDailySeries,
} from '../../lib/selectors.js'

function barColor(ratio) {
  return ratio >= 1 ? 'var(--color-negative)' : 'var(--color-accent)'
}

export default function OverviewView({ month, onNavigate }) {
  const {
    transactions,
    budgets,
    pockets,
    cryptos,
    cashBalance,
    bankBalance,
    deleteTransaction,
  } = useFinance()
  const { getDisplay } = useCategoryOverrides()

  /* Valeur live du portefeuille crypto — utilisée pour reconstruire le
     Pocket Global identique à <PocketGlobalCard />. */
  const geckoIds = useMemo(
    () => cryptos.map((c) => getCryptoMeta(c.coin).geckoId).filter(Boolean),
    [cryptos],
  )
  const { prices } = useCryptoPrices(geckoIds)
  const cryptoValue = useMemo(
    () => portfolioValue(cryptos, prices),
    [cryptos, prices],
  )
  const pocketGlobal = useMemo(() => {
    const pocketsTotal = pockets.reduce(
      (s, p) => s + (p.key === 'investissement' ? cryptoValue : p.amount),
      0,
    )
    return pocketsTotal + cashBalance + bankBalance
  }, [pockets, cryptoValue, cashBalance, bankBalance])

  const stats = useMemo(() => {
    const curKey = monthKey(month)
    const prevKey = monthKey(
      new Date(month.getFullYear(), month.getMonth() - 1, 1),
    )
    const curTx = filterByMonth(transactions, curKey)
    const cur = totals(curTx)
    const prev = totals(filterByMonth(transactions, prevKey))
    return {
      cur,
      curTx,
      incomeDelta: delta(cur.income, prev.income),
      expenseDelta: delta(cur.expense, prev.expense),
      breakdown: categoryBreakdown(curTx, 'expense'),
      budgetState: budgetStatus(budgets, transactions, curKey),
      recent: curTx.slice(0, 6),
    }
  }, [transactions, budgets, month])

  /* Début de la courbe = date de la toute première transaction saisie
     (« depuis que j'ai commencé à rentrer mes données »). Fallback : aujourd'hui. */
  const chartStart = useMemo(() => {
    if (transactions.length === 0) return new Date()
    let earliest = new Date(transactions[0].date)
    for (const t of transactions) {
      const d = new Date(t.date)
      if (d < earliest) earliest = d
    }
    return earliest
  }, [transactions])

  /* Évolution journalière du Pocket Global — ancrée sur la valeur live
     d'aujourd'hui, indépendante du mois affiché. */
  const dailySeries = useMemo(
    () => trackingDailySeries(transactions, pocketGlobal, chartStart),
    [transactions, pocketGlobal, chartStart],
  )

  /* Prévisionnel : prolonge la courbe jusqu'à la fin du mois au rythme
     net moyen constaté depuis le 1er. */
  const projection = useMemo(
    () => monthEndProjection(transactions, pocketGlobal),
    [transactions, pocketGlobal],
  )

  const recent = stats.recent

  return (
    <div className="relative">
      {/* Lueur d'ambiance violette derrière les cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-72"
        style={{
          background:
            'radial-gradient(ellipse 55% 100% at 50% 0%, rgba(124,111,255,0.13), transparent 72%)',
        }}
      />

      <div className="space-y-5">
      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          accent="#7C6FFF"
          label="Solde"
          value={formatCurrency(bankBalance)}
          hint="Compte bancaire"
        />
        <PocketGlobalCard />
        <MonthlyGoalCard
          transactions={stats.curTx}
          trend={{
            positive: stats.incomeDelta >= 0,
            label: formatPercent(Math.abs(stats.incomeDelta), 0),
          }}
        />
        <StatCard
          icon={TrendingDown}
          accent="#FF4D6A"
          label="Dépenses du mois"
          value={formatCurrency(stats.cur.expense)}
          trend={{
            positive: stats.expenseDelta <= 0,
            label: formatPercent(Math.abs(stats.expenseDelta), 0),
          }}
        />
      </div>

      {/* Graphique + répartition */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <YearlyChart data={dailySeries} projection={projection} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">
              Dépenses du mois
            </h2>
            <p className="mb-5 text-xs text-muted">Répartition par catégorie</p>
            <CategoryDonut data={stats.breakdown} />
          </div>
          {/* Moyenne nourriture / jour — basée sur la date du jour */}
          <FoodAverageCard />
        </div>
      </div>

      {/* Transactions + budgets */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <h2 className="font-display text-base font-semibold">
              Transactions récentes
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5">
            <TransactionTable
              transactions={recent}
              onDelete={deleteTransaction}
              emptyLabel="Aucune transaction pour ce mois."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <h2 className="font-display text-base font-semibold">Budgets</h2>
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Gérer
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-5">
            {stats.budgetState.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Aucun budget défini.
              </p>
            )}
            {stats.budgetState.slice(0, 5).map((b) => {
              const disp = getDisplay(b.category)
              const color = disp.color
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-[3px]"
                        style={{ backgroundColor: color }}
                      />
                      <span style={{ color }}>{disp.name}</span>
                    </span>
                    <span className="font-num tabular-nums text-muted">
                      {formatCurrency(b.spent, { compact: true })} /{' '}
                      {formatCurrency(b.limit, { compact: true })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(b.ratio, 1) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
