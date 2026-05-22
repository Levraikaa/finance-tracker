import { useState } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js'

/* Logo CoinGecko avec repli sur une pastille « ticker » si l'image échoue. */
function CryptoLogo({ src, fallback }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 font-num text-xs font-bold uppercase text-accent">
        {(fallback || '?').slice(0, 3)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-full bg-white/5 object-contain"
    />
  )
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="truncate font-num text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}

export default function CryptoCard({ row, onEdit, onDelete, onBuyMore }) {
  const {
    meta,
    name,
    quantity,
    snapshotPrice,
    currentPrice,
    positionValue,
    perf,
    perfPct,
    interest,
    staking,
  } = row
  const up = perf >= 0
  const perfColor = up ? 'text-positive' : 'text-negative'

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      {/* En-tête : logo, nom, staking, suppression */}
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <CryptoLogo src={meta.logo} fallback={meta.symbol || name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted">{meta.symbol || 'Crypto'}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {staking.enabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
              <Zap className="h-3 w-3" />
              Staking {formatNumber(staking.rate, { maximumFractionDigits: 2 })}%
            </span>
          )}
          <button
            type="button"
            onClick={() => onDelete(row.id)}
            aria-label={`Supprimer ${name}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-negative"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Détail de la position */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field
          label="Quantité"
          value={formatNumber(quantity, { maximumFractionDigits: 8 })}
        />
        <Field label="Prix à l’ajout" value={formatCurrency(snapshotPrice)} />
        <Field label="Prix actuel" value={formatCurrency(currentPrice)} />
        <Field label="Valeur actuelle" value={formatCurrency(positionValue)} />
      </div>

      {/* Performance de la position */}
      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="text-xs text-muted">Performance</span>
        <span className={`font-num text-sm font-semibold tabular-nums ${perfColor}`}>
          {formatCurrency(perf, { sign: true })} · {up ? '+' : ''}
          {formatPercent(perfPct, 2)}
        </span>
      </div>

      {/* Intérêts de staking accumulés */}
      {staking.enabled && (
        <p className="mt-2 font-num text-xs font-medium text-accent">
          Intérêts accumulés : +{formatCurrency(interest)}
        </p>
      )}

      {/* Acheter plus — cumule la quantité sur cette position */}
      <button
        type="button"
        onClick={() => onBuyMore(row)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-line bg-canvas py-2.5 text-sm font-semibold transition-colors hover:border-accent/40 hover:bg-elevated"
      >
        <Plus className="h-4 w-4" />
        Acheter plus
      </button>
    </div>
  )
}
