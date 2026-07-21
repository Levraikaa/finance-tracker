import {
  Banknote,
  Briefcase,
  Car,
  CircleDashed,
  Dumbbell,
  Gamepad2,
  Gift,
  HandCoins,
  HeartPulse,
  House,
  Laptop,
  Repeat,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Umbrella,
  Undo2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

/* Résout le nom d'icône d'une catégorie vers le composant lucide correspondant. */
const ICONS = {
  Banknote,
  Briefcase,
  Car,
  CircleDashed,
  Dumbbell,
  Gamepad2,
  Gift,
  HandCoins,
  HeartPulse,
  House,
  Laptop,
  Repeat,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Umbrella,
  Undo2,
  UtensilsCrossed,
  Wallet,
}

export default function CategoryIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? CircleDashed
  return <Icon {...props} />
}
