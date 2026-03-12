import { Modal } from '@/shared/components/Modal'
import { useCategoryStore } from '@/features/categories/store'
import { usePartnerStore } from '@/features/partners/store'
import type { useExpenseForm } from '../hooks/useExpenseForm'

type ExpenseFormProps = ReturnType<typeof useExpenseForm>

export function ExpenseForm(form: ExpenseFormProps) {
  const categories = useCategoryStore(state => state.categories)
  const partners = usePartnerStore(state => state.partners)

  return (
    <Modal open={form.showForm} onClose={form.closeForm}>
      <Modal.Header title={form.editId ? 'Editar Lancamento' : 'Novo Lancamento'} onClose={form.closeForm} />
      <Modal.Body>
        {/* Value - big and prominent */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={form.formValue}
            onChange={e => form.setFormValue(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-2xl font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center"
            autoFocus
          />
          {form.errors.value && <p className="text-xs text-red-500 mt-1">{form.errors.value}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Categoria</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => form.setFormCategory(c.id)}
                className={`px-2 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                  form.formCategory === c.id
                    ? 'border-current text-white'
                    : 'border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-500'
                }`}
                style={form.formCategory === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
          {form.errors.categoryId && <p className="text-xs text-red-500 mt-1">{form.errors.categoryId}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Data e Hora</label>
          <input
            type="datetime-local"
            value={form.formDate}
            onChange={e => form.setFormDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Partner */}
        {partners.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Parceiro/Estabelecimento</label>
            <select
              value={form.formPartner}
              onChange={e => form.setFormPartner(e.target.value)}
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
            value={form.formDescription}
            onChange={e => form.setFormDescription(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <button
          onClick={form.handleSubmit}
          disabled={form.saving || !form.formValue || !form.formCategory}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {form.saving ? 'Salvando...' : form.editId ? 'Salvar Alteracoes' : 'Adicionar Lancamento'}
        </button>
      </Modal.Body>
    </Modal>
  )
}
