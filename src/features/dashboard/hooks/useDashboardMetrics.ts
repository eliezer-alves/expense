import { useMemo } from 'react'
import { useExpenseStore } from '@/features/expenses/store'
import { useCategoryStore } from '@/features/categories/store'
import { getMonthKey, getMonthLabel } from '@/shared/lib/format'
import type { Expense } from '@/features/expenses/types'
import type { Category } from '@/features/categories/types'

export interface DashboardData {
  total: number
  byCategory: { name: string; key: string; value: number; pct: number; color: string }[]
  monthlyData: Record<string, number | string>[]
  cumulativeData: { name: string; total: number }[]
  monthlyTrend: { name: string; total: number }[]
  topExpenses: Expense[]
  avgPerTransaction: number
  avgMonthly: number
  lastMonthVal: number
  lastMonthLabel: string
  monthChange: number
  numTransactions: number
}

export function useDashboardMetrics(): DashboardData | null {
  const expenses = useExpenseStore(state => state.expenses)
  const categories = useCategoryStore(state => state.categories)

  return useMemo(() => {
    if (expenses.length === 0) return null

    const total = expenses.reduce((s, e) => s + e.value, 0)
    const catMap = new Map<string, Category>(categories.map(c => [c.id, c]))

    // By category
    const byCatRaw: Record<string, number> = {}
    expenses.forEach(e => { byCatRaw[e.categoryId] = (byCatRaw[e.categoryId] || 0) + e.value })
    const byCategory = Object.entries(byCatRaw)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => {
        const cat = catMap.get(id)
        return {
          name: cat?.name || 'N/A',
          key: id,
          value: Math.round(value * 100) / 100,
          pct: Math.round((value / total) * 1000) / 10,
          color: cat?.color || '#94a3b8',
        }
      })

    // Monthly
    const monthTotals: Record<string, Record<string, number>> = {}
    expenses.forEach(e => {
      const mk = getMonthKey(e.date)
      if (!monthTotals[mk]) monthTotals[mk] = {}
      monthTotals[mk][e.categoryId] = (monthTotals[mk][e.categoryId] || 0) + e.value
    })

    const monthKeys = Object.keys(monthTotals).sort()
    const monthlyData = monthKeys.map(mk => {
      const entry: Record<string, number | string> = { name: getMonthLabel(mk) }
      let monthTotal = 0
      categories.forEach(c => {
        const v = Math.round((monthTotals[mk]?.[c.id] || 0) * 100) / 100
        entry[c.id] = v
        monthTotal += v
      })
      entry.total = Math.round(monthTotal * 100) / 100
      return entry
    })

    // Cumulative
    let running = 0
    const cumulativeData = monthKeys.map(mk => {
      let mt = 0
      categories.forEach(c => { mt += monthTotals[mk]?.[c.id] || 0 })
      running += mt
      return { name: getMonthLabel(mk), total: Math.round(running * 100) / 100 }
    })

    // Monthly trend
    const monthlyTrend = monthKeys.map(mk => {
      let mt = 0
      categories.forEach(c => { mt += monthTotals[mk]?.[c.id] || 0 })
      return { name: getMonthLabel(mk), total: Math.round(mt * 100) / 100 }
    })

    // Top expenses
    const topExpenses = [...expenses].sort((a, b) => b.value - a.value).slice(0, 10)

    // Averages
    const avgPerTransaction = total / expenses.length
    const avgMonthly = total / (monthKeys.length || 1)

    // Month change
    const lastMonthVal = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].total : 0
    const prevMonthVal = monthlyTrend.length > 1 ? monthlyTrend[monthlyTrend.length - 2].total : 0
    const monthChange = prevMonthVal > 0 ? ((lastMonthVal - prevMonthVal) / prevMonthVal * 100) : 0
    const lastMonthLabel = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].name : ''

    return {
      total, byCategory, monthlyData, cumulativeData, monthlyTrend,
      topExpenses, avgPerTransaction, avgMonthly,
      lastMonthVal, lastMonthLabel, monthChange,
      numTransactions: expenses.length,
    }
  }, [expenses, categories])
}
