interface BadgeProps {
  label: string
  color?: string
  size?: 'sm' | 'md'
}

export function Badge({ label, color = '#94a3b8', size = 'sm' }: BadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-block rounded font-medium text-white ${sizeClasses}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
