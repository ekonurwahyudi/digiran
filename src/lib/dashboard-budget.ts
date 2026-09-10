const monthFields = ['janAmount', 'febAmount', 'marAmount', 'aprAmount', 'mayAmount', 'junAmount', 'julAmount', 'augAmount', 'sepAmount', 'octAmount', 'novAmount', 'decAmount'] as const
type BudgetAmounts = Partial<Record<typeof monthFields[number] | 'q1Amount' | 'q2Amount' | 'q3Amount' | 'q4Amount', number>>

export function baseQuarterBudget(budget: BudgetAmounts, quarter: number) {
  return Number(budget[`q${quarter}Amount` as 'q1Amount'] || 0)
}

export function baseMonthlyBudget(budget: BudgetAmounts, month: number) {
  const start = Math.floor(month / 3) * 3
  // Legacy budgets have no monthly allocation. Preserve explicitly allocated zero months.
  const hasMonthlyAllocation = monthFields.slice(start, start + 3).some(key => Number(budget[key] || 0) !== 0)
  return hasMonthlyAllocation ? Number(budget[monthFields[month]] || 0) : baseQuarterBudget(budget, Math.floor(month / 3) + 1) / 3
}

export function periodBudget(budget: number, incoming: number, outgoing: number, used: number) {
  const available = budget + incoming
  return {
    budget, incoming, rra: outgoing, used,
    remaining: available - outgoing - used,
    outlook: available > 0 ? (outgoing + used) / available * 100 : 0,
  }
}

export function scopedRraTotals(lines: { regionalCode: string; regionalName?: string | null; costCenter?: string | null; side: string; amount: number; rraLog?: { month: number } }[], regionalCode: string | null | undefined, months: number[], legacyHoScope = false) {
  return lines.filter(line => (regionalCode ? line.regionalCode === regionalCode : legacyHoScope && /(^|[^A-Z0-9])HO([^A-Z0-9]|$)/i.test(`${line.regionalCode} ${line.regionalName || ''} ${line.costCenter || ''}`)) && months.includes(Number(line.rraLog?.month)))
    .reduce((totals, line) => {
      if (line.side === 'PENERIMA') totals.incoming += Number(line.amount || 0)
      if (line.side === 'DONOR') totals.outgoing += Number(line.amount || 0)
      return totals
    }, { incoming: 0, outgoing: 0 })
}
