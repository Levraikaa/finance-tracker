import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import SubscriptionsSection from './SubscriptionsSection.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { CATEGORIES, EXPENSE_CATEGORIES, getCategory } from '../../lib/categories.js'
import { formatCurrency, formatPercent, monthKey } from '../../lib/format.js'
import { budgetStatus } from '../../lib/selectors.js'

export default function BudgetsView({ month }) {
  const { budgets, transactions, upsertBudget, deleteBudget } = useFinance()
  const { getDisplay } = useCategoryOverrides()
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [limit, setLimit] = useState('')

  const curKey = monthKey(month)
  const status = useMemo(
    () => budgetStatus(budgets, transactions, curKey),
    [budgets, transactions, curKey],
  )

  const summary = useMemo(() => {
    const totalLimit = status.reduce((s, b) => s + b.limit, 0)
    const totalSpent = status.reduce((s, b) => s + b.spent, 0)
    return {
      totalLimit,
      totalSpent,
      remaining: totalLimit - totalSpent,
      ratio: totalLimit > 0 ? totalSpent / totalLimit : 0,
    }
  }, [status])

  const pickCategory = (key) => {
    setCategory(key)
    const existing = budgets.find((b) => b.category === key)
    setLimit(existing ? String(existing.limit) : '')
  }

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(String(limit).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    upsertBudget({ category, limit: value })
    setLimit('')
  }

  const editing = budgets.some((b) => b.category === category)

  return (
    <div className="space-y-5">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Budget total</p>
          <p className="mt-1 font-num text-xl font-bold tabular-nums">
            {formatCurrency(summary.totalLimit, { compact: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Dépensé ce mois</p>
          <p className="mt-1 font-num text-xl font-bold tabular-nums text-negative">
            {formatCurrency(summary.totalSpent, { compact: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Restant</p>
          <p
            className={`mt-1 font-num text-xl font-bold tabular-nums ${
              summary.remaining < 0 ? 'text-negative' : 'text-positive'
            }`}
          >
            {formatCurrency(summary.remaining, { compact: true })}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-line bg-surface p-5"
      >
        <h2 className="font-display text-base font-semibold">
          {editing ? 'Modifier un budget' : 'Définir un budget'}
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Fixez une limite mensuelle de dépenses par catégorie.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={category}
            onChange={(e) => pickCategory(e.target.value)}
            className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent/60 sm:flex-1 [color-scheme:dark]"
          >
            {EXPENSE_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {getDisplay(key).name}
              </option>
            ))}
          </select>
          <div className="relative sm:w-44">
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Limite"
              className="w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 pr-9 font-num text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
              €
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            <Plus className="h-4 w-4" />
            {editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>

      {/* Cartes de budget */}
      {status.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface px-4 py-16 text-center">
          <p className="text-sm text-muted">
            Aucun budget défini. Ajoutez-en un pour suivre vos dépenses.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {status.map((b) => {
            const cat = getCategory(b.category)
            const over = b.ratio >= 1
            const disp = getDisplay(b.category)
            const color = disp.color
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-line bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{ backgroundColor: `${color}26`, color }}
                    >
                      <CategoryIcon name={cat.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color }}
                      >
                        {disp.name}
                      </p>
                      <p className="font-num text-xs text-muted">
                        {formatPercent(b.ratio, 0)} utilisé
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBudget(b.id)}
                    aria-label={`Supprimer le budget ${disp.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-negative"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-num text-lg font-bold tabular-nums">
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="font-num text-sm text-muted">
                    / {formatCurrency(b.limit)}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(b.ratio, 1) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <p
                  className={`mt-2.5 font-num text-xs font-medium ${
                    over ? 'text-negative' : 'text-muted'
                  }`}
                >
                  {over
                    ? `Dépassement de ${formatCurrency(-b.remaining)}`
                    : `${formatCurrency(b.remaining)} restants`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Abonnements & charges fixes */}
      <SubscriptionsSection />
    </div>
  )
}
