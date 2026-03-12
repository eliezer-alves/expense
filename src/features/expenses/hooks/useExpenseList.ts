import { useMemo } from 'react'
import { useExpenseStore } from '../store'
import { useCategoryStore } from '@/features/categories/store'
import { usePartnerStore } from '@/features/partners/store'
import { formatBRL } from '@/shared/lib/format'
import type { Expense } from '../types'

interface UseExpenseListParams {
  search: string
  filterCategory: string
}

interface UseExpenseListReturn {
  filtered: Expense[]
  totalFiltered: number
  catMap: Map<string, { id: string; name: string; color: string; icon: string }>
  partnerMap: Map<string, { id: string; name: string }>
}

export function useExpenseList({ search, filterCategory }: UseExpenseListParams): UseExpenseListReturn {
  const expenses = useExpenseStore(state => state.expenses)
  const categories = useCategoryStore(state => state.categories)
  const partners = usePartnerStore(state => state.partners)

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])
  const partnerMap = useMemo(() => new Map(partners.map(p => [p.id, p])), [partners])

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterCategory && e.categoryId !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        const cat = catMap.get(e.categoryId)
        const par = e.partnerId ? partnerMap.get(e.partnerId) : null
        const match =
          e.description.toLowerCase().includes(q) ||
          (cat?.name || '').toLowerCase().includes(q) ||
          (par?.name || '').toLowerCase().includes(q) ||
          formatBRL(e.value).includes(q) ||
          new Date(e.date).toLocaleDateString('pt-BR').includes(q)
        if (!match) return false
      }
      return true
    })
  }, [expenses, search, filterCategory, catMap, partnerMap])

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + e.value, 0), [filtered])

  return { filtered, totalFiltered, catMap, partnerMap }
}
