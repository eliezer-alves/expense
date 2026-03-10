import { v4 as uuidv4 } from 'uuid'
import type {
  Expense, Category, Partner,
  IExpenseRepository, ICategoryRepository, IPartnerRepository
} from '../types'

const KEYS = {
  expenses: 'casa-gastos-expenses',
  categories: 'casa-gastos-categories',
  partners: 'casa-gastos-partners',
}

function getFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ============ Expense Repository ============
export class LocalStorageExpenseRepository implements IExpenseRepository {
  async getAll(): Promise<Expense[]> {
    return getFromStorage<Expense>(KEYS.expenses).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  async getById(id: string): Promise<Expense | null> {
    const all = getFromStorage<Expense>(KEYS.expenses)
    return all.find(e => e.id === id) || null
  }

  async create(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const all = getFromStorage<Expense>(KEYS.expenses)
    const expense: Expense = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }
    all.push(expense)
    saveToStorage(KEYS.expenses, all)
    return expense
  }

  async update(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
    const all = getFromStorage<Expense>(KEYS.expenses)
    const idx = all.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Expense not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(KEYS.expenses, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = getFromStorage<Expense>(KEYS.expenses)
    saveToStorage(KEYS.expenses, all.filter(e => e.id !== id))
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    const all = getFromStorage<Expense>(KEYS.expenses)
    saveToStorage(KEYS.expenses, all.filter(e => !idSet.has(e.id)))
  }

  async importBatch(items: Omit<Expense, 'id' | 'createdAt'>[]): Promise<Expense[]> {
    const all = getFromStorage<Expense>(KEYS.expenses)
    const created: Expense[] = items.map(item => ({
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }))
    saveToStorage(KEYS.expenses, [...all, ...created])
    return created
  }

  async exportAll(): Promise<Expense[]> {
    return this.getAll()
  }
}

// ============ Category Repository ============
export class LocalStorageCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const cats = getFromStorage<Category>(KEYS.categories)
    if (cats.length === 0) {
      const defaults = getDefaultCategories()
      saveToStorage(KEYS.categories, defaults)
      return defaults
    }
    return cats
  }

  async getById(id: string): Promise<Category | null> {
    const all = await this.getAll()
    return all.find(c => c.id === id) || null
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const all = await this.getAll()
    const cat: Category = { ...data, id: uuidv4() }
    all.push(cat)
    saveToStorage(KEYS.categories, all)
    return cat
  }

  async update(id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category> {
    const all = await this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Category not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(KEYS.categories, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll()
    saveToStorage(KEYS.categories, all.filter(c => c.id !== id))
  }
}

// ============ Partner Repository ============
export class LocalStoragePartnerRepository implements IPartnerRepository {
  async getAll(): Promise<Partner[]> {
    return getFromStorage<Partner>(KEYS.partners)
  }

  async getById(id: string): Promise<Partner | null> {
    const all = getFromStorage<Partner>(KEYS.partners)
    return all.find(p => p.id === id) || null
  }

  async create(data: Omit<Partner, 'id'>): Promise<Partner> {
    const all = getFromStorage<Partner>(KEYS.partners)
    const partner: Partner = { ...data, id: uuidv4() }
    all.push(partner)
    saveToStorage(KEYS.partners, all)
    return partner
  }

  async update(id: string, data: Partial<Omit<Partner, 'id'>>): Promise<Partner> {
    const all = getFromStorage<Partner>(KEYS.partners)
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Partner not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(KEYS.partners, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = getFromStorage<Partner>(KEYS.partners)
    saveToStorage(KEYS.partners, all.filter(p => p.id !== id))
  }
}

// ============ Default Categories ============
function getDefaultCategories(): Category[] {
  return [
    { id: 'cat-material', name: 'Material', color: '#f59e0b', icon: 'Package' },
    { id: 'cat-servico', name: 'Servico', color: '#10b981', icon: 'Wrench' },
    { id: 'cat-ferramenta', name: 'Ferramenta', color: '#06b6d4', icon: 'Hammer' },
    { id: 'cat-terreno', name: 'Terreno', color: '#6366f1', icon: 'MapPin' },
    { id: 'cat-documentacao', name: 'Documentacao', color: '#ef4444', icon: 'FileText' },
    { id: 'cat-projeto', name: 'Projeto', color: '#8b5cf6', icon: 'Compass' },
    { id: 'cat-outros', name: 'Outros', color: '#64748b', icon: 'MoreHorizontal' },
  ]
}
