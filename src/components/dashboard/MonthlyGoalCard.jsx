import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Pencil } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { formatCurrency, formatPercent } from '../../lib/format.js'
import { isReimbursement } from '../../lib/categories.js'

const DEFAULT_GOAL = 3000

/* Mapping source → catégories incluses + couleur de pastille.
   « Autres » agrège tous les revenus qui ne tombent pas dans
   les trois premières sources et exclut Remboursement reçu. */
const SOURCES = [
  { key: 'chomage', label: 'Chômage', color: '#7C6FFF', categories: ['chomage'] },
  { key: 'black', label: 'Black', color: '#FFB84D', categories: ['black'] },
  { key: 'irysAgency', label: 'Irys Agency', color: '#00E5A0', categories: ['irysAgency'] },
  { key: 'autres', label: 'Autres', color: 'rgba(255,255,255,0.55)', categories: null },
]

const NAMED_KEYS = new Set(
  SOURCES.flatMap((s) => s.categories ?? []),
)

/* Le rouge est réservé aux dépenses : la barre objectif ne descend
   jamais en dessous d'amber. */
function barColor(ratio) {
  if (ratio >= 1) return '#00E5A0'
  if (ratio >= 0.5) return '#7C6FFF'
  return '#FFB84D'
}

export default function MonthlyGoalCard({ transactions }) {
  const [goal, setGoal] = useLocalStorage(
    'kaafinance.monthlyGoal.v1',
    DEFAULT_GOAL,
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  /* Agrège les revenus par source pour le mois en cours.
     `transactions` est déjà filtré sur le mois par OverviewView. */
  const sources = useMemo(() => {
    const totals = Object.fromEntries(SOURCES.map((s) => [s.key, 0]))
    for (const t of transactions) {
      if (t.type !== 'income') continue
      if (isReimbursement(t.category)) continue
      if (NAMED_KEYS.has(t.category)) {
        totals[t.category] = (totals[t.category] ?? 0) + t.amount
      } else {
        totals.autres += t.amount
      }
    }
    return SOURCES.map((s) => ({ ...s, amount: totals[s.key] ?? 0 }))
  }, [transactions])

  const total = sources.reduce((s, r) => s + r.amount, 0)
  const safeGoal = goal > 0 ? goal : DEFAULT_GOAL
  const ratio = total / safeGoal
  const pct = Math.min(ratio, 1) * 100
  const color = barColor(ratio)
  const reached = ratio >= 1

  const startEdit = () => {
    setDraft(String(safeGoal))
    setEditing(true)
  }
  const commit = () => {
    const value = parseFloat(String(draft).replace(',', '.'))
    if (Number.isFinite(value) && value > 0) setGoal(value)
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
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">
            Objectif mensuel
          </h2>
          <p className="text-xs text-muted">
            Tous tes revenus du mois confondus
          </p>
        </div>
        {reached && (
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(0,229,160,0.15)',
              color: '#00E5A0',
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Objectif atteint
          </span>
        )}
      </div>

      {/* Total + objectif */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p
          className="font-num text-3xl font-bold tracking-tight tabular-nums"
          style={{ color }}
        >
          {formatCurrency(total)}
        </p>
        <span className="text-base text-muted">/</span>
        {editing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="number"
              step="1"
              min="1"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commit}
              className="w-28 rounded-lg border border-accent/40 bg-canvas px-2 py-1 pr-6 font-num text-xl font-bold text-ink outline-none transition-colors focus:border-accent"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-faint">
              €
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Modifier l’objectif mensuel"
            className="group inline-flex items-baseline gap-1.5 rounded-md px-1 font-num text-xl font-bold tabular-nums text-muted transition-colors hover:text-ink"
          >
            {formatCurrency(safeGoal)}
            <Pencil className="h-3.5 w-3.5 self-center text-faint transition-colors group-hover:text-accent" />
          </button>
        )}
      </div>

      {/* Barre de progression avec pourcentage centré */}
      <div className="relative mt-4 h-7 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: reached
              ? '0 0 20px rgba(0,229,160,0.35)'
              : `0 0 12px ${color}40`,
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="font-num text-xs font-bold tabular-nums"
            style={{
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
            }}
          >
            {formatPercent(ratio, 0)}
          </span>
        </div>
      </div>

      {/* Détail par source */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {sources.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-canvas px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-sm text-ink">{s.label}</span>
            </span>
            <span className="font-num text-sm font-semibold tabular-nums text-ink">
              {formatCurrency(s.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
