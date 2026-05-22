import { useEffect, useState } from 'react'

/* État React synchronisé avec localStorage.
   `initial` peut être une valeur ou une fonction (évaluée à la 1re lecture). */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* stockage indisponible — on retombe sur la valeur initiale */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota dépassé ou stockage bloqué — sans gravité */
    }
  }, [key, value])

  return [value, setValue]
}
