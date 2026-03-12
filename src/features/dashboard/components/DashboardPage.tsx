import { useRef } from 'react'
import { Receipt, FileText, FileSpreadsheet } from 'lucide-react'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { useDashboardExport } from '../hooks/useDashboardExport'
import { KPICards } from './KPICards'
import { Charts } from './Charts'
import { TopExpenses } from './TopExpenses'
import { Insights } from './Insights'

export default function DashboardPage() {
  const data = useDashboardMetrics()
  const { handleExportPDF, handleExportXLSX } = useDashboardExport()
  const dashRef = useRef<HTMLDivElement>(null)

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhum lancamento ainda</h2>
          <p className="text-gray-500 dark:text-gray-400">Adicione lancamentos ou importe uma planilha para ver o dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.numTransactions} lancamentos registrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dashRef.current && handleExportPDF(dashRef.current)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => handleExportXLSX(data.monthlyData, data.byCategory)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      <div ref={dashRef} className="space-y-6">
        <KPICards data={data} />
        <Charts data={data} />
        <TopExpenses expenses={data.topExpenses} />
        <Insights data={data} />
      </div>
    </div>
  )
}
