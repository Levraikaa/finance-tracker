import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import DatePicker from './DatePicker.jsx'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useIdrRate } from '../../hooks/useIdrRate.js'
import { formatCurrency } from '../../lib/format.js'
import {
  CATEGORIES,
  DEBT_CATEGORY,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../../lib/categories.js'

const todayISO = () => new Date().toISOString().slice(0, 10)

/* Devises saisissables. Tout est stocké en EUR : un montant en IDR est
   converti au taux du jour (useIdrRate) au moment de l'enregistrement,
   comme pour les abonnements. */
const CURRENCIES = ['EUR', 'IDR']
const CURRENCY_SYMBOL = { EUR: '€', IDR: 'Rp' }

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

export default function TransactionModal({ open, onClose }) {
  const { addTransaction } = useFinance()
  const fx = useIdrRate()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [paymentMethod, setPaymentMethod] = useState('compte')
  const [description, setDescription] = useState('')
  const [debtPerson, setDebtPerson] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  /* Prêt d'argent : la catégorie « Dette » demande le nom de la personne et
     alimente la liste des dettes en plus de la transaction. */
  const isDebt = type === 'expense' && category === DEBT_CATEGORY

  /* Montant saisi converti en EUR (null si IDR sans taux disponible). */
  const rawAmount = parseFloat(String(amount).replace(',', '.'))
  const eurAmount =
    !Number.isFinite(rawAmount)
      ? null
      : currency === 'EUR'
      ? rawAmount
      : fx.status === 'ok' && fx.rate > 0
      ? rawAmount * fx.rate
      : null

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const switchType = (next) => {
    setType(next)
    setCategory(
      next === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    )
    setError('')
  }

  const reset = () => {
    setType('expense')
    setAmount('')
    setCurrency('EUR')
    setCategory(EXPENSE_CATEGORIES[0])
    setPaymentMethod('compte')
    setDescription('')
    setDebtPerson('')
    setDate(todayISO())
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      setError('Saisissez un montant supérieur à 0.')
      return
    }
    if (currency === 'IDR' && eurAmount == null) {
      setError('Taux IDR indisponible pour le moment, réessaie dans un instant.')
      return
    }
    if (isDebt && !debtPerson.trim()) {
      setError('Indique à qui tu prêtes cet argent.')
      return
    }
    addTransaction({
      type,
      amount: eurAmount,
      category,
      description,
      date,
      paymentMethod,
      currency,
      /* Montant natif à ranger dans le pocket cash : en IDR pour un cash IDR,
         sinon le montant en euros. */
      cashAmount: currency === 'IDR' ? rawAmount : eurAmount,
      /* Catégorie « Dette » : crée aussi l'entrée dans la liste des dettes. */
      debtPerson: isDebt ? debtPerson : '',
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nouvelle transaction"
      description="Ajoutez un revenu ou une dépense à votre suivi."
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Type */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-canvas p-1">
          {[
            { id: 'expense', label: 'Dépense' },
            { id: 'income', label: 'Revenu' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => switchType(opt.id)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                type === opt.id
                  ? opt.id === 'income'
                    ? 'bg-positive/15 text-positive'
                    : 'bg-negative/15 text-negative'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Montant + devise */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="amount">
            Montant
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                }}
                placeholder="0,00"
                className={`${FIELD} pr-9 font-num`}
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
                {CURRENCY_SYMBOL[currency]}
              </span>
            </div>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                setError('')
              }}
              aria-label="Devise"
              className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent/60 [color-scheme:dark]"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {currency === 'IDR' && (
            <p className="mt-1.5 text-xs text-muted">
              {eurAmount != null
                ? `≈ ${formatCurrency(eurAmount)} au taux du jour`
                : fx.status === 'loading'
                ? 'Récupération du taux IDR…'
                : 'Taux IDR indisponible pour le moment.'}
            </p>
          )}
        </div>

        {/* Compte vs cash — moyen de paiement pour une dépense, destination
            de l'argent reçu pour un revenu. */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {type === 'income' ? 'Destination' : 'Moyen de paiement'}
          </label>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-canvas p-1">
            {[
              {
                id: 'compte',
                label: type === 'income' ? 'Compte bancaire' : 'Compte courant',
                color: '#7C6FFF',
              },
              { id: 'cash', label: 'Cash', color: '#FFB84D' },
            ].map((opt) => {
              const active = paymentMethod === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    active ? '' : 'text-muted hover:text-ink'
                  }`}
                  style={
                    active
                      ? { backgroundColor: `${opt.color}26`, color: opt.color }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {type === 'income' && paymentMethod === 'cash' && (
            <p className="mt-1.5 text-xs text-muted">
              Ce revenu ira dans ton pocket Cash{' '}
              {currency === 'IDR' ? 'IDR' : '€'} et s'ajoutera au cash existant
              (le compte bancaire n'est pas affecté).
            </p>
          )}
        </div>

        {/* Catégorie */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Catégorie</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((key) => {
              const cat = CATEGORIES[key]
              const selected = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-line bg-canvas text-muted hover:text-ink'
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
                    <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Catégorie « Dette » : à qui on prête */}
        {isDebt && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="debt-tx-person"
            >
              À qui prêtes-tu ?
            </label>
            <input
              id="debt-tx-person"
              type="text"
              value={debtPerson}
              onChange={(e) => {
                setDebtPerson(e.target.value)
                setError('')
              }}
              placeholder="Ex. Paul"
              className={FIELD}
            />
            <p className="mt-1.5 text-xs text-muted">
              Le montant sortira de ton solde et cette personne apparaîtra dans
              tes dettes sur la page d'accueil.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="description"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Courses de la semaine"
            className={FIELD}
          />
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Date</label>
          <DatePicker value={date} max={todayISO()} onChange={setDate} />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-[10px] border border-line bg-canvas py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 rounded-[10px] bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}
