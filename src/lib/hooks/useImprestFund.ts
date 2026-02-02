import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export const imprestFundKeys = {
  all: ['imprestFunds'] as const,
  cards: ['imprestFundCards'] as const,
}

export const useImprestFunds = () => {
  return useQuery({
    queryKey: imprestFundKeys.all,
    queryFn: async () => {
      const data = await api.get('/imprest-fund')
      return data as unknown as any[]
    },
  })
}

export const useImprestFundCards = () => {
  return useQuery({
    queryKey: imprestFundKeys.cards,
    queryFn: async () => {
      const data = await api.get('/imprest-fund-card')
      return data as unknown as any[]
    },
  })
}

export const useCreateImprestFund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/imprest-fund', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imprestFundKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export const useUpdateImprestFund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/imprest-fund/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imprestFundKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export const useDeleteImprestFund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/imprest-fund/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imprestFundKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export const useTopUpImprestFund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { imprestFundCardId: string; amount: number; keterangan?: string }) => 
      await api.post('/imprest-fund/topup', { imprestFundCardId: data.imprestFundCardId, debit: data.amount, keterangan: data.keterangan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imprestFundKeys.all })
      queryClient.invalidateQueries({ queryKey: imprestFundKeys.cards })
    },
  })
}
