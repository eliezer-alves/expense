import { v4 as uuidv4 } from 'uuid'
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/shared/lib/storage'
import type { Category, CreateCategoryDTO, UpdateCategoryDTO, ICategoryRepository } from '../types'

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

export class LocalStorageCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const cats = getFromStorage<Category>(STORAGE_KEYS.categories)
    if (cats.length === 0) {
      const defaults = getDefaultCategories()
      saveToStorage(STORAGE_KEYS.categories, defaults)
      return defaults
    }
    return cats
  }

  async getById(id: string): Promise<Category | null> {
    const all = await this.getAll()
    return all.find(c => c.id === id) || null
  }

  async create(data: CreateCategoryDTO): Promise<Category> {
    const all = await this.getAll()
    const cat: Category = { ...data, id: uuidv4() }
    all.push(cat)
    saveToStorage(STORAGE_KEYS.categories, all)
    return cat
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
    const all = await this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Category not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(STORAGE_KEYS.categories, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll()
    saveToStorage(STORAGE_KEYS.categories, all.filter(c => c.id !== id))
  }
}

// Factory function - swap implementation here when moving to REST API
export function createCategoryRepository(): ICategoryRepository {
  return new LocalStorageCategoryRepository()
}
