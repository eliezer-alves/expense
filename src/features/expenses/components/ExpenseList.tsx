import { useState } from 'react'
import {
  Plus, Search, Trash2, Edit3, X, Check, Download
} from 'lucide-react'
import { formatBRL, formatDate } from '@/shared/lib/format'
import { useExpenseStore } from '../store'
import { useCategoryStore } from '@/features/categories/store'
import { useExpenseList } from '../hooks/useExpenseList'
import { useExpenseSelection } from '../hooks/useExpenseSelection'
import { useExpenseForm } from '../hooks/useExpenseForm'
import { useBulkDelete } from '../hooks/useBulkDelete'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseDetail } from './ExpenseDetail'
import { BulkDeleteModal } from './BulkDeleteModal'
import type { Expense } from '../types'

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

export default function ExpenseList() {
  const deleteExpense = useExpenseStore(state => state.deleteExpense)
  const categories = useCategoryStore(state => state.categories)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null)

  const { filtered, totalFiltered, catMap, partnerMap } = useExpenseList({ search, filterCategory })
  const selection = useExpenseSelection(filtered)
  const form = useExpenseForm()
  const bulkDelete = useBulkDelete()

  const handleDelete = async (id: string) => {
    await deleteExpense(id)
    setConfirmDelete(null)
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Selection mode header (mobile) */}
      {selection.selectionMode && (
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4 bg-indigo-600 dark:bg-indigo-700 -mx-4 -mt-4 px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={selection.clearSelection} className="p-1 text-white/80 hover:text-white">
              <X size={20} />
            </button>
            <span className="text-white font-semibold text-sm">{selection.selectedIds.size} selecionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selection.toggleSelectAll}
              className="px-3 py-1.5 text-white/90 text-xs font-medium rounded-lg border border-white/30 hover:bg-white/10"
            >
              {selection.allFilteredSelected ? 'Nenhum' : 'Todos'}
            </button>
            <button
              onClick={bulkDelete.openBulkDelete}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Normal Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 ${selection.selectionMode ? 'hidden lg:flex' : ''}`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Lancamentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} registro(s) - Total: {formatBRL(totalFiltered)}
            {selection.someSelected && (
              <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">
                ({selection.selectedIds.size} selecionado(s) - {formatBRL(selection.selectedTotal)})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selection.someSelected && (
            <button
              onClick={bulkDelete.openBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              Excluir ({selection.selectedIds.size})
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
            onClick={form.openNew}
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

      {/* Select All bar */}
      {filtered.length > 0 && (
        <div className={`flex items-center gap-3 mb-3 px-1 ${selection.someSelected ? '' : 'hidden lg:flex'}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selection.allFilteredSelected}
              onChange={selection.toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Selecionar todos</span>
          </label>
          {selection.someSelected && (
            <button onClick={selection.clearSelection} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Limpar selecao
            </button>
          )}
        </div>
      )}

      {/* Hint for long press on mobile */}
      {!selection.someSelected && filtered.length > 0 && (
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
            const isSelected = selection.selectedIds.has(e.id)
            return (
              <div
                key={e.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-3 sm:p-4 flex items-center gap-3 transition-all select-none ${
                  isSelected
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm'
                    : 'border-gray-100 dark:border-gray-700 hover:shadow-sm'
                }`}
                onTouchStart={() => selection.handleTouchStart(e.id)}
                onTouchMove={selection.handleTouchMove}
                onTouchEnd={selection.handleTouchEnd}
                onClick={() => selection.handleItemTap(e, setDetailExpense)}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 ${selection.someSelected ? '' : 'hidden lg:block'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(ev) => { ev.stopPropagation(); selection.toggleSelect(e.id) }}
                    onClick={(ev) => ev.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                  />
                </div>

                {/* Selected indicator on mobile */}
                {isSelected && !selection.someSelected && (
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
                  <button onClick={() => form.openEdit(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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

      {/* Detail Modal */}
      {detailExpense && (
        <ExpenseDetail
          expense={detailExpense}
          category={catMap.get(detailExpense.categoryId)}
          partner={detailExpense.partnerId ? partnerMap.get(detailExpense.partnerId) : undefined}
          onClose={() => setDetailExpense(null)}
          onEdit={form.openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        bulkDelete={bulkDelete}
        selectedCount={selection.selectedIds.size}
        selectedTotal={selection.selectedTotal}
        selectedIds={selection.selectedIds}
        onSuccess={selection.clearSelection}
      />

      {/* Form Modal */}
      <ExpenseForm {...form} />

      {/* FAB (mobile) */}
      {!selection.selectionMode && (
        <button
          onClick={form.openNew}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900 flex items-center justify-center hover:bg-indigo-700 transition-colors z-20"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
