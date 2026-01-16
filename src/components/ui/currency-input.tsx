'use client'
import * as React from 'react'
import { Input } from '@/components/ui/input'
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
    <Input
      value={displayValue}
      onChange={handleChange}
      className={cn(className)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
