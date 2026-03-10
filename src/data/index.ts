import {
  LocalStorageExpenseRepository,
  LocalStorageCategoryRepository,
  LocalStoragePartnerRepository,
} from './localStorage'
import type {
  IExpenseRepository,
  ICategoryRepository,
  IPartnerRepository,
} from '../types'

// Factory functions - swap implementation here when moving to REST API
export function createExpenseRepository(): IExpenseRepository {
  return new LocalStorageExpenseRepository()
}

export function createCategoryRepository(): ICategoryRepository {
  return new LocalStorageCategoryRepository()
}

export function createPartnerRepository(): IPartnerRepository {
  return new LocalStoragePartnerRepository()
}
