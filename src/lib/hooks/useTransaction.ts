import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export const transactionKeys = {
  all: ['transactions'] as const,
  byYear: (year: number) => [...transactionKeys.all, year] as const,
  remaining: (glAccountId: string, quarter: number, regionalCode: string, year: number) => 
    ['remaining', glAccountId, quarter, regionalCode, year] as const,
}

export const useTransactions = (year: number) => {
  return useQuery({
    queryKey: transactionKeys.byYear(year),
    queryFn: async () => {
      const data = await api.get(`/transaction?year=${year}`)
      return data as unknown as any[]
    },
  })
}

export const useRemainingBudget = (glAccountId: string, quarter: number, regionalCode: string, year: number) => {
  return useQuery({
    queryKey: transactionKeys.remaining(glAccountId, quarter, regionalCode, year),
    queryFn: async () => {
      const data = await api.get(`/transaction/remaining?glAccountId=${glAccountId}&quarter=${quarter}&regionalCode=${regionalCode}&year=${year}`)
      return data as unknown as { remaining: number; allocated: number; used: number }
    },
    enabled: !!glAccountId && !!quarter && !!regionalCode && !!year,
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/transaction', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/transaction/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/transaction/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export const useUploadTransactionFiles = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      return await api.post(`/transaction/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export const useDeleteTransactionFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ transactionId, fileId }: { transactionId: string; fileId: string }) => 
      await api.delete(`/transaction/${transactionId}/files?fileId=${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}
