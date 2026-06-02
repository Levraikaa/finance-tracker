import { useEffect, useState } from 'react'

/* Taux de change IDR → EUR (Frankfurter, mis en cache 1 h).
   L'ancien hôte `api.frankfurter.app` renvoie un 301 vers
   `api.frankfurter.dev` sans en-têtes CORS — on attaque directement
   le canonique pour éviter l'échec silencieux côté navigateur. */
const FX_ENDPOINT = 'https://api.frankfurter.dev/v1/latest?from=IDR&to=EUR'
const FX_CACHE_KEY = 'kaa_fx_idr_eur_v2'
const FX_TTL_MS = 60 * 60 * 1000

export function useIdrRate() {
  const [state, setState] = useState({ rate: null, status: 'loading' })

  useEffect(() => {
    let cancelled = false

    try {
      const cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null')
      if (
        cached &&
        typeof cached.r === 'number' &&
        Number.isFinite(cached.r) &&
        cached.r > 0 &&
        Date.now() - cached.t < FX_TTL_MS
      ) {
        setState({ rate: cached.r, status: 'ok' })
        return
      }
    } catch {
      /* cache illisible — on refetch */
    }

    fetch(FX_ENDPOINT)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (cancelled) return
        const r = json?.rates?.EUR
        if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) {
          throw new Error('Taux EUR invalide dans la réponse')
        }
        setState({ rate: r, status: 'ok' })
        try {
          localStorage.setItem(
            FX_CACHE_KEY,
            JSON.stringify({ r, t: Date.now() }),
          )
        } catch {
          /* cache non persisté — sans gravité */
        }
      })
      .catch(() => {
        if (cancelled) return
        setState({ rate: null, status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
