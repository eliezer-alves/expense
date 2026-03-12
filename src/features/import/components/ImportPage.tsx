import { Upload, FileSpreadsheet, Check, AlertCircle, X, ChevronDown, ChevronRight } from 'lucide-react'
import { formatBRL } from '@/shared/lib/format'
import { useCategoryStore } from '@/features/categories/store'
import { useImport } from '../hooks/useImport'

export default function ImportPage() {
  const categories = useCategoryStore(state => state.categories)
  const imp = useImport()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Importar Planilha</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Importe lancamentos a partir de arquivo CSV ou Excel (.xlsx)</p>

        {/* Step 1: Upload */}
        {!imp.parsed && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                imp.dragging
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onDragOver={imp.handleDragOver}
              onDragLeave={imp.handleDragLeave}
              onDrop={imp.handleDrop}
            >
              <Upload size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Arraste um arquivo aqui ou{' '}
                <label className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline font-medium">
                  escolha do computador
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={imp.handleFileInput}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Formatos aceitos: .csv, .xlsx, .xls</p>
            </div>

            {imp.error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {imp.error}
              </div>
            )}

            {/* Expected format hint */}
            <div className="mt-6">
              <button
                onClick={() => imp.setShowFormatHint(!imp.showFormatHint)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {imp.showFormatHint ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Formato esperado da planilha
              </button>
              {imp.showFormatHint && (
                <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400">
                  <p className="mb-2 font-medium">Colunas reconhecidas automaticamente:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Data</strong> — DD/MM/AAAA ou formato de data do Excel</li>
                    <li><strong>Valor</strong> — numero ou formato BRL (ex: 1.500,00)</li>
                    <li><strong>Categoria</strong> — nome da categoria (cria automaticamente se nao existir)</li>
                    <li><strong>Descricao</strong> — texto livre (opcional)</li>
                    <li><strong>Parceiro</strong> — nome do parceiro (opcional, cria se nao existir)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview and Confirm */}
        {imp.parsed && !imp.imported && (
          <div className="space-y-4">
            {/* File info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-indigo-600 dark:text-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{imp.fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {imp.parsed.length} lancamento(s) encontrado(s) — Total: {formatBRL(imp.parsed.reduce((s, r) => s + r.value, 0))}
                </p>
              </div>
              <button onClick={imp.reset} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            {/* Preview table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preview dos dados</h2>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Descricao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imp.parsed.slice(0, 50).map((row, i) => {
                      const cat = categories.find(c => c.name.toLowerCase() === row.categoryName?.toLowerCase())
                      return (
                        <tr key={i} className="border-t border-gray-50 dark:border-gray-700">
                          <td className="px-4 py-2 text-gray-400 dark:text-gray-500 text-xs">{i + 1}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">
                            {formatBRL(row.value)}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {cat ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: cat.color }}>
                                {cat.name}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs">
                                + {row.categoryName || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate">{row.description}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {imp.parsed.length > 50 && (
                  <p className="p-3 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700">
                    Mostrando 50 de {imp.parsed.length} registros
                  </p>
                )}
              </div>
            </div>

            {/* Import actions */}
            <div className="flex gap-3">
              <button
                onClick={imp.reset}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={imp.handleImport}
                disabled={imp.importing}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {imp.importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Importar {imp.parsed.length} lancamentos
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {imp.imported && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Importacao concluida!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {imp.importedCount} lancamento(s) importado(s) com sucesso
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={imp.reset}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Importar mais
              </button>
              <a
                href="/lancamentos"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Ver Lancamentos
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
