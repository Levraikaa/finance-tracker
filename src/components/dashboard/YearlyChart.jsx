import { useMemo, useState } from 'react'
import { formatCurrency } from '../../lib/format.js'

/* Évolution mensuelle du Pocket Global sur l'année en cours.
   `data` = { year, currentMonth, series } produit par yearlyPocketSeries.
   - X : 12 mois (jan → déc)
   - Y : valeurs cadrées autour de la fourchette observée
   - Courbe pleine jusqu'au mois en cours, pointillés au-delà */
const W = 720
const H = 260
const PAD = { l: 18, r: 18, t: 26, b: 38 }

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function linePath(points) {
  if (points.length === 0) return ''
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

export default function YearlyChart({ data, showFuture = false }) {
  const [hover, setHover] = useState(null)
  const series = data?.series ?? []
  const currentMonth = data?.currentMonth ?? 11

  const { points, bottom, gridY, xTicks } = useMemo(() => {
    const innerW = W - PAD.l - PAD.r
    const innerH = H - PAD.t - PAD.b
    const base = H - PAD.b

    const known = series.filter((d) => d.value != null)
    const values = known.map((d) => d.value)
    let min = values.length ? Math.min(...values) : 0
    let max = values.length ? Math.max(...values) : 1
    if (min === max) {
      const pad = Math.max(Math.abs(min) * 0.02, 1)
      min -= pad
      max += pad
    } else {
      const range = max - min
      min -= range * 0.18
      max += range * 0.18
    }
    const span = max - min || 1

    const xAt = (month) => PAD.l + (innerW * month) / 11
    const yAt = (v) => base - ((v - min) / span) * innerH

    return {
      bottom: base,
      points: series.map((d) => ({
        x: xAt(d.month),
        y: d.value != null ? yAt(d.value) : null,
        d,
      })),
      gridY: [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD.t + innerH * f,
        value: max - span * f,
      })),
      xTicks: MONTHS.map((label, m) => ({ label, x: xAt(m) })),
    }
  }, [series])

  /* Sépare la courbe : passé/présent (plein) vs futur (pointillés). */
  const drawablePast = points.filter(
    (p) => p.y != null && p.d.month <= currentMonth,
  )
  const drawableFuture = showFuture
    ? points.filter((p) => p.y != null && p.d.month >= currentMonth)
    : []

  const linePast = linePath(drawablePast)
  const lineFuture = linePath(drawableFuture)
  const area =
    drawablePast.length > 0
      ? `${linePast} L ${drawablePast.at(-1).x} ${bottom} L ${drawablePast[0].x} ${bottom} Z`
      : ''
  const active = hover != null ? points[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Évolution annuelle du Pocket Global"
      >
        <defs>
          <linearGradient id="yearlyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
            <text
              x={PAD.l}
              y={g.y - 6}
              fill="var(--color-faint)"
              fontSize="11"
              fontFamily="var(--font-num)"
            >
              {formatCurrency(g.value, { compact: true })}
            </text>
          </g>
        ))}

        {area && <path d={area} fill="url(#yearlyFill)" />}
        {linePast && (
          <path
            d={linePast}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {lineFuture && (
          <path
            d={lineFuture}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 5"
          />
        )}

        {active && active.y != null && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.t}
            y2={bottom}
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {points.map((p, i) =>
          p.y == null ? null : (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5.5 : 3.5}
              fill="#ffffff"
              stroke="var(--color-accent)"
              strokeWidth="2"
              opacity={p.d.future ? 0.5 : 1}
            />
          ),
        )}

        {xTicks.map((t, m) => (
          <text
            key={m}
            x={t.x}
            y={H - 12}
            fill="var(--color-faint)"
            fontSize="11"
            textAnchor="middle"
            opacity={m > currentMonth ? 0.45 : 1}
          >
            {t.label}
          </text>
        ))}

        {points.map((p, i) => (
          <rect
            key={`hover-${i}`}
            x={p.x - W / 12 / 2}
            y={0}
            width={W / 12}
            height={H}
            fill="transparent"
            onMouseEnter={() => p.y != null && setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {active && active.y != null && (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-xl border border-line bg-elevated p-3 shadow-xl shadow-black/50"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            transform: `translate(${
              hover === 0 ? '0%' : hover === points.length - 1 ? '-100%' : '-50%'
            }, -118%)`,
          }}
        >
          <p className="text-xs text-muted">
            {MONTHS[active.d.month]} {data.year}
            {active.d.month === currentMonth && ' · aujourd’hui'}
          </p>
          <p className="mt-0.5 font-num text-base font-bold">
            {formatCurrency(active.d.value)}
          </p>
          {active.d.month <= currentMonth && active.d.month > 0 && (
            <div className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
              <p className="flex justify-between">
                <span className="text-muted">Variation</span>
                <span
                  className={`font-num font-medium ${
                    active.d.net >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {active.d.net >= 0 ? '+' : ''}
                  {formatCurrency(active.d.net, { compact: true })}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
