import { create } from 'zustand'
import type { Partner, CreatePartnerDTO, UpdatePartnerDTO, IPartnerRepository } from './types'
import { createPartnerRepository } from './services/partnerRepository'

interface PartnerState {
  partners: Partner[]
  loading: boolean
  repository: IPartnerRepository

  // Actions
  fetchAll: () => Promise<void>
  addPartner: (data: CreatePartnerDTO) => Promise<Partner>
  updatePartner: (id: string, data: UpdatePartnerDTO) => Promise<void>
  deletePartner: (id: string) => Promise<void>
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  partners: [],
  loading: true,
  repository: createPartnerRepository(),

  fetchAll: async () => {
    set({ loading: true })
    const partners = await get().repository.getAll()
    set({ partners, loading: false })
  },

  addPartner: async (data) => {
    const created = await get().repository.create(data)
    set(state => ({
      partners: [...state.partners, created],
    }))
    return created
  },

  updatePartner: async (id, data) => {
    await get().repository.update(id, data)
    await get().fetchAll()
  },

  deletePartner: async (id) => {
    await get().repository.delete(id)
    set(state => ({
      partners: state.partners.filter(p => p.id !== id),
    }))
  },
}))
