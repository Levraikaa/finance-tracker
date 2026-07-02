import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import SubscriptionsSection from './SubscriptionsSection.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { useUpcomingSubscriptions } from '../../hooks/useUpcomingSubscriptions.js'
import { EXPENSE_CATEGORIES, getCategory } from '../../lib/categories.js'
import { formatCurrency, formatDate, formatPercent, monthKey } from '../../lib/format.js'
import { budgetStatus } from '../../lib/selectors.js'
import {
  daysUntilLabel,
  formatSubscriptionAmount,
} from '../../lib/subscriptions.js'

const AMBER = '#FFB84D'
const RED = '#FF4D6A'

/* Couleur « santé » du budget : rouge si dépassé, ambre si proche (≥80%),
   sinon la couleur de la catégorie. */
function toneColor(ratio, categoryColor) {
  if (ratio >= 1) return RED
  if (ratio >= 0.8) return AMBER
  return categoryColor
}

/* Petite notification (cloche + badge) — remplace l'ancien gros bandeau.
   Le détail des prélèvements imminents s'ouvre dans un popover au clic. */
function UpcomingBell({ upcoming }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hasToday = upcoming.some((s) => s.isToday)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (upcoming.length === 0) return null
  const accent = hasToday ? RED : AMBER

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-3 text-xs font-semibold transition-[filter] hover:brightness-110"
        style={{
          color: accent,
          borderColor: `${accent}59`,
          background: `${accent}1a`,
        }}
      >
        <span className="relative">
          <Bell className="h-4 w-4" />
          <span
            className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] font-bold text-canvas"
            style={{ background: accent }}
          >
            {upcoming.length}
          </span>
        </span>
        <span className="hidden sm:inline">
          {upcoming.length} prélèvement{upcoming.length > 1 ? 's' : ''} sous 3 j
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-line bg-elevated p-2 shadow-xl shadow-black/40"
        >
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
            Prélèvements imminents
          </p>
          <ul className="space-y-0.5">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {s.name}
                  </p>
                  <p className="text-xs capitalize text-faint">
                    {formatDate(s.nextDate, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-num text-sm font-semibold tabular-nums text-ink">
                    {formatSubscriptionAmount(s)}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: s.isToday ? RED : AMBER,
                      background: `${s.isToday ? RED : AMBER}1a`,
                    }}
                  >
                    {daysUntilLabel(s.daysUntil)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function BudgetsView({ month }) {
  const { budgets, transactions, upsertBudget, deleteBudget } = useFinance()
  const { getDisplay } = useCategoryOverrides()
  const upcoming = useUpcomingSubscriptions()
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
      {/* En-tête : titre + notification abonnements imminents */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold">Budgets</h1>
        <UpcomingBell upcoming={upcoming} />
      </div>

      {/* Résumé + barre de progression globale */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted">Budget total</p>
            <p className="mt-1 font-num text-xl font-bold tabular-nums">
              {formatCurrency(summary.totalLimit, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Dépensé</p>
            <p className="mt-1 font-num text-xl font-bold tabular-nums text-negative">
              {formatCurrency(summary.totalSpent, { compact: true })}
            </p>
          </div>
          <div className="text-right">
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
        {summary.totalLimit > 0 && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(summary.ratio, 1) * 100}%`,
                background: toneColor(summary.ratio, 'var(--color-accent)'),
              }}
            />
          </div>
        )}
      </div>

      {/* Cartes de budget — compactes */}
      {status.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface px-4 py-14 text-center">
          <p className="text-sm text-muted">
            Aucun budget défini. Ajoutes-en un ci-dessous pour suivre tes
            dépenses.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {status.map((b) => {
            const cat = getCategory(b.category)
            const disp = getDisplay(b.category)
            const color = disp.color
            const over = b.ratio >= 1
            const tone = toneColor(b.ratio, color)
            return (
              <div
                key={b.id}
                className="group rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${color}26`, color }}
                  >
                    <CategoryIcon name={cat.icon} className="h-4 w-4" />
                  </span>
                  <p
                    className="min-w-0 flex-1 truncate text-sm font-semibold"
                    style={{ color }}
                  >
                    {disp.name}
                  </p>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 font-num text-[11px] font-bold tabular-nums"
                    style={{ color: tone, background: `${tone}1a` }}
                  >
                    {formatPercent(b.ratio, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteBudget(b.id)}
                    aria-label={`Supprimer le budget ${disp.name}`}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-faint opacity-0 transition-all hover:text-negative focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-num text-base font-bold tabular-nums">
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="font-num text-xs text-faint">
                    / {formatCurrency(b.limit)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(b.ratio, 1) * 100}%`,
                      backgroundColor: tone,
                    }}
                  />
                </div>

                <p
                  className={`mt-2 font-num text-[11px] font-medium ${
                    over ? 'text-negative' : 'text-muted'
                  }`}
                >
                  {over
                    ? `Dépassé de ${formatCurrency(-b.remaining)}`
                    : `${formatCurrency(b.remaining)} restants`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Ajouter / modifier un budget — compact */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-line bg-surface p-4"
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-sm font-semibold">
            {editing ? 'Modifier un budget' : 'Définir un budget'}
          </h2>
          <p className="text-xs text-faint">Limite mensuelle par catégorie</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <select
            value={category}
            onChange={(e) => pickCategory(e.target.value)}
            className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent/60 sm:flex-1 [color-scheme:dark]"
          >
            {EXPENSE_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {getDisplay(key).name}
              </option>
            ))}
          </select>
          <div className="relative sm:w-40">
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Limite"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 pr-8 font-num text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-faint">
              €
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            <Plus className="h-4 w-4" />
            {editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>

      {/* Abonnements & charges fixes */}
      <SubscriptionsSection />
    </div>
  )
}
