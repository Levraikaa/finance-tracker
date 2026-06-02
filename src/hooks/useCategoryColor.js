import { useCategoryOverrides } from '../context/CategoryOverridesContext.jsx'

/* Source unique pour les couleurs de catégorie. Toutes les vues
   (budgets, camembert, transactions, abonnements) lisent par ici
   plutôt que d'importer la palette par défaut, pour que la sélection
   d'une couleur en Paramètres se propage en temps réel. */
export function useCategoryColor(key) {
  const { getDisplay } = useCategoryOverrides()
  return getDisplay(key).color
}

/* Variante : retourne une fonction de résolution, utile si un composant
   doit produire plusieurs couleurs dans le même rendu. */
export function useCategoryColorResolver() {
  const { getDisplay } = useCategoryOverrides()
  return (key) => getDisplay(key).color
}
