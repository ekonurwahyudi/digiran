'use client'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, CheckCircle, Users } from 'lucide-react'
import { TableSkeleton } from '@/components/loading'
import { useKaryawan, useCreateKaryawan, useUpdateKaryawan, useDeleteKaryawan } from '@/lib/hooks/useMaster'

interface Karyawan {
  id: string
  nama: string
  nik: string
  jabatan: string
  nomorHp: string | null
  isActive: boolean
}

export default function KaryawanPage() {
  const { data: karyawanList = [], isLoading } = useKaryawan()
  const createKaryawan = useCreateKaryawan()
  const updateKaryawan = useUpdateKaryawan()
  const deleteKaryawan = useDeleteKaryawan()

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Karyawan | null>(null)
  const [nama, setNama] = useState('')
  const [nik, setNik] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [nomorHp, setNomorHp] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const showMessage = (type: 'success' | 'error', msg: string) => {
    setMessageType(type)
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const resetForm = () => {
    setNama('')
    setNik('')
    setJabatan('')
    setNomorHp('')
    setIsActive(true)
  }

  const openDialog = (item?: Karyawan) => {
    if (item) {
      setEditing(item)
      setNama(item.nama)
      setNik(item.nik)
      setJabatan(item.jabatan)
      setNomorHp(item.nomorHp || '')
      setIsActive(item.isActive)
    } else {
      setEditing(null)
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!nama || !nik || !jabatan) {
      showMessage('error', 'Nama, NIK, dan Jabatan harus diisi')
      return
    }

    const data = { nama, nik, jabatan, nomorHp: nomorHp || null, isActive }
    try {
      if (editing) {
        await updateKaryawan.mutateAsync({ id: editing.id, data })
        showMessage('success', 'Karyawan berhasil diupdate!')
      } else {
        await createKaryawan.mutateAsync(data)
        showMessage('success', 'Karyawan berhasil ditambahkan!')
      }
      setShowDialog(false)
      resetForm()
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Gagal menyimpan Karyawan'
      showMessage('error', errorMsg)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteKaryawan.mutateAsync(deleteId)
      setDeleteId(null)
      showMessage('success', 'Karyawan berhasil dihapus!')
    } catch {
      showMessage('error', 'Gagal menghapus Karyawan')
    }
  }

  const columns: ColumnDef<Karyawan>[] = [
    { accessorKey: 'nik', header: 'NIK', cell: ({ row }) => <span className="font-medium">{row.original.nik}</span> },
    { accessorKey: 'nama', header: 'Nama' },
    { accessorKey: 'jabatan', header: 'Jabatan' },
    { accessorKey: 'nomorHp', header: 'Nomor HP', cell: ({ row }) => row.original.nomorHp || '-' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
        {row.getValue('isActive') ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )},
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => openDialog(row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteId(row.original.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    )},
  ]

  if (isLoading) return <TableSkeleton title="Master Karyawan" showFilters={false} showActions={true} rows={6} columns={5} />

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold">Karyawan</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Kelola data Karyawan</p>
      </div>

      {message && (
        <div className={`px-3 py-2 md:px-4 md:py-3 rounded-md flex items-center gap-2 text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <CheckCircle className="h-4 w-4" />
          {message}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Daftar Karyawan
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Data karyawan yang terdaftar</CardDescription>
          </div>
          <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />Tambah Karyawan
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <DataTable columns={columns} data={karyawanList as Karyawan[]} searchKey="nama" searchPlaceholder="Cari nama karyawan..." />
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK *</Label>
                <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="123456" />
              </div>
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jabatan *</Label>
                <Input value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Manager" />
              </div>
              <div className="space-y-2">
                <Label>Nomor HP</Label>
                <Input value={nomorHp} onChange={(e) => setNomorHp(e.target.value)} placeholder="08123456789" />
              </div>
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Aktif</Label>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={!nama || !nik || !jabatan || createKaryawan.isPending || updateKaryawan.isPending}>
                {(createKaryawan.isPending || updateKaryawan.isPending) ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription>Karyawan akan dihapus permanen dari database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteKaryawan.isPending} className="bg-red-500 hover:bg-red-600">
              {deleteKaryawan.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
