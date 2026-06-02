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

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]
const MONTH_LONG = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const RANGES = [
  { key: '1y', label: '1 an', days: 365 },
  { key: '6m', label: '6 mois', days: 183 },
  { key: '3m', label: '3 mois', days: 92 },
  { key: '1m', label: '1 mois', days: 31 },
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
        {point.pocketGlobal == null
          ? '—'
          : formatCurrency(point.pocketGlobal)}
      </p>
    </div>
  )
}

export default function YearlyChart({ data }) {
  const [range, setRange] = useState('6m')

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

  const count = RANGES.find((r) => r.key === range)?.days ?? 183
  /* On garde au moins 2 points pour qu'une courbe se dessine. */
  let window = data.slice(-count)
  if (window.length < 2) window = data.slice(-2)

  const chartData = window.map((d) => ({
    key: d.key,
    fullLabel: `${d.day} ${MONTH_LONG[d.month]} ${d.year}`,
    pocketGlobal: d.pocketGlobal,
  }))

  /* Une étiquette d'axe X par mois (au premier jour disponible du mois). */
  const monthTicks = []
  const seen = new Set()
  for (const d of chartData) {
    const ym = d.key.slice(0, 7)
    if (!seen.has(ym)) {
      seen.add(ym)
      monthTicks.push(d.key)
    }
  }

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
              ticks={monthTicks}
              tickFormatter={monthFromKey}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              orientation="right"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              domain={[0, (max) => Math.ceil(max * 1.05)]}
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
              dot={false}
              activeDot={{ r: 5, fill: MARK, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pied : moyenne sur la période + légende */}
      <div className="mt-3 flex items-center justify-between">
        <p
          className="font-num text-xs tabular-nums"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Moyenne sur la période{' '}
          <span className="font-semibold text-white/70">
            {formatCurrency(avg)}
          </span>
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: WARM }}
          />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Pocket Global</span>
        </div>
      </div>
    </div>
  )
}
