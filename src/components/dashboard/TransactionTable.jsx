import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { getCategory, isReimbursement } from '../../lib/categories.js'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, formatDateShort, formatDayLabel } from '../../lib/format.js'

/* Liste de transactions réutilisable (aperçu + vue complète).
   `grouped` regroupe les transactions par jour (vue Transactions). */
export default function TransactionTable({
  transactions,
  onDelete,
  grouped = false,
  emptyLabel = 'Aucune transaction pour le moment.',
}) {
  if (!transactions.length) {
    return (
      <div className="grid place-items-center px-4 py-14 text-center">
        <p className="text-sm text-muted">{emptyLabel}</p>
      </div>
    )
  }

  if (grouped) {
    return <GroupedTransactionList transactions={transactions} onDelete={onDelete} />
  }

  return <TransactionList transactions={transactions} onDelete={onDelete} />
}

/** Clé de jour locale, ex. « 2026-06-12 ». */
function dayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/* Regroupe les transactions par jour : groupes du plus récent au plus ancien,
   transactions chronologiques (anciennes → récentes) à l'intérieur de chaque jour,
   et total net du jour (revenus − dépenses). */
function groupByDay(transactions) {
  const map = new Map()
  for (const t of transactions) {
    const key = dayKey(t.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(t)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => new Date(a.date) - new Date(b.date)),
      net: items.reduce(
        (s, t) =>
          s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0),
        0,
      ),
    }))
}

function GroupedTransactionList({ transactions, onDelete }) {
  const groups = useMemo(() => groupByDay(transactions), [transactions])

  return (
    <div>
      {groups.map((g, i) => (
        <div key={g.key} className={i > 0 ? 'border-t border-line' : ''}>
          <div className="flex items-center justify-between pb-2 pt-4">
            <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-white/30">
              {formatDayLabel(g.items[0].date)}
            </span>
            <span
              className={`font-num text-xs font-semibold tabular-nums ${
                g.net < 0 ? 'text-negative' : 'text-positive'
              }`}
            >
              {formatCurrency(g.net, { sign: true })}
            </span>
          </div>
          <TransactionList transactions={g.items} onDelete={onDelete} />
        </div>
      ))}
    </div>
  )
}

function TransactionList({ transactions, onDelete }) {
  return (
    <ul className="divide-y divide-line-soft">
      {transactions.map((t) => (
        <TransactionRow key={t.id} t={t} onDelete={onDelete} />
      ))}
    </ul>
  )
}

function TransactionRow({ t, onDelete }) {
  const { getDisplay } = useCategoryOverrides()
  const { updateTransactionNote } = useFinance()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(t.note ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const cat = getCategory(t.category)
  const disp = getDisplay(t.category)
  const income = t.type === 'income'
  const reimbursement = isReimbursement(t.category)
  const hasNote = Boolean(t.note && t.note.trim())
  /* Moyen de paiement — défaut « compte » pour les transactions
     antérieures à cette donnée (migration implicite). */
  const cash = t.paymentMethod === 'cash'
  const payColor = cash ? '#FFB84D' : '#7C6FFF'
  const payLabel = cash ? 'Cash' : 'Compte'

  const pill = reimbursement
    ? { backgroundColor: 'rgba(255,184,77,0.15)', color: '#FFB84D' }
    : cat.type === 'expense'
    ? { backgroundColor: `${disp.color}26`, color: disp.color }
    : null

  const openNote = () => {
    setDraft(t.note ?? '')
    setEditing(true)
  }
  const commit = () => {
    updateTransactionNote(t.id, draft)
    setEditing(false)
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(false)
    }
  }

  return (
    <li className="group py-3">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            pill ? '' : 'bg-accent/15 text-accent'
          }`}
          style={pill ?? undefined}
        >
          <CategoryIcon name={cat.icon} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{t.description}</p>
            {reimbursement && (
              <span
                className="shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(255,184,77,0.15)',
                  color: '#FFB84D',
                }}
              >
                Remboursement
              </span>
            )}
            {t.auto && (
              <span
                className="shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Auto
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${payColor}26`, color: payColor }}
            >
              {payLabel}
            </span>
            <p className="truncate text-xs text-muted">
              {disp.name} · {formatDateShort(t.date)}
            </p>
          </div>
          {hasNote && !editing && (
            <p className="truncate font-sans text-[12px] italic text-white/40">
              {t.note}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 font-num text-sm font-semibold tabular-nums ${
            reimbursement ? '' : income ? 'text-positive' : 'text-ink'
          }`}
          style={reimbursement ? { color: '#FFB84D' } : undefined}
        >
          {income ? '+' : '−'}
          {formatCurrency(t.amount)}
        </span>
        <button
          type="button"
          onClick={() => (editing ? commit() : openNote())}
          aria-label={hasNote ? `Modifier la note de ${t.description}` : `Ajouter une note à ${t.description}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-elevated"
          style={{ color: hasNote ? '#7C6FFF' : 'rgba(255,255,255,0.2)' }}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
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
      </div>

      {/* Champ de note inline — apparition fluide 200ms */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          editing ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden pl-13">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            tabIndex={editing ? 0 : -1}
            placeholder="Ajouter une note…"
            className="w-full rounded-lg text-sm text-ink outline-none transition-colors placeholder:text-white/30 focus:border-accent/60"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '8px 12px',
            }}
          />
        </div>
      </div>
    </li>
  )
}
