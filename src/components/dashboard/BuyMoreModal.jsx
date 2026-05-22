import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { getCryptoMeta } from '../../lib/cryptos.js'
import { formatCurrency, formatNumber } from '../../lib/format.js'

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

const num = (v) => parseFloat(String(v).replace(',', '.'))

/* Modale « Acheter plus » — cumule une quantité sur une position existante.
   Le prix vient de CoinGecko (live) en lecture seule. */
export default function BuyMoreModal({ crypto, onClose }) {
  const { buyMoreCrypto } = useFinance()
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')

  const meta = getCryptoMeta(crypto.coin)
  const { prices, status } = useCryptoPrices(meta.geckoId ? [meta.geckoId] : [])
  /* Prix live pour une crypto connue, prix snapshot pour « Autre ». */
  const price = meta.geckoId ? prices[meta.geckoId] : crypto.snapshotPrice

  const qty = num(quantity)
  const cost =
    Number.isFinite(qty) && Number.isFinite(price) ? qty * price : null

  const submit = (e) => {
    e.preventDefault()
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Saisissez une quantité supérieure à 0.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Prix CoinGecko indisponible — patientez un instant.')
      return
    }
    buyMoreCrypto(crypto.id, qty, price)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Acheter plus de ${crypto.name}`}
      description="La quantité s’ajoute à votre position existante."
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Position actuelle */}
        <div className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm">
          <span className="text-muted">Position actuelle : </span>
          <span className="font-num font-semibold">
            {formatNumber(crypto.quantity, { maximumFractionDigits: 8 })}{' '}
            {meta.symbol || 'coins'}
          </span>
        </div>

        {/* Quantité à ajouter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="buy-qty">
            Quantité à ajouter
          </label>
          <input
            id="buy-qty"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value)
              setError('')
            }}
            placeholder="0,00"
            className={`${FIELD} font-num`}
            autoFocus
          />
        </div>

        {/* Prix actuel — lecture seule */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Prix actuel
          </label>
          <div className="rounded-lg border border-line bg-elevated px-3.5 py-2.5 font-num text-sm text-muted">
            {typeof price === 'number'
              ? formatCurrency(price)
              : status === 'error'
                ? 'Indisponible'
                : 'Chargement…'}
          </div>
        </div>

        {cost != null && cost > 0 && (
          <p className="text-xs text-muted">
            Coût de l’achat :{' '}
            <span className="font-num font-semibold text-ink">
              {formatCurrency(cost)}
            </span>
          </p>
        )}

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
            Confirmer
          </button>
        </div>
      </form>
    </Modal>
  )
}
