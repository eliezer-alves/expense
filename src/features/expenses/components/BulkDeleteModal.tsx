import { formatBRL } from '@/shared/lib/format'
import type { useBulkDelete } from '../hooks/useBulkDelete'

interface BulkDeleteModalProps {
  bulkDelete: ReturnType<typeof useBulkDelete>
  selectedCount: number
  selectedTotal: number
  selectedIds: Set<string>
  onSuccess: () => void
}

export function BulkDeleteModal({ bulkDelete, selectedCount, selectedTotal, selectedIds, onSuccess }: BulkDeleteModalProps) {
  if (!bulkDelete.showBulkDeleteModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={bulkDelete.closeBulkDelete}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
        onClick={ev => ev.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excluir lancamentos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta acao nao pode ser desfeita.</p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-300">
            Voce esta prestes a excluir <strong>{selectedCount} lancamento(s)</strong> no valor total de <strong>{formatBRL(selectedTotal)}</strong>.
          </p>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
            Para confirmar, digite <strong className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400">{bulkDelete.confirmWord}</strong> abaixo:
          </label>
          <input
            type="text"
            value={bulkDelete.bulkDeleteConfirmText}
            onChange={ev => bulkDelete.setBulkDeleteConfirmText(ev.target.value)}
            placeholder={bulkDelete.confirmWord}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={bulkDelete.closeBulkDelete}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => bulkDelete.handleBulkDelete(Array.from(selectedIds), onSuccess)}
            disabled={!bulkDelete.isConfirmValid || bulkDelete.bulkDeleting}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkDelete.bulkDeleting ? 'Excluindo...' : `Excluir ${selectedCount} item(ns)`}
          </button>
        </div>
      </div>
    </div>
  )
}
