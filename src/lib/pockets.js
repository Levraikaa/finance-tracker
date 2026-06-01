import { Coins, Gift, Plane, TrendingUp } from 'lucide-react'
import { uid } from './format.js'

/* Définitions des pockets — métadonnées d'affichage (nom + icône).
   Seuls le montant et l'objectif sont modifiables et persistés. */
export const POCKET_DEFS = [
  { key: 'investissement', name: 'Pocket Investissement', icon: TrendingUp },
  { key: 'voyage', name: 'Pocket Voyage', icon: Plane },
  { key: 'cadeau', name: 'Pocket Cadeau', icon: Gift },
  { key: 'fondsMonetaires', name: 'Fonds monétaires flexibles', icon: Coins },
]

/* Anciennes clés -> nouvelles clés, pour migrer les données localStorage
   sans perdre les montants déjà saisis. */
export const POCKET_KEY_ALIASES = {
  autre: 'fondsMonetaires',
}

export function getPocketDef(key) {
  const resolved = POCKET_KEY_ALIASES[key] ?? key
  return (
    POCKET_DEFS.find((p) => p.key === resolved) ??
    POCKET_DEFS[POCKET_DEFS.length - 1]
  )
}

/* État initial : 4 pockets vides (montant et objectif à zéro). */
export function seedPockets() {
  return POCKET_DEFS.map((p) => ({ id: uid(), key: p.key, amount: 0, goal: 0 }))
}

/* Renomme les anciennes clés de pockets vers les nouvelles, en conservant
   id / amount / goal. Idempotent. */
export function migratePockets(pockets) {
  if (!Array.isArray(pockets)) return pockets
  let mutated = false
  const next = pockets.map((p) => {
    const alias = POCKET_KEY_ALIASES[p.key]
    if (alias && alias !== p.key) {
      mutated = true
      return { ...p, key: alias }
    }
    return p
  })
  return mutated ? next : pockets
}
