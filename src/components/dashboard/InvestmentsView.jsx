import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowLeftRight,
  Banknote,
  Bitcoin,
  Check,
  Coins,
  Gift,
  Pencil,
  Plane,
  Plus,
  Wallet,
} from 'lucide-react'
import PortfolioChart from './PortfolioChart.jsx'
import CryptoCard from './CryptoCard.jsx'
import CryptoModal from './CryptoModal.jsx'
import BuyMoreModal from './BuyMoreModal.jsx'
import TransferModal from './TransferModal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { getCryptoMeta, stakingInterest } from '../../lib/cryptos.js'
import { formatCurrency, formatPercent } from '../../lib/format.js'

const FONDS_MONETAIRES_APY = 0.0201

/* Indicateur discret de fraîcheur des prix — recompte chaque seconde. */
function PriceStatus({ status, lastUpdated }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  if (status === 'idle') return null

  let dot = 'bg-accent'
  let text = 'Mise à jour des prix…'
  if (status === 'error') {
    dot = 'bg-negative'
    text = 'Hors ligne — nouvelle tentative en cours'
  } else if (status === 'ok' && lastUpdated) {
    const secs = Math.max(0, Math.round((Date.now() - lastUpdated) / 1000))
    dot = 'bg-positive'
    text = `Prix mis à jour il y a ${secs} s`
  }

  return (
    <div className="fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-line bg-canvas/85 px-3 py-1.5 text-xs text-muted backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {text}
    </div>
  )
}

/* Carte d'un pocket avec édition inline du solde + APY optionnel.
   `onTransfer` reçoit la clé de la destination pré-remplie. */
function PocketEditCard({
  icon: Icon,
  name,
  amount,
  onSave,
  onTransfer,
  showApy = false,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const startEdit = () => {
    setDraft(amount ? String(amount) : '')
    setEditing(true)
  }

  const commit = () => {
    const value = parseFloat(String(draft).replace(',', '.'))
    onSave(Number.isFinite(value) ? value : 0)
    setEditing(false)
  }

  const cancel = () => {
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  const monthly = amount * FONDS_MONETAIRES_APY / 12
  const yearly = amount * FONDS_MONETAIRES_APY

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#131929',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <p className="truncate text-sm font-medium text-ink">{name}</p>
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            {onTransfer && (
              <button
                type="button"
                onClick={onTransfer}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transférer
              </button>
            )}
            <button
              type="button"
              onClick={startEdit}
              aria-label={`Modifier le solde de ${name}`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-canvas text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commit}
                placeholder="0,00"
                className="w-full rounded-lg border border-accent/40 bg-canvas px-3 py-2 pr-8 font-num text-lg font-bold text-ink outline-none transition-colors focus:border-accent"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-faint">
                €
              </span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
              aria-label="Valider le solde"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-dim"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="font-num text-2xl font-bold tracking-tight text-ink">
            {formatCurrency(amount)}
          </p>
        )}
      </div>

      {showApy && (
        <dl
          className="mt-4 space-y-1.5 border-t pt-3 text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <dt style={{ color: 'rgba(255,255,255,0.55)' }}>Taux APY</dt>
            <dd
              className="font-num font-semibold tabular-nums"
              style={{ color: '#00E5A0' }}
            >
              {formatPercent(FONDS_MONETAIRES_APY, 2)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt style={{ color: 'rgba(255,255,255,0.55)' }}>
              Intérêts mensuels estimés
            </dt>
            <dd
              className="font-num font-semibold tabular-nums"
              style={{ color: '#00E5A0' }}
            >
              {formatCurrency(monthly)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt style={{ color: 'rgba(255,255,255,0.55)' }}>
              Intérêts annuels estimés
            </dt>
            <dd
              className="font-num font-semibold tabular-nums"
              style={{ color: '#00E5A0' }}
            >
              {formatCurrency(yearly)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, sub, valueColor, subColor }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p
        className={`mt-3 font-num text-2xl font-bold tracking-tight ${
          valueColor || ''
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className={`mt-1 font-num text-xs ${subColor || 'text-faint'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function InvestmentsView() {
  const {
    cryptos,
    deleteCrypto,
    pockets,
    cashBalance,
    setCashBalance,
    updatePocketAmount,
  } = useFinance()
  const [history, setHistory] = useLocalStorage('kaafinance.cryptoHistory.v2', [])
  const [modal, setModal] = useState(null)
  const [buyMore, setBuyMore] = useState(null)
  const [transferTo, setTransferTo] = useState(null)

  const pocketAmount = (key) =>
    pockets.find((p) => p.key === key)?.amount ?? 0

  const geckoIds = useMemo(
    () => cryptos.map((c) => getCryptoMeta(c.coin).geckoId).filter(Boolean),
    [cryptos],
  )
  const { prices, status, lastUpdated } = useCryptoPrices(geckoIds)

  const rows = useMemo(
    () =>
      cryptos.map((c) => {
        const meta = getCryptoMeta(c.coin)
        const livePrice = meta.geckoId ? prices[meta.geckoId] : undefined
        const currentPrice = livePrice ?? c.snapshotPrice ?? 0
        /* Référence = valeur de la position au moment de l'ajout. */
        const reference = c.quantity * (c.snapshotPrice ?? 0)
        const positionValue = c.quantity * currentPrice
        const perf = positionValue - reference
        const perfPct = reference > 0 ? perf / reference : 0
        const interest = stakingInterest(c, currentPrice)
        return {
          ...c,
          meta,
          currentPrice,
          reference,
          positionValue,
          perf,
          perfPct,
          interest,
        }
      }),
    [cryptos, prices],
  )

  const totals = useMemo(() => {
    const totalReference = rows.reduce((s, r) => s + r.reference, 0)
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0)
    const marketValue = rows.reduce((s, r) => s + r.positionValue, 0)
    const totalValue = marketValue + totalInterest
    const performance = totalValue - totalReference
    const performancePct = totalReference > 0 ? performance / totalReference : 0
    return { totalReference, totalInterest, totalValue, performance, performancePct }
  }, [rows])

  /* À chaque rafraîchissement réussi : on sauvegarde un point d'historique. */
  useEffect(() => {
    if (status !== 'ok' || lastUpdated == null || cryptos.length === 0) return
    setHistory((prev) =>
      [...prev, { t: lastUpdated, v: totals.totalValue }].slice(-300),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdated])

  const openAdd = () => setModal({ key: Date.now(), crypto: null })
  const openEdit = (row) => setModal({ key: Date.now(), crypto: row })
  const closeModal = () => setModal(null)

  const modals = (
    <>
      {modal && (
        <CryptoModal key={modal.key} crypto={modal.crypto} onClose={closeModal} />
      )}
      {buyMore && (
        <BuyMoreModal
          key={buyMore.id}
          crypto={buyMore}
          onClose={() => setBuyMore(null)}
        />
      )}
      {transferTo && (
        <TransferModal
          defaultTo={transferTo}
          onClose={() => setTransferTo(null)}
        />
      )}
    </>
  )

  /* Section éditable des pockets — toujours affichée, y compris si le
     portefeuille crypto est vide. */
  const pocketsSection = (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold">Mes pockets</h2>
        <p className="text-xs text-muted">
          Ajuste manuellement le solde de chaque pocket. Le Pocket Global se
          recalcule instantanément.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PocketEditCard
          icon={Banknote}
          name="Cash"
          amount={cashBalance}
          onSave={setCashBalance}
          onTransfer={() => setTransferTo('cash')}
        />
        <PocketEditCard
          icon={Coins}
          name="Fonds monétaires flexibles"
          amount={pocketAmount('fondsMonetaires')}
          onSave={(v) => updatePocketAmount('fondsMonetaires', v)}
          onTransfer={() => setTransferTo('fondsMonetaires')}
          showApy
        />
        <PocketEditCard
          icon={Gift}
          name="Cadeau"
          amount={pocketAmount('cadeau')}
          onSave={(v) => updatePocketAmount('cadeau', v)}
          onTransfer={() => setTransferTo('cadeau')}
        />
        <PocketEditCard
          icon={Plane}
          name="Voyage"
          amount={pocketAmount('voyage')}
          onSave={(v) => updatePocketAmount('voyage', v)}
          onTransfer={() => setTransferTo('voyage')}
        />
      </div>
    </section>
  )

  /* État vide */
  if (cryptos.length === 0) {
    return (
      <div className="space-y-5">
        {pocketsSection}
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Bitcoin className="h-7 w-7" />
          </span>
          <p className="mt-4 font-display text-base font-semibold">
            Ton portefeuille est vide
          </p>
          <p className="mt-1 text-sm text-muted">
            Ajoute ta première crypto pour commencer.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            <Plus className="h-4 w-4" />
            Ajouter une crypto
          </button>
        </div>
        {modals}
      </div>
    )
  }

  const up = totals.performance >= 0

  return (
    <div className="space-y-5">
      {pocketsSection}

      {/* Cards principales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          label="Valeur à l’ajout"
          value={formatCurrency(totals.totalReference)}
          sub={`${cryptos.length} crypto${cryptos.length > 1 ? 's' : ''}`}
        />
        <SummaryCard
          icon={Coins}
          label="Valeur actuelle"
          value={formatCurrency(totals.totalValue)}
          sub={
            totals.totalInterest > 0
              ? `dont +${formatCurrency(totals.totalInterest)} de staking`
              : 'Au prix du marché'
          }
        />
        <SummaryCard
          icon={Activity}
          label="Performance"
          value={formatCurrency(totals.performance, { sign: true })}
          valueColor={up ? 'text-positive' : 'text-negative'}
          sub={`${up ? '+' : ''}${formatPercent(totals.performancePct, 2)}`}
          subColor={up ? 'text-positive' : 'text-negative'}
        />
      </div>

      {/* Graphique d'évolution */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold">
          Évolution du portefeuille
        </h2>
        <p className="mb-2 text-xs text-muted">Valeur totale dans le temps</p>
        <PortfolioChart data={history} />
      </div>

      {/* Liste des cryptos */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Mes cryptos</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter une crypto</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <CryptoCard
            key={row.id}
            row={row}
            onEdit={openEdit}
            onDelete={deleteCrypto}
            onBuyMore={setBuyMore}
          />
        ))}
      </div>

      {modals}
      <PriceStatus status={status} lastUpdated={lastUpdated} />
    </div>
  )
}
