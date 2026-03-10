import { v4 as uuidv4 } from 'uuid'
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/shared/lib/storage'
import type { Partner, CreatePartnerDTO, UpdatePartnerDTO, IPartnerRepository } from '../types'

export class LocalStoragePartnerRepository implements IPartnerRepository {
  async getAll(): Promise<Partner[]> {
    return getFromStorage<Partner>(STORAGE_KEYS.partners)
  }

  async getById(id: string): Promise<Partner | null> {
    const all = getFromStorage<Partner>(STORAGE_KEYS.partners)
    return all.find(p => p.id === id) || null
  }

  async create(data: CreatePartnerDTO): Promise<Partner> {
    const all = getFromStorage<Partner>(STORAGE_KEYS.partners)
    const partner: Partner = { ...data, id: uuidv4() }
    all.push(partner)
    saveToStorage(STORAGE_KEYS.partners, all)
    return partner
  }

  async update(id: string, data: UpdatePartnerDTO): Promise<Partner> {
    const all = getFromStorage<Partner>(STORAGE_KEYS.partners)
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Partner not found')
    all[idx] = { ...all[idx], ...data }
    saveToStorage(STORAGE_KEYS.partners, all)
    return all[idx]
  }

  async delete(id: string): Promise<void> {
    const all = getFromStorage<Partner>(STORAGE_KEYS.partners)
    saveToStorage(STORAGE_KEYS.partners, all.filter(p => p.id !== id))
  }
}

// Factory function - swap implementation here when moving to REST API
export function createPartnerRepository(): IPartnerRepository {
  return new LocalStoragePartnerRepository()
}
