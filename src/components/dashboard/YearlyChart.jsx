import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatPercent } from '../../lib/format.js'

/* Graphique détaillé de l'évolution du Pocket Global sur la période de tracking.
   `data` : tableau renvoyé par trackingMonthlySeries (un point par mois).
   On n'affiche QUE la série `pocketGlobal` — courbe enrichie de la variation
   mois par mois, de la valeur min/max et des stats de période. */

const ACCENT = '#7C6FFF'

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

const AXIS_TICK = {
  fill: 'rgba(255,255,255,0.3)',
  fontSize: 11,
  fontFamily: "'DM Sans', sans-serif",
}

const monthLabel = (m) => `${MONTH_SHORT[m.month]} ${String(m.year).slice(-2)}`

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  const value = point.pocketGlobal
  const delta = point.delta
  const hasDelta = delta != null
  const up = hasDelta && delta >= 0
  return (
    <div
      className="font-num text-xs"
      style={{
        background: '#0B0F1A',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 170,
      }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {label}
      </p>
      <p
        className="font-num text-lg font-bold tabular-nums"
        style={{ color: ACCENT }}
      >
        {value == null ? '—' : formatCurrency(value)}
      </p>
      {hasDelta && (
        <p
          className="mt-1 flex items-center gap-1 tabular-nums"
          style={{ color: up ? '#00E5A0' : '#FF4D6A' }}
        >
          {up ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {up ? '+' : '−'}
          {formatCurrency(Math.abs(delta), { compact: true })}
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>vs mois préc.</span>
        </p>
      )}
    </div>
  )
}

export default function YearlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="grid h-80 place-items-center rounded-xl text-sm"
        style={{
          background: '#131929',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Aucune donnée à afficher.
      </div>
    )
  }

  /* Points avec uniquement le Pocket Global + variation vs mois précédent. */
  const chartData = data.map((d, i) => {
    const prev = i > 0 ? data[i - 1].pocketGlobal : null
    return {
      label: monthLabel(d),
      pocketGlobal: d.pocketGlobal,
      delta:
        prev == null || d.pocketGlobal == null ? null : d.pocketGlobal - prev,
    }
  })

  const values = chartData.map((d) => d.pocketGlobal).filter((v) => v != null)
  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const min = Math.min(...values)
  const max = Math.max(...values)
  const periodChange = last - first
  const periodPct = first !== 0 ? periodChange / first : 0
  const up = periodChange >= 0

  return (
    <div className="rounded-xl p-4" style={{ background: '#131929' }}>
      {/* En-tête : valeur actuelle + variation sur la période */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Pocket Global aujourd’hui
          </p>
          <p
            className="font-num text-2xl font-bold tabular-nums"
            style={{ color: '#fff', textShadow: `0 0 20px ${ACCENT}55` }}
          >
            {formatCurrency(last)}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-num text-sm font-semibold tabular-nums"
          style={{
            background: up ? 'rgba(0,229,160,0.12)' : 'rgba(255,77,106,0.12)',
            color: up ? '#00E5A0' : '#FF4D6A',
          }}
        >
          {up ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {up ? '+' : '−'}
          {formatCurrency(Math.abs(periodChange), { compact: true })}
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            ({up ? '+' : '−'}
            {formatPercent(Math.abs(periodPct), 0)})
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) =>
                formatCurrency(v, { compact: true }).replace(/\s/g, '')
              }
              width={56}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />

            {/* Repères min / max sur la période */}
            <ReferenceLine
              y={max}
              stroke="rgba(0,229,160,0.25)"
              strokeDasharray="3 3"
              label={{
                value: `Max ${formatCurrency(max, { compact: true })}`,
                position: 'insideTopLeft',
                fill: 'rgba(0,229,160,0.6)',
                fontSize: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <ReferenceLine
              y={min}
              stroke="rgba(255,77,106,0.25)"
              strokeDasharray="3 3"
              label={{
                value: `Min ${formatCurrency(min, { compact: true })}`,
                position: 'insideBottomLeft',
                fill: 'rgba(255,77,106,0.6)',
                fontSize: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />

            <Area
              type="monotone"
              dataKey="pocketGlobal"
              name="Pocket Global"
              stroke={ACCENT}
              strokeWidth={2.5}
              fill="url(#pgFill)"
              dot={{ r: 3, fill: '#131929', stroke: ACCENT, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
