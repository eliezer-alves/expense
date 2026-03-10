import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { formatBRL, formatDate } from '../lib/format'
import {
  Plus, Search, Trash2, Edit3, X, Check, Download
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

export default function LancamentosPage() {
  const { expenses, categories, partners, addExpense, updateExpense, deleteExpense } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lancamentos</h1>
          <p className="text-sm text-gray-500">{filtered.length} registro(s) - Total: {formatBRL(totalFiltered)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar lancamentos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">Todas categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Nenhum lancamento encontrado</p>
          </div>
        ) : (
          filtered.map(e => {
            const cat = catMap.get(e.categoryId)
            const par = e.partnerId ? partnerMap.get(e.partnerId) : null
            return (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                {/* Color bar */}
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#94a3b8' }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{e.description || 'Sem descricao'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <span>{formatDate(e.date)}</span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: cat?.color || '#94a3b8' }}>
                      {cat?.name || 'N/A'}
                    </span>
                    {par && <span className="text-gray-500">{par.name}</span>}
                  </div>
                </div>

                {/* Value */}
                <span className="text-sm sm:text-base font-bold text-gray-800 whitespace-nowrap">{formatBRL(e.value)}</span>

                {/* Actions */}
                <div className="flex gap-1">
                  <button onClick={() => openEdit(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Edit3 size={14} />
                  </button>
                  {confirmDelete === e.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 sm:p-6 max-h-screen overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{editId ? 'Editar Lancamento' : 'Novo Lancamento'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Value - big and prominent */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Categoria</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFormCategory(c.id)}
                      className={`px-2 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        formCategory === c.id
                          ? 'border-current text-white'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
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
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Partner */}
              {partners.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Parceiro/Estabelecimento</label>
                  <select
                    value={formPartner}
                    onChange={e => setFormPartner(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                <label className="text-xs font-medium text-gray-500 mb-1 block">Descricao</label>
                <input
                  type="text"
                  placeholder="Ex: 10 sacos de cimento"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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

      {/* FAB (mobile) */}
      <button
        onClick={openNew}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-colors z-20"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
