import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

/* Modale d'ajout / de retrait de cash. `mode` vaut 'add' ou 'remove'. */
export default function CashModal({ mode, onClose }) {
  const { addCashMovement } = useFinance()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const isAdd = mode === 'add'

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(String(amount).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisissez un montant supérieur à 0.')
      return
    }
    addCashMovement({ type: mode, amount: value, description })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isAdd ? 'Ajouter du cash' : 'Retirer du cash'}
      description={
        isAdd
          ? 'Enregistrez une entrée d’argent liquide.'
          : 'Enregistrez une sortie d’argent liquide.'
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="cash-amount">
            Montant
          </label>
          <div className="relative">
            <input
              id="cash-amount"
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

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="cash-desc">
            Description <span className="text-faint">(optionnel)</span>
          </label>
          <input
            id="cash-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isAdd ? 'Ex. retrait DAB' : 'Ex. courses du marché'}
            className={FIELD}
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[10px] border border-line bg-canvas py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 rounded-[10px] bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            {isAdd ? 'Ajouter' : 'Retirer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
