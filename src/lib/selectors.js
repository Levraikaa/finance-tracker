import { monthKey } from './format'
import { getCategory, isReimbursement } from './categories'

/* Sélecteurs analytiques — fonctions pures dérivant des stats des transactions. */

export const sum = (nums) => nums.reduce((s, n) => s + n, 0)

export function filterByMonth(transactions, key) {
  return transactions.filter((t) => monthKey(t.date) === key)
}

/* « Vrai » revenu : exclut la catégorie Remboursement reçu, qui crédite
   bien le solde mais n'est pas considérée comme un revenu. */
const isRealIncome = (t) =>
  t.type === 'income' && !isReimbursement(t.category)

export function totals(transactions) {
  const income = sum(
    transactions.filter(isRealIncome).map((t) => t.amount),
  )
  const reimbursement = sum(
    transactions
      .filter((t) => t.type === 'income' && isReimbursement(t.category))
      .map((t) => t.amount),
  )
  const expense = sum(
    transactions.filter((t) => t.type === 'expense').map((t) => t.amount),
  )
  /* Le solde inclut les remboursements (ils créditent réellement le compte). */
  const net = income + reimbursement - expense
  return {
    income,
    reimbursement,
    expense,
    net,
    balance: net,
    savingsRate: income > 0 ? (income - expense) / income : 0,
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

/** Série mensuelle : revenus, dépenses, net et solde cumulé.
 *  Les remboursements reçus sont exclus du « revenu » affiché, mais
 *  comptent dans le cumulatif (ils créditent le compte). */
export function monthlySeries(transactions, n = 6, ref = new Date()) {
  let running = 0
  return lastMonthsKeys(n, ref).map(({ key, date }) => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === key)
    const income = sum(inMonth.filter(isRealIncome).map((t) => t.amount))
    const reimbursement = sum(
      inMonth
        .filter((t) => t.type === 'income' && isReimbursement(t.category))
        .map((t) => t.amount),
    )
    const expense = sum(
      inMonth.filter((t) => t.type === 'expense').map((t) => t.amount),
    )
    running += income + reimbursement - expense
    return {
      key,
      date,
      income,
      reimbursement,
      expense,
      net: income - expense,
      cumulative: running,
    }
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

/** Évolution mensuelle du Pocket Global sur l'année de `ref`.
 *  - Point pour chaque mois (janvier → décembre).
 *  - Le mois en cours = `endValue` (le Pocket Global d'aujourd'hui).
 *  - Les mois passés sont reconstitués en remontant le temps depuis
 *    `endValue` et en retirant le net des transactions de cette année.
 *  - Les mois futurs sont marqués `future: true` (à afficher en pointillés). */
export function yearlyPocketSeries(transactions, endValue, ref = new Date()) {
  const year = ref.getFullYear()
  const currentMonth = ref.getMonth()

  const netByMonth = new Array(12).fill(0)
  for (const t of transactions) {
    const d = new Date(t.date)
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()
    if (t.type === 'income') netByMonth[m] += t.amount
    else if (t.type === 'expense') netByMonth[m] -= t.amount
  }

  const values = new Array(12).fill(null)
  values[currentMonth] = endValue
  for (let m = currentMonth - 1; m >= 0; m--) {
    values[m] = values[m + 1] - netByMonth[m + 1]
  }

  const series = values.map((v, m) => ({
    month: m,
    value: v,
    net: netByMonth[m],
    future: m > currentMonth,
  }))

  return { year, currentMonth, series }
}

/** Répartition par catégorie pour un type donné (dépense par défaut).
 *  Les remboursements reçus sont toujours exclus (camembert dépenses
 *  comme statistiques de revenus). */
export function categoryBreakdown(transactions, type = 'expense') {
  const map = new Map()
  for (const t of transactions) {
    if (t.type !== type) continue
    if (isReimbursement(t.category)) continue
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
