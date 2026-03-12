import { create } from 'zustand'
import type { Expense, CreateExpenseDTO, UpdateExpenseDTO, IExpenseRepository } from './types'
import { createExpenseRepository } from './services/expenseRepository'

interface ExpenseState {
  expenses: Expense[]
  loading: boolean
  repository: IExpenseRepository

  // Actions
  fetchAll: () => Promise<void>
  addExpense: (data: CreateExpenseDTO) => Promise<Expense>
  updateExpense: (id: string, data: UpdateExpenseDTO) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  deleteBatchExpenses: (ids: string[]) => Promise<void>
  importExpenses: (items: CreateExpenseDTO[]) => Promise<Expense[]>
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: true,
  repository: createExpenseRepository(),

  fetchAll: async () => {
    set({ loading: true })
    const expenses = await get().repository.getAll()
    set({ expenses, loading: false })
  },

  addExpense: async (data) => {
    const created = await get().repository.create(data)
    set(state => ({
      expenses: [created, ...state.expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }))
    return created
  },

  updateExpense: async (id, data) => {
    await get().repository.update(id, data)
    await get().fetchAll()
  },

  deleteExpense: async (id) => {
    await get().repository.delete(id)
    set(state => ({
      expenses: state.expenses.filter(e => e.id !== id),
    }))
  },

  deleteBatchExpenses: async (ids) => {
    await get().repository.deleteBatch(ids)
    const idSet = new Set(ids)
    set(state => ({
      expenses: state.expenses.filter(e => !idSet.has(e.id)),
    }))
  },

  importExpenses: async (items) => {
    const created = await get().repository.importBatch(items)
    await get().fetchAll()
    return created
  },
}))
