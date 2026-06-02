import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Pencil,
  TrendingUp,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { formatCurrency, formatPercent } from '../../lib/format.js'

const DEFAULT_GOAL = 3000

/* Mapping source → catégorie unique. Chaque revenu est rattaché à
   sa source ; les catégories héritées et le Remboursement reçu sont
   silencieusement exclus du total objectif. */
const SOURCES = [
  { key: 'chomage', label: 'Chômage', color: '#7C6FFF', category: 'chomage' },
  { key: 'irysAgency', label: 'Irys Agency', color: '#00E5A0', category: 'irysAgency' },
  { key: 'black', label: 'Black', color: '#FFB84D', category: 'black' },
  { key: 'autres', label: 'Autre', color: 'rgba(255,255,255,0.55)', category: 'autres' },
]

const SOURCE_BY_CATEGORY = Object.fromEntries(
  SOURCES.map((s) => [s.category, s.key]),
)

/* Couleur fixe de la barre : verte, indépendamment du seuil. */
const BAR_COLOR = '#00E5A0'

export default function MonthlyGoalCard({ transactions, trend }) {
  const [goal, setGoal] = useLocalStorage(
    'kaafinance.monthlyGoal.v1',
    DEFAULT_GOAL,
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  /* Agrège les revenus par source pour le mois passé en `transactions`. */
  const sources = useMemo(() => {
    const totals = Object.fromEntries(SOURCES.map((s) => [s.key, 0]))
    for (const t of transactions) {
      if (t.type !== 'income') continue
      const sourceKey = SOURCE_BY_CATEGORY[t.category]
      if (!sourceKey) continue
      totals[sourceKey] += t.amount
    }
    return SOURCES.map((s) => ({ ...s, amount: totals[s.key] ?? 0 }))
  }, [transactions])

  const total = sources.reduce((s, r) => s + r.amount, 0)
  const safeGoal = goal > 0 ? goal : DEFAULT_GOAL
  const ratio = total / safeGoal
  const pct = Math.min(ratio, 1) * 100

  const startEdit = (e) => {
    e.stopPropagation()
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
    <div className="overflow-visible">
      {/* En-tête cliquable — même look que Pocket Global (fond #131929 +
          border rgba(255,255,255,0.06), rayon adapté à l'état ouvert). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full p-5 text-left transition-[border-radius,filter] duration-300 hover:brightness-110"
        style={{
          background: '#131929',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: open ? '16px 16px 0 0' : '16px',
        }}
      >
        <div className="flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent">
            <TrendingUp className="h-[22px] w-[22px]" />
          </span>
          <div className="flex items-center gap-2">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 font-num text-xs font-semibold ${
                  trend.positive
                    ? 'bg-positive/10 text-positive'
                    : 'bg-negative/10 text-negative'
                }`}
              >
                {trend.positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {trend.label}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-faint transition-transform duration-300 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
          Revenus du mois
        </p>
        <p
          className="mt-1 font-num text-4xl font-bold tracking-tight"
          style={{ textShadow: '0 0 20px rgba(124,111,255,0.3)' }}
        >
          {formatCurrency(total)}
        </p>
      </button>

      {/* Corps accordéon — objectif + ventilation par source. */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="space-y-4 px-5 pb-5 pt-4"
            style={{
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0 0 16px 16px',
              background: '#131929',
            }}
          >
            {/* Total / objectif */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p
                className="font-num text-2xl font-bold tracking-tight tabular-nums"
                style={{ color: BAR_COLOR }}
              >
                {formatCurrency(total)}
              </p>
              <span className="text-base text-muted">/</span>
              {editing ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                    className="w-28 rounded-lg border border-accent/40 bg-canvas px-2 py-1 pr-6 font-num text-lg font-bold text-ink outline-none transition-colors focus:border-accent"
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
                  className="group inline-flex items-baseline gap-1.5 rounded-md px-1 font-num text-lg font-bold tabular-nums text-muted transition-colors hover:text-ink"
                >
                  {formatCurrency(safeGoal)}
                  <Pencil className="h-3.5 w-3.5 self-center text-faint transition-colors group-hover:text-accent" />
                </button>
              )}
            </div>

            {/* Barre toujours verte. */}
            <div className="relative h-6 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: BAR_COLOR,
                  boxShadow: '0 0 12px rgba(0,229,160,0.35)',
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

            {/* Détail par source — label à gauche translucide, montant
                à droite en blanc bold. */}
            <ul className="space-y-2">
              {sources.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span
                      className="truncate text-sm"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {s.label}
                    </span>
                  </span>
                  <span className="font-num text-sm font-bold tabular-nums text-white">
                    {formatCurrency(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
