import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import { NAV } from './nav.js'
import { useUpcomingSubscriptions } from '../../hooks/useUpcomingSubscriptions.js'

/* Barre de navigation horizontale fixe — logo, onglets, actions. */
export default function Navbar({
  view,
  onChange,
  month,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  onAdd,
}) {
  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(month)

  /* Sur mobile la place manque : on n'affiche que le mois abrégé, l'année
     n'apparaît qu'à partir de `sm`. */
  const monthLabelShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(month)
    .replace('.', '')

  /* Abonnements imminents -> badge rouge sur l'onglet Budgets. */
  const upcomingCount = useUpcomingSubscriptions().length

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 h-16 border-b border-line"
      style={{ background: 'linear-gradient(to right, #0d1220, #111827)' }}
    >
      <div className="flex h-full items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-8">
        {/* Gauche — logo */}
        <Logo onClick={() => onChange('overview')} className="shrink-0" />

        {/* Centre — onglets de navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative h-16 shrink-0 px-3 text-sm transition-colors sm:px-4 ${
                  active
                    ? 'font-semibold text-accent'
                    : 'font-medium text-faint hover:text-ink'
                }`}
              >
                {item.label}
                {item.id === 'budgets' && upcomingCount > 0 && (
                  <span
                    className="absolute right-0 top-3 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white sm:right-1"
                    style={{ background: '#FF4D6A' }}
                    aria-label={`${upcomingCount} abonnement(s) imminent(s)`}
                  >
                    {upcomingCount}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Pousse les actions à droite quand les onglets sont masqués. */}
        <div className="flex-1 lg:hidden" />

        {/* Droite — bouton Ajouter + sélecteur de mois */}
        <div className="flex min-w-0 shrink items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>

          <div className="flex items-center rounded-lg border border-line bg-surface">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mois précédent"
              className="grid h-8 w-8 place-items-center rounded-l-lg text-muted transition-colors hover:bg-elevated hover:text-ink sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-14 select-none truncate text-center text-xs font-medium capitalize text-muted sm:w-28">
              <span className="sm:hidden">{monthLabelShort}</span>
              <span className="hidden sm:inline">{monthLabel}</span>
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              disabled={!canGoNext}
              aria-label="Mois suivant"
              className="grid h-8 w-8 place-items-center rounded-r-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
