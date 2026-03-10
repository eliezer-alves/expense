import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Tag } from 'lucide-react'
import { useCategoryStore } from '../store'
import { useCategoryForm } from '../hooks/useCategoryForm'
import { Modal } from '@/shared/components/Modal'
import { useExpenseStore } from '@/features/expenses/store'

export default function CategoriesPage() {
  const categories = useCategoryStore(state => state.categories)
  const deleteCategory = useCategoryStore(state => state.deleteCategory)
  const expenses = useExpenseStore(state => state.expenses)
  const form = useCategoryForm()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getCategoryExpenseCount = (categoryId: string) =>
    expenses.filter(e => e.categoryId === categoryId).length

  const handleDelete = async (id: string) => {
    const count = getCategoryExpenseCount(id)
    if (count > 0) {
      alert(`Esta categoria possui ${count} lancamento(s). Remova-os primeiro.`)
      setConfirmDelete(null)
      return
    }
    await deleteCategory(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Categorias</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categoria(s)</p>
          </div>
          <button
            onClick={form.openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nova
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Tag size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => {
              const count = getCategoryExpenseCount(cat.id)
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{count} lancamento(s)</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => form.openEdit(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit3 size={14} />
                    </button>
                    {confirmDelete === cat.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Category Form Modal */}
        <Modal open={form.showForm} onClose={form.closeForm}>
          <Modal.Header title={form.editId ? 'Editar Categoria' : 'Nova Categoria'} onClose={form.closeForm} />
          <Modal.Body>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Nome</label>
              <input
                type="text"
                placeholder="Ex: Material de Construcao"
                                value={form.name}
                                onChange={e => form.setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
                          {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Cor</label>
                          <div className="flex flex-wrap gap-2">
                            {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#64748b', '#06b6d4', '#84cc16'].map(c => (
                              <button
                                key={c}
                                onClick={() => form.setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <input
                            type="color"
                            value={form.color}
                            onChange={e => form.setColor(e.target.value)}
                className="mt-2 h-8 w-full rounded cursor-pointer"
              />
            </div>

            <button
              onClick={form.handleSubmit}
              disabled={form.saving || !form.name.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {form.saving ? 'Salvando...' : form.editId ? 'Salvar Alteracoes' : 'Criar Categoria'}
            </button>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  )
}
