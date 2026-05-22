import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function StatCard({
  icon: Icon,
  accent = '#7C6FFF',
  label,
  value,
  hint,
  trend,
}) {
  return (
    <div
      className="rounded-2xl border border-line p-5"
      style={{
        background: 'linear-gradient(135deg, #131929 0%, #1a1f35 100%)',
        borderLeftWidth: '3px',
        borderLeftColor: accent,
        boxShadow: '0 8px 32px rgba(124,111,255,0.08)',
      }}
    >
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent">
          <Icon className="h-[22px] w-[22px]" />
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 font-num text-xs font-semibold ${
              trend.positive
                ? 'bg-positive/10 text-positive'
                : 'bg-negative/10 text-negative'
            }`}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.label}
          </span>
        )}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
        {label}
      </p>
      <p
        className="mt-1 font-num text-4xl font-bold tracking-tight"
        style={{ textShadow: '0 0 20px rgba(124,111,255,0.3)' }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  )
}
