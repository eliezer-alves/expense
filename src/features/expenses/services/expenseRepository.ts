import { v4 as uuidv4 } from 'uuid'
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/shared/lib/storage'
import type { Expense, CreateExpenseDTO, UpdateExpenseDTO, IExpenseRepository } from '../types'

export class LocalStorageExpenseRepository implements IExpenseRepository {
  async getAll(): Promise<Expense[]> {
    return getFromStorage<Expense>(STORAGE_KEYS.expenses).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  async getById(id: string): Promise<Expense | null> {
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    return all.find(e => e.id === id) || null
  }

  async create(data: CreateExpenseDTO): Promise<Expense> {
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    const expense: Expense = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }
    all.push(expense)
    saveToStorage(STORAGE_KEYS.expenses, all)
    return expense
  }

  async update(id: string, data: UpdateExpenseDTO): Promise<Expense> {
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    const idx = all.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Expense not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(STORAGE_KEYS.expenses, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    saveToStorage(STORAGE_KEYS.expenses, all.filter(e => e.id !== id))
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    saveToStorage(STORAGE_KEYS.expenses, all.filter(e => !idSet.has(e.id)))
  }

  async importBatch(items: CreateExpenseDTO[]): Promise<Expense[]> {
    const all = getFromStorage<Expense>(STORAGE_KEYS.expenses)
    const created: Expense[] = items.map(item => ({
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }))
    saveToStorage(STORAGE_KEYS.expenses, [...all, ...created])
    return created
  }

  async exportAll(): Promise<Expense[]> {
    return this.getAll()
  }
}

// Factory function - swap implementation here when moving to REST API
export function createExpenseRepository(): IExpenseRepository {
  return new LocalStorageExpenseRepository()
}
