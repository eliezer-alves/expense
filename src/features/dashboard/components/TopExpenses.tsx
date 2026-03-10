import { formatBRL } from '@/shared/lib/format'
import { useCategoryStore } from '@/features/categories/store'
import type { Expense } from '@/features/expenses/types'

interface TopExpensesProps {
  expenses: Expense[]
}

export function TopExpenses({ expenses }: TopExpensesProps) {
  const categories = useCategoryStore(state => state.categories)
  const catMap = new Map(categories.map(c => [c.id, c]))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Top 10 Maiores Gastos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium text-xs">#</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Data</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium text-xs hidden sm:table-cell">Descricao</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Categoria</th>
              <th className="text-right py-2 px-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Valor</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e, i) => {
              const cat = catMap.get(e.categoryId)
              return (
                <tr key={e.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 px-2 text-gray-400 dark:text-gray-500 text-xs">{i + 1}</td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 px-2 text-gray-800 dark:text-gray-200 text-xs max-w-xs truncate hidden sm:table-cell">{e.description}</td>
                  <td className="py-2 px-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: cat?.color || '#94a3b8' }}>
                      {cat?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">{formatBRL(e.value)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
