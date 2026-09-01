import {
  ArrowRightLeft,
  LayoutDashboard,
  PiggyBank,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { NAV } from './nav.js'

const ICONS = {
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  TrendingUp,
  Settings,
}

/* Barre d'onglets fixée en bas — affichée uniquement sous `lg`, là où les
   cinq onglets ne tiennent pas sur la ligne du header. */
export default function BottomNav({ view, onChange, upcomingCount = 0 }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-navbar/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch">
        {NAV.map((item) => {
          const Icon = ICONS[item.icon]
          const active = view === item.id
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  active ? 'text-accent' : 'text-faint hover:text-ink'
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.id === 'budgets' && upcomingCount > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 grid h-[16px] min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                      style={{ background: '#FF4D6A' }}
                      aria-label={`${upcomingCount} abonnement(s) imminent(s)`}
                    >
                      {upcomingCount}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] leading-none ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.short}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
