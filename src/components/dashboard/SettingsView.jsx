import { useEffect, useState } from 'react'
import {
  Banknote,
  Database,
  Info,
  Landmark,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
} from 'lucide-react'
import CashModal from './CashModal.jsx'
import CategorySettings from './CategorySettings.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

const FIELD =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 pr-9 font-num text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60'

export default function SettingsView() {
  const {
    transactions,
    budgets,
    cashMovements,
    cashBalance,
    startingBalance,
    setStartingBalance,
    resetData,
    clearData,
  } = useFinance()

  const [cashMode, setCashMode] = useState(null)
  const [editingBalance, setEditingBalance] = useState(
    () => !startingBalance.date,
  )
  const [balanceDraft, setBalanceDraft] = useState(() =>
    startingBalance.amount ? String(startingBalance.amount) : '',
  )

  /* Resynchronise le champ quand le solde de départ change (ex. après reset). */
  useEffect(() => {
    setBalanceDraft(startingBalance.amount ? String(startingBalance.amount) : '')
    if (!startingBalance.date) setEditingBalance(true)
  }, [startingBalance])

  const saveBalance = (e) => {
    e.preventDefault()
    const value = parseFloat(String(balanceDraft).replace(',', '.'))
    setStartingBalance(Number.isFinite(value) ? value : 0)
    setEditingBalance(false)
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Réinitialiser l’application ? Toutes vos données seront remises à zéro.',
      )
    ) {
      resetData()
    }
  }

  const handleClear = () => {
    if (
      window.confirm(
        'Effacer définitivement toutes vos données ? Cette action est irréversible.',
      )
    ) {
      clearData()
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Mes liquidités */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Mes liquidités
            </h2>
            <p className="text-xs text-muted">
              Votre argent disponible — compte bancaire et cash physique.
            </p>
          </div>
        </div>

        <div className="mt-5 grid items-start gap-4 sm:grid-cols-2">
          {/* Bloc 1 — Solde bancaire */}
          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">Solde bancaire</p>
            </div>

            {editingBalance ? (
              <form onSubmit={saveBalance} className="mt-3 space-y-2">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={balanceDraft}
                    onChange={(e) => setBalanceDraft(e.target.value)}
                    placeholder="Solde actuel du compte"
                    className={FIELD}
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
                    €
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-[10px] bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
                >
                  Enregistrer
                </button>
              </form>
            ) : (
              <>
                <p className="mt-3 font-num text-2xl font-bold tabular-nums">
                  {formatCurrency(startingBalance.amount)}
                </p>
                {startingBalance.date && (
                  <p className="mt-0.5 text-xs text-muted">
                    Enregistré le {formatDate(startingBalance.date)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingBalance(true)}
                  className="mt-3 w-full rounded-[10px] border border-line bg-surface py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
                >
                  Modifier
                </button>
              </>
            )}
          </div>

          {/* Bloc 2 — Pocket Cash */}
          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">Pocket Cash</p>
            </div>

            <p className="mt-3 font-num text-2xl font-bold tabular-nums">
              {formatCurrency(cashBalance)}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCashMode('add')}
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
              >
                <Plus className="h-4 w-4" />
                Ajouter du cash
              </button>
              <button
                type="button"
                onClick={() => setCashMode('remove')}
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
              >
                <Minus className="h-4 w-4" />
                Retirer du cash
              </button>
            </div>

            {/* Historique des mouvements */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                Historique
              </p>
              {cashMovements.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Aucun mouvement pour le moment.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-line-soft">
                  {cashMovements.map((m) => {
                    const add = m.type === 'add'
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.description ||
                              (add ? 'Ajout de cash' : 'Retrait de cash')}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(m.date)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-num text-sm font-semibold tabular-nums ${
                            add ? 'text-positive' : 'text-negative'
                          }`}
                        >
                          {add ? '+' : '−'}
                          {formatCurrency(m.amount)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gestion des catégories */}
      <CategorySettings />

      {/* Gestion des données */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Vos données
            </h2>
            <p className="text-xs text-muted">
              Stockées localement dans votre navigateur — rien n’est envoyé sur
              un serveur.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="font-num text-2xl font-bold tabular-nums">
              {transactions.length}
            </p>
            <p className="text-xs text-muted">transactions enregistrées</p>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="font-num text-2xl font-bold tabular-nums">
              {budgets.length}
            </p>
            <p className="text-xs text-muted">budgets actifs</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-negative/30 bg-negative/10 px-4 py-2.5 text-sm font-semibold text-negative transition-colors hover:bg-negative/20"
          >
            <Trash2 className="h-4 w-4" />
            Tout effacer
          </button>
        </div>
      </section>

      {/* À propos */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              À propos de KAAFINANCE
            </h2>
            <p className="text-xs text-muted">Version 1.0.0</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-line-soft text-sm">
          {[
            ['Application', 'KAAFINANCE — suivi financier'],
            ['Technologies', 'React · Vite · Tailwind CSS'],
            ['Typographie', 'DM Sans · Inter'],
            ['Stockage', 'localStorage du navigateur'],
          ].map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">{key}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {cashMode && (
        <CashModal mode={cashMode} onClose={() => setCashMode(null)} />
      )}
    </div>
  )
}
