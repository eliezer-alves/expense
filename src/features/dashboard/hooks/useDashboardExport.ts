import { useCallback } from 'react'
import { useExpenseStore } from '@/features/expenses/store'
import { useCategoryStore } from '@/features/categories/store'
import type { Expense } from '@/features/expenses/types'
import type { Category } from '@/features/categories/types'

async function exportDashboardPDF(element: HTMLElement) {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const isDark = document.documentElement.classList.contains('dark')
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: isDark ? '#111827' : '#f9fafb' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  let heightLeft = pdfHeight
  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
  heightLeft -= pdf.internal.pageSize.getHeight()
  while (heightLeft > 0) {
    position = heightLeft - pdfHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pdf.internal.pageSize.getHeight()
  }
  pdf.save('dashboard-casa-mcmv.pdf')
}

async function exportMetricsXLSX(
  expenses: Expense[],
  categories: Category[],
  monthlyData: Record<string, number | string>[],
  byCategory: { name: string; value: number; pct: number }[]
) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // Sheet 1: Resumo por Categoria
  const catRows = byCategory.map(c => ({
    Categoria: c.name,
    'Valor Total': c.value,
    '% do Total': `${c.pct.toFixed(1)}%`,
  }))
  const ws1 = XLSX.utils.json_to_sheet(catRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'Por Categoria')

  // Sheet 2: Resumo Mensal
  const monthRows = monthlyData.map(m => {
    const row: Record<string, string | number> = { Mes: m.name as string }
    categories.forEach(c => {
      row[c.name] = (m[c.id] as number) || 0
    })
    row['Total'] = m.total as number
    return row
  })
  const ws2 = XLSX.utils.json_to_sheet(monthRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Por Mes')

  // Sheet 3: Todos os Lancamentos
  const catMap = new Map(categories.map(c => [c.id, c.name]))
  const expRows = expenses.map(e => ({
    Data: new Date(e.date).toLocaleDateString('pt-BR'),
    Valor: e.value,
    Categoria: catMap.get(e.categoryId) || 'N/A',
    Descricao: e.description,
  }))
  const ws3 = XLSX.utils.json_to_sheet(expRows)
  XLSX.utils.book_append_sheet(wb, ws3, 'Lancamentos')

  XLSX.writeFile(wb, 'metricas-casa-mcmv.xlsx')
}

export function useDashboardExport() {
  const expenses = useExpenseStore(state => state.expenses)
  const categories = useCategoryStore(state => state.categories)

  const handleExportPDF = useCallback((element: HTMLElement) => {
    exportDashboardPDF(element)
  }, [])

  const handleExportXLSX = useCallback((
    monthlyData: Record<string, number | string>[],
    byCategory: { name: string; value: number; pct: number }[]
  ) => {
    exportMetricsXLSX(expenses, categories, monthlyData, byCategory)
  }, [expenses, categories])

  return { handleExportPDF, handleExportXLSX }
}
