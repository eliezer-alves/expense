import { useState, useCallback } from 'react'
import { useExpenseStore } from '../store'

const CONFIRM_WORD = 'EXCLUIR'

interface UseBulkDeleteReturn {
  showBulkDeleteModal: boolean
  bulkDeleteConfirmText: string
  bulkDeleting: boolean
  confirmWord: string
  isConfirmValid: boolean
  setBulkDeleteConfirmText: (v: string) => void
  openBulkDelete: () => void
  closeBulkDelete: () => void
  handleBulkDelete: (ids: string[], onSuccess: () => void) => Promise<void>
}

export function useBulkDelete(): UseBulkDeleteReturn {
  const deleteBatchExpenses = useExpenseStore(state => state.deleteBatchExpenses)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const isConfirmValid = bulkDeleteConfirmText === CONFIRM_WORD

  const openBulkDelete = useCallback(() => {
    setBulkDeleteConfirmText('')
    setShowBulkDeleteModal(true)
  }, [])

  const closeBulkDelete = useCallback(() => {
    setShowBulkDeleteModal(false)
    setBulkDeleteConfirmText('')
  }, [])

  const handleBulkDelete = useCallback(async (ids: string[], onSuccess: () => void) => {
    if (!isConfirmValid) return
    setBulkDeleting(true)
    try {
      await deleteBatchExpenses(ids)
      onSuccess()
      setShowBulkDeleteModal(false)
      setBulkDeleteConfirmText('')
    } finally {
      setBulkDeleting(false)
    }
  }, [isConfirmValid, deleteBatchExpenses])

  return {
    showBulkDeleteModal,
    bulkDeleteConfirmText,
    bulkDeleting,
    confirmWord: CONFIRM_WORD,
    isConfirmValid,
    setBulkDeleteConfirmText,
    openBulkDelete,
    closeBulkDelete,
    handleBulkDelete,
  }
}
