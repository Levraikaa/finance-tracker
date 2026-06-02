import { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { formatCurrency, monthKey, uid } from '../../lib/format.js'

const STORAGE_KEY = 'kaa_irys_agency'

const EXPENSE_CATEGORIES = [
  { id: 'outils', label: 'Outils' },
  { id: 'logiciels', label: 'Logiciels' },
  { id: 'sousTraitance', label: 'Sous-traitance' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'autre', label: 'Autre' },
]
const EXPENSE_LABEL = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.id, c.label]),
)

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

const todayISO = () => new Date().toISOString().slice(0, 10)

const seedData = () => ({ prestations: [], expenses: [] })

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 [color-scheme:dark]'

function SummaryCard({ icon: Icon, label, value, sub, valueColor, accent = '#7C6FFF' }) {
  return (
    <div
      className="rounded-2xl border border-line p-5"
      style={{
        background: 'linear-gradient(135deg, #131929 0%, #1a1f35 100%)',
        borderLeftWidth: '3px',
        borderLeftColor: accent,
        boxShadow: '0 8px 32px rgba(124,111,255,0.08)',
      }}
    >
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent">
          <Icon className="h-[22px] w-[22px]" />
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-num text-3xl font-bold tracking-tight ${valueColor || ''}`}
        style={{ textShadow: '0 0 20px rgba(124,111,255,0.3)' }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
    </div>
  )
}

function PrestationForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [client, setClient] = useState(initial?.client ?? '')
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : '',
  )
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? todayISO())
  const [status, setStatus] = useState(initial?.status ?? 'paid')

  const submit = (e) => {
    e.preventDefault()
    const a = parseFloat(String(amount).replace(',', '.'))
    if (!client.trim() || !Number.isFinite(a) || a <= 0) return
    onSubmit({ client: client.trim(), amount: a, date, status })
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-canvas p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Client</label>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Ex. Nike France"
            className={FIELD}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Montant</label>
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
          <label className="mb-1 block text-xs font-medium text-muted">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${FIELD} font-num`}
          />
        </div>
        <div className="lg:col-span-4">
          <label className="mb-1 block text-xs font-medium text-muted">Statut</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'paid', label: 'Payé', color: '#00E5A0' },
              { id: 'pending', label: 'En attente', color: '#FFB84D' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                style={
                  status === s.id
                    ? {
                        borderColor: s.color,
                        backgroundColor: `${s.color}1A`,
                        color: s.color,
                      }
                    : {
                        borderColor: 'var(--color-line)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-muted)',
                      }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
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

function ExpenseForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : '',
  )
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? todayISO())
  const [category, setCategory] = useState(
    initial?.category ?? EXPENSE_CATEGORIES[0].id,
  )

  const submit = (e) => {
    e.preventDefault()
    const a = parseFloat(String(amount).replace(',', '.'))
    if (!name.trim() || !Number.isFinite(a) || a <= 0) return
    onSubmit({ name: name.trim(), amount: a, date, category })
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-canvas p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Figma Pro"
            className={FIELD}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Montant</label>
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
          <label className="mb-1 block text-xs font-medium text-muted">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${FIELD} font-num`}
          />
        </div>
        <div className="lg:col-span-4">
          <label className="mb-1 block text-xs font-medium text-muted">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={FIELD}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
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

/* Calcule les séries mensuelles sur 12 mois (mois courant inclus). */
function buildYearlySeries(prestations, expenses, refDate = new Date()) {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
    months.push({
      key: monthKey(d),
      label: MONTH_LABELS[d.getMonth()],
      ca: 0,
      depenses: 0,
      net: 0,
    })
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]))

  for (const p of prestations) {
    if (p.status !== 'paid') continue
    const k = monthKey(p.date)
    if (byKey[k]) byKey[k].ca += Number(p.amount) || 0
  }
  for (const e of expenses) {
    const k = monthKey(e.date)
    if (byKey[k]) byKey[k].depenses += Number(e.amount) || 0
  }
  for (const m of months) m.net = m.ca - m.depenses
  return months
}

export default function IrysAgencyView({ month }) {
  const [data, setData] = useLocalStorage(STORAGE_KEY, seedData)
  const { transactions } = useFinance()
  const [prestationMode, setPrestationMode] = useState(null) // null | 'add' | { id }
  const [expenseMode, setExpenseMode] = useState(null)

  const prestations = data.prestations ?? []
  const expenses = data.expenses ?? []

  const curKey = monthKey(month)
  const stats = useMemo(() => {
    const inMonth = (list) => list.filter((x) => monthKey(x.date) === curKey)
    const ca = inMonth(prestations)
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const depenses = inMonth(expenses).reduce(
      (s, e) => s + (Number(e.amount) || 0),
      0,
    )
    const verse = transactions
      .filter(
        (t) =>
          t.type === 'income' &&
          t.category === 'irysAgency' &&
          monthKey(t.date) === curKey,
      )
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return { ca, depenses, net: ca - depenses, verse }
  }, [prestations, expenses, transactions, curKey])

  const yearlySeries = useMemo(
    () => buildYearlySeries(prestations, expenses, month),
    [prestations, expenses, month],
  )

  const sortedPrestations = useMemo(
    () =>
      [...prestations].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [prestations],
  )
  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [expenses],
  )

  const editingPrestation =
    prestationMode && prestationMode.id
      ? prestations.find((p) => p.id === prestationMode.id) ?? null
      : null
  const editingExpense =
    expenseMode && expenseMode.id
      ? expenses.find((e) => e.id === expenseMode.id) ?? null
      : null

  const addPrestation = (p) => {
    setData((prev) => ({
      ...prev,
      prestations: [{ id: uid(), ...p }, ...(prev.prestations ?? [])],
    }))
    setPrestationMode(null)
  }
  const updatePrestation = (id, p) => {
    setData((prev) => ({
      ...prev,
      prestations: (prev.prestations ?? []).map((x) =>
        x.id === id ? { ...x, ...p } : x,
      ),
    }))
    setPrestationMode(null)
  }
  const deletePrestation = (id) => {
    setData((prev) => ({
      ...prev,
      prestations: (prev.prestations ?? []).filter((x) => x.id !== id),
    }))
  }
  const togglePrestationStatus = (id) => {
    setData((prev) => ({
      ...prev,
      prestations: (prev.prestations ?? []).map((x) =>
        x.id === id
          ? { ...x, status: x.status === 'paid' ? 'pending' : 'paid' }
          : x,
      ),
    }))
  }

  const addExpense = (e) => {
    setData((prev) => ({
      ...prev,
      expenses: [{ id: uid(), ...e }, ...(prev.expenses ?? [])],
    }))
    setExpenseMode(null)
  }
  const updateExpense = (id, e) => {
    setData((prev) => ({
      ...prev,
      expenses: (prev.expenses ?? []).map((x) =>
        x.id === id ? { ...x, ...e } : x,
      ),
    }))
    setExpenseMode(null)
  }
  const deleteExpense = (id) => {
    setData((prev) => ({
      ...prev,
      expenses: (prev.expenses ?? []).filter((x) => x.id !== id),
    }))
  }

  const netPositive = stats.net >= 0

  return (
    <div className="space-y-5">
      {/* Cards récap */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          accent="#7C6FFF"
          label="CA du mois"
          value={formatCurrency(stats.ca)}
          sub="Prestations payées"
        />
        <SummaryCard
          icon={TrendingDown}
          accent="#FF4D6A"
          label="Dépenses agence"
          value={formatCurrency(stats.depenses)}
          sub="Outils, logiciels, etc."
        />
        <SummaryCard
          icon={Activity}
          accent={netPositive ? '#00E5A0' : '#FF4D6A'}
          label="Net du mois"
          value={formatCurrency(stats.net)}
          valueColor={netPositive ? 'text-positive' : 'text-negative'}
          sub={netPositive ? 'Excédent' : 'Déficit'}
        />
        <SummaryCard
          icon={Wallet}
          accent="#00E5A0"
          label="Versé perso"
          value={formatCurrency(stats.verse)}
          sub="Revenus Irys Agency"
        />
      </div>

      {/* Graphique 12 mois */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-2">
          <h2 className="font-display text-base font-semibold">
            12 derniers mois
          </h2>
          <p className="text-xs text-muted">
            CA en violet, dépenses en rouge, net en vert.
          </p>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={yearlySeries}
              margin={{ top: 12, right: 8, left: -10, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                tickFormatter={(v) =>
                  formatCurrency(v, { compact: true }).replace(/\s/g, '')
                }
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  backgroundColor: '#1a1f35',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.55)' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
              />
              <Bar dataKey="ca" name="CA" fill="#7C6FFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#FF4D6A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net" fill="#00E5A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prestations */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Prestations</h2>
            <p className="text-xs text-muted">
              Seules les prestations payées comptent dans le CA.
            </p>
          </div>
          {prestationMode === null ? (
            <button
              type="button"
              onClick={() => setPrestationMode('add')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium transition-colors hover:bg-elevated"
            >
              <Plus className="h-4 w-4" />
              Ajouter une prestation
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPrestationMode(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
              Fermer
            </button>
          )}
        </div>

        {prestationMode === 'add' && (
          <div className="mt-4">
            <PrestationForm
              onSubmit={addPrestation}
              onCancel={() => setPrestationMode(null)}
              submitLabel="Ajouter"
            />
          </div>
        )}
        {editingPrestation && (
          <div className="mt-4">
            <PrestationForm
              initial={editingPrestation}
              onSubmit={(p) => updatePrestation(editingPrestation.id, p)}
              onCancel={() => setPrestationMode(null)}
              submitLabel="Mettre à jour"
            />
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {sortedPrestations.length === 0 ? (
            <li className="rounded-xl border border-dashed border-line bg-canvas px-4 py-10 text-center text-sm text-muted">
              Aucune prestation enregistrée.
            </li>
          ) : (
            sortedPrestations.map((p) => {
              const paid = p.status === 'paid'
              const statusColor = paid ? '#00E5A0' : '#FFB84D'
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {p.client}
                    </p>
                    <p className="mt-1 font-num text-base font-bold tabular-nums text-ink">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(p.date))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePrestationStatus(p.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: `${statusColor}26`,
                        color: statusColor,
                      }}
                    >
                      {paid ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {paid ? 'Payé' : 'En attente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrestationMode({ id: p.id })}
                      aria-label={`Modifier ${p.client}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-accent/40 hover:text-accent"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePrestation(p.id)}
                      aria-label={`Supprimer ${p.client}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-negative"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </section>

      {/* Dépenses agence */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              Dépenses agence
            </h2>
            <p className="text-xs text-muted">
              Outils, logiciels, sous-traitance, marketing.
            </p>
          </div>
          {expenseMode === null ? (
            <button
              type="button"
              onClick={() => setExpenseMode('add')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium transition-colors hover:bg-elevated"
            >
              <Plus className="h-4 w-4" />
              Ajouter une dépense
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpenseMode(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
              Fermer
            </button>
          )}
        </div>

        {expenseMode === 'add' && (
          <div className="mt-4">
            <ExpenseForm
              onSubmit={addExpense}
              onCancel={() => setExpenseMode(null)}
              submitLabel="Ajouter"
            />
          </div>
        )}
        {editingExpense && (
          <div className="mt-4">
            <ExpenseForm
              initial={editingExpense}
              onSubmit={(e) => updateExpense(editingExpense.id, e)}
              onCancel={() => setExpenseMode(null)}
              submitLabel="Mettre à jour"
            />
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {sortedExpenses.length === 0 ? (
            <li className="rounded-xl border border-dashed border-line bg-canvas px-4 py-10 text-center text-sm text-muted">
              Aucune dépense enregistrée.
            </li>
          ) : (
            sortedExpenses.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {e.name}
                  </p>
                  <p className="mt-1 font-num text-base font-bold tabular-nums text-ink">
                    {formatCurrency(e.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {EXPENSE_LABEL[e.category] ?? 'Autre'} ·{' '}
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(e.date))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseMode({ id: e.id })}
                    aria-label={`Modifier ${e.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExpense(e.id)}
                    aria-label={`Supprimer ${e.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-negative"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
