import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import DatePicker from './DatePicker.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { CRYPTO_CATALOG, getCryptoMeta } from '../../lib/cryptos.js'
import { formatCurrency } from '../../lib/format.js'

const todayISO = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

const num = (v) => parseFloat(String(v).replace(',', '.'))

/* Modale d'ajout / d'édition d'une crypto.
   Le prix est récupéré automatiquement depuis CoinGecko ; au moment de
   l'ajout il est figé (snapshot) pour servir de base à la performance. */
export default function CryptoModal({ crypto, onClose }) {
  const { addCrypto, updateCrypto } = useFinance()
  const editing = Boolean(crypto)

  const [coin, setCoin] = useState(() => crypto?.coin ?? CRYPTO_CATALOG[0].key)
  const [name, setName] = useState(() => crypto?.name ?? '')
  const [quantity, setQuantity] = useState(() =>
    crypto ? String(crypto.quantity) : '',
  )
  const [manualPrice, setManualPrice] = useState(() =>
    crypto?.snapshotPrice ? String(crypto.snapshotPrice) : '',
  )
  const [stakingOn, setStakingOn] = useState(
    () => crypto?.staking?.enabled ?? false,
  )
  const [rate, setRate] = useState(() =>
    crypto?.staking?.rate ? String(crypto.staking.rate) : '',
  )
  const [startDate, setStartDate] = useState(
    () => crypto?.staking?.startDate || todayISO(),
  )
  const [error, setError] = useState('')

  const meta = getCryptoMeta(coin)
  const isAutre = !meta.geckoId

  /* Prix live de la crypto sélectionnée (rafraîchi tant que la modale est
     ouverte). Pour « Autre » : pas de flux, prix saisi manuellement. */
  const { prices, status: priceStatus } = useCryptoPrices(
    meta.geckoId ? [meta.geckoId] : [],
  )
  const livePrice = meta.geckoId ? prices[meta.geckoId] : undefined

  const qty = num(quantity)
  const unitPrice = isAutre ? num(manualPrice) : livePrice
  const positionValue =
    Number.isFinite(qty) && Number.isFinite(unitPrice) ? qty * unitPrice : null

  const submit = (e) => {
    e.preventDefault()
    if (isAutre && !name.trim()) {
      setError('Donnez un nom à cette crypto.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Saisissez une quantité supérieure à 0.')
      return
    }

    let snapshotPrice
    if (isAutre) {
      snapshotPrice = num(manualPrice)
      if (!Number.isFinite(snapshotPrice) || snapshotPrice <= 0) {
        setError('Saisissez le prix actuel de la crypto.')
        return
      }
    } else if (editing) {
      /* On conserve le snapshot d'origine — la base ne doit pas bouger. */
      snapshotPrice = crypto.snapshotPrice
    } else {
      if (typeof livePrice !== 'number') {
        setError('Prix CoinGecko indisponible — patientez un instant.')
        return
      }
      snapshotPrice = livePrice
    }

    let stakingRate = 0
    if (stakingOn) {
      stakingRate = num(rate)
      if (!Number.isFinite(stakingRate) || stakingRate <= 0) {
        setError('Saisissez un taux de staking supérieur à 0.')
        return
      }
    }

    const data = {
      coin,
      name: isAutre ? name.trim() : meta.name,
      quantity: qty,
      snapshotPrice,
      staking: {
        enabled: stakingOn,
        rate: stakingRate,
        startDate: stakingOn ? startDate : '',
      },
    }
    if (editing) updateCrypto(crypto.id, data)
    else addCrypto(data)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Modifier la crypto' : 'Ajouter une crypto'}
      description="Suivez une position de votre portefeuille crypto."
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Crypto + prix actuel en lecture seule */}
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="crypto-coin"
          >
            Crypto
          </label>
          {editing ? (
            <div className="rounded-lg border border-line bg-elevated px-3.5 py-2.5 text-sm text-muted">
              {meta.name}
              {meta.symbol ? ` (${meta.symbol})` : ''}
            </div>
          ) : (
            <select
              id="crypto-coin"
              value={coin}
              onChange={(e) => {
                setCoin(e.target.value)
                setError('')
              }}
              className={`${FIELD} [color-scheme:dark]`}
            >
              {CRYPTO_CATALOG.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key === 'autre' ? 'Autre' : `${c.name} (${c.symbol})`}
                </option>
              ))}
            </select>
          )}
          {!isAutre && (
            <p className="mt-1.5 text-xs text-muted">
              {typeof livePrice === 'number'
                ? `Prix actuel : ${formatCurrency(livePrice)}`
                : priceStatus === 'error'
                  ? 'Prix actuel : indisponible'
                  : 'Prix actuel : chargement…'}
            </p>
          )}
        </div>

        {/* Nom — uniquement pour « Autre » */}
        {isAutre && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="crypto-name"
            >
              Nom
            </label>
            <input
              id="crypto-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Ex. Litecoin"
              className={FIELD}
            />
          </div>
        )}

        {/* Prix manuel — « Autre » n'a pas de flux CoinGecko */}
        {isAutre && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="crypto-price"
            >
              Prix actuel
            </label>
            <div className="relative">
              <input
                id="crypto-price"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={manualPrice}
                onChange={(e) => {
                  setManualPrice(e.target.value)
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
        )}

        {/* Quantité + valeur de la position calculée en direct */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="crypto-qty">
            Quantité de coins
          </label>
          <input
            id="crypto-qty"
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
          />
          {positionValue != null && positionValue > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Valeur de la position :{' '}
              <span className="font-num font-semibold text-ink">
                {formatCurrency(positionValue)}
              </span>
            </p>
          )}
        </div>

        {/* Staking */}
        <div className="rounded-lg border border-line bg-canvas p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">En staking</p>
              <p className="text-xs text-muted">
                Calcule les intérêts accumulés.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={stakingOn}
              aria-label="Activer le staking"
              onClick={() => setStakingOn((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                stakingOn ? 'bg-accent' : 'bg-elevated'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  stakingOn ? 'left-[1.375rem]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {stakingOn && (
            <div className="mt-3.5 space-y-3.5 border-t border-line-soft pt-3.5">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="crypto-rate"
                >
                  Taux annuel
                </label>
                <div className="relative">
                  <input
                    id="crypto-rate"
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value)
                      setError('')
                    }}
                    placeholder="4.5"
                    className={`${FIELD} pr-9 font-num`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Date de début
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  max={todayISO()}
                />
              </div>
            </div>
          )}
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
            {editing ? 'Mettre à jour' : 'Confirmer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
