/* Référentiel des catégories KAAFINANCE.
   `icon` correspond au nom d'une icône lucide-react. */

/* Catégorie « Remboursement reçu » : techniquement un revenu (elle
   crédite le solde bancaire), mais exclue des stats de revenus, des
   graphiques et des budgets — c'est de l'argent récupéré, pas gagné. */
export const REIMBURSEMENT_CATEGORY = 'remboursementRecu'

/* `hidden` = catégorie héritée, conservée pour afficher d'anciennes
   transactions mais retirée des sélecteurs de saisie. */
export const CATEGORIES = {
  chomage: { label: 'Chômage', type: 'income', icon: 'Umbrella' },
  irysAgency: { label: 'Irys Agency', type: 'income', icon: 'Briefcase' },
  black: { label: 'Black', type: 'income', icon: 'Banknote' },
  remboursementRecu: {
    label: 'Remboursement reçu',
    type: 'income',
    icon: 'Undo2',
    excludedFromStats: true,
  },
  autres: { label: 'Autre', type: 'income', icon: 'CircleDashed' },
  salaire: { label: 'Salaire', type: 'income', icon: 'Wallet', hidden: true },
  remboursement: {
    label: 'Remboursement',
    type: 'income',
    icon: 'RotateCcw',
    hidden: true,
  },

  alimentation: { label: 'Alimentation', type: 'expense', icon: 'UtensilsCrossed' },
  logement: { label: 'Logement', type: 'expense', icon: 'House' },
  transport: { label: 'Transport', type: 'expense', icon: 'Car' },
  loisirs: { label: 'Autre', type: 'expense', icon: 'Gamepad2' },
  shopping: { label: 'Shopping', type: 'expense', icon: 'ShoppingBag' },
  sante: { label: 'Santé', type: 'expense', icon: 'HeartPulse' },
  sport: { label: 'Sport', type: 'expense', icon: 'Dumbbell' },
  abonnements: { label: 'Abonnements', type: 'expense', icon: 'Repeat' },
  autre: { label: 'Autre', type: 'expense', icon: 'CircleDashed' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES)

/* Liste affichée dans le sélecteur de revenu (hors catégories
   héritées). L'ordre = ordre d'affichage dans le picker. */
export const INCOME_CATEGORIES = CATEGORY_KEYS.filter(
  (k) => CATEGORIES[k].type === 'income' && !CATEGORIES[k].hidden,
)
export const EXPENSE_CATEGORIES = CATEGORY_KEYS.filter(
  (k) => CATEGORIES[k].type === 'expense',
)

export function getCategory(key) {
  return CATEGORIES[key] ?? CATEGORIES.autre
}

/* True si la catégorie ne doit pas compter comme un « vrai » revenu
   (exclue des stats, graphiques de revenus et budgets). */
export function isReimbursement(category) {
  return category === REIMBURSEMENT_CATEGORY
}
