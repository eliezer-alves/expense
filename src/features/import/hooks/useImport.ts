import { useState, useCallback } from 'react'
import { useExpenseStore } from '@/features/expenses/store'
import { useCategoryStore } from '@/features/categories/store'
import { usePartnerStore } from '@/features/partners/store'

interface ParsedRow {
  date: string
  value: number
  categoryName: string
  description: string
  partnerName: string
}

export function useImport() {
  const { importExpenses } = useExpenseStore()
  const { categories, addCategory } = useCategoryStore()
  const { partners, addPartner } = usePartnerStore()

  const [parsed, setParsed] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showFormatHint, setShowFormatHint] = useState(false)

  const reset = useCallback(() => {
    setParsed(null)
    setImported(false)
    setImportedCount(0)
    setError('')
    setFileName('')
  }, [])

  const parseFile = useCallback(async (file: File) => {
    setError('')
    setImported(false)
    setFileName(file.name)

    try {
      const XLSX = await import('xlsx')
      const isCSV = file.name.toLowerCase().endsWith('.csv')
      let wb
      if (isCSV) {
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

      const rows: ParsedRow[] = []
      for (const row of jsonData) {
        const keys = Object.keys(row)
        const dateKey = keys.find(k => /data|date/i.test(k)) || keys[0]
        const valueKey = keys.find(k => /valor|value|preco|price/i.test(k)) || keys[1]
        const catKey = keys.find(k => /categ/i.test(k)) || ''
        const descKey = keys.find(k => /desc|descri/i.test(k)) || keys[keys.length - 1]
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
          categoryName: rawCat.trim(),
          description: rawDesc.trim(),
          partnerName: rawPartner.trim(),
        })
      }

      if (rows.length === 0) {
        setError('Nao foi possivel interpretar os dados da planilha. Verifique se possui colunas de DATA e VALOR.')
        return
      }

      setParsed(rows)
    } catch (err) {
      setError('Erro ao ler o arquivo. Verifique se e um arquivo CSV ou XLSX valido.')
      console.error(err)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleImport = useCallback(async () => {
    if (!parsed) return
    setImporting(true)
    setError('')
    try {
      const catNameMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]))
      const partnerNameMap = new Map(partners.map(p => [p.name.toLowerCase(), p.id]))

      const items = []
      for (const row of parsed) {
        // Resolve category
        let categoryId = ''
        if (row.categoryName) {
          const existing = catNameMap.get(row.categoryName.toLowerCase())
          if (existing) {
            categoryId = existing
          } else {
            const newCat = await addCategory({
              name: row.categoryName,
              color: '#64748b',
              icon: 'Package',
            })
            catNameMap.set(row.categoryName.toLowerCase(), newCat.id)
            categoryId = newCat.id
          }
        } else {
          const outros = catNameMap.get('outros')
          categoryId = outros || categories[0]?.id || ''
        }

        // Resolve partner
        let partnerId: string | null = null
        if (row.partnerName) {
          const existing = partnerNameMap.get(row.partnerName.toLowerCase())
          if (existing) {
            partnerId = existing
          } else {
            const newPartner = await addPartner({ name: row.partnerName })
            partnerNameMap.set(row.partnerName.toLowerCase(), newPartner.id)
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
      setImportedCount(items.length)
      setImported(true)
      setParsed(null)
    } catch (err) {
      setError('Erro ao importar os dados.')
      console.error(err)
    } finally {
      setImporting(false)
    }
  }, [parsed, categories, partners, addCategory, addPartner, importExpenses])

  return {
    parsed,
    importing,
    imported,
    importedCount,
    error,
    fileName,
    dragging,
    showFormatHint,
    setShowFormatHint,
    reset,
    handleFileInput,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImport,
  }
}
