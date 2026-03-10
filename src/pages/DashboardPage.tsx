import { useMemo, useRef } from 'react'
import { useData } from '../contexts/DataContext'
import { formatBRL, formatBRLShort, getMonthKey, getMonthLabel } from '../lib/format'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend
} from 'recharts'
import {
  DollarSign, TrendingUp, Receipt, Calendar, ArrowUpRight,
  ArrowDownRight, FileSpreadsheet, FileText
} from 'lucide-react'
import type { Expense, Category } from '../types'

// PDF + XLSX export helpers
async function exportDashboardPDF(element: HTMLElement) {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f9fafb' })
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

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

// KPI Card
function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }: {
  title: string; value: string; subtitle?: string; icon: typeof DollarSign
  trend?: 'up' | 'down' | 'neutral'; color?: string
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-1.5 sm:p-2 rounded-xl ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-lg sm:text-2xl font-bold text-gray-900">{value}</span>
        {trend && trend !== 'neutral' && (
          <span className={`flex items-center text-xs ${trend === 'up' ? 'text-rose-500' : 'text-emerald-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { expenses, categories } = useData()
  const dashRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => {
    if (expenses.length === 0) return null

    const total = expenses.reduce((s, e) => s + e.value, 0)
    const catMap = new Map(categories.map(c => [c.id, c]))

    // By category
    const byCatRaw: Record<string, number> = {}
    expenses.forEach(e => { byCatRaw[e.categoryId] = (byCatRaw[e.categoryId] || 0) + e.value })
    const byCategory = Object.entries(byCatRaw)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => {
        const cat = catMap.get(id)
        return {
          name: cat?.name || 'N/A',
          key: id,
          value: Math.round(value * 100) / 100,
          pct: Math.round((value / total) * 1000) / 10,
          color: cat?.color || '#94a3b8',
        }
      })

    // Monthly
    const monthTotals: Record<string, Record<string, number>> = {}
    expenses.forEach(e => {
      const mk = getMonthKey(e.date)
      if (!monthTotals[mk]) monthTotals[mk] = {}
      monthTotals[mk][e.categoryId] = (monthTotals[mk][e.categoryId] || 0) + e.value
    })

    const monthKeys = Object.keys(monthTotals).sort()
    const monthlyData = monthKeys.map(mk => {
      const entry: Record<string, number | string> = { name: getMonthLabel(mk) }
      let monthTotal = 0
      categories.forEach(c => {
        const v = Math.round((monthTotals[mk]?.[c.id] || 0) * 100) / 100
        entry[c.id] = v
        monthTotal += v
      })
      entry.total = Math.round(monthTotal * 100) / 100
      return entry
    })

    // Cumulative
    let running = 0
    const cumulativeData = monthKeys.map(mk => {
      let mt = 0
      categories.forEach(c => { mt += monthTotals[mk]?.[c.id] || 0 })
      running += mt
      return { name: getMonthLabel(mk), total: Math.round(running * 100) / 100 }
    })

    // Monthly trend
    const monthlyTrend = monthKeys.map(mk => {
      let mt = 0
      categories.forEach(c => { mt += monthTotals[mk]?.[c.id] || 0 })
      return { name: getMonthLabel(mk), total: Math.round(mt * 100) / 100 }
    })

    // Top expenses
    const topExpenses = [...expenses].sort((a, b) => b.value - a.value).slice(0, 10)

    // Averages
    const avgPerTransaction = total / expenses.length
    const avgMonthly = total / (monthKeys.length || 1)

    // Month change
    const lastMonthVal = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].total : 0
    const prevMonthVal = monthlyTrend.length > 1 ? monthlyTrend[monthlyTrend.length - 2].total : 0
    const monthChange = prevMonthVal > 0 ? ((lastMonthVal - prevMonthVal) / prevMonthVal * 100) : 0
    const lastMonthLabel = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].name : ''

    return {
      total, byCategory, monthlyData, cumulativeData, monthlyTrend,
      topExpenses, avgPerTransaction, avgMonthly,
      lastMonthVal, lastMonthLabel, monthChange,
      numTransactions: expenses.length,
    }
  }, [expenses, categories])

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum lancamento ainda</h2>
          <p className="text-gray-500">Adicione lancamentos ou importe uma planilha para ver o dashboard.</p>
        </div>
      </div>
    )
  }

  const catMap = new Map(categories.map(c => [c.id, c]))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{data.numTransactions} lancamentos registrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dashRef.current && exportDashboardPDF(dashRef.current)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => exportMetricsXLSX(expenses, categories, data.monthlyData, data.byCategory)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      <div ref={dashRef} className="space-y-6">
        {/* KPIs */}
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Distribuicao por Categoria</h2>
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
                  <span className="text-gray-600 truncate">{c.name}</span>
                  <span className="text-gray-400 ml-auto">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Gastos Mensais por Categoria</h2>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Evolucao Acumulada</h2>
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Tendencia Mensal</h2>
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

        {/* Top 10 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top 10 Maiores Gastos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">#</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">Data</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs hidden sm:table-cell">Descricao</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">Categoria</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium text-xs">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.topExpenses.map((e, i) => {
                  const cat = catMap.get(e.categoryId)
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2 px-2 text-gray-600 text-xs whitespace-nowrap">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 px-2 text-gray-800 text-xs max-w-xs truncate hidden sm:table-cell">{e.description}</td>
                      <td className="py-2 px-2">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: cat?.color || '#94a3b8' }}>
                          {cat?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-gray-800 text-xs whitespace-nowrap">{formatBRL(e.value)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
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
      </div>
    </div>
  )
}
