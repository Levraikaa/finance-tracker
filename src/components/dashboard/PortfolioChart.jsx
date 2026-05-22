import { formatCurrency } from '../../lib/format.js'

/* Courbe d'évolution de la valeur du portefeuille — SVG, style KAAFINANCE. */
const W = 720
const H = 220
const PAD = { l: 16, r: 16, t: 20, b: 18 }

export default function PortfolioChart({ data }) {
  if (data.length < 2) {
    return (
      <div className="grid h-44 place-items-center px-4 text-center text-sm text-muted">
        {data.length === 0
          ? 'La courbe se construit au fil des rafraîchissements automatiques.'
          : 'La courbe apparaît dès le deuxième relevé de prix.'}
      </div>
    )
  }

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const base = H - PAD.b

  const values = data.map((d) => d.v)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const range = max - min
  min -= range * 0.12
  max += range * 0.12
  const span = max - min || 1

  const xAt = (i) => PAD.l + (innerW * i) / (data.length - 1)
  const yAt = (v) => base - ((v - min) / span) * innerH

  const pts = data.map((d, i) => `${xAt(i)},${yAt(d.v)}`)
  const line = `M ${pts.join(' L ')}`
  const area = `${line} L ${xAt(data.length - 1)},${base} L ${xAt(0)},${base} Z`
  const grid = [0, 0.5, 1].map((f) => ({
    y: PAD.t + innerH * f,
    value: max - span * f,
  }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Évolution de la valeur du portefeuille"
    >
      <defs>
        <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid.map((g, i) => (
        <g key={i}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={g.y}
            y2={g.y}
            stroke="var(--color-line-soft)"
            strokeWidth="1"
          />
          <text
            x={PAD.l}
            y={g.y - 5}
            fill="var(--color-faint)"
            fontSize="11"
            fontFamily="var(--font-num)"
          >
            {formatCurrency(g.value, { compact: true })}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#portfolioFill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
