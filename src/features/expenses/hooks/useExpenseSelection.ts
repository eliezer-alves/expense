import { useState, useCallback, useRef, useEffect } from 'react'
import type { Expense } from '../types'

const LONG_PRESS_MS = 500

interface UseExpenseSelectionReturn {
  selectedIds: Set<string>
  someSelected: boolean
  allFilteredSelected: boolean
  selectedTotal: number
  selectionMode: boolean
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  // Long press handlers for mobile
  handleTouchStart: (id: string) => void
  handleTouchMove: () => void
  handleTouchEnd: () => void
  handleItemTap: (expense: Expense, onDetail: (e: Expense) => void) => void
}

export function useExpenseSelection(filtered: Expense[]): UseExpenseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Long press tracking
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const touchMoved = useRef(false)

  const someSelected = selectedIds.size > 0
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))
  const selectedTotal = filtered.filter(e => selectedIds.has(e.id)).reduce((s, e) => s + e.value, 0)
  const selectionMode = someSelected

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)))
    }
  }, [allFilteredSelected, filtered])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleTouchStart = useCallback((id: string) => {
    touchMoved.current = false
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      if (navigator.vibrate) navigator.vibrate(30)
      toggleSelect(id)
    }, LONG_PRESS_MS)
  }, [toggleSelect])

  const handleTouchMove = useCallback(() => {
    touchMoved.current = true
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleItemTap = useCallback((e: Expense, onDetail: (e: Expense) => void) => {
    if (longPressTriggered.current || touchMoved.current) return
    if (someSelected) {
      toggleSelect(e.id)
    } else {
      onDetail(e)
    }
  }, [someSelected, toggleSelect])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  return {
    selectedIds,
    someSelected,
    allFilteredSelected,
    selectedTotal,
    selectionMode,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleItemTap,
  }
}
