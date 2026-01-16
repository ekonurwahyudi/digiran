'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function CurrencyInput({ value, onChange, className, placeholder = '0', disabled }: CurrencyInputProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID')
  }

  const parseNumber = (str: string) => {
    const cleaned = str.replace(/\./g, '').replace(/,/g, '')
    return parseInt(cleaned) || 0
  }

  const [displayValue, setDisplayValue] = React.useState(formatNumber(value))

  React.useEffect(() => {
    setDisplayValue(formatNumber(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseNumber(raw)
    setDisplayValue(formatNumber(num))
    onChange(num)
  }

  return (
    <div className={cn("flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", disabled && "opacity-50 cursor-not-allowed", className)}>
      <span className="flex items-center px-3 text-muted-foreground bg-muted border-r border-input rounded-l-md text-sm">Rp</span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className="flex-1 px-3 py-2 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}
