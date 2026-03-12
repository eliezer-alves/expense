import { useState, useCallback } from 'react'
import { useCategoryStore } from '../store'
import { createCategorySchema } from '../types'

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#84cc16', '#f97316',
]

interface UseCategoryFormReturn {
  showForm: boolean
  editId: string | null
  name: string
  color: string
  icon: string
  saving: boolean
  errors: Record<string, string>
  presetColors: string[]
  setName: (v: string) => void
  setColor: (v: string) => void
  setIcon: (v: string) => void
  openNew: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  handleSubmit: () => Promise<void>
}

export function useCategoryForm(): UseCategoryFormReturn {
  const { categories, addCategory, updateCategory } = useCategoryStore()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('Package')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setName('')
    setColor(PRESET_COLORS[0])
    setIcon('Package')
    setEditId(null)
    setErrors({})
  }, [])

  const openNew = useCallback(() => {
    resetForm()
    setShowForm(true)
  }, [resetForm])

  const openEdit = useCallback((id: string) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    setName(cat.name)
    setColor(cat.color)
    setIcon(cat.icon)
    setEditId(id)
    setErrors({})
    setShowForm(true)
  }, [categories])

  const closeForm = useCallback(() => {
    setShowForm(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(async () => {
    const data = { name: name.trim(), color, icon }

    const result = createCategorySchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0]
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      if (editId) {
        await updateCategory(editId, data)
      } else {
        await addCategory(data)
      }
      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }, [name, color, icon, editId, addCategory, updateCategory, resetForm])

  return {
    showForm,
    editId,
    name,
    color,
    icon,
    saving,
    errors,
    presetColors: PRESET_COLORS,
    setName,
    setColor,
    setIcon,
    openNew,
    openEdit,
    closeForm,
    handleSubmit,
  }
}
