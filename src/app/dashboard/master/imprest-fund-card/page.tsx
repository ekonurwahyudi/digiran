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
import { Plus, Pencil, Trash2, CreditCard, CheckCircle } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { TableSkeleton } from '@/components/loading'
import { useImprestFundCards } from '@/lib/hooks/useImprestFund'
import { useCreateImprestFundCard, useUpdateImprestFundCard, useDeleteImprestFundCard } from '@/lib/hooks/useMaster'

interface ImprestFundCard { id: string; nomorKartu: string; user: string; saldo: number; pic: string; isActive: boolean }

export default function ImprestFundCardPage() {
  const { data: cards = [], isLoading } = useImprestFundCards()
  const createCard = useCreateImprestFundCard()
  const updateCard = useUpdateImprestFundCard()
  const deleteCard = useDeleteImprestFundCard()

  const [message, setMessage] = useState('')
  const [nomorKartu, setNomorKartu] = useState('')
  const [user, setUser] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [pic, setPic] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<ImprestFundCard | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }
  const resetForm = () => { setNomorKartu(''); setUser(''); setSaldo(0); setPic('') }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomorKartu || !user || !pic) { showMsg('Semua field harus diisi!'); return }
    try {
      await createCard.mutateAsync({ nomorKartu, user, saldo, pic })
      showMsg('Imprest Fund Card berhasil ditambahkan!')
      setShowAddDialog(false); resetForm()
    } catch { showMsg('Gagal menambahkan Imprest Fund Card!') }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard) return
    try {
      await updateCard.mutateAsync({ id: editingCard.id, data: { nomorKartu: editingCard.nomorKartu, user: editingCard.user, saldo: editingCard.saldo, pic: editingCard.pic } })
      showMsg('Imprest Fund Card berhasil diupdate!')
      setShowEditDialog(false); setEditingCard(null)
    } catch { showMsg('Gagal update Imprest Fund Card!') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCard.mutateAsync(deleteId)
      showMsg('Imprest Fund Card berhasil dihapus!')
      setShowDeleteDialog(false); setDeleteId(null)
    } catch { showMsg('Gagal menghapus Imprest Fund Card!') }
  }

  const columns: ColumnDef<ImprestFundCard>[] = [
    { accessorKey: 'nomorKartu', header: 'No. Nomor Kartu', cell: ({ row }) => <span className="font-medium">{row.original.nomorKartu}</span> },
    { accessorKey: 'user', header: 'User' },
    { accessorKey: 'saldo', header: () => <div className="text-right">Saldo (Rp)</div>, cell: ({ row }) => <div className="text-right font-medium">{row.original.saldo.toLocaleString('id-ID')}</div> },
    { accessorKey: 'pic', header: 'PIC' },
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => { setEditingCard(row.original); setShowEditDialog(true) }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => { setDeleteId(row.original.id); setShowDeleteDialog(true) }} className="text-red-500 hover:text-red-700 hover:border-red-300"><Trash2 className="h-4 w-4" /></Button>
      </div>
    )}
  ]

  if (isLoading) return <TableSkeleton title="Master Imprest Fund Card" showFilters={false} showActions={true} rows={5} columns={4} />

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div><h1 className="text-xl md:text-2xl font-bold">Master Imprest Fund Card</h1><p className="text-muted-foreground text-xs md:text-sm">Kelola data kartu imprest fund</p></div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" />Tambah Kartu</Button>
      </div>
      {message && (<div className={`border px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-2 text-sm ${message.includes('berhasil') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}><CheckCircle className="h-4 w-4" />{message}</div>)}
      <Card className="border">
        <CardHeader className="p-4 md:p-6"><CardTitle className="flex items-center gap-2 text-base md:text-lg"><CreditCard className="h-4 w-4 md:h-5 md:w-5" />Daftar Imprest Fund Card</CardTitle><CardDescription className="text-xs md:text-sm">Data kartu imprest fund yang terdaftar</CardDescription></CardHeader>
        <CardContent><DataTable columns={columns} data={cards as ImprestFundCard[]} /></CardContent>
      </Card>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Imprest Fund Card</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2"><Label>No. Nomor Kartu</Label><Input value={nomorKartu} onChange={(e) => setNomorKartu(e.target.value)} placeholder="Masukkan nomor kartu" required /></div>
            <div className="space-y-2"><Label>User</Label><Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Masukkan nama user" required /></div>
            <div className="space-y-2"><Label>Saldo Imprest Fund (Rp)</Label><CurrencyInput value={saldo} onChange={setSaldo} /></div>
            <div className="space-y-2"><Label>PIC</Label><Input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Masukkan nama PIC" required /></div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetForm() }}>Batal</Button>
              <Button type="submit" disabled={createCard.isPending}>{createCard.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Imprest Fund Card</DialogTitle></DialogHeader>
          {editingCard && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2"><Label>No. Nomor Kartu</Label><Input value={editingCard.nomorKartu} onChange={(e) => setEditingCard({...editingCard, nomorKartu: e.target.value})} required /></div>
              <div className="space-y-2"><Label>User</Label><Input value={editingCard.user} onChange={(e) => setEditingCard({...editingCard, user: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Saldo Imprest Fund (Rp)</Label><CurrencyInput value={editingCard.saldo} onChange={(value) => setEditingCard({...editingCard, saldo: value})} /></div>
              <div className="space-y-2"><Label>PIC</Label><Input value={editingCard.pic} onChange={(e) => setEditingCard({...editingCard, pic: e.target.value})} required /></div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingCard(null) }}>Batal</Button>
                <Button type="submit" disabled={updateCard.isPending}>{updateCard.isPending ? 'Menyimpan...' : 'Update'}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Imprest Fund Card?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Data kartu akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteCard.isPending} className="bg-red-500 hover:bg-red-600">{deleteCard.isPending ? 'Menghapus...' : 'Hapus'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
