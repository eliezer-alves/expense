import type { ElementType } from 'react'

interface EmptyStateProps {
  icon: ElementType
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}
