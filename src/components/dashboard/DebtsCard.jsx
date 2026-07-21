import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, formatDateShort } from '../../lib/format.js'

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

/* Carte « Dettes » — les personnes qui doivent de l'argent à l'utilisateur.
   Suivi informatif : marquer une dette comme remboursée la retire de la liste
   (le remboursement se saisit ensuite comme une transaction si besoin). */
export default function DebtsCard() {
  const { debts, addDebt, deleteDebt } = useFinance()
  const [open, setOpen] = useState(false)
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const total = debts.reduce((s, d) => s + d.amount, 0)

  const reset = () => {
    setPerson('')
    setAmount('')
    setNote('')
    setError('')
  }
  const close = () => {
    reset()
    setOpen(false)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!person.trim()) {
      setError('Indique qui te doit de l’argent.')
      return
    }
    const value = parseFloat(String(amount).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisis un montant supérieur à 0.')
      return
    }
    addDebt({ person, amount: value, note })
    close()
  }

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
        <h2 className="font-display text-base font-semibold">Dettes</h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="p-5">
        {debts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Personne ne te doit d’argent.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-muted">On te doit</p>
              <p className="mt-0.5 font-num text-2xl font-bold tabular-nums text-positive">
                {formatCurrency(total)}
              </p>
            </div>
            <ul className="divide-y divide-line-soft">
              {debts.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.person}</p>
                    <p className="truncate text-xs text-muted">
                      {d.note ? `${d.note} · ` : ''}
                      {formatDateShort(d.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-num text-sm font-semibold tabular-nums text-positive">
                      {formatCurrency(d.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteDebt(d.id)}
                      aria-label={`Marquer la dette de ${d.person} comme remboursée`}
                      title="Marquer comme remboursée"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-line text-faint transition-colors hover:border-positive/40 hover:text-positive"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={close}
        title="Ajouter une dette"
        description="Quelqu’un te doit de l’argent ?"
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="debt-person"
            >
              Qui te doit ?
            </label>
            <input
              id="debt-person"
              type="text"
              value={person}
              onChange={(e) => {
                setPerson(e.target.value)
                setError('')
              }}
              placeholder="Ex. Paul"
              className={FIELD}
              autoFocus
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="debt-amount"
            >
              Montant
            </label>
            <div className="relative">
              <input
                id="debt-amount"
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
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
                €
              </span>
            </div>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="debt-note"
            >
              Motif <span className="text-faint">(optionnel)</span>
            </label>
            <input
              id="debt-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. restaurant"
              className={FIELD}
            />
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
    </div>
  )
}
