import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export const dashboardKeys = {
  budgets: (year: number) => ['dashboard', 'budgets', year] as const,
  transactions: (year: number) => ['dashboard', 'transactions', year] as const,
  glAccounts: ['dashboard', 'glAccounts'] as const,
}

export const useDashboardBudgets = (year: number) => {
  return useQuery({
    queryKey: dashboardKeys.budgets(year),
    queryFn: async () => {
      const data = await api.get(`/budget?year=${year}`)
      return data as unknown as any[]
    },
  })
}

export const useDashboardTransactions = (year: number) => {
  return useQuery({
    queryKey: dashboardKeys.transactions(year),
    queryFn: async () => {
      const data = await api.get(`/transaction?year=${year}`)
      return data as unknown as any[]
    },
  })
}

export const useDashboardGlAccounts = () => {
  return useQuery({
    queryKey: dashboardKeys.glAccounts,
    queryFn: async () => {
      const data = await api.get('/gl-account')
      return data as unknown as any[]
    },
  })
}
