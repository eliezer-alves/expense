import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

interface FormFieldWrapperProps {
  label: string
  children: ReactNode
  error?: string
}

export function FormField({ label, children, error }: FormFieldWrapperProps) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${props.className || ''}`}
    />
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode
}

export function Select({ children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${props.className || ''}`}
    >
      {children}
    </select>
  )
}
