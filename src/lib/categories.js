/* Référentiel des catégories KAAFINANCE.
   `icon` correspond au nom d'une icône lucide-react. */

export const CATEGORIES = {
  salaire: { label: 'Salaire', type: 'income', icon: 'Wallet' },
  autres: { label: 'Autres', type: 'income', icon: 'CircleDashed' },
  black: { label: 'Black', type: 'income', icon: 'Banknote' },
  remboursement: { label: 'Remboursement', type: 'income', icon: 'RotateCcw' },

  alimentation: { label: 'Alimentation', type: 'expense', icon: 'UtensilsCrossed' },
  logement: { label: 'Logement', type: 'expense', icon: 'House' },
  transport: { label: 'Transport', type: 'expense', icon: 'Car' },
  loisirs: { label: 'Loisirs', type: 'expense', icon: 'Gamepad2' },
  shopping: { label: 'Shopping', type: 'expense', icon: 'ShoppingBag' },
  sante: { label: 'Santé', type: 'expense', icon: 'HeartPulse' },
  sport: { label: 'Sport', type: 'expense', icon: 'Dumbbell' },
  abonnements: { label: 'Abonnements', type: 'expense', icon: 'Repeat' },
  autre: { label: 'Autre', type: 'expense', icon: 'CircleDashed' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES)

export const INCOME_CATEGORIES = CATEGORY_KEYS.filter(
  (k) => CATEGORIES[k].type === 'income',
)
export const EXPENSE_CATEGORIES = CATEGORY_KEYS.filter(
  (k) => CATEGORIES[k].type === 'expense',
)

export function getCategory(key) {
  return CATEGORIES[key] ?? CATEGORIES.autre
}
