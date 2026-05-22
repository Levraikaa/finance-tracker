import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, ChevronDown, Landmark, PiggyBank } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useCryptoPrices } from '../../hooks/useCryptoPrices.js'
import { getPocketDef } from '../../lib/pockets.js'
import { getCryptoMeta, portfolioValue } from '../../lib/cryptos.js'
import { formatCurrency } from '../../lib/format.js'

/* Carte « Pocket Global » — déroule le détail des pockets.
   Le total agrège : pockets, cash et solde du compte bancaire.
   Pocket Investissement = valeur live du portefeuille crypto. */
export default function PocketGlobalCard() {
  const { pockets, cryptos, cashBalance, bankBalance } = useFinance()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  /* Valeur live du portefeuille crypto (prix CoinGecko, rafraîchis 60 s). */
  const geckoIds = useMemo(
    () => cryptos.map((c) => getCryptoMeta(c.coin).geckoId).filter(Boolean),
    [cryptos],
  )
  const { prices } = useCryptoPrices(geckoIds)
  const cryptoValue = useMemo(
    () => portfolioValue(cryptos, prices),
    [cryptos, prices],
  )

  const rows = [
    ...pockets.map((p) => {
      const def = getPocketDef(p.key)
      return {
        key: p.key,
        name: def.name,
        Icon: def.icon,
        amount: p.key === 'investissement' ? cryptoValue : p.amount,
      }
    }),
    { key: 'cash', name: 'Pocket Cash', Icon: Banknote, amount: cashBalance },
    {
      key: 'bank',
      name: 'Solde bancaire',
      sub: 'Compte bancaire',
      Icon: Landmark,
      amount: bankBalance,
    },
  ]
  const total = rows.reduce((s, r) => s + r.amount, 0)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-full w-full rounded-2xl border border-line p-5 text-left transition-[filter] duration-200 hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, #131929 0%, #1a1f35 100%)',
          borderLeftWidth: '3px',
          borderLeftColor: '#00E5A0',
          boxShadow: '0 8px 32px rgba(124,111,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent">
            <PiggyBank className="h-[22px] w-[22px]" />
          </span>
          <ChevronDown
            className={`h-4 w-4 text-faint transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
          Pocket Global
        </p>
        <p
          className="mt-1 font-num text-4xl font-bold tracking-tight"
          style={{ textShadow: '0 0 20px rgba(124,111,255,0.3)' }}
        >
          {formatCurrency(total)}
        </p>
        <p className="mt-1 text-xs text-faint">Pockets + solde bancaire</p>
      </button>

      {/* Menu déroulant — détail des pockets + solde bancaire */}
      <div
        className={`absolute inset-x-0 top-full z-30 mt-2 grid transition-all duration-300 ease-out ${
          open
            ? 'grid-rows-[1fr] opacity-100'
            : 'pointer-events-none grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-accent/20 bg-elevated p-2 shadow-xl shadow-black/40">
            {rows.map((row) => {
              const Icon = row.Icon
              return (
                <div
                  key={row.key}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{row.name}</p>
                    {row.sub && (
                      <p className="truncate text-xs text-faint">{row.sub}</p>
                    )}
                  </div>
                  <span className="font-num text-sm font-semibold tabular-nums text-accent">
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
