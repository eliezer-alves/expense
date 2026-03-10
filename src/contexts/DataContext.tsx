import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Expense, Category, Partner, IExpenseRepository, ICategoryRepository, IPartnerRepository } from '../types'
import { createExpenseRepository, createCategoryRepository, createPartnerRepository } from '../data'

interface DataContextType {
  expenses: Expense[]
  categories: Category[]
  partners: Partner[]
  loading: boolean
  // Expenses
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  importExpenses: (items: Omit<Expense, 'id' | 'createdAt'>[]) => Promise<Expense[]>
  // Categories
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  // Partners
  addPartner: (data: Omit<Partner, 'id'>) => Promise<Partner>
  updatePartner: (id: string, data: Partial<Omit<Partner, 'id'>>) => Promise<void>
  deletePartner: (id: string) => Promise<void>
  // Refresh
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

const expenseRepo: IExpenseRepository = createExpenseRepository()
const categoryRepo: ICategoryRepository = createCategoryRepository()
const partnerRepo: IPartnerRepository = createPartnerRepository()

export function DataProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [e, c, p] = await Promise.all([
      expenseRepo.getAll(),
      categoryRepo.getAll(),
      partnerRepo.getAll(),
    ])
    setExpenses(e)
    setCategories(c)
    setPartners(p)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = await expenseRepo.create(data)
    setExpenses(prev => [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    return created
  }, [])

  const updateExpense = useCallback(async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    await expenseRepo.update(id, data)
    await refresh()
  }, [refresh])

  const deleteExpense = useCallback(async (id: string) => {
    await expenseRepo.delete(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  const importExpenses = useCallback(async (items: Omit<Expense, 'id' | 'createdAt'>[]) => {
    const created = await expenseRepo.importBatch(items)
    await refresh()
    return created
  }, [refresh])

  const addCategory = useCallback(async (data: Omit<Category, 'id'>) => {
    const created = await categoryRepo.create(data)
    setCategories(prev => [...prev, created])
    return created
  }, [])

  const updateCategory = useCallback(async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    await categoryRepo.update(id, data)
    await refresh()
  }, [refresh])

  const deleteCategory = useCallback(async (id: string) => {
    await categoryRepo.delete(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  const addPartner = useCallback(async (data: Omit<Partner, 'id'>) => {
    const created = await partnerRepo.create(data)
    setPartners(prev => [...prev, created])
    return created
  }, [])

  const updatePartner = useCallback(async (id: string, data: Partial<Omit<Partner, 'id'>>) => {
    await partnerRepo.update(id, data)
    await refresh()
  }, [refresh])

  const deletePartner = useCallback(async (id: string) => {
    await partnerRepo.delete(id)
    setPartners(prev => prev.filter(p => p.id !== id))
  }, [])

  return (
    <DataContext.Provider value={{
      expenses, categories, partners, loading,
      addExpense, updateExpense, deleteExpense, importExpenses,
      addCategory, updateCategory, deleteCategory,
      addPartner, updatePartner, deletePartner,
      refresh,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
