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
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { TableSkeleton } from '@/components/loading'
import { useGlAccounts, useCreateGlAccount, useUpdateGlAccount, useDeleteGlAccount } from '@/lib/hooks/useMaster'

interface GlAccount {
  id: string
  code: string
  description: string
  keterangan: string
  isActive: boolean
}

export default function GlAccountPage() {
  const { data: glAccounts = [], isLoading } = useGlAccounts()
  const createGlAccount = useCreateGlAccount()
  const updateGlAccount = useUpdateGlAccount()
  const deleteGlAccount = useDeleteGlAccount()

  const [message, setMessage] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<GlAccount | null>(null)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const showMessage = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const openDialog = (item?: GlAccount) => {
    if (item) {
      setEditing(item); setCode(item.code); setDescription(item.description); setKeterangan(item.keterangan); setIsActive(item.isActive)
    } else {
      setEditing(null); setCode(''); setDescription(''); setKeterangan(''); setIsActive(true)
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    const data = { code, description, keterangan, isActive }
    try {
      if (editing) {
        await updateGlAccount.mutateAsync({ id: editing.id, data })
        showMessage('GL Account berhasil diupdate!')
      } else {
        await createGlAccount.mutateAsync(data)
        showMessage('GL Account berhasil ditambahkan!')
      }
      setShowDialog(false)
    } catch { showMessage('Gagal menyimpan GL Account') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteGlAccount.mutateAsync(deleteId)
      setDeleteId(null)
      showMessage('GL Account berhasil dihapus!')
    } catch { showMessage('Gagal menghapus GL Account') }
  }

  const columns: ColumnDef<GlAccount>[] = [
    { accessorKey: 'code', header: 'Kode' },
    { accessorKey: 'description', header: 'Deskripsi' },
    { accessorKey: 'keterangan', header: 'Keterangan' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>{row.getValue('isActive') ? 'Aktif' : 'Nonaktif'}</Badge>
    )},
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => openDialog(row.original)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ]

  if (isLoading) return <TableSkeleton title="Master GL Account" showFilters={false} showActions={true} rows={6} columns={5} />

  return (
    <div className="space-y-4 md:space-y-6">
      <div><h1 className="text-xl md:text-3xl font-bold">GL Account</h1><p className="text-muted-foreground text-xs md:text-sm">Kelola data GL Account untuk anggaran</p></div>
      {message && (<div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 md:px-4 md:py-3 rounded-md flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4" />{message}</div>)}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6">
          <div><CardTitle className="text-base md:text-lg">Daftar GL Account</CardTitle><CardDescription className="text-xs md:text-sm">Kelola data GL Account untuk anggaran</CardDescription></div>
          <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Tambah GL Account</Button>
        </CardHeader>
        <CardContent><DataTable columns={columns} data={glAccounts as GlAccount[]} searchKey="code" searchPlaceholder="Cari kode GL Account..." /></CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit GL Account' : 'Tambah GL Account'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Kode</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="51341002" /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="BODP BBM Genset" /></div>
            <div className="space-y-2"><Label>Keterangan</Label><Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Pembelian BBM CADA" /></div>
            {editing && (<div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Aktif</Label></div>)}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={!code || !description || createGlAccount.isPending || updateGlAccount.isPending}>
                {(createGlAccount.isPending || updateGlAccount.isPending) ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus GL Account?</AlertDialogTitle><AlertDialogDescription>GL Account akan dihapus permanen dari database.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteGlAccount.isPending} className="bg-red-500 hover:bg-red-600">{deleteGlAccount.isPending ? 'Menghapus...' : 'Hapus'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
