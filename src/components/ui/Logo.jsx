/* Logo KAAFINANCE — wordmark texte uniquement (KAA blanc, FINANCE violet). */
export default function Logo({ onClick, className = '' }) {
  const inner = (
    <span className="font-display text-base font-bold leading-none tracking-tight text-ink sm:text-[1.15rem]">
      KAA<span className="text-accent">FINANCE</span>
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="KAAFINANCE — Vue d’ensemble"
        className={className}
      >
        {inner}
      </button>
    )
  }

  return <span className={className}>{inner}</span>
}
