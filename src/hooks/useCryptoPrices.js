import { useEffect, useState } from 'react'

/* Récupère les prix CoinGecko en euros et les rafraîchit toutes les 60 s.
   Renvoie { prices, status, lastUpdated }.
   status : 'idle' | 'loading' | 'ok' | 'error'. */
const ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price'
const REFRESH_MS = 60000

export function useCryptoPrices(geckoIds) {
  const [prices, setPrices] = useState({})
  const [status, setStatus] = useState('idle')
  const [lastUpdated, setLastUpdated] = useState(null)

  /* Clé stable : l'effet ne se relance que si la liste de cryptos change. */
  const key = [...new Set(geckoIds)].filter(Boolean).sort().join(',')

  useEffect(() => {
    if (!key) {
      setStatus('idle')
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(
          `${ENDPOINT}?ids=${encodeURIComponent(key)}&vs_currencies=eur`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const next = {}
        for (const [id, v] of Object.entries(data)) {
          if (v && typeof v.eur === 'number') next[id] = v.eur
        }
        setPrices(next)
        setStatus('ok')
        setLastUpdated(Date.now())
      } catch {
        /* API injoignable : on conserve les derniers prix connus. */
        if (!cancelled) setStatus('error')
      }
    }

    setStatus((s) => (s === 'ok' ? 'ok' : 'loading'))
    load()
    const timer = setInterval(load, REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [key])

  return { prices, status, lastUpdated }
}
