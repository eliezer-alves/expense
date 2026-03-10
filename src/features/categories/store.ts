import { create } from 'zustand'
import type { Category, CreateCategoryDTO, UpdateCategoryDTO, ICategoryRepository } from './types'
import { createCategoryRepository } from './services/categoryRepository'

interface CategoryState {
  categories: Category[]
  loading: boolean
  repository: ICategoryRepository

  // Actions
  fetchAll: () => Promise<void>
  addCategory: (data: CreateCategoryDTO) => Promise<Category>
  updateCategory: (id: string, data: UpdateCategoryDTO) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: true,
  repository: createCategoryRepository(),

  fetchAll: async () => {
    set({ loading: true })
    const categories = await get().repository.getAll()
    set({ categories, loading: false })
  },

  addCategory: async (data) => {
    const created = await get().repository.create(data)
    set(state => ({
      categories: [...state.categories, created],
    }))
    return created
  },

  updateCategory: async (id, data) => {
    await get().repository.update(id, data)
    await get().fetchAll()
  },

  deleteCategory: async (id) => {
    await get().repository.delete(id)
    set(state => ({
      categories: state.categories.filter(c => c.id !== id),
    }))
  },
}))
