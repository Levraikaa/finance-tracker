# KAAFINANCE

> Le suivi financier nouvelle génération — application de gestion de budget.

Application web construite **entièrement de zéro** en **React + Vite**, stylée avec
**Tailwind CSS v4** et la police de marque **Oktah**.

## ✨ Fonctionnalités

L'application s'ouvre directement sur le dashboard. La navigation se fait via
une **barre horizontale fixe** en haut de l'écran : logo à gauche, onglets au
centre, bouton **+ Ajouter** et **sélecteur de mois** à droite.

- **Vue d'ensemble** — solde, pocket global (détail dépliable des pockets,
  dont le portefeuille crypto et le cash), revenus et dépenses, graphique
  d'évolution du solde et répartition des dépenses par catégorie.
- **Transactions** — liste filtrable et recherchable, ajout et suppression.
- **Budgets** — limites mensuelles par catégorie avec barres de progression.
- **Investissement** — tracker de portefeuille crypto en temps réel : prix
  CoinGecko rafraîchis toutes les 60 s, staking, graphique d'évolution.
- **Paramètres** — Pocket Cash (suivi de l'argent liquide), gestion des
  données (réinitialisation, effacement).

Le sélecteur de mois pilote toutes les vues : les flèches gauche/droite
permettent de naviguer entre les mois et les données affichées s'actualisent
en conséquence.

Les données sont **persistées dans le `localStorage`** du navigateur — aucun
backend requis.

## 🚀 Démarrage

```bash
npm install      # installer les dépendances
npm run dev      # serveur de développement
npm run build    # build de production
npm run preview  # prévisualiser le build
```

## 🧱 Stack technique

| Outil            | Rôle                          |
| ---------------- | ----------------------------- |
| React 19         | Interface                     |
| Vite             | Build & dev server            |
| Tailwind CSS v4  | Styles (thème dark fintech)   |
| lucide-react     | Icônes                        |
| Oktah            | Police de marque (display)    |

## 📁 Structure

```
src/
├── components/
│   ├── dashboard/   Navbar, vues, graphiques, modale
│   └── ui/          Composants partagés (Logo, Modal…)
├── context/         FinanceContext — état global + persistance
├── hooks/           useLocalStorage
├── lib/             Formatage, catégories, sélecteurs, données de démo
├── pages/           Dashboard
└── index.css        Thème Tailwind v4 + police Oktah
```

---

© 2026 KAAFINANCE.
