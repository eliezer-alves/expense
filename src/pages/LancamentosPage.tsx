import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { formatBRL, formatDate } from '../lib/format'
import type { Expense } from '../types'
import {
  Plus, Search, Trash2, Edit3, X, Check, Download, AlertTriangle,
  Calendar, Tag, User, FileText
} from 'lucide-react'

function toLocalDatetimeString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

async function exportExpensesXLSX(
  expenses: { date: string; value: number; category: string; partner: string; description: string }[]
) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const rows = expenses.map(e => ({
    Data: e.date,
    Valor: e.value,
    Categoria: e.category,
    Parceiro: e.partner,
    Descricao: e.description,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Lancamentos')
  XLSX.writeFile(wb, 'lancamentos-casa-mcmv.xlsx')
}

const CONFIRM_WORD = 'EXCLUIR'
const LONG_PRESS_MS = 500

export default function LancamentosPage() {
  const { expenses, categories, partners, addExpense, updateExpense, deleteExpense, deleteBatchExpenses } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Detail modal
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null)

  // Long press tracking
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const touchMoved = useRef(false)

  // Form state
  const [formDate, setFormDate] = useState(toLocalDatetimeString(new Date()))
  const [formValue, setFormValue] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPartner, setFormPartner] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])
  const partnerMap = useMemo(() => new Map(partners.map(p => [p.id, p])), [partners])

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterCategory && e.categoryId !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        const cat = catMap.get(e.categoryId)
        const par = e.partnerId ? partnerMap.get(e.partnerId) : null
        const match =
          e.description.toLowerCase().includes(q) ||
          (cat?.name || '').toLowerCase().includes(q) ||
          (par?.name || '').toLowerCase().includes(q) ||
          formatBRL(e.value).includes(q) ||
          new Date(e.date).toLocaleDateString('pt-BR').includes(q)
        if (!match) return false
      }
      return true
    })
  }, [expenses, search, filterCategory, catMap, partnerMap])

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))
  const someSelected = selectedIds.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)))
    }
  }

  // Long press handlers for mobile
  const handleTouchStart = useCallback((id: string) => {
    touchMoved.current = false
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      // Haptic feedback if available
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

  // Handle tap on expense item (mobile)
  const handleItemTap = useCallback((e: Expense) => {
    // If long press was just triggered, don't do anything
    if (longPressTriggered.current || touchMoved.current) return
    // If in selection mode, toggle selection instead
    if (someSelected) {
      toggleSelect(e.id)
    } else {
      // Open detail modal
      setDetailExpense(e)
    }
  }, [someSelected, toggleSelect])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  const resetForm = () => {
    setFormDate(toLocalDatetimeString(new Date()))
    setFormValue('')
    setFormCategory(categories.length > 0 ? '' : '')
    setFormPartner('')
    setFormDescription('')
    setEditId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (id: string) => {
    const e = expenses.find(ex => ex.id === id)
    if (!e) return
    setFormDate(toLocalDatetimeString(new Date(e.date)))
    setFormValue(String(e.value))
    setFormCategory(e.categoryId)
    setFormPartner(e.partnerId || '')
    setFormDescription(e.description)
    setEditId(id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    const val = parseFloat(formValue.replace(',', '.'))
    if (!val || val <= 0 || !formCategory) return
    setSaving(true)
    try {
      const data = {
        date: new Date(formDate).toISOString(),
        value: val,
        categoryId: formCategory,
        partnerId: formPartner || null,
        description: formDescription,
      }
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
  }

  const handleDelete = async (id: string) => {
    await deleteExpense(id)
    setConfirmDelete(null)
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  const handleBulkDelete = async () => {
    if (bulkDeleteConfirmText !== CONFIRM_WORD) return
    setBulkDeleting(true)
    try {
      await deleteBatchExpenses(Array.from(selectedIds))
      setSelectedIds(new Set())
      setShowBulkDeleteModal(false)
      setBulkDeleteConfirmText('')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleExport = () => {
    const rows = filtered.map(e => ({
      date: new Date(e.date).toLocaleDateString('pt-BR'),
      value: e.value,
      category: catMap.get(e.categoryId)?.name || 'N/A',
      partner: e.partnerId ? partnerMap.get(e.partnerId)?.name || '' : '',
      description: e.description,
    }))
    exportExpensesXLSX(rows)
  }

  const totalFiltered = filtered.reduce((s, e) => s + e.value, 0)
  const selectedTotal = filtered.filter(e => selectedIds.has(e.id)).reduce((s, e) => s + e.value, 0)

  // Whether we're in mobile selection mode (at least 1 selected)
  const selectionMode = someSelected

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Selection mode header (mobile) - replaces normal header when selecting */}
      {selectionMode && (
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4 bg-indigo-600 dark:bg-indigo-700 -mx-4 -mt-4 px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set())} className="p-1 text-white/80 hover:text-white">
              <X size={20} />
            </button>
            <span className="text-white font-semibold text-sm">{selectedIds.size} selecionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 text-white/90 text-xs font-medium rounded-lg border border-white/30 hover:bg-white/10"
            >
              {allFilteredSelected ? 'Nenhum' : 'Todos'}
            </button>
            <button
              onClick={() => { setShowBulkDeleteModal(true); setBulkDeleteConfirmText('') }}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Normal Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 ${selectionMode ? 'hidden lg:flex' : ''}`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Lancamentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} registro(s) - Total: {formatBRL(totalFiltered)}
            {someSelected && (
              <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">
                ({selectedIds.size} selecionado(s) - {formatBRL(selectedTotal)})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {someSelected && (
            <button
              onClick={() => { setShowBulkDeleteModal(true); setBulkDeleteConfirmText('') }}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              Excluir ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar lancamentos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">Todas categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Select All bar - always visible on desktop, only in selection mode on mobile */}
      {filtered.length > 0 && (
        <div className={`flex items-center gap-3 mb-3 px-1 ${someSelected ? '' : 'hidden lg:flex'}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Selecionar todos</span>
          </label>
          {someSelected && (
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Limpar selecao
            </button>
          )}
        </div>
      )}

      {/* Hint for long press on mobile (only when no selection and has items) */}
      {!someSelected && filtered.length > 0 && (
        <p className="lg:hidden text-xs text-gray-400 dark:text-gray-500 mb-3 px-1 italic">
          Segure um lancamento para selecionar
        </p>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum lancamento encontrado</p>
          </div>
        ) : (
          filtered.map(e => {
            const cat = catMap.get(e.categoryId)
            const par = e.partnerId ? partnerMap.get(e.partnerId) : null
            const isSelected = selectedIds.has(e.id)
            return (
              <div
                key={e.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-3 sm:p-4 flex items-center gap-3 transition-all select-none ${
                  isSelected
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm'
                    : 'border-gray-100 dark:border-gray-700 hover:shadow-sm'
                }`}
                // Mobile: long press to select, tap for detail/toggle
                onTouchStart={() => handleTouchStart(e.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleItemTap(e)}
              >
                {/* Checkbox: always visible on desktop, on mobile only when in selection mode */}
                <div className={`flex-shrink-0 ${someSelected ? '' : 'hidden lg:block'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(ev) => { ev.stopPropagation(); toggleSelect(e.id) }}
                    onClick={(ev) => ev.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                  />
                </div>

                {/* Selected indicator on mobile (when no checkbox visible, show colored left border) */}
                {isSelected && !someSelected && (
                  <div className="lg:hidden w-1 h-10 rounded-full flex-shrink-0 bg-indigo-500" />
                )}

                {/* Color bar */}
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#94a3b8' }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{e.description || 'Sem descricao'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                    <span>{formatDate(e.date)}</span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: cat?.color || '#94a3b8' }}>
                      {cat?.name || 'N/A'}
                    </span>
                    {par && <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">{par.name}</span>}
                  </div>
                </div>

                {/* Value */}
                <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatBRL(e.value)}</span>

                {/* Actions - visible on desktop, hidden on mobile */}
                <div className="hidden lg:flex gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => openEdit(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Edit3 size={14} />
                  </button>
                  {confirmDelete === e.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail Modal (opens on tap in mobile) */}
      {detailExpense && (() => {
        const cat = catMap.get(detailExpense.categoryId)
        const par = detailExpense.partnerId ? partnerMap.get(detailExpense.partnerId) : null
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setDetailExpense(null)}>
            <div
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden"
              onClick={ev => ev.stopPropagation()}
            >
              {/* Color header */}
              <div className="h-2" style={{ backgroundColor: cat?.color || '#94a3b8' }} />

              <div className="p-5 sm:p-6">
                {/* Close button */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: cat?.color || '#94a3b8' }}
                  >
                    {cat?.name || 'N/A'}
                  </span>
                  <button onClick={() => setDetailExpense(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={18} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Value - prominent */}
                <div className="text-center mb-5">
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatBRL(detailExpense.value)}</p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {detailExpense.description && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <FileText size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Descricao</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{detailExpense.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Calendar size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Data</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {new Date(detailExpense.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {' as '}
                        {new Date(detailExpense.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Tag size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Categoria</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
                        <p className="text-sm text-gray-800 dark:text-gray-200">{cat?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {par && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Parceiro</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{par.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setDetailExpense(null); openEdit(detailExpense.id) }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => { setDetailExpense(null); handleDelete(detailExpense.id) }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Bulk Delete Confirmation Modal (GitHub-style) */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowBulkDeleteModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excluir lancamentos</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Esta acao nao pode ser desfeita.</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-300">
                Voce esta prestes a excluir <strong>{selectedIds.size} lancamento(s)</strong> no valor total de <strong>{formatBRL(selectedTotal)}</strong>.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                Para confirmar, digite <strong className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400">{CONFIRM_WORD}</strong> abaixo:
              </label>
              <input
                type="text"
                value={bulkDeleteConfirmText}
                onChange={ev => setBulkDeleteConfirmText(ev.target.value)}
                placeholder={CONFIRM_WORD}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteConfirmText !== CONFIRM_WORD || bulkDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {bulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.size} item(ns)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 sm:p-6 max-h-screen overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editId ? 'Editar Lancamento' : 'Novo Lancamento'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Value - big and prominent */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-2xl font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Categoria</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFormCategory(c.id)}
                      className={`px-2 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        formCategory === c.id
                          ? 'border-current text-white'
                          : 'border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-500'
                      }`}
                      style={formCategory === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Partner */}
              {partners.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Parceiro/Estabelecimento</label>
                  <select
                    value={formPartner}
                    onChange={e => setFormPartner(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Nenhum</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Descricao</label>
                <input
                  type="text"
                  placeholder="Ex: 10 sacos de cimento"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !formValue || !formCategory}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Salvando...' : editId ? 'Salvar Alteracoes' : 'Adicionar Lancamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB (mobile) - hide during selection mode */}
      {!selectionMode && (
        <button
          onClick={openNew}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900 flex items-center justify-center hover:bg-indigo-700 transition-colors z-20"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
