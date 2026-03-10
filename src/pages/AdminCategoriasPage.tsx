import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Plus, Edit3, Trash2, X, Check, Palette } from 'lucide-react'

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#84cc16', '#f97316',
]

export default function AdminCategoriasPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('Package')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setColor(PRESET_COLORS[0])
    setIcon('Package')
    setEditId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    setName(cat.name)
    setColor(cat.color)
    setIcon(cat.icon)
    setEditId(id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editId) {
        await updateCategory(editId, { name: name.trim(), color, icon })
      } else {
        await addCategory({ name: name.trim(), color, icon })
      }
      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Categorias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categoria(s) cadastrada(s)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Nova
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: cat.color }}>
              {cat.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Palette size={10} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-400 dark:text-gray-500">{cat.color}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(cat.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                <button onClick={() => setConfirmDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Material, Servico..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
