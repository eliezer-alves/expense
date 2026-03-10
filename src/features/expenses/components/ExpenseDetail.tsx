import { X, FileText, Calendar, Tag, User, Edit3, Trash2 } from 'lucide-react'
import { formatBRL } from '@/shared/lib/format'
import type { Expense } from '../types'
import type { Category } from '@/features/categories/types'
import type { Partner } from '@/features/partners/types'

interface ExpenseDetailProps {
  expense: Expense
  category: Category | undefined
  partner: Partner | undefined
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ExpenseDetail({ expense, category, partner, onClose, onEdit, onDelete }: ExpenseDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden"
        onClick={ev => ev.stopPropagation()}
      >
        {/* Color header */}
        <div className="h-2" style={{ backgroundColor: category?.color || '#94a3b8' }} />

        <div className="p-5 sm:p-6">
          {/* Close button */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: category?.color || '#94a3b8' }}
            >
              {category?.name || 'N/A'}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Value - prominent */}
          <div className="text-center mb-5">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatBRL(expense.value)}</p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {expense.description && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <FileText size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Descricao</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{expense.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Calendar size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Data</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {new Date(expense.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' as '}
                  {new Date(expense.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Tag size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Categoria</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category?.color || '#94a3b8' }} />
                  <p className="text-sm text-gray-800 dark:text-gray-200">{category?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {partner && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Parceiro</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{partner.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { onClose(); onEdit(expense.id) }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Edit3 size={14} />
              Editar
            </button>
            <button
              onClick={() => { onClose(); onDelete(expense.id) }}
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
}
