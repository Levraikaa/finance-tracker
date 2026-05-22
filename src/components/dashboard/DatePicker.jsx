import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

/* Sélecteur de date custom — calendrier sombre, déroulé sous le champ. */
const WEEKDAYS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']

const pad = (n) => String(n).padStart(2, '0')
const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const parseISO = (s) => {
  const [y, m, d] = (s || toISO(new Date())).split('-').map(Number)
  return new Date(y, m - 1, d)
}

const TODAY = toISO(new Date())

export default function DatePicker({ value, onChange, max }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = parseISO(value)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = parseISO(value)

  const toggle = () => {
    if (!open) setView(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setOpen((v) => !v)
  }

  const shiftMonth = (delta) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))

  const year = view.getFullYear()
  const month = view.getMonth()
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(view)
  const fieldLabel = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selected)

  const nextDisabled = max ? toISO(new Date(year, month + 1, 1)) > max : false

  const pick = (day) => {
    onChange(toISO(new Date(year, month, day)))
    setOpen(false)
  }

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-lg border bg-canvas px-3.5 py-2.5 text-sm text-ink transition-colors ${
          open ? 'border-accent/60' : 'border-line hover:border-accent/40'
        }`}
      >
        <span className="capitalize">{fieldLabel}</span>
        <Calendar className="h-4 w-4 text-faint" />
      </button>

      {/* Calendrier — ouverture animée vers le bas */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open
            ? 'mt-2 grid-rows-[1fr] opacity-100'
            : 'pointer-events-none grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-accent/20 bg-surface p-3">
            <div className="mx-auto w-full max-w-[20rem]">
              {/* Navigation entre mois */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Mois précédent"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-num text-sm font-semibold capitalize">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  disabled={nextDisabled}
                  aria-label="Mois suivant"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="mt-3 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w, i) => (
                  <span
                    key={i}
                    className="grid h-7 place-items-center text-xs font-medium capitalize text-faint"
                  >
                    {w}
                  </span>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (day == null) return <span key={i} />
                  const iso = toISO(new Date(year, month, day))
                  const isSelected = iso === value
                  const isToday = iso === TODAY
                  const isDisabled = max ? iso > max : false
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => pick(day)}
                      className={`grid aspect-square place-items-center rounded-lg font-num text-sm tabular-nums transition-colors ${
                        isSelected
                          ? 'bg-accent font-semibold text-white'
                          : isDisabled
                            ? 'cursor-not-allowed text-faint/40'
                            : isToday
                              ? 'text-ink underline decoration-accent decoration-2 underline-offset-4 hover:bg-elevated'
                              : 'text-ink hover:bg-elevated'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
