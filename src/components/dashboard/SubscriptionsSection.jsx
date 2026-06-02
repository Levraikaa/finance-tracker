import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { useIdrRate } from '../../hooks/useIdrRate.js'
import { CATEGORIES, EXPENSE_CATEGORIES, getCategory } from '../../lib/categories.js'
import { getCategoryColor } from '../../constants/categories.js'
import { formatCurrency, uid } from '../../lib/format.js'

const STORAGE_KEY = 'kaa_abonnements'
const DEFAULT_CATEGORY = 'abonnements'

const CURRENCIES = ['EUR', 'IDR']
const METHODS = [
  { id: 'compte', label: 'Compte', color: '#7C6FFF' },
  { id: 'cash', label: 'Cash', color: '#00E5A0' },
]

const METHOD_BY_ID = Object.fromEntries(METHODS.map((m) => [m.id, m]))

/* Pré-remplissage : abonnements de référence. Modifiables et
   supprimables ensuite par l'utilisateur. La majorité tombe sous
   « Abonnements », sauf Salle de sport qui pointe vers « Sport »
   pour que le débit alimente directement le budget Sport. */
const DEFAULTS = [
  { name: 'Loyer', amount: 0, currency: 'EUR', day: 1, method: 'compte', category: 'abonnements' },
  { name: 'Scooter', amount: 0, currency: 'IDR', day: 5, method: 'cash', category: 'abonnements' },
  { name: 'Revolut Metal', amount: 0, currency: 'EUR', day: 10, method: 'compte', category: 'abonnements' },
  { name: 'Forfait téléphone', amount: 0, currency: 'EUR', day: 15, method: 'compte', category: 'abonnements' },
  { name: 'iTunes', amount: 0, currency: 'EUR', day: 20, method: 'compte', category: 'abonnements' },
  { name: 'Salle de sport', amount: 0, currency: 'EUR', day: 1, method: 'compte', category: 'sport' },
]

const seedSubscriptions = () =>
  DEFAULTS.map((s) => ({ id: uid(), ...s }))

function formatIdr(value) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value) + ' IDR'
}

function formatOriginal(amount, currency) {
  if (currency === 'IDR') return formatIdr(amount)
  return formatCurrency(amount)
}

function toEur(amount, currency, idrRate) {
  if (currency === 'EUR') return amount
  if (currency === 'IDR' && typeof idrRate === 'number' && idrRate > 0) {
    return amount * idrRate
  }
  return null
}

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 [color-scheme:dark]'

function SubscriptionForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : '',
  )
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR')
  const [day, setDay] = useState(String(initial?.day ?? 1))
  const [method, setMethod] = useState(initial?.method ?? 'compte')
  const [category, setCategory] = useState(
    initial?.category ?? DEFAULT_CATEGORY,
  )

  const submit = (e) => {
    e.preventDefault()
    const a = parseFloat(String(amount).replace(',', '.'))
    const d = Math.min(31, Math.max(1, parseInt(day, 10) || 1))
    if (!name.trim() || !Number.isFinite(a) || a < 0) return
    onSubmit({
      name: name.trim(),
      amount: a,
      currency,
      day: d,
      method,
      category,
    })
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-line bg-canvas p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Netflix"
            className={FIELD}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Montant
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className={`${FIELD} font-num`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Devise
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={FIELD}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Jour
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={`${FIELD} font-num`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Moyen de paiement
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={FIELD}
          >
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={FIELD}
          >
            {EXPENSE_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
        >
          <Plus className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function SubscriptionRow({ sub, fx, onEdit, onDelete }) {
  const method = METHOD_BY_ID[sub.method] ?? METHODS[0]
  const categoryKey = sub.category || DEFAULT_CATEGORY
  const categoryLabel = getCategory(categoryKey).label
  const categoryColor = getCategoryColor(categoryKey)
  const eur = toEur(sub.amount, sub.currency, fx.rate)

  return (
    <li className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{sub.name}</p>
          <p className="mt-1 font-num text-base font-bold tabular-nums text-ink">
            {formatOriginal(sub.amount, sub.currency)}
          </p>
          {sub.currency === 'IDR' && (
            <p
              className="mt-0.5 font-num text-xs tabular-nums"
              style={{
                color:
                  eur != null
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.3)',
              }}
            >
              {eur != null
                ? `≈ ${formatCurrency(eur)}`
                : fx.status === 'loading'
                ? 'Conversion en cours…'
                : 'Taux indisponible'}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className="rounded-lg px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${categoryColor}26`,
              color: categoryColor,
            }}
          >
            {categoryLabel}
          </span>
          <span
            className="rounded-lg px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(255,184,77,0.15)',
              color: '#FFB84D',
            }}
          >
            Le {sub.day}
          </span>
          <span
            className="rounded-lg px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${method.color}26`,
              color: method.color,
            }}
          >
            {method.label}
          </span>
          <button
            type="button"
            onClick={() => onEdit(sub)}
            aria-label={`Modifier ${sub.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(sub.id)}
            aria-label={`Supprimer ${sub.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-negative"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}

export default function SubscriptionsSection() {
  const [subs, setSubs] = useLocalStorage(STORAGE_KEY, seedSubscriptions)
  const [mode, setMode] = useState(null) // null | 'add' | { id }
  const fx = useIdrRate()

  const editingSub = useMemo(
    () =>
      mode && mode.id ? subs.find((s) => s.id === mode.id) ?? null : null,
    [mode, subs],
  )

  const totals = useMemo(() => {
    let compte = 0
    let cash = 0
    let unknownIdr = false
    for (const s of subs) {
      const eur = toEur(s.amount, s.currency, fx.rate)
      if (eur == null) {
        unknownIdr = true
        continue
      }
      if (s.method === 'cash') cash += eur
      else compte += eur
    }
    return { compte, cash, total: compte + cash, unknownIdr }
  }, [subs, fx.rate])

  const addSub = (data) => {
    setSubs((prev) => [...prev, { id: uid(), ...data }])
    setMode(null)
  }
  const updateSub = (id, data) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
    setMode(null)
  }
  const deleteSub = (id) => {
    setSubs((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">
            Abonnements & Charges fixes
          </h2>
          <p className="text-xs text-muted">
            Tes prélèvements récurrents — IDR convertis en EUR au taux du jour.
          </p>
        </div>
        {mode === null && (
          <button
            type="button"
            onClick={() => setMode('add')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium transition-colors hover:bg-elevated"
          >
            <Plus className="h-4 w-4" />
            Ajouter un abonnement
          </button>
        )}
        {mode !== null && (
          <button
            type="button"
            onClick={() => setMode(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
            Fermer
          </button>
        )}
      </div>

      {mode === 'add' && (
        <div className="mt-4">
          <SubscriptionForm
            onSubmit={addSub}
            onCancel={() => setMode(null)}
            submitLabel="Ajouter"
          />
        </div>
      )}

      {editingSub && (
        <div className="mt-4">
          <SubscriptionForm
            initial={editingSub}
            onSubmit={(data) => updateSub(editingSub.id, data)}
            onCancel={() => setMode(null)}
            submitLabel="Mettre à jour"
          />
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {subs.length === 0 && (
          <li className="rounded-xl border border-dashed border-line bg-canvas px-4 py-10 text-center text-sm text-muted">
            Aucun abonnement enregistré.
          </li>
        )}
        {subs.map((sub) => (
          <SubscriptionRow
            key={sub.id}
            sub={sub}
            fx={fx}
            onEdit={(s) => setMode({ id: s.id })}
            onDelete={deleteSub}
          />
        ))}
      </ul>

      {/* Totaux du mois */}
      <div className="mt-5 grid gap-2 rounded-xl border border-line bg-canvas p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Compte courant</span>
          <span
            className="font-num font-semibold tabular-nums"
            style={{ color: '#7C6FFF' }}
          >
            {formatCurrency(totals.compte)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Cash</span>
          <span
            className="font-num font-semibold tabular-nums"
            style={{ color: '#00E5A0' }}
          >
            {formatCurrency(totals.cash)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-2">
          <span className="font-semibold text-ink">Total mensuel</span>
          <span className="font-num text-base font-bold tabular-nums text-ink">
            {formatCurrency(totals.total)}
          </span>
        </div>
        {totals.unknownIdr && (
          <p className="text-xs text-muted">
            Au moins une charge en IDR n’a pas pu être convertie (taux
            indisponible).
          </p>
        )}
      </div>
    </section>
  )
}
