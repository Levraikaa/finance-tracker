import { useMemo, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency } from '../../lib/format.js'

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent/60'

/* Comptes éligibles à un transfert.
   `key` est aussi la valeur passée à `transferFunds`. */
const ACCOUNTS = [
  { key: 'bank', label: 'Solde bancaire' },
  { key: 'cash', label: 'Cash' },
  { key: 'fondsMonetaires', label: 'Fonds monétaires flexibles' },
  { key: 'cadeau', label: 'Cadeau' },
  { key: 'voyage', label: 'Voyage' },
]

const labelOf = (key) =>
  ACCOUNTS.find((a) => a.key === key)?.label ?? key

export default function TransferModal({ defaultTo, onClose }) {
  const { pockets, cashBalance, bankBalance, transferFunds } = useFinance()

  /* Source par défaut : le 1er compte qui n'est pas la destination. */
  const initialFrom = useMemo(
    () => ACCOUNTS.find((a) => a.key !== defaultTo)?.key ?? 'bank',
    [defaultTo],
  )

  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(defaultTo ?? 'fondsMonetaires')
  const [error, setError] = useState('')

  /* Sélection sans deadlock : si on choisit une valeur déjà prise par
     l'autre champ, on les permute (l'ancienne source devient destination,
     et inversement). Garantit que TOUS les sens sont composables. */
  const chooseFrom = (next) => {
    setError('')
    if (next === to) setTo(from)
    setFrom(next)
  }
  const chooseTo = (next) => {
    setError('')
    if (next === from) setFrom(to)
    setTo(next)
  }
  const swap = () => {
    setError('')
    setFrom(to)
    setTo(from)
  }

  const balances = useMemo(() => {
    const pocketAmount = (k) => pockets.find((p) => p.key === k)?.amount ?? 0
    return {
      bank: bankBalance,
      cash: cashBalance,
      fondsMonetaires: pocketAmount('fondsMonetaires'),
      cadeau: pocketAmount('cadeau'),
      voyage: pocketAmount('voyage'),
    }
  }, [pockets, cashBalance, bankBalance])

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(String(amount).replace(',', '.'))

    /* Diagnostic : valeurs exactes reçues au moment du confirm. */
    console.log(
      `[KAAFINANCE][Transfert] De = "${from}" (${labelOf(from)}) | ` +
        `Vers = "${to}" (${labelOf(to)}) | Montant = ${value}`,
    )

    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisissez un montant supérieur à 0.')
      return
    }
    if (from === to) {
      setError('La source et la destination doivent être différentes.')
      return
    }
    if (value > balances[from] + 0.0001) {
      setError(
        `Solde insuffisant sur ${labelOf(from)} (${formatCurrency(balances[from])}).`,
      )
      return
    }
    transferFunds(from, to, value)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Transfert entre comptes"
      description="Déplacez de l'argent entre vos pockets et vos liquidités."
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="transfer-amount"
          >
            Montant
          </label>
          <div className="relative">
            <input
              id="transfer-amount"
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

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="transfer-from"
            >
              De
            </label>
            <select
              id="transfer-from"
              value={from}
              onChange={(e) => chooseFrom(e.target.value)}
              className={FIELD}
            >
              {ACCOUNTS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label} — {formatCurrency(balances[a.key])}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden place-items-center pb-2 sm:grid">
            <button
              type="button"
              onClick={swap}
              aria-label="Inverser source et destination"
              className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="transfer-to"
            >
              Vers
            </label>
            <select
              id="transfer-to"
              value={to}
              onChange={(e) => chooseTo(e.target.value)}
              className={FIELD}
            >
              {ACCOUNTS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label} — {formatCurrency(balances[a.key])}
                </option>
              ))}
            </select>
          </div>
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
            className="flex-1 rounded-[10px] py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
            style={{
              background: '#7C6FFF',
              boxShadow: '0 0 30px rgba(124,111,255,0.5)',
            }}
          >
            Confirmer le transfert
          </button>
        </div>
      </form>
    </Modal>
  )
}
