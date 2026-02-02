import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

// GL Account hooks
export const glAccountKeys = {
  all: ['glAccounts'] as const,
}

export const useGlAccounts = () => {
  return useQuery({
    queryKey: glAccountKeys.all,
    queryFn: async () => {
      const data = await api.get('/gl-account')
      return data as unknown as any[]
    },
  })
}

export const useCreateGlAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/gl-account', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: glAccountKeys.all }),
  })
}

export const useUpdateGlAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/gl-account/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: glAccountKeys.all }),
  })
}

export const useDeleteGlAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/gl-account/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: glAccountKeys.all }),
  })
}

// Regional hooks
export const regionalKeys = {
  all: ['regionals'] as const,
}

export const useRegionals = () => {
  return useQuery({
    queryKey: regionalKeys.all,
    queryFn: async () => {
      const data = await api.get('/regional')
      return data as unknown as any[]
    },
  })
}

export const useCreateRegional = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/regional', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: regionalKeys.all }),
  })
}

export const useUpdateRegional = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/regional/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: regionalKeys.all }),
  })
}

export const useDeleteRegional = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/regional/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: regionalKeys.all }),
  })
}


// Vendor hooks
export const vendorKeys = {
  all: ['vendors'] as const,
  withInactive: ['vendors', 'includeInactive'] as const,
}

export const useVendors = (includeInactive = true) => {
  return useQuery({
    queryKey: includeInactive ? vendorKeys.withInactive : vendorKeys.all,
    queryFn: async () => {
      const url = includeInactive ? '/vendor?includeInactive=true' : '/vendor'
      const data = await api.get(url)
      return data as unknown as any[]
    },
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/vendor', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/vendor/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/vendor/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

// PIC Anggaran hooks
export const picAnggaranKeys = {
  all: ['picAnggaran'] as const,
  byYear: (year: number) => [...picAnggaranKeys.all, year] as const,
}

export const usePicAnggaran = (year?: number) => {
  return useQuery({
    queryKey: year ? picAnggaranKeys.byYear(year) : picAnggaranKeys.all,
    queryFn: async () => {
      const url = year ? `/pic-anggaran?year=${year}` : '/pic-anggaran'
      const data = await api.get(url)
      return data as unknown as any[]
    },
  })
}

export const useCreatePicAnggaran = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/pic-anggaran', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: picAnggaranKeys.all }),
  })
}

export const useUpdatePicAnggaran = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/pic-anggaran/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: picAnggaranKeys.all }),
  })
}

export const useDeletePicAnggaran = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/pic-anggaran/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: picAnggaranKeys.all }),
  })
}

// Imprest Fund Card hooks
export const imprestFundCardKeys = {
  all: ['imprestFundCards'] as const,
}

export const useImprestFundCards = () => {
  return useQuery({
    queryKey: imprestFundCardKeys.all,
    queryFn: async () => {
      const data = await api.get('/imprest-fund-card')
      return data as unknown as any[]
    },
  })
}

export const useCreateImprestFundCard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await api.post('/imprest-fund-card', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imprestFundCardKeys.all }),
  })
}

export const useUpdateImprestFundCard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => await api.put(`/imprest-fund-card/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imprestFundCardKeys.all }),
  })
}

export const useDeleteImprestFundCard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/imprest-fund-card/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imprestFundCardKeys.all }),
  })
}
