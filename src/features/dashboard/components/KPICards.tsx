import {
  DollarSign, TrendingUp, Receipt, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { formatBRL } from '@/shared/lib/format'
import type { DashboardData } from '../hooks/useDashboardMetrics'
import type { ElementType } from 'react'

function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }: {
  title: string; value: string; subtitle?: string; icon: ElementType
  trend?: 'up' | 'down' | 'neutral'; color?: string
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <div className={`p-1.5 sm:p-2 rounded-xl ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        {trend && trend !== 'neutral' && (
          <span className={`flex items-center text-xs ${trend === 'up' ? 'text-rose-500' : 'text-emerald-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

interface KPICardsProps {
  data: DashboardData
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KPICard title="Total Investido" value={formatBRL(data.total)} subtitle="Desde o inicio" icon={DollarSign} color="indigo" />
      <KPICard title="Media Mensal" value={formatBRL(data.avgMonthly)} icon={TrendingUp} color="emerald" />
      <KPICard title="Media/Transacao" value={formatBRL(data.avgPerTransaction)} icon={Receipt} color="amber" />
      <KPICard
        title={`Ultimo Mes (${data.lastMonthLabel})`}
        value={formatBRL(data.lastMonthVal)}
        subtitle={`${data.monthChange > 0 ? '+' : ''}${data.monthChange.toFixed(0)}% vs anterior`}
        icon={Calendar}
        trend={data.monthChange > 0 ? 'up' : 'down'}
        color="rose"
      />
    </div>
  )
}
