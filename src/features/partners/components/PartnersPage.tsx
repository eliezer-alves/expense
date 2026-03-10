import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Users } from 'lucide-react'
import { usePartnerStore } from '../store'
import { usePartnerForm } from '../hooks/usePartnerForm'
import { Modal } from '@/shared/components/Modal'
import { useExpenseStore } from '@/features/expenses/store'

export default function PartnersPage() {
  const partners = usePartnerStore(state => state.partners)
  const deletePartner = usePartnerStore(state => state.deletePartner)
  const expenses = useExpenseStore(state => state.expenses)
  const form = usePartnerForm()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getPartnerExpenseCount = (partnerId: string) =>
    expenses.filter(e => e.partnerId === partnerId).length

  const handleDelete = async (id: string) => {
    await deletePartner(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Parceiros</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{partners.length} parceiro(s)</p>
          </div>
          <button
            onClick={form.openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum parceiro cadastrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map(p => {
              const count = getPartnerExpenseCount(p.id)
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{count} lancamento(s)</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => form.openEdit(p.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit3 size={14} />
                    </button>
                    {confirmDelete === p.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(p.id)}
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

        {/* Partner Form Modal */}
        <Modal open={form.showForm} onClose={form.closeForm}>
          <Modal.Header title={form.editId ? 'Editar Parceiro' : 'Novo Parceiro'} onClose={form.closeForm} />
          <Modal.Body>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Nome</label>
              <input
                type="text"
                placeholder="Ex: Loja de Materiais"
                                value={form.name}
                                onChange={e => form.setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
            </div>

            <button
              onClick={form.handleSubmit}
              disabled={form.saving || !form.name.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {form.saving ? 'Salvando...' : form.editId ? 'Salvar Alteracoes' : 'Criar Parceiro'}
            </button>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  )
}
