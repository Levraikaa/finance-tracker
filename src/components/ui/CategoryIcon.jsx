import {
  Banknote,
  Car,
  CircleDashed,
  Dumbbell,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Laptop,
  Repeat,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

/* Résout le nom d'icône d'une catégorie vers le composant lucide correspondant. */
const ICONS = {
  Banknote,
  Car,
  CircleDashed,
  Dumbbell,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Laptop,
  Repeat,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
}

export default function CategoryIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? CircleDashed
  return <Icon {...props} />
}
