import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend
} from 'recharts'
import { formatBRL, formatBRLShort } from '@/shared/lib/format'
import { useCategoryStore } from '@/features/categories/store'
import type { DashboardData } from '../hooks/useDashboardMetrics'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

interface ChartsProps {
  data: DashboardData
}

export function Charts({ data }: ChartsProps) {
  const categories = useCategoryStore(state => state.categories)
  const catMap = new Map(categories.map(c => [c.id, c]))

  return (
    <>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Distribuicao por Categoria</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {data.byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {data.byCategory.map(c => (
              <div key={c.key} className="flex items-center gap-2 text-xs p-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{c.name}</span>
                <span className="text-gray-400 dark:text-gray-500 ml-auto">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Gastos Mensais por Categoria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => formatBRLShort(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value: string) => {
                const cat = catMap.get(value)
                return <span className="text-xs text-gray-500">{cat?.name || value}</span>
              }} />
              {categories.map(cat => (
                <Bar key={cat.id} dataKey={cat.id} name={cat.id} stackId="a" fill={cat.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Evolucao Acumulada</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.cumulativeData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => formatBRLShort(v)} />
              <Tooltip formatter={(value: number) => [formatBRL(value), 'Acumulado']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Tendencia Mensal</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => formatBRLShort(v)} />
              <Tooltip formatter={(value: number) => [formatBRL(value), 'Total do Mes']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
