import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { CATEGORIES, getCategory } from '../lib/categories.js'
import { getCategoryColor } from '../constants/categories.js'

const STORAGE_KEY = 'kaa_categories'

/* Surcharges utilisateur des libellés et couleurs de catégories.
   Format en localStorage : { [categoryKey]: { name?, color? } }.
   Les clés internes restent stables — seul l'affichage change. */

const CategoryOverridesContext = createContext(null)

const seed = () => ({})

export function CategoryOverridesProvider({ children }) {
  const [overrides, setOverrides] = useLocalStorage(STORAGE_KEY, seed)

  const renameCategory = useCallback(
    (key, name) => {
      const next = String(name ?? '').trim()
      setOverrides((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), name: next },
      }))
    },
    [setOverrides],
  )

  const recolorCategory = useCallback(
    (key, color) => {
      setOverrides((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), color },
      }))
    },
    [setOverrides],
  )

  const resetCategory = useCallback(
    (key) => {
      setOverrides((prev) => {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    [setOverrides],
  )

  const getDisplay = useCallback(
    (key) => {
      const o = overrides[key] ?? {}
      const meta = CATEGORIES[key] ?? getCategory(key)
      const name =
        o.name && o.name.trim() ? o.name.trim() : meta.label
      const color = o.color || getCategoryColor(key)
      return { name, color, icon: meta.icon, type: meta.type }
    },
    [overrides],
  )

  const value = useMemo(
    () => ({
      overrides,
      getDisplay,
      renameCategory,
      recolorCategory,
      resetCategory,
    }),
    [overrides, getDisplay, renameCategory, recolorCategory, resetCategory],
  )

  return (
    <CategoryOverridesContext.Provider value={value}>
      {children}
    </CategoryOverridesContext.Provider>
  )
}

export function useCategoryOverrides() {
  const ctx = useContext(CategoryOverridesContext)
  if (!ctx) {
    throw new Error(
      'useCategoryOverrides doit être utilisé dans un <CategoryOverridesProvider>.',
    )
  }
  return ctx
}

/* Sucre syntaxique : raccourci de lecture pour une seule clé. */
export function useCategoryDisplay(key) {
  const { getDisplay } = useCategoryOverrides()
  return getDisplay(key)
}
