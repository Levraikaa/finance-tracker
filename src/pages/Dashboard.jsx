import { useEffect, useState } from 'react'
import Navbar from '../components/dashboard/Navbar.jsx'
import OverviewView from '../components/dashboard/OverviewView.jsx'
import TransactionsView from '../components/dashboard/TransactionsView.jsx'
import BudgetsView from '../components/dashboard/BudgetsView.jsx'
import InvestmentsView from '../components/dashboard/InvestmentsView.jsx'
import SettingsView from '../components/dashboard/SettingsView.jsx'
import TransactionModal from '../components/dashboard/TransactionModal.jsx'
import { useSubscriptionAutoDebit } from '../hooks/useSubscriptionAutoDebit.js'
import { parseLocalDay } from '../lib/format.js'

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)

export default function Dashboard() {
  const [view, setView] = useState('overview')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [modalOpen, setModalOpen] = useState(false)

  /* Vérifie les abonnements à débiter à chaque chargement. */
  useSubscriptionAutoDebit()

  useEffect(() => {
    document.title = 'KAAFINANCE — Suivi financier'
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  const shiftMonth = (delta) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))

  const canGoNext = month < startOfMonth(new Date())
  const openModal = () => setModalOpen(true)

  /* Le mois affiché est figé au chargement de la page. Une transaction datée
     d'un autre mois (onglet resté ouvert la nuit, ou saisie antidatée) était
     bien enregistrée mais absente de la liste filtrée. On recale la vue sur
     le mois de la transaction qui vient d'être ajoutée. */
  const handleAdded = (day) => {
    const d = parseLocalDay(day)
    if (Number.isNaN(d.getTime())) return
    setMonth((m) => {
      const target = startOfMonth(d)
      return target.getTime() === m.getTime() ? m : target
    })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar
        view={view}
        onChange={setView}
        month={month}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        canGoNext={canGoNext}
        onAdd={openModal}
      />

      <main className="px-5 pb-12 pt-24 sm:px-8">
        {view === 'overview' && (
          <OverviewView month={month} onNavigate={setView} />
        )}
        {view === 'transactions' && (
          <TransactionsView month={month} onAdd={openModal} />
        )}
        {view === 'budgets' && <BudgetsView month={month} />}
        {view === 'investments' && <InvestmentsView />}
        {view === 'settings' && <SettingsView />}
      </main>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleAdded}
      />
    </div>
  )
}
