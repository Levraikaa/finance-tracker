/* Couleurs uniques par catégorie — centralisées ici pour rester
   cohérentes entre les budgets, le camembert et les transactions.

   Clés = clés internes des catégories (alimentation, sport, …) ;
   les libellés affichés sont définis dans src/lib/categories.js. */

export const CATEGORY_COLORS = {
  alimentation: '#FF6B6B', // Nourriture / Alimentation
  sport: '#00E5A0',         // Sport
  loisirs: '#FFB84D',       // Loisir
  transport: '#69C9D0',     // Transport
  abonnements: '#FF4D6A',   // Abonnements / Charges
  autre: '#A78BFA',         // Autre achat
  shopping: '#C084FC',
  logement: '#4FD1C5',
  sante: '#FB7185',
}

/* Catégorie liée à l'investissement (utilisée pour les pockets, pas
   pour une catégorie de transaction). Conservée ici pour la cohérence
   de la palette. */
export const INVESTMENT_COLOR = '#7C6FFF'

const DEFAULT_COLOR = '#7C6FFF'

export function getCategoryColor(key) {
  return CATEGORY_COLORS[key] ?? DEFAULT_COLOR
}
