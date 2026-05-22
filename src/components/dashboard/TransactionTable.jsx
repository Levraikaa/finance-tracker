import { Trash2 } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { getCategory } from '../../lib/categories.js'
import { formatCurrency, formatDateShort } from '../../lib/format.js'

/* Liste de transactions réutilisable (aperçu + vue complète). */
export default function TransactionTable({
  transactions,
  onDelete,
  emptyLabel = 'Aucune transaction pour le moment.',
}) {
  if (!transactions.length) {
    return (
      <div className="grid place-items-center px-4 py-14 text-center">
        <p className="text-sm text-muted">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line-soft">
      {transactions.map((t) => {
        const cat = getCategory(t.category)
        const income = t.type === 'income'
        return (
          <li key={t.id} className="group flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <CategoryIcon name={cat.icon} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.description}</p>
              <p className="truncate text-xs text-muted">
                {cat.label} · {formatDateShort(t.date)}
              </p>
            </div>
            <span
              className={`shrink-0 font-num text-sm font-semibold tabular-nums ${
                income ? 'text-positive' : 'text-ink'
              }`}
            >
              {income ? '+' : '−'}
              {formatCurrency(t.amount)}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                aria-label={`Supprimer ${t.description}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint transition-all hover:bg-elevated hover:text-negative sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
