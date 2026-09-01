/* Référentiel des catégories KAAFINANCE.
   `icon` correspond au nom d'une icône lucide-react. */

/* Catégorie « Remboursement reçu » : techniquement un revenu (elle
   crédite le solde bancaire), mais exclue des stats de revenus, des
   graphiques et des budgets — c'est de l'argent récupéré, pas gagné. */
export const REIMBURSEMENT_CATEGORY = 'remboursementRecu'

/* Catégorie « Ajustement » : sert à recaler le solde sur la réalité
   (erreur de saisie, arrondi, correction). L'argent bouge bien sur le
   compte, mais ce n'est pas une vraie dépense — donc exclue des stats,
   des graphiques de dépenses, du camembert et des budgets. */
export const ADJUSTMENT_CATEGORY = 'ajustement'

/* Catégorie « Dette » : de l'argent prêté à quelqu'un. C'est une dépense
   (l'argent sort réellement du solde), mais elle crée en plus une entrée
   dans la liste des dettes (qui te doit combien). */
export const DEBT_CATEGORY = 'dette'

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
  sport: { label: 'Sport', type: 'expense', icon: 'Dumbbell' },
  loisirs: { label: 'Autre', type: 'expense', icon: 'Gamepad2' },
  transport: { label: 'Transport', type: 'expense', icon: 'Car' },
  investissement: { label: 'Investissement', type: 'expense', icon: 'TrendingUp' },
  abonnements: { label: 'Abonnements / Charges', type: 'expense', icon: 'Repeat' },
  dette: { label: 'Dette', type: 'expense', icon: 'HandCoins' },
  autre: { label: 'Autre achat', type: 'expense', icon: 'ShoppingBag' },
  ajustement: {
    label: 'Ajustement',
    type: 'expense',
    icon: 'SlidersHorizontal',
    excludedFromStats: true,
  },
  /* Catégories héritées : on les conserve pour afficher d'anciennes
     transactions, mais elles ne s'affichent plus dans les sélecteurs. */
  logement: { label: 'Logement', type: 'expense', icon: 'House', hidden: true },
  shopping: { label: 'Shopping', type: 'expense', icon: 'ShoppingBag', hidden: true },
  sante: { label: 'Santé', type: 'expense', icon: 'HeartPulse', hidden: true },
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

/* Catégories budgétables : on retire les recalages de solde. */
export const BUDGETABLE_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (k) => !CATEGORIES[k].excludedFromStats,
)

export function getCategory(key) {
  return CATEGORIES[key] ?? CATEGORIES.autre
}

/* True si la catégorie ne doit pas compter comme un « vrai » revenu
   (exclue des stats, graphiques de revenus et budgets). */
export function isReimbursement(category) {
  return category === REIMBURSEMENT_CATEGORY
}

/* True si la transaction est un simple recalage de solde : elle bouge le
   solde bancaire mais ne compte pas comme une dépense. */
export function isAdjustment(category) {
  return category === ADJUSTMENT_CATEGORY
}
