import { CircleDashed, Gift, Plane, TrendingUp } from 'lucide-react'
import { uid } from './format.js'

/* Définitions des pockets — métadonnées d'affichage (nom + icône).
   Seuls le montant et l'objectif sont modifiables et persistés. */
export const POCKET_DEFS = [
  { key: 'investissement', name: 'Pocket Investissement', icon: TrendingUp },
  { key: 'voyage', name: 'Pocket Voyage', icon: Plane },
  { key: 'cadeau', name: 'Pocket Cadeau', icon: Gift },
  { key: 'autre', name: 'Pocket Autre', icon: CircleDashed },
]

export function getPocketDef(key) {
  return (
    POCKET_DEFS.find((p) => p.key === key) ?? POCKET_DEFS[POCKET_DEFS.length - 1]
  )
}

/* État initial : 4 pockets vides (montant et objectif à zéro). */
export function seedPockets() {
  return POCKET_DEFS.map((p) => ({ id: uid(), key: p.key, amount: 0, goal: 0 }))
}
