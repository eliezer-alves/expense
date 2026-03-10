import { useState, useCallback } from 'react'
import { useExpenseStore } from '../store'
import { createExpenseSchema } from '../types'

function toLocalDatetimeString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

interface UseExpenseFormReturn {
  showForm: boolean
  editId: string | null
  formDate: string
  formValue: string
  formCategory: string
  formPartner: string
  formDescription: string
  saving: boolean
  errors: Record<string, string>
  setFormDate: (v: string) => void
  setFormValue: (v: string) => void
  setFormCategory: (v: string) => void
  setFormPartner: (v: string) => void
  setFormDescription: (v: string) => void
  openNew: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  handleSubmit: () => Promise<void>
}

export function useExpenseForm(): UseExpenseFormReturn {
  const { expenses, addExpense, updateExpense } = useExpenseStore()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formDate, setFormDate] = useState(toLocalDatetimeString(new Date()))
  const [formValue, setFormValue] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPartner, setFormPartner] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setFormDate(toLocalDatetimeString(new Date()))
    setFormValue('')
    setFormCategory('')
    setFormPartner('')
    setFormDescription('')
    setEditId(null)
    setErrors({})
  }, [])

  const openNew = useCallback(() => {
    resetForm()
    setShowForm(true)
  }, [resetForm])

  const openEdit = useCallback((id: string) => {
    const e = expenses.find(ex => ex.id === id)
    if (!e) return
    setFormDate(toLocalDatetimeString(new Date(e.date)))
    setFormValue(String(e.value))
    setFormCategory(e.categoryId)
    setFormPartner(e.partnerId || '')
    setFormDescription(e.description)
    setEditId(id)
    setErrors({})
    setShowForm(true)
  }, [expenses])

  const closeForm = useCallback(() => {
    setShowForm(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(async () => {
    const val = parseFloat(formValue.replace(',', '.'))

    const data = {
      date: new Date(formDate).toISOString(),
      value: val,
      categoryId: formCategory,
      partnerId: formPartner || null,
      description: formDescription,
    }

    // Validate with Zod
    const result = createExpenseSchema.safeParse(data)
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
        await updateExpense(editId, data)
      } else {
        await addExpense(data)
      }
      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }, [formDate, formValue, formCategory, formPartner, formDescription, editId, addExpense, updateExpense, resetForm])

  return {
    showForm,
    editId,
    formDate,
    formValue,
    formCategory,
    formPartner,
    formDescription,
    saving,
    errors,
    setFormDate,
    setFormValue,
    setFormCategory,
    setFormPartner,
    setFormDescription,
    openNew,
    openEdit,
    closeForm,
    handleSubmit,
  }
}
