import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../../lib/format.js'

/* Graphique multi-courbes sur la période de tracking.
   `data` : tableau renvoyé par trackingMonthlySeries (par mois). */

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

const SERIES = [
  { key: 'pocketGlobal', name: 'Pocket Global', color: '#7C6FFF' },
  { key: 'revenus', name: 'Revenus', color: '#00E5A0' },
  { key: 'depenses', name: 'Dépenses', color: '#FF4D6A' },
  { key: 'soldeBancaire', name: 'Solde bancaire', color: '#FFB84D', dashed: true },
]

const AXIS_TICK = {
  fill: 'rgba(255,255,255,0.3)',
  fontSize: 11,
  fontFamily: "'DM Sans', sans-serif",
}

const monthLabel = (m) => `${MONTH_SHORT[m.month]} ${String(m.year).slice(-2)}`

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  /* Recharts passe `payload` non trié — on aligne sur l'ordre métier. */
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p]))
  return (
    <div
      className="font-num text-xs"
      style={{
        background: '#0B0F1A',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 180,
      }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {label}
      </p>
      <ul className="space-y-1.5">
        {SERIES.map((s) => {
          const entry = byKey[s.key]
          if (!entry) return null
          return (
            <li key={s.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{s.name}</span>
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: s.color }}
              >
                {entry.value == null
                  ? '—'
                  : formatCurrency(entry.value, { compact: true })}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function renderLegend() {
  return (
    <ul
      className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3"
      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
    >
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className="inline-block"
            style={{
              width: 18,
              height: 2,
              backgroundColor: s.color,
              borderRadius: 1,
              backgroundImage: s.dashed
                ? `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 8px)`
                : undefined,
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.name}</span>
        </li>
      ))}
    </ul>
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

  const chartData = data.map((d) => ({
    ...d,
    label: monthLabel(d),
  }))

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: '#131929' }}
    >
      <Legend
        content={renderLegend}
        verticalAlign="top"
        wrapperStyle={{ position: 'relative' }}
      />
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
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
              tickFormatter={(v) =>
                formatCurrency(v, { compact: true }).replace(/\s/g, '')
              }
              width={56}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="pocketGlobal"
              name="Pocket Global"
              stroke="#7C6FFF"
              strokeWidth={2}
              fill="#7C6FFF"
              fillOpacity={0.05}
              dot={false}
              activeDot={{ r: 4, fill: '#7C6FFF', stroke: '#7C6FFF' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="revenus"
              name="Revenus"
              stroke="#00E5A0"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00E5A0', stroke: '#00E5A0' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="depenses"
              name="Dépenses"
              stroke="#FF4D6A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#FF4D6A', stroke: '#FF4D6A' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="soldeBancaire"
              name="Solde bancaire"
              stroke="#FFB84D"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: '#FFB84D', stroke: '#FFB84D' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
