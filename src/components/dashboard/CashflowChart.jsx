import { useMemo, useState } from 'react'
import { formatCurrency, formatMonthLabel } from '../../lib/format.js'

/* Graphique d'évolution du solde cumulé — SVG sur mesure, sans dépendance. */
const W = 720
const H = 260
const PAD = { l: 18, r: 18, t: 26, b: 38 }

function smoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const mx = (prev.x + curr.x) / 2
    const my = (prev.y + curr.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

export default function CashflowChart({ data }) {
  const [hover, setHover] = useState(null)

  const { points, bottom, gridY } = useMemo(() => {
    const innerW = W - PAD.l - PAD.r
    const innerH = H - PAD.t - PAD.b
    const base = H - PAD.b
    const values = data.map((d) => d.cumulative)
    let min = values.length ? Math.min(...values) : 0
    let max = values.length ? Math.max(...values) : 1
    if (min === max) max = min + 1
    const range = max - min
    min -= range * 0.18
    max += range * 0.18
    const span = max - min || 1

    const xAt = (i) =>
      data.length <= 1
        ? PAD.l + innerW / 2
        : PAD.l + (innerW * i) / (data.length - 1)
    const yAt = (v) => base - ((v - min) / span) * innerH

    return {
      bottom: base,
      points: data.map((d, i) => ({ x: xAt(i), y: yAt(d.cumulative), d })),
      gridY: [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD.t + innerH * f,
        value: max - span * f,
      })),
    }
  }, [data])

  const line = smoothPath(points)
  const area = points.length
    ? `${line} L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z`
    : ''
  const active = hover != null ? points[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Évolution du solde"
      >
        <defs>
          <linearGradient id="cashflowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grille */}
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

        {/* Aire + courbe */}
        {area && <path d={area} fill="url(#cashflowFill)" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Repère au survol */}
        {active && (
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

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5.5 : 3.5}
            fill="#ffffff"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        ))}

        {/* Libellés des mois */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 12}
            fill="var(--color-faint)"
            fontSize="12"
            textAnchor="middle"
            className="capitalize"
          >
            {formatMonthLabel(p.d.date)}
          </text>
        ))}

        {/* Zones de survol */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - W / (points.length * 2)}
            y={0}
            width={W / points.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {/* Infobulle */}
      {active && (
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
          <p className="text-xs capitalize text-muted">
            {new Intl.DateTimeFormat('fr-FR', {
              month: 'long',
              year: 'numeric',
            }).format(new Date(active.d.date))}
          </p>
          <p className="mt-0.5 font-num text-base font-bold">
            {formatCurrency(active.d.cumulative)}
          </p>
          <div className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
            <p className="flex justify-between">
              <span className="text-muted">Revenus</span>
              <span className="font-num font-medium text-positive">
                {formatCurrency(active.d.income, { compact: true })}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">Dépenses</span>
              <span className="font-num font-medium text-negative">
                {formatCurrency(active.d.expense, { compact: true })}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
