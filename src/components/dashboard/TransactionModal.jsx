import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import DatePicker from './DatePicker.jsx'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../../lib/categories.js'

const todayISO = () => new Date().toISOString().slice(0, 10)

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

export default function TransactionModal({ open, onClose }) {
  const { addTransaction } = useFinance()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

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
    setCategory(EXPENSE_CATEGORIES[0])
    setDescription('')
    setDate(todayISO())
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(String(amount).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisissez un montant supérieur à 0.')
      return
    }
    addTransaction({ type, amount: value, category, description, date })
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

        {/* Montant */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="amount">
            Montant
          </label>
          <div className="relative">
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
              €
            </span>
          </div>
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
