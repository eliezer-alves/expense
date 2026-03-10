export function getFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const STORAGE_KEYS = {
  expenses: 'casa-gastos-expenses',
  categories: 'casa-gastos-categories',
  partners: 'casa-gastos-partners',
  auth: 'casa-gastos-auth',
  theme: 'casa-gastos-theme',
} as const
