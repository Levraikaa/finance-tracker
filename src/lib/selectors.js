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

/** Évolution mensuelle multi-courbes de `from` jusqu'au mois de `ref`
 *  (inclus, contigu). Retourne pour chaque mois :
 *   - pocketGlobal : valeur de fin de mois, reconstituée en remontant
 *     depuis `pocketGlobalEnd`.
 *   - soldeBancaire : idem, reconstitué depuis `bankBalanceEnd`, en
 *     prenant en compte les ajustements internes du compte.
 *   - revenus : somme des « vrais » revenus du mois (hors Remboursement
 *     reçu pour rester aligné avec « Revenus du mois »).
 *   - depenses : somme des dépenses du mois. */
export function trackingMonthlySeries(
  transactions,
  bankAdjustments,
  pocketGlobalEnd,
  bankBalanceEnd,
  from,
  ref = new Date(),
) {
  const months = []
  let y = from.getFullYear()
  let m = from.getMonth()
  const endY = ref.getFullYear()
  const endM = ref.getMonth()
  while (y < endY || (y === endY && m <= endM)) {
    months.push({
      year: y,
      month: m,
      key: `${y}-${String(m + 1).padStart(2, '0')}`,
    })
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }

  const revenus = new Map()
  const depenses = new Map()
  const txNet = new Map()
  for (const t of transactions) {
    const d = new Date(t.date)
    const k = monthKey(d)
    if (t.type === 'income') {
      if (!isReimbursement(t.category)) {
        revenus.set(k, (revenus.get(k) ?? 0) + t.amount)
      }
      txNet.set(k, (txNet.get(k) ?? 0) + t.amount)
    } else if (t.type === 'expense') {
      depenses.set(k, (depenses.get(k) ?? 0) + t.amount)
      txNet.set(k, (txNet.get(k) ?? 0) - t.amount)
    }
  }

  const bankAdj = new Map()
  for (const a of bankAdjustments ?? []) {
    const k = monthKey(a.date)
    bankAdj.set(k, (bankAdj.get(k) ?? 0) + (Number(a.delta) || 0))
  }

  /* Marche arrière : on connaît la valeur de fin pour le dernier mois,
     on en déduit chaque mois précédent en retirant le delta du mois suivant. */
  const pocket = new Array(months.length).fill(null)
  const bank = new Array(months.length).fill(null)
  if (months.length > 0) {
    pocket[months.length - 1] = pocketGlobalEnd
    bank[months.length - 1] = bankBalanceEnd
    for (let i = months.length - 2; i >= 0; i--) {
      const nextKey = months[i + 1].key
      const nextTxNet = txNet.get(nextKey) ?? 0
      pocket[i] = pocket[i + 1] - nextTxNet
      bank[i] = bank[i + 1] - nextTxNet - (bankAdj.get(nextKey) ?? 0)
    }
  }

  return months.map((m, i) => ({
    key: m.key,
    year: m.year,
    month: m.month,
    revenus: revenus.get(m.key) ?? 0,
    depenses: depenses.get(m.key) ?? 0,
    pocketGlobal: pocket[i],
    soldeBancaire: bank[i],
  }))
}

/** Évolution JOURNALIÈRE du Pocket Global sur la période de tracking.
 *  - Un point par jour, de `from` (inclus) jusqu'à `ref` (aujourd'hui).
 *  - Le dernier jour = `endValue` (le Pocket Global live d'aujourd'hui).
 *  - Chaque jour précédent est reconstitué en remontant le temps : on
 *    retire le net des transactions du jour suivant.
 *  La courbe ne « bouge » donc qu'aux jours où il y a eu des mouvements
 *  (on ne dispose pas d'un historique de prix crypto au jour le jour). */
export function trackingDailySeries(
  transactions,
  endValue,
  from,
  ref = new Date(),
) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  if (end < start) return []

  const dayKey = (date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  /* Net (pour la reconstruction) + revenus/dépenses séparés par jour
     (pour enrichir le tooltip : « pourquoi la courbe a bougé ce jour-là »). */
  const txNet = new Map()
  const income = new Map()
  const expense = new Map()
  for (const t of transactions) {
    const k = dayKey(t.date)
    if (t.type === 'income') {
      income.set(k, (income.get(k) ?? 0) + t.amount)
      txNet.set(k, (txNet.get(k) ?? 0) + t.amount)
    } else if (t.type === 'expense') {
      expense.set(k, (expense.get(k) ?? 0) + t.amount)
      txNet.set(k, (txNet.get(k) ?? 0) - t.amount)
    }
  }

  const days = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  const n = days.length
  const pocket = new Array(n).fill(null)
  if (n > 0) {
    pocket[n - 1] = endValue
    for (let i = n - 2; i >= 0; i--) {
      pocket[i] = pocket[i + 1] - (txNet.get(dayKey(days[i + 1])) ?? 0)
    }
  }

  return days.map((d, i) => {
    const k = dayKey(d)
    return {
      key: k,
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      pocketGlobal: pocket[i],
      income: income.get(k) ?? 0,
      expense: expense.get(k) ?? 0,
    }
  })
}

const PROJECTION_WINDOW = 30

/** Prévisionnel : prolonge le Pocket Global jusqu'à la fin du mois de `ref`,
 *  au rythme net moyen des `PROJECTION_WINDOW` derniers jours glissants. On
 *  utilise une fenêtre glissante plutôt que « depuis le 1er » pour éviter la
 *  distorsion de début de mois : un gros débit fixe (loyer le 1er) ne doit
 *  pas être extrapolé comme un rythme quotidien et faire « plonger » la
 *  courbe. Le rythme net journalier = (revenus − dépenses sur la fenêtre) /
 *  nombre de jours de la fenêtre ; on l'ajoute à `endValue` (le Pocket Global
 *  live d'aujourd'hui) pour chaque jour restant.
 *  Renvoie :
 *   - series       : un point par jour APRÈS aujourd'hui { key, year, month,
 *                    day, projected }, à concaténer après la courbe réelle ;
 *   - dailyNet     : le rythme net journalier utilisé (peut être négatif) ;
 *   - projectedEnd : la valeur projetée au dernier jour du mois ;
 *   - daysRemaining, daysInMonth.
 *  Note : seul le flux de trésorerie (transactions) est extrapolé — les
 *  variations de prix crypto ne sont pas projetées. */
export function monthEndProjection(transactions, endValue, ref = new Date()) {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const today = ref.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  /* Net sur la fenêtre glissante [aujourd'hui − (WINDOW−1) ; aujourd'hui]. */
  const endDay = new Date(year, month, today)
  const startDay = new Date(year, month, today - PROJECTION_WINDOW + 1)
  let net = 0
  for (const t of transactions) {
    const d = new Date(t.date)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day < startDay || day > endDay) continue
    if (t.type === 'income') net += t.amount
    else if (t.type === 'expense') net -= t.amount
  }

  const dailyNet = net / PROJECTION_WINDOW

  const dayKey = (dd) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`

  const series = []
  for (let dd = today + 1; dd <= daysInMonth; dd++) {
    series.push({
      key: dayKey(dd),
      year,
      month,
      day: dd,
      projected: endValue + dailyNet * (dd - today),
    })
  }

  return {
    series,
    dailyNet,
    projectedEnd:
      series.length > 0 ? series[series.length - 1].projected : endValue,
    daysRemaining: daysInMonth - today,
    daysInMonth,
  }
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
