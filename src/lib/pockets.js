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

/* Normalise le tableau des pockets persistés. Idempotent. Trois étapes :
   1. Renomme les anciennes clés (« autre » -> « fondsMonetaires »).
   2. Dédoublonne par clé en fusionnant les montants/objectifs (si l'alias
      et la nouvelle clé coexistaient, on additionne les soldes).
   3. Backfill : garantit qu'un pocket existe pour CHAQUE définition
      (POCKET_DEFS). Sans ça, les anciennes données seedées avant l'ajout
      de « fondsMonetaires » n'avaient aucune entrée -> transfert KO. */
export function migratePockets(pockets) {
  const list = Array.isArray(pockets) ? pockets : []

  /* 1. renommage des alias */
  const renamed = list.map((p) => {
    const alias = POCKET_KEY_ALIASES[p.key]
    return alias && alias !== p.key ? { ...p, key: alias } : p
  })

  /* 2. dédoublonnage par clé (fusion des montants/objectifs) */
  const byKey = new Map()
  for (const p of renamed) {
    const existing = byKey.get(p.key)
    if (existing) {
      byKey.set(p.key, {
        ...existing,
        amount: (existing.amount || 0) + (p.amount || 0),
        goal: existing.goal || p.goal || 0,
      })
    } else {
      byKey.set(p.key, { ...p })
    }
  }

  /* 3. backfill des pockets manquants */
  for (const def of POCKET_DEFS) {
    if (!byKey.has(def.key)) {
      byKey.set(def.key, { id: uid(), key: def.key, amount: 0, goal: 0 })
    }
  }

  const next = [...byKey.values()]

  /* Idempotence : on ne renvoie une nouvelle référence que si la donnée
     a réellement changé (clés / montants / objectifs). */
  const sig = (arr) =>
    arr
      .map((p) => `${p.key}:${p.amount || 0}:${p.goal || 0}`)
      .sort()
      .join('|')
  return sig(next) === sig(list) ? pockets : next
}

/* Applique une variation de solde à un pocket, en UPSERT : si le pocket
   n'existe pas encore dans le tableau, il est créé. Garantit qu'un crédit
   vers un pocket absent n'est jamais perdu et qu'un débit cible la bonne
   entrée. Le solde reste borné à >= 0. */
export function adjustPocket(pockets, key, delta) {
  const list = Array.isArray(pockets) ? pockets : []
  const idx = list.findIndex((p) => p.key === key)
  if (idx === -1) {
    return [...list, { id: uid(), key, amount: Math.max(0, delta), goal: 0 }]
  }
  return list.map((p, i) =>
    i === idx ? { ...p, amount: Math.max(0, (p.amount || 0) + delta) } : p,
  )
}
