export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatBRLShort(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`
  return formatBRL(value)
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR')
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('pt-BR')
}

export function toInputDate(isoString: string): string {
  return isoString.slice(0, 10)
}

export function toInputDateTime(isoString: string): string {
  return isoString.slice(0, 16)
}

export function getMonthKey(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`
}
