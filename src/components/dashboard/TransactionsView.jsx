import { useMemo, useState } from 'react'
import { Plus, Search, RotateCcw } from 'lucide-react'
import TransactionTable from './TransactionTable.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { formatCurrency, monthKey } from '../../lib/format.js'
import { totals } from '../../lib/selectors.js'

const TYPES = [
  { id: 'all', label: 'Tout' },
  { id: 'expense', label: 'Dépenses' },
  { id: 'income', label: 'Revenus' },
]

const PERIODS = [
  { id: 'month', label: 'Ce mois' },
  { id: 'lastMonth', label: 'Mois dernier' },
  { id: 'last3', label: '3 derniers mois' },
  { id: 'all', label: 'Tout' },
]

/* Bouton toggle : actif = accent / blanc ; inactif = surface / bordure / 55%. */
const toggle = (active) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'bg-accent text-white'
      : 'border border-line bg-surface text-white/55 hover:text-ink'
  }`

const FIELD =
  'rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent/60'

export default function TransactionsView({ month, onAdd }) {
  const { transactions, deleteTransaction } = useFinance()
  const { getDisplay } = useCategoryOverrides()

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [period, setPeriod] = useState('month')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')

  /* Catégories réellement présentes dans les données — triées par libellé. */
  const categoryOptions = useMemo(() => {
    const keys = [...new Set(transactions.map((t) => t.category))]
    return keys
      .map((key) => ({ key, label: getDisplay(key).name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [transactions, getDisplay])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const minV = min.trim() === '' ? null : parseFloat(min.replace(',', '.'))
    const maxV = max.trim() === '' ? null : parseFloat(max.replace(',', '.'))
    const curKey = monthKey(month)
    const lastKey = monthKey(new Date(month.getFullYear(), month.getMonth() - 1, 1))
    const last3 = new Set([
      curKey,
      lastKey,
      monthKey(new Date(month.getFullYear(), month.getMonth() - 2, 1)),
    ])

    return transactions.filter((t) => {
      const tKey = monthKey(t.date)
      if (period === 'month' && tKey !== curKey) return false
      if (period === 'lastMonth' && tKey !== lastKey) return false
      if (period === 'last3' && !last3.has(tKey)) return false

      if (type !== 'all' && t.type !== type) return false
      if (category !== 'all' && t.category !== category) return false
      if (q && !t.description.toLowerCase().includes(q)) return false

      if (minV != null && Number.isFinite(minV) && t.amount < minV) return false
      if (maxV != null && Number.isFinite(maxV) && t.amount > maxV) return false
      return true
    })
  }, [transactions, query, type, category, period, min, max, month])

  const sums = totals(filtered)

  const isFilterActive =
    query.trim() !== '' ||
    category !== 'all' ||
    type !== 'all' ||
    period !== 'month' ||
    min.trim() !== '' ||
    max.trim() !== ''

  const reset = () => {
    setQuery('')
    setType('all')
    setCategory('all')
    setPeriod('month')
    setMin('')
    setMax('')
  }

  return (
    <div className="space-y-5">
      {/* Barre de recherche */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une transaction..."
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-white/30 focus:border-accent/60"
          />
        </div>

        {/* Ligne de filtres */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type */}
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={toggle(type === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Période */}
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={toggle(period === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Catégorie */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${FIELD} text-white/55`}
            aria-label="Filtrer par catégorie"
          >
            <option value="all">Toutes</option>
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Montant min / max */}
          <div className="flex items-center gap-1.5 text-sm text-white/55">
            <span>De</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
              className={`${FIELD} w-20 font-num`}
              aria-label="Montant minimum"
            />
            <span>€ à</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="∞"
              className={`${FIELD} w-20 font-num`}
              aria-label="Montant maximum"
            />
            <span>€</span>
          </div>

          {/* Réinitialiser — visible dès qu'un filtre est actif */}
          {isFilterActive && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Transactions</p>
          <p className="mt-1 font-num text-xl font-bold tabular-nums">
            {filtered.length}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Revenus</p>
          <p className="mt-1 font-num text-xl font-bold tabular-nums text-positive">
            {formatCurrency(sums.income, { compact: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Dépenses</p>
          <p className="mt-1 font-num text-xl font-bold tabular-nums text-negative">
            {formatCurrency(sums.expense, { compact: true })}
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="font-display text-base font-semibold">Transactions</h2>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium transition-colors hover:bg-elevated"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="px-5">
          <TransactionTable
            transactions={filtered}
            onDelete={deleteTransaction}
            grouped
            emptyLabel="Aucune transaction ne correspond à ces filtres."
          />
        </div>
      </div>
    </div>
  )
}
