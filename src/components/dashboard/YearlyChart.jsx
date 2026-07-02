import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatPercent } from '../../lib/format.js'

/* Évolution JOURNALIÈRE du Pocket Global — courbe unique, style « Total Balance ».
   `data` : tableau renvoyé par trackingDailySeries (un point par jour). */

const WARM = '#FF7A1A' // orange de la courbe / dégradé
const MARK = '#00E5A0' // vert du marqueur au survol + badge de variation
const DOWN = '#FF4D6A' // rouge des dépenses dans le tooltip

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]
const MONTH_LONG = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const RANGES = [
  { key: 'all', label: 'Tout', days: 100000 },
  { key: '30d', label: '30 j', days: 31 },
  { key: '14d', label: '14 j', days: 15 },
  { key: '7d', label: '7 j', days: 8 },
]

const AXIS_TICK = {
  fill: 'rgba(255,255,255,0.3)',
  fontSize: 11,
  fontFamily: "'DM Sans', sans-serif",
}

/* "2026-04-09" -> mois abrégé pour l'axe X. */
const monthFromKey = (key) => MONTH_SHORT[Number(key.slice(5, 7)) - 1]

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  const isProjected = point.pocketGlobal == null
  const value = isProjected ? point.projected : point.pocketGlobal
  return (
    <div
      className="font-num"
      style={{
        background: '#0B0F1A',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 150,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className="text-[11px] font-medium"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {point.fullLabel}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5" style={{ color: MARK }} />
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums text-white">
        {value == null ? '—' : formatCurrency(value)}
      </p>
      {isProjected ? (
        <p
          className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.5px]"
          style={{ color: MARK }}
        >
          Projeté
        </p>
      ) : (
        (point.income > 0 || point.expense > 0) && (
          <div className="mt-2 space-y-0.5 border-t border-white/10 pt-1.5 text-[11px]">
            {point.income > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Revenus</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: MARK }}
                >
                  +{formatCurrency(point.income)}
                </span>
              </div>
            )}
            {point.expense > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Dépenses</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: DOWN }}
                >
                  −{formatCurrency(point.expense)}
                </span>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}

/* Petit point orange sur les jours où il y a eu un mouvement (revenu ou
   dépense) — repère visuel des vraies données parmi la ligne interpolée. */
function MovementDot({ cx, cy, payload }) {
  if (cx == null || cy == null || !payload) return null
  if (payload.pocketGlobal == null) return null
  const moved = (payload.income ?? 0) > 0 || (payload.expense ?? 0) > 0
  if (!moved) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={2.5}
      fill={WARM}
      stroke="#0A0D14"
      strokeWidth={1.5}
    />
  )
}

export default function YearlyChart({ data, projection }) {
  const [range, setRange] = useState('all')

  if (!data || data.length === 0) {
    return (
      <div
        className="grid h-80 place-items-center rounded-2xl border border-line text-sm"
        style={{ background: '#0A0D14', color: 'rgba(255,255,255,0.4)' }}
      >
        Aucune donnée à afficher.
      </div>
    )
  }

  /* Points réels (passé → aujourd'hui). On conserve revenus/dépenses du
     jour pour le tooltip enrichi et les points de mouvement. */
  const actual = data.map((d) => ({
    key: d.key,
    fullLabel: `${d.day} ${MONTH_LONG[d.month]} ${d.year}`,
    pocketGlobal: d.pocketGlobal,
    projected: null,
    income: d.income ?? 0,
    expense: d.expense ?? 0,
  }))
  /* Points projetés (après aujourd'hui, jusqu'à la fin du mois). */
  const projPoints = (projection?.series ?? []).map((d) => ({
    key: d.key,
    fullLabel: `${d.day} ${MONTH_LONG[d.month]} ${d.year}`,
    pocketGlobal: null,
    projected: d.projected,
  }))
  const hasProjection = projPoints.length > 0

  const count = RANGES.find((r) => r.key === range)?.days ?? 31
  /* La projection (jusqu'à la fin du mois) n'est affichée que sur les vues
     larges ; sur 7 j / 14 j on zoome sur le détail récent réel. */
  const showProjection = hasProjection && (range === 'all' || range === '30d')

  /* On tranche la fenêtre sur les points RÉELS, puis on ajoute la projection
     ENTIÈRE après — sinon, sur une courte fenêtre, les jours futurs
     prendraient toute la place. On garde au moins 2 points. */
  let actualWindow = actual.slice(-count)
  if (actualWindow.length < 2) actualWindow = actual.slice(-2)

  if (showProjection && actualWindow.length > 0) {
    /* Le dernier point réel amorce la courbe projetée (jonction). */
    const bridge = actualWindow[actualWindow.length - 1]
    actualWindow = [
      ...actualWindow.slice(0, -1),
      { ...bridge, projected: bridge.pocketGlobal },
    ]
  }

  const chartData = showProjection
    ? [...actualWindow, ...projPoints]
    : actualWindow
  const projectedEnd = showProjection ? projection.projectedEnd : null

  /* Axe X adaptatif : sur une courte fenêtre on étiquette des JOURS
     (ex. « 2 juil »), sinon un repère par MOIS (ex. « Juil »). */
  const shortRange = chartData.length <= 16
  const xTicks = []
  if (shortRange) {
    const step = chartData.length <= 8 ? 1 : 2
    for (let i = 0; i < chartData.length; i += step) xTicks.push(chartData[i].key)
    const lastKey = chartData[chartData.length - 1].key
    if (xTicks[xTicks.length - 1] !== lastKey) xTicks.push(lastKey)
  } else {
    const seen = new Set()
    for (const d of chartData) {
      const ym = d.key.slice(0, 7)
      if (!seen.has(ym)) {
        seen.add(ym)
        xTicks.push(d.key)
      }
    }
  }
  const xTickFormatter = shortRange
    ? (key) => `${Number(key.slice(8, 10))} ${monthFromKey(key).toLowerCase()}`
    : monthFromKey

  /* Domaine Y « zoomé » sur les valeurs réelles + projetées (plutôt que de
     partir de 0) pour rendre les variations lisibles. Marge de 12 %. */
  const numeric = chartData
    .map((d) => (d.pocketGlobal != null ? d.pocketGlobal : d.projected))
    .filter((v) => v != null)
  const dMin = numeric.length ? Math.min(...numeric) : 0
  const dMax = numeric.length ? Math.max(...numeric) : 0
  const pad = Math.max((dMax - dMin) * 0.12, 1)
  const yDomain = [Math.floor(dMin - pad), Math.ceil(dMax + pad)]

  const values = chartData.map((d) => d.pocketGlobal).filter((v) => v != null)
  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const avg = values.length
    ? values.reduce((s, v) => s + v, 0) / values.length
    : 0
  const change = last - first
  const pct = first !== 0 ? change / first : 0
  const up = change >= 0

  return (
    <div
      className="rounded-2xl border border-line p-4 sm:p-5"
      style={{ background: '#0A0D14' }}
    >
      {/* En-tête : titre + valeur + variation, et sélecteur de période */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-[13px] font-medium"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Pocket Global
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-num text-2xl font-bold tabular-nums text-white">
              {formatCurrency(last)}
            </span>
            <span
              className="flex items-center gap-0.5 font-num text-xs font-semibold tabular-nums"
              style={{ color: up ? MARK : '#FF4D6A' }}
            >
              <ArrowUpRight
                className={`h-3.5 w-3.5 ${up ? '' : 'rotate-90'}`}
              />
              {formatPercent(Math.abs(pct), 2)}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {RANGES.map((r) => {
            const isActive = r.key === range
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pgWarm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={WARM} stopOpacity={0.55} />
                <stop offset="45%" stopColor={WARM} stopOpacity={0.18} />
                <stop offset="100%" stopColor={WARM} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="key"
              ticks={xTicks}
              tickFormatter={xTickFormatter}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              orientation="right"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              domain={yDomain}
              tickFormatter={(v) =>
                formatCurrency(v, { compact: true }).replace(/\s/g, '')
              }
              width={52}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'rgba(255,255,255,0.25)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="pocketGlobal"
              name="Pocket Global"
              stroke={WARM}
              strokeWidth={2.5}
              fill="url(#pgWarm)"
              dot={<MovementDot />}
              activeDot={{ r: 5, fill: MARK, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projeté"
              stroke={MARK}
              strokeWidth={2}
              strokeDasharray="6 5"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: MARK, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pied : moyenne + prévision de fin de mois, et légende */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2">
        <p
          className="font-num text-xs tabular-nums"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Moyenne sur la période{' '}
          <span className="font-semibold text-white/70">
            {formatCurrency(avg)}
          </span>
          {projectedEnd != null && (
            <>
              <span className="mx-2 text-white/20">·</span>
              Fin de mois{' '}
              <span className="font-semibold" style={{ color: MARK }}>
                ≈ {formatCurrency(projectedEnd)}
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: WARM }}
            />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
              Pocket Global
            </span>
          </span>
          {showProjection && (
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-0 w-3.5"
                style={{ borderTop: `2px dashed ${MARK}` }}
              />
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Projeté</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
