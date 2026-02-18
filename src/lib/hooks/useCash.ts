import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export const cashKeys = {
  all: ['cash'] as const,
}

export interface Cash {
  id: string
  karyawanId: string
  karyawan: {
    id: string
    nama: string
    nik: string
    jabatan: string
  }
  tanggal: Date
  tipe: 'masuk' | 'keluar'
  jumlah: number
  keterangan?: string
  createdAt: Date
  updatedAt: Date
}

export const useCash = () => {
  return useQuery({
    queryKey: cashKeys.all,
    queryFn: async () => {
      const data = await api.get('/cash')
      return data as unknown as Cash[]
    },
  })
}

export const useCreateCash = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      karyawanId: string
      tanggal: Date
      tipe: 'masuk' | 'keluar'
      jumlah: number
      keterangan?: string
    }) => await api.post('/cash', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
    },
  })
}

export const useUpdateCash = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cash> }) => 
      await api.put(`/cash/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
    },
  })
}

export const useDeleteCash = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => await api.delete(`/cash/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
    },
  })
}
