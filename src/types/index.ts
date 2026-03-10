export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface Partner {
  id: string
  name: string
}

export interface Expense {
  id: string
  date: string // ISO string
  value: number
  categoryId: string
  partnerId: string | null
  description: string
  createdAt: string // ISO string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export interface DashboardMetrics {
  totalSpent: number
  totalTransactions: number
  avgPerTransaction: number
  avgMonthly: number
  byCategory: { name: string; key: string; value: number; pct: number; color: string }[]
  monthlyData: Record<string, number | string>[]
  cumulativeData: { name: string; total: number }[]
  topExpenses: Expense[]
  monthlyTrend: { name: string; total: number }[]
}

// Repository interface - abstracts data access
export interface IExpenseRepository {
  getAll(): Promise<Expense[]>
  getById(id: string): Promise<Expense | null>
  create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>
  update(id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense>
  delete(id: string): Promise<void>
  importBatch(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<Expense[]>
  exportAll(): Promise<Expense[]>
}

export interface ICategoryRepository {
  getAll(): Promise<Category[]>
  getById(id: string): Promise<Category | null>
  create(category: Omit<Category, 'id'>): Promise<Category>
  update(id: string, category: Partial<Omit<Category, 'id'>>): Promise<Category>
  delete(id: string): Promise<void>
}

export interface IPartnerRepository {
  getAll(): Promise<Partner[]>
  getById(id: string): Promise<Partner | null>
  create(partner: Omit<Partner, 'id'>): Promise<Partner>
  update(id: string, partner: Partial<Omit<Partner, 'id'>>): Promise<Partner>
  delete(id: string): Promise<void>
}
