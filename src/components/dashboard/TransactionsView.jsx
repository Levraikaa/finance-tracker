import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import TransactionTable from './TransactionTable.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, monthKey } from '../../lib/format.js'
import { totals } from '../../lib/selectors.js'

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'income', label: 'Revenus' },
  { id: 'expense', label: 'Dépenses' },
]

export default function TransactionsView({ month, onAdd }) {
  const { transactions, deleteTransaction } = useFinance()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const key = monthKey(month)
    return transactions.filter((t) => {
      if (monthKey(t.date) !== key) return false
      if (filter !== 'all' && t.type !== filter) return false
      if (q && !t.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [transactions, filter, query, month])

  const sums = totals(filtered)

  return (
    <div className="space-y-5">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une transaction…"
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-faint focus:border-accent/60"
          />
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
          <h2 className="font-display text-base font-semibold">
            Transactions du mois
          </h2>
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
            emptyLabel="Aucune transaction à afficher pour ce mois."
          />
        </div>
      </div>
    </div>
  )
}
