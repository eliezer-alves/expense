import { useEffect, type ReactNode } from 'react'
import { useExpenseStore } from '@/features/expenses/store'
import { useCategoryStore } from '@/features/categories/store'
import { usePartnerStore } from '@/features/partners/store'

interface DataLoaderProps {
  children: ReactNode
}

export function DataLoader({ children }: DataLoaderProps) {
  const fetchExpenses = useExpenseStore(state => state.fetchAll)
  const fetchCategories = useCategoryStore(state => state.fetchAll)
  const fetchPartners = usePartnerStore(state => state.fetchAll)

  const expenseLoading = useExpenseStore(state => state.loading)
  const categoryLoading = useCategoryStore(state => state.loading)
  const partnerLoading = usePartnerStore(state => state.loading)

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
    fetchPartners()
  }, [fetchExpenses, fetchCategories, fetchPartners])

  const loading = expenseLoading || categoryLoading || partnerLoading

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
