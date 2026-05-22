import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { seedBudgets, seedTransactions } from '../lib/sampleData.js'
import { seedPockets } from '../lib/pockets.js'
import { totals } from '../lib/selectors.js'
import { uid } from '../lib/format.js'

const FinanceContext = createContext(null)

const EMPTY_BALANCE = { amount: 0, date: null }

const sortByDate = (list) =>
  [...list].sort((a, b) => new Date(b.date) - new Date(a.date))

const normalizeCrypto = (data) => ({
  coin: data.coin,
  name: data.name?.trim() || 'Crypto',
  quantity: Math.abs(Number(data.quantity)) || 0,
  /* Prix du marché figé au moment de l'ajout — base de la performance. */
  snapshotPrice: Math.abs(Number(data.snapshotPrice)) || 0,
  staking: {
    enabled: Boolean(data.staking?.enabled),
    rate: Math.abs(Number(data.staking?.rate)) || 0,
    startDate: data.staking?.startDate || '',
  },
})

/* Ajoute une quantité à une position : le prix snapshot devient la
   moyenne pondérée de l'ancien snapshot et du prix d'achat. */
const mergeCrypto = (holding, addedQty, price) => {
  const quantity = holding.quantity + addedQty
  const snapshotPrice =
    quantity > 0
      ? (holding.quantity * holding.snapshotPrice + addedQty * price) / quantity
      : holding.snapshotPrice
  return { ...holding, quantity, snapshotPrice }
}

export function FinanceProvider({ children }) {
  /* Clés en v2 : invalide les anciennes données de démonstration. */
  const [transactions, setTransactions] = useLocalStorage(
    'kaafinance.transactions.v2',
    seedTransactions,
  )
  const [budgets, setBudgets] = useLocalStorage(
    'kaafinance.budgets.v2',
    seedBudgets,
  )
  const [pockets, setPockets] = useLocalStorage(
    'kaafinance.pockets.v1',
    seedPockets,
  )
  const [cryptos, setCryptos] = useLocalStorage(
    'kaafinance.cryptos.v2',
    () => [],
  )
  const [cashMovements, setCashMovements] = useLocalStorage(
    'kaafinance.cash.v1',
    () => [],
  )
  /* Solde de départ du compte bancaire { amount, date } — défini dans
     les Paramètres ; base de calcul de toutes les transactions. */
  const [startingBalance, setStartingBalanceState] = useLocalStorage(
    'kaafinance.startingBalance.v1',
    EMPTY_BALANCE,
  )

  const addTransaction = useCallback(
    (data) => {
      setTransactions((prev) =>
        sortByDate([
          {
            id: uid(),
            type: data.type,
            amount: Math.abs(Number(data.amount)) || 0,
            category: data.category,
            description: data.description?.trim() || 'Sans description',
            date: data.date
              ? new Date(data.date).toISOString()
              : new Date().toISOString(),
          },
          ...prev,
        ]),
      )
    },
    [setTransactions],
  )

  const deleteTransaction = useCallback(
    (id) => setTransactions((prev) => prev.filter((t) => t.id !== id)),
    [setTransactions],
  )

  const upsertBudget = useCallback(
    (data) => {
      setBudgets((prev) => {
        const limit = Math.abs(Number(data.limit)) || 0
        const existing = prev.find((b) => b.category === data.category)
        if (existing) {
          return prev.map((b) =>
            b.category === data.category ? { ...b, limit } : b,
          )
        }
        return [...prev, { id: uid(), category: data.category, limit }]
      })
    },
    [setBudgets],
  )

  const deleteBudget = useCallback(
    (id) => setBudgets((prev) => prev.filter((b) => b.id !== id)),
    [setBudgets],
  )

  /* Ajoute une crypto. Si la crypto existe déjà (hors « Autre »), la
     quantité est cumulée sur la ligne existante au lieu d'en créer une. */
  const addCrypto = useCallback(
    (data) => {
      const incoming = normalizeCrypto(data)
      setCryptos((prev) => {
        if (incoming.coin !== 'autre') {
          const idx = prev.findIndex((c) => c.coin === incoming.coin)
          if (idx !== -1) {
            return prev.map((c, i) =>
              i === idx
                ? mergeCrypto(c, incoming.quantity, incoming.snapshotPrice)
                : c,
            )
          }
        }
        return [{ id: uid(), ...incoming }, ...prev]
      })
    },
    [setCryptos],
  )

  const updateCrypto = useCallback(
    (id, data) => {
      setCryptos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...normalizeCrypto(data) } : c)),
      )
    },
    [setCryptos],
  )

  /* Achète davantage d'une position existante (cumul de quantité). */
  const buyMoreCrypto = useCallback(
    (id, addedQuantity, price) => {
      const qty = Math.abs(Number(addedQuantity)) || 0
      const p = Math.abs(Number(price)) || 0
      if (qty <= 0) return
      setCryptos((prev) =>
        prev.map((c) => (c.id === id ? mergeCrypto(c, qty, p) : c)),
      )
    },
    [setCryptos],
  )

  const deleteCrypto = useCallback(
    (id) => setCryptos((prev) => prev.filter((c) => c.id !== id)),
    [setCryptos],
  )

  const addCashMovement = useCallback(
    (data) => {
      setCashMovements((prev) => [
        {
          id: uid(),
          type: data.type === 'remove' ? 'remove' : 'add',
          amount: Math.abs(Number(data.amount)) || 0,
          description: data.description?.trim() || '',
          date: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    [setCashMovements],
  )

  /* Enregistre le solde de départ et l'horodate. */
  const setStartingBalance = useCallback(
    (amount) => {
      setStartingBalanceState({
        amount: Number(amount) || 0,
        date: new Date().toISOString(),
      })
    },
    [setStartingBalanceState],
  )

  const cashBalance = useMemo(
    () =>
      cashMovements.reduce(
        (s, m) => s + (m.type === 'add' ? m.amount : -m.amount),
        0,
      ),
    [cashMovements],
  )

  /* Solde du compte : solde de départ + somme de toutes les transactions
     (revenus ajoutés, dépenses déduites). Recalculé en temps réel. */
  const bankBalance = useMemo(
    () => (startingBalance?.amount ?? 0) + totals(transactions).balance,
    [startingBalance, transactions],
  )

  const resetData = useCallback(() => {
    setTransactions(seedTransactions())
    setBudgets(seedBudgets())
    setPockets(seedPockets())
    setCryptos([])
    setCashMovements([])
    setStartingBalanceState(EMPTY_BALANCE)
  }, [
    setTransactions,
    setBudgets,
    setPockets,
    setCryptos,
    setCashMovements,
    setStartingBalanceState,
  ])

  const clearData = useCallback(() => {
    setTransactions([])
    setBudgets([])
    setPockets(seedPockets())
    setCryptos([])
    setCashMovements([])
    setStartingBalanceState(EMPTY_BALANCE)
  }, [
    setTransactions,
    setBudgets,
    setPockets,
    setCryptos,
    setCashMovements,
    setStartingBalanceState,
  ])

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      pockets,
      cryptos,
      cashMovements,
      cashBalance,
      startingBalance,
      bankBalance,
      addTransaction,
      deleteTransaction,
      upsertBudget,
      deleteBudget,
      addCrypto,
      updateCrypto,
      buyMoreCrypto,
      deleteCrypto,
      addCashMovement,
      setStartingBalance,
      resetData,
      clearData,
    }),
    [
      transactions,
      budgets,
      pockets,
      cryptos,
      cashMovements,
      cashBalance,
      startingBalance,
      bankBalance,
      addTransaction,
      deleteTransaction,
      upsertBudget,
      deleteBudget,
      addCrypto,
      updateCrypto,
      buyMoreCrypto,
      deleteCrypto,
      addCashMovement,
      setStartingBalance,
      resetData,
      clearData,
    ],
  )

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) {
    throw new Error('useFinance doit être utilisé dans un <FinanceProvider>.')
  }
  return ctx
}
