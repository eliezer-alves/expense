import { useState, useCallback } from 'react'
import { usePartnerStore } from '../store'
import { createPartnerSchema } from '../types'

interface UsePartnerFormReturn {
  showForm: boolean
  editId: string | null
  name: string
  saving: boolean
  errors: Record<string, string>
  setName: (v: string) => void
  openNew: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  handleSubmit: () => Promise<void>
}

export function usePartnerForm(): UsePartnerFormReturn {
  const { partners, addPartner, updatePartner } = usePartnerStore()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setName('')
    setEditId(null)
    setErrors({})
  }, [])

  const openNew = useCallback(() => {
    resetForm()
    setShowForm(true)
  }, [resetForm])

  const openEdit = useCallback((id: string) => {
    const p = partners.find(x => x.id === id)
    if (!p) return
    setName(p.name)
    setEditId(id)
    setErrors({})
    setShowForm(true)
  }, [partners])

  const closeForm = useCallback(() => {
    setShowForm(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(async () => {
    const data = { name: name.trim() }

    const result = createPartnerSchema.safeParse(data)
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
        await updatePartner(editId, data)
      } else {
        await addPartner(data)
      }
      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }, [name, editId, addPartner, updatePartner, resetForm])

  return {
    showForm,
    editId,
    name,
    saving,
    errors,
    setName,
    openNew,
    openEdit,
    closeForm,
    handleSubmit,
  }
}
