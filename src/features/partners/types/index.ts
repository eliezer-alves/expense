import { z } from 'zod'

// ============ Models ============
export interface Partner {
  id: string
  name: string
}

// ============ DTOs ============
export type CreatePartnerDTO = Omit<Partner, 'id'>
export type UpdatePartnerDTO = Partial<CreatePartnerDTO>

// ============ Zod Schemas ============
export const createPartnerSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').trim(),
})

export const updatePartnerSchema = createPartnerSchema.partial()

// ============ Repository Interface ============
export interface IPartnerRepository {
  getAll(): Promise<Partner[]>
  getById(id: string): Promise<Partner | null>
  create(partner: CreatePartnerDTO): Promise<Partner>
  update(id: string, partner: UpdatePartnerDTO): Promise<Partner>
  delete(id: string): Promise<void>
}
