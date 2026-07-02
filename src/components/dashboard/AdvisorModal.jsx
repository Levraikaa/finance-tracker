import { useMemo, useState } from 'react'
import { Sparkles, Loader2, RefreshCw, TriangleAlert } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { getCategory } from '../../lib/categories.js'
import { monthKey } from '../../lib/format.js'
import {
  budgetStatus,
  categoryBreakdown,
  filterByMonth,
  monthlySeries,
  totals,
} from '../../lib/selectors.js'

const r = (n) => Math.round(Number(n) || 0)

const monthLabel = (date) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    date,
  )

/* Construit un résumé chiffré et compact des finances du mois — c'est ce
   qu'on envoie à l'IA (pas les transactions brutes : plus léger et plus privé). */
function buildSummary({ transactions, budgets, month, pocketGlobal, projection }) {
  const key = monthKey(month)
  const curTx = filterByMonth(transactions, key)
  const cur = totals(curTx)
  const breakdown = categoryBreakdown(curTx, 'expense')
  const budgetState = budgetStatus(budgets, transactions, key)
  const series = monthlySeries(transactions, 3, month)

  const now = new Date()
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()

  return {
    mois: monthLabel(month),
    jourDuMois: now.getDate(),
    joursDansLeMois: daysInMonth,
    revenusDuMois: r(cur.income),
    depensesDuMois: r(cur.expense),
    soldeNetDuMois: r(cur.income - cur.expense),
    tauxEpargnePct: r(cur.savingsRate * 100),
    topDepensesParCategorie: breakdown.slice(0, 6).map((b) => ({
      categorie: b.meta?.label ?? b.category,
      montant: r(b.amount),
      partPct: r(b.share * 100),
    })),
    budgets: budgetState.map((b) => ({
      categorie: getCategory(b.category).label,
      limite: r(b.limit),
      depense: r(b.spent),
      tauxPct: r(b.ratio * 100),
    })),
    troisDerniersMois: series.map((m) => ({
      mois: monthLabel(m.date),
      revenus: r(m.income),
      depenses: r(m.expense),
      net: r(m.net),
    })),
    pocketGlobalActuel: r(pocketGlobal),
    projectionFinDeMois: r(projection?.projectedEnd ?? pocketGlobal),
    rythmeNetJournalier: r(projection?.dailyNet ?? 0),
  }
}

/* Rendu Markdown minimal (titres ##, listes -, gras **…**) — évite d'ajouter
   une dépendance pour trois règles de formatage. */
function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function Markdown({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let list = null

  const flushList = () => {
    if (list) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1.5">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{renderInline(item, `li-${blocks.length}-${i}`)}</span>
            </li>
          ))}
        </ul>,
      )
      list = null
    }
  }

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) {
      flushList()
      return
    }
    if (line.startsWith('## ')) {
      flushList()
      blocks.push(
        <h4
          key={`h-${i}`}
          className="mt-5 mb-1.5 font-display text-sm font-semibold text-accent first:mt-0"
        >
          {renderInline(line.slice(3), `h-${i}`)}
        </h4>,
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!list) list = []
      list.push(line.slice(2))
    } else {
      flushList()
      blocks.push(
        <p key={`p-${i}`} className="my-1.5 text-sm leading-relaxed text-muted">
          {renderInline(line.replace(/^#+\s*/, ''), `p-${i}`)}
        </p>,
      )
    }
  })
  flushList()
  return <div>{blocks}</div>
}

const LOADING_MESSAGES = [
  'Lecture de tes transactions…',
  'Analyse de tes catégories…',
  'Repérage de tes tendances…',
  'Rédaction de tes conseils…',
]

export default function AdvisorModal({ month, pocketGlobal, projection }) {
  const { transactions, budgets } = useFinance()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const summary = useMemo(
    () => buildSummary({ transactions, budgets, month, pocketGlobal, projection }),
    [transactions, budgets, month, pocketGlobal, projection],
  )

  const run = async () => {
    setLoading(true)
    setError('')
    setAdvice('')
    setModel('')
    const timer = setInterval(() => setTick((t) => t + 1), 1800)
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) throw new Error('unavailable')
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Analyse indisponible pour le moment.')
        return
      }
      setAdvice(data.advice || '')
      setModel(data.model || '')
    } catch (err) {
      setError(
        err.message === 'unavailable'
          ? "Le Conseiller IA a besoin d'être déployé (fonction serverless) et d'une clé ANTHROPIC_API_KEY. Une fois configuré sur Vercel — ou dans un fichier .env en local — il s'active ici."
          : "Impossible de contacter le Conseiller IA. Vérifie ta connexion et réessaie.",
      )
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  const openAndRun = () => {
    setOpen(true)
    run()
  }

  const hasData = summary.revenusDuMois > 0 || summary.depensesDuMois > 0

  return (
    <>
      <button
        type="button"
        onClick={openAndRun}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-[filter] duration-200 hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, #7C6FFF 0%, #00E5A0 140%)',
          boxShadow: '0 8px 24px rgba(124,111,255,0.28)',
        }}
      >
        <Sparkles className="h-4 w-4" />
        Analyse IA
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ton conseiller IA"
        description="Analyse de tes finances et conseils personnalisés"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="text-sm text-muted">
              {LOADING_MESSAGES[tick % LOADING_MESSAGES.length]}
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-negative/15 text-negative">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <p className="max-w-sm text-sm text-muted">{error}</p>
            <button
              type="button"
              onClick={run}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-elevated"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && advice && (
          <div>
            {!hasData && (
              <p className="mb-3 rounded-lg border border-line bg-elevated/60 px-3 py-2 text-xs text-faint">
                Astuce : ajoute quelques transactions ce mois-ci pour une analyse
                plus précise.
              </p>
            )}
            <Markdown text={advice} />
            <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-3">
              <p className="text-[11px] text-faint">
                Généré par IA · vérifie toujours les montants
              </p>
              <button
                type="button"
                onClick={run}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Régénérer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
