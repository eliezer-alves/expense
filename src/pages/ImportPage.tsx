import { useState, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { Upload, FileSpreadsheet, Check, AlertCircle, X } from 'lucide-react'

interface ParsedRow {
  date: string
  value: number
  category: string
  description: string
  partner: string
}

export default function ImportPage() {
  const { categories, partners, importExpenses, addCategory, addPartner } = useData()
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback(async (file: File) => {
    setError('')
    setDone(false)
    setFileName(file.name)

    try {
      const XLSX = await import('xlsx')
      const isCSV = file.name.toLowerCase().endsWith('.csv')
      let wb
      if (isCSV) {
        // For CSV files, read as UTF-8 text to preserve special characters (accents, emojis, etc.)
        const text = await file.text()
        wb = XLSX.read(text, { type: 'string' })
      } else {
        const buffer = await file.arrayBuffer()
        wb = XLSX.read(buffer, { type: 'array', codepage: 65001 })
      }
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      if (jsonData.length === 0) {
        setError('A planilha esta vazia.')
        return
      }

      // Try to auto-detect columns
      const rows: ParsedRow[] = []
      for (const row of jsonData) {
        const keys = Object.keys(row)
        // Find date column
        const dateKey = keys.find(k => /data|date/i.test(k)) || keys[0]
        // Find value column
        const valueKey = keys.find(k => /valor|value|preco|price/i.test(k)) || keys[1]
        // Find category column
        const catKey = keys.find(k => /categ/i.test(k)) || ''
        // Find description column
        const descKey = keys.find(k => /desc|descri/i.test(k)) || keys[keys.length - 1]
        // Find partner column
        const partnerKey = keys.find(k => /parceiro|partner|fornecedor|estabelecimento/i.test(k)) || ''

        const rawDate = String(row[dateKey] || '')
        const rawValue = String(row[valueKey] || '')
        const rawCat = catKey ? String(row[catKey] || '') : ''
        const rawDesc = descKey ? String(row[descKey] || '') : ''
        const rawPartner = partnerKey ? String(row[partnerKey] || '') : ''

        // Parse value
        let value = 0
        const cleanVal = rawValue.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        value = parseFloat(cleanVal)
        if (isNaN(value) || value <= 0) continue

        // Parse date
        let dateISO = ''
        // Try DD/MM/YYYY or DD/MM
        const dateMatch = rawDate.match(/(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?/)
        if (dateMatch) {
          const day = parseInt(dateMatch[1])
          const month = parseInt(dateMatch[2])
          const yearRaw = dateMatch[3]
          let year = new Date().getFullYear()
          if (yearRaw) {
            year = yearRaw.length === 2 ? 2000 + parseInt(yearRaw) : parseInt(yearRaw)
          }
          const d = new Date(year, month - 1, day, 12, 0, 0)
          if (!isNaN(d.getTime())) {
            dateISO = d.toISOString()
          }
        }

        // Try Excel serial number
        if (!dateISO && !isNaN(Number(rawDate))) {
          const serial = Number(rawDate)
          if (serial > 40000 && serial < 50000) {
            const d = new Date((serial - 25569) * 86400 * 1000)
            if (!isNaN(d.getTime())) {
              dateISO = d.toISOString()
            }
          }
        }

        if (!dateISO) continue

        rows.push({
          date: dateISO,
          value,
          category: rawCat.trim(),
          description: rawDesc.trim(),
          partner: rawPartner.trim(),
        })
      }

      if (rows.length === 0) {
        setError('Nao foi possivel interpretar os dados da planilha. Verifique se possui colunas de DATA e VALOR.')
        return
      }

      setParsedRows(rows)
    } catch (err) {
      setError('Erro ao ler o arquivo. Verifique se e um arquivo CSV ou XLSX valido.')
      console.error(err)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    setImporting(true)
    setError('')
    try {
      // Build maps
      const catNameMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]))
      const partnerNameMap = new Map(partners.map(p => [p.name.toLowerCase(), p.id]))

      const items = []
      for (const row of parsedRows) {
        // Resolve category
        let categoryId = ''
        if (row.category) {
          const existing = catNameMap.get(row.category.toLowerCase())
          if (existing) {
            categoryId = existing
          } else {
            // Create new category
            const newCat = await addCategory({
              name: row.category,
              color: '#64748b',
              icon: 'Package',
            })
            catNameMap.set(row.category.toLowerCase(), newCat.id)
            categoryId = newCat.id
          }
        } else {
          // Default to first category or 'Outros'
          const outros = catNameMap.get('outros')
          categoryId = outros || categories[0]?.id || ''
        }

        // Resolve partner
        let partnerId: string | null = null
        if (row.partner) {
          const existing = partnerNameMap.get(row.partner.toLowerCase())
          if (existing) {
            partnerId = existing
          } else {
            const newPartner = await addPartner({ name: row.partner })
            partnerNameMap.set(row.partner.toLowerCase(), newPartner.id)
            partnerId = newPartner.id
          }
        }

        items.push({
          date: row.date,
          value: row.value,
          categoryId,
          partnerId,
          description: row.description,
        })
      }

      await importExpenses(items)
      setDone(true)
      setParsedRows([])
    } catch (err) {
      setError('Erro ao importar os dados.')
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Importar Planilha</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Importe lancamentos a partir de um arquivo CSV ou XLSX</p>
      </div>

      {/* Success */}
      {done && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <Check size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Importacao concluida!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Os lancamentos foram adicionados com sucesso.</p>
          </div>
          <button onClick={() => setDone(false)} className="ml-auto p-1 rounded hover:bg-emerald-100">
            <X size={14} className="text-emerald-600" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button onClick={() => setError('')} className="ml-auto p-1 rounded hover:bg-red-100">
            <X size={14} className="text-red-600" />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      {parsedRows.length === 0 && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 sm:p-12 text-center hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors bg-white dark:bg-gray-800"
        >
          <Upload size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Arraste seu arquivo aqui</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">ou clique para selecionar (CSV, XLSX)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer transition-colors">
            <FileSpreadsheet size={16} />
            Selecionar Arquivo
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>
          <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>Formatos aceitos: CSV, XLSX, XLS</p>
            <p>O sistema detecta automaticamente as colunas: DATA, VALOR, CATEGORIA, DESCRICAO</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pre-visualizacao</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">{parsedRows.length} lancamento(s) encontrado(s) em {fileName}</p>
            </div>
            <button onClick={() => setParsedRows([])} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Cancelar
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-gray-800">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Data</th>
                  <th className="text-right py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Valor</th>
                  <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Categoria</th>
                  <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium hidden sm:table-cell">Descricao</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-gray-800 dark:text-gray-200">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.value)}
                    </td>
                    <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{r.category || '-'}</td>
                    <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400 max-w-xs truncate hidden sm:table-cell">{r.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 50 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Mostrando 50 de {parsedRows.length} registros</p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {importing ? 'Importando...' : `Importar ${parsedRows.length} lancamento(s)`}
          </button>
        </div>
      )}
    </div>
  )
}
