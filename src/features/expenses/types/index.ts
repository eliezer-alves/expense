import { z } from 'zod'

// ============ Models ============
export interface Expense {
  id: string
  date: string // ISO string
  value: number
  categoryId: string
  partnerId: string | null
  description: string
  createdAt: string // ISO string
}

// ============ DTOs ============
export type CreateExpenseDTO = Omit<Expense, 'id' | 'createdAt'>
export type UpdateExpenseDTO = Partial<CreateExpenseDTO>

// ============ Zod Schemas ============
export const createExpenseSchema = z.object({
  date: z.string().min(1, 'Data e obrigatoria'),
  value: z.number().positive('Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria e obrigatoria'),
  partnerId: z.string().nullable(),
  description: z.string(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

// ============ Repository Interface ============
export interface IExpenseRepository {
  getAll(): Promise<Expense[]>
  getById(id: string): Promise<Expense | null>
  create(expense: CreateExpenseDTO): Promise<Expense>
  update(id: string, expense: UpdateExpenseDTO): Promise<Expense>
  delete(id: string): Promise<void>
  deleteBatch(ids: string[]): Promise<void>
  importBatch(expenses: CreateExpenseDTO[]): Promise<Expense[]>
  exportAll(): Promise<Expense[]>
}
