import { useState } from 'react'
import { formatCurrency, formatPercent } from '../../lib/format.js'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'

/* Anneau de répartition des dépenses par catégorie. */
const SIZE = 180
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

export default function CategoryDonut({ data }) {
  const [active, setActive] = useState(null)
  const { getDisplay } = useCategoryOverrides()
  const total = data.reduce((s, d) => s + d.amount, 0)

  if (!data.length || total === 0) {
    return (
      <div className="grid h-48 place-items-center text-sm text-muted">
        Aucune dépense à afficher.
      </div>
    )
  }

  let offset = 0
  const segments = data.map((d) => {
    const seg = { ...d, dash: d.share * CIRC, offset: -offset * CIRC }
    offset += d.share
    return seg
  })

  const focused = active != null ? data[active] : null

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-elevated)"
            strokeWidth={STROKE}
          />
          {segments.map((seg, i) => (
            <circle
              key={seg.category}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={getDisplay(seg.category).color}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer transition-opacity"
              style={{ opacity: active == null || active === i ? 1 : 0.3 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted">
            {focused ? getDisplay(focused.category).name : 'Total dépenses'}
          </span>
          <span className="font-num text-xl font-bold tracking-tight">
            {formatCurrency(focused ? focused.amount : total, { compact: true })}
          </span>
          {focused && (
            <span className="font-num text-xs text-faint">
              {formatPercent(focused.share, 1)}
            </span>
          )}
        </div>
      </div>

      {/* `min-w-0` est indispensable : sans lui un enfant flex refuse de
          passer sous la largeur de son contenu, la légende pousse la carte
          et le libellé déborde au lieu d'être tronqué. */}
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {data.map((d, i) => {
          const disp = getDisplay(d.category)
          return (
          <li
            key={d.category}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="flex items-center gap-3"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: disp.color }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {disp.name}
            </span>
            <span className="font-num text-sm tabular-nums text-muted">
              {formatPercent(d.share, 0)}
            </span>
            <span className="w-20 text-right font-num text-sm font-medium tabular-nums">
              {formatCurrency(d.amount, { compact: true })}
            </span>
          </li>
          )
        })}
      </ul>
    </div>
  )
}
