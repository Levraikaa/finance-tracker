import { monthKey } from './format'
import { getCategory } from './categories'

/* Sélecteurs analytiques — fonctions pures dérivant des stats des transactions. */

export const sum = (nums) => nums.reduce((s, n) => s + n, 0)

export function filterByMonth(transactions, key) {
  return transactions.filter((t) => monthKey(t.date) === key)
}

export function totals(transactions) {
  const income = sum(
    transactions.filter((t) => t.type === 'income').map((t) => t.amount),
  )
  const expense = sum(
    transactions.filter((t) => t.type === 'expense').map((t) => t.amount),
  )
  const net = income - expense
  return {
    income,
    expense,
    net,
    balance: net,
    savingsRate: income > 0 ? net / income : 0,
  }
}

/** Retourne les clés des n derniers mois (le mois courant inclus). */
export function lastMonthsKeys(n, ref = new Date()) {
  const keys = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1)
    keys.push({ key: monthKey(d), date: d })
  }
  return keys
}

/** Série mensuelle : revenus, dépenses, net et solde cumulé. */
export function monthlySeries(transactions, n = 6, ref = new Date()) {
  let running = 0
  return lastMonthsKeys(n, ref).map(({ key, date }) => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === key)
    const income = sum(
      inMonth.filter((t) => t.type === 'income').map((t) => t.amount),
    )
    const expense = sum(
      inMonth.filter((t) => t.type === 'expense').map((t) => t.amount),
    )
    running += income - expense
    return { key, date, income, expense, net: income - expense, cumulative: running }
  })
}

/** Évolution day-by-day du Pocket Global au cours du mois de `ref`.
 *  Le premier point porte la valeur initiale ; un point est ajouté pour
 *  chaque jour où au moins une transaction a été enregistrée. */
export function dailyPocketSeries(transactions, startValue, ref = new Date()) {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const byDay = new Map()
  for (const t of transactions) {
    const d = new Date(t.date)
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    const day = d.getDate()
    if (!byDay.has(day)) byDay.set(day, { income: 0, expense: 0 })
    const acc = byDay.get(day)
    if (t.type === 'income') acc.income += t.amount
    else if (t.type === 'expense') acc.expense += t.amount
  }

  const series = [
    { day: 1, value: startValue, income: 0, expense: 0, isStart: true },
  ]
  let running = startValue
  const sortedDays = [...byDay.keys()].sort((a, b) => a - b)
  for (const day of sortedDays) {
    const { income, expense } = byDay.get(day)
    running += income - expense
    if (day === 1) {
      series[0] = { day: 1, value: running, income, expense, isStart: false }
    } else {
      series.push({ day, value: running, income, expense, isStart: false })
    }
  }
  return { series, daysInMonth, year, month }
}

/** Répartition par catégorie pour un type donné (dépense par défaut). */
export function categoryBreakdown(transactions, type = 'expense') {
  const map = new Map()
  for (const t of transactions) {
    if (t.type !== type) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  const total = sum([...map.values()])
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: total > 0 ? amount / total : 0,
      meta: getCategory(category),
    }))
    .sort((a, b) => b.amount - a.amount)
}

/** Avancement des budgets pour un mois donné. */
export function budgetStatus(budgets, transactions, key) {
  return budgets.map((b) => {
    const spent = sum(
      transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category === b.category &&
            monthKey(t.date) === key,
        )
        .map((t) => t.amount),
    )
    return {
      ...b,
      spent,
      ratio: b.limit > 0 ? spent / b.limit : 0,
      remaining: b.limit - spent,
    }
  })
}

/** Variation en pourcentage entre deux valeurs. */
export function delta(current, previous) {
  if (!previous) return current > 0 ? 1 : 0
  return (current - previous) / Math.abs(previous)
}
