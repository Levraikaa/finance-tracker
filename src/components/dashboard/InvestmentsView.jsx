import { useEffect, useMemo, useState } from 'react'
import { Activity, Bitcoin, Coins, Plus, Wallet } from 'lucide-react'
import PortfolioChart from './PortfolioChart.jsx'
import CryptoCard from './CryptoCard.jsx'
import CryptoModal from './CryptoModal.jsx'
import BuyMoreModal from './BuyMoreModal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { getCryptoMeta, stakingInterest } from '../../lib/cryptos.js'
import { formatCurrency, formatPercent } from '../../lib/format.js'

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
  const { cryptos, deleteCrypto } = useFinance()
  const [history, setHistory] = useLocalStorage('kaafinance.cryptoHistory.v2', [])
  const [modal, setModal] = useState(null)
  const [buyMore, setBuyMore] = useState(null)

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
    </>
  )

  /* État vide */
  if (cryptos.length === 0) {
    return (
      <>
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
      </>
    )
  }

  const up = totals.performance >= 0

  return (
    <div className="space-y-5">
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
