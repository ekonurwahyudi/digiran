"use client"

import * as React from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onSelect: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({ dateRange, onSelect, placeholder = "Pilih tanggal", className }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd MMM yy", { locale: idLocale })} - {format(dateRange.to, "dd MMM yy", { locale: idLocale })}
              </>
            ) : (
              format(dateRange.from, "dd MMM yyyy", { locale: idLocale })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
