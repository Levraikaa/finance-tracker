import { useMemo } from 'react'
import { ArrowRight, TrendingDown, Wallet } from 'lucide-react'
import StatCard from './StatCard.jsx'
import PocketGlobalCard from './PocketGlobalCard.jsx'
import FoodAverageCard from './FoodAverageCard.jsx'
import DailyExpenseCard from './DailyExpenseCard.jsx'
import MonthlyGoalCard from './MonthlyGoalCard.jsx'
import YearlyChart from './YearlyChart.jsx'
import CategoryDonut from './CategoryDonut.jsx'
import TransactionTable from './TransactionTable.jsx'
import DebtsCard from './DebtsCard.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { useIdrRate } from '../../hooks/useIdrRate.js'
import { getCryptoMeta, portfolioValue } from '../../lib/cryptos.js'
import { formatCurrency, formatPercent, monthKey } from '../../lib/format.js'
import {
  categoryBreakdown,
  delta,
  filterByMonth,
  totals,
  trackingDailySeries,
} from '../../lib/selectors.js'

export default function OverviewView({ month, onNavigate }) {
  const {
    transactions,
    pockets,
    cryptos,
    cashBalance,
    cashIdrBalance,
    bankBalance,
    deleteTransaction,
  } = useFinance()
  const fx = useIdrRate()
  const cashIdrEur =
    fx.status === 'ok' && fx.rate > 0 ? cashIdrBalance * fx.rate : 0

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
    return pocketsTotal + cashBalance + cashIdrEur + bankBalance
  }, [pockets, cryptoValue, cashBalance, cashIdrEur, bankBalance])

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
      recent: curTx.slice(0, 6),
    }
  }, [transactions, month])

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
          <YearlyChart data={dailySeries} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">
              Dépenses du mois
            </h2>
            <p className="mb-5 text-xs text-muted">Répartition par catégorie</p>
            <CategoryDonut data={stats.breakdown} />
          </div>
          {/* Moyennes journalières du mois affiché */}
          <FoodAverageCard month={month} />
          <DailyExpenseCard month={month} />
        </div>
      </div>

      {/* Transactions + dettes */}
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

        <DebtsCard />
      </div>
      </div>
    </div>
  )
}
