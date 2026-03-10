import { formatBRL } from '@/shared/lib/format'
import type { DashboardData } from '../hooks/useDashboardMetrics'

interface InsightsProps {
  data: DashboardData
}

export function Insights({ data }: InsightsProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 text-white">
      <h2 className="text-sm font-semibold mb-3 opacity-90">Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/10 rounded-xl p-3 sm:p-4">
          <p className="opacity-70 text-xs mb-1">Maior gasto unico</p>
          <p className="font-bold text-sm sm:text-base">{formatBRL(data.topExpenses[0]?.value || 0)}</p>
          <p className="text-xs opacity-70 mt-1 truncate">{data.topExpenses[0]?.description}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 sm:p-4">
          <p className="opacity-70 text-xs mb-1">Categoria mais custosa</p>
          <p className="font-bold text-sm sm:text-base">{data.byCategory[0]?.name}</p>
          <p className="text-xs opacity-70 mt-1">{formatBRL(data.byCategory[0]?.value || 0)} ({data.byCategory[0]?.pct}%)</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 sm:p-4">
          <p className="opacity-70 text-xs mb-1">Total de transacoes</p>
          <p className="font-bold text-sm sm:text-base">{data.numTransactions}</p>
          <p className="text-xs opacity-70 mt-1">Media {formatBRL(data.avgPerTransaction)}/transacao</p>
        </div>
      </div>
    </div>
  )
}
