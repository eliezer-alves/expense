import { z } from 'zod'

// ============ Models ============
export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

// ============ DTOs ============
export type CreateCategoryDTO = Omit<Category, 'id'>
export type UpdateCategoryDTO = Partial<CreateCategoryDTO>

// ============ Zod Schemas ============
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').trim(),
  color: z.string().min(1, 'Cor e obrigatoria'),
  icon: z.string().min(1, 'Icone e obrigatorio'),
})

export const updateCategorySchema = createCategorySchema.partial()

// ============ Repository Interface ============
export interface ICategoryRepository {
  getAll(): Promise<Category[]>
  getById(id: string): Promise<Category | null>
  create(category: CreateCategoryDTO): Promise<Category>
  update(id: string, category: UpdateCategoryDTO): Promise<Category>
  delete(id: string): Promise<void>
}
