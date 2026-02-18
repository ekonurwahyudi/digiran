'use client'
import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { TableSkeleton } from '@/components/loading'
import { useCash, useCreateCash, useUpdateCash, useDeleteCash, Cash } from '@/lib/hooks/useCash'
import { useKaryawan } from '@/lib/hooks/useMaster'

interface Karyawan {
  id: string
  nama: string
  nik: string
  jabatan: string
  isActive: boolean
}

export default function CashPage() {
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Form states
  const [karyawanId, setKaryawanId] = useState('')
  const [tanggal, setTanggal] = useState<Date>(new Date())
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk')
  const [jumlah, setJumlah] = useState(0)
  const [keterangan, setKeterangan] = useState('')
  
  // Edit states
  const [editingCash, setEditingCash] = useState<Cash | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // TanStack Query hooks
  const { data: cashData = [], isLoading: cashLoading } = useCash()
  const { data: karyawanData = [], isLoading: karyawanLoading } = useKaryawan()
  
  const createCash = useCreateCash()
  const updateCash = useUpdateCash()
  const deleteCash = useDeleteCash()

  const cashRecords = Array.isArray(cashData) ? cashData : []
  const karyawanList = Array.isArray(karyawanData) ? karyawanData.filter((k: Karyawan) => k.isActive) : []
  const loading = cashLoading || karyawanLoading

  // Calculate totals
  const totalMasuk = cashRecords.filter(c => c.tipe === 'masuk').reduce((sum, c) => sum + c.jumlah, 0)
  const totalKeluar = cashRecords.filter(c => c.tipe === 'keluar').reduce((sum, c) => sum + c.jumlah, 0)
  const totalCash = totalMasuk - totalKeluar

  // Calculate cash per karyawan (only those with balance)
  const cashPerKaryawan = useMemo(() => {
    const map = new Map<string, { nama: string; saldo: number }>()
    
    cashRecords.forEach(c => {
      const current = map.get(c.karyawanId) || { nama: c.karyawan.nama, saldo: 0 }
      if (c.tipe === 'masuk') {
        current.saldo += c.jumlah
      } else {
        current.saldo -= c.jumlah
      }
      map.set(c.karyawanId, current)
    })
    
    // Filter only those with non-zero balance
    return Array.from(map.entries())
      .filter(([_, data]) => data.saldo !== 0)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.saldo - a.saldo)
  }, [cashRecords])

  const resetForm = () => {
    setKaryawanId('')
    setTanggal(new Date())
    setTipe('masuk')
    setJumlah(0)
    setKeterangan('')
  }

  const handleSubmit = async () => {
    if (!karyawanId || !tanggal || jumlah <= 0) {
      setMessage('Karyawan, tanggal, dan jumlah harus diisi!')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      await createCash.mutateAsync({
        karyawanId,
        tanggal,
        tipe,
        jumlah,
        keterangan: keterangan || undefined
      })
      setMessage('Data cash berhasil disimpan!')
      resetForm()
    } catch (error) {
      setMessage('Gagal menyimpan data cash!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleEdit = async () => {
    if (!editingCash) return

    try {
      await updateCash.mutateAsync({
        id: editingCash.id,
        data: {
          karyawanId: editingCash.karyawanId,
          tanggal: editingCash.tanggal,
          tipe: editingCash.tipe,
          jumlah: editingCash.jumlah,
          keterangan: editingCash.keterangan
        }
      })
      setMessage('Data cash berhasil diupdate!')
      setShowEditDialog(false)
      setEditingCash(null)
    } catch (error) {
      setMessage('Gagal update data cash!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteCash.mutateAsync(deleteId)
      setMessage('Data cash berhasil dihapus!')
      setShowDeleteDialog(false)
      setDeleteId(null)
    } catch (error) {
      setMessage('Gagal menghapus data cash!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  // Filter records
  const filteredRecords = cashRecords.filter(c => {
    if (activeTab !== 'all' && c.tipe !== activeTab) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return c.karyawan.nama.toLowerCase().includes(query) || 
             (c.keterangan && c.keterangan.toLowerCase().includes(query))
    }
    return true
  })

  const masukCount = cashRecords.filter(c => c.tipe === 'masuk').length
  const keluarCount = cashRecords.filter(c => c.tipe === 'keluar').length

  const columns: ColumnDef<Cash>[] = [
    { 
      accessorKey: 'tanggal', 
      header: 'Tanggal', 
      cell: ({ row }) => format(new Date(row.original.tanggal), 'dd MMM yyyy', { locale: idLocale }) 
    },
    { 
      accessorKey: 'karyawan.nama', 
      header: 'Karyawan', 
      cell: ({ row }) => row.original.karyawan.nama 
    },
    { 
      accessorKey: 'tipe', 
      header: 'Tipe', 
      cell: ({ row }) => (
        <Badge className={row.original.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {row.original.tipe === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'}
        </Badge>
      )
    },
    { 
      accessorKey: 'jumlah', 
      header: () => <div className="text-right">Jumlah (Rp)</div>, 
      cell: ({ row }) => (
        <div className={`text-right font-medium ${row.original.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.tipe === 'masuk' ? '+' : '-'} {row.original.jumlah.toLocaleString('id-ID')}
        </div>
      )
    },
    { 
      accessorKey: 'keterangan', 
      header: 'Keterangan', 
      cell: ({ row }) => row.original.keterangan || '-' 
    },
    { 
      id: 'actions', 
      header: 'Aksi', 
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => { setEditingCash(row.original); setShowEditDialog(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setDeleteId(row.original.id); setShowDeleteDialog(true) }} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <TableSkeleton title="Cash Management" showFilters={false} showActions={true} rows={5} columns={5} />
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Cash Management</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Kelola uang masuk dan keluar karyawan</p>
      </div>

      {message && (
        <div className={`border px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-2 text-sm ${
          message.includes('berhasil') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cash</p>
                <p className={`text-lg md:text-2xl font-bold ${totalCash >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Rp {totalCash.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Masuk</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">Rp {totalMasuk.toLocaleString('id-ID')}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Keluar</p>
                <p className="text-lg md:text-2xl font-bold text-red-600">Rp {totalKeluar.toLocaleString('id-ID')}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Karyawan dgn Saldo</p>
                <p className="text-lg md:text-2xl font-bold text-purple-600">{cashPerKaryawan.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Karyawan dengan Saldo */}
      {cashPerKaryawan.length > 0 && (
        <Card className="border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Cash per Karyawan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {cashPerKaryawan.map(k => (
                <Badge key={k.id} variant="outline" className={`px-3 py-1.5 ${k.saldo > 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                  <span className="font-medium">{k.nama}:</span>
                  <span className={`ml-1 ${k.saldo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {k.saldo.toLocaleString('id-ID')}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form */}
      <Card className="border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />Input Cash
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Tambah data uang masuk atau keluar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Karyawan</Label>
              <Select value={karyawanId} onValueChange={setKaryawanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {karyawanList.map((k: Karyawan) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Tanggal</Label>
              <DatePicker date={tanggal} onSelect={(d) => d && setTanggal(d)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Tipe</Label>
              <Select value={tipe} onValueChange={(v) => setTipe(v as 'masuk' | 'keluar')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masuk">Uang Masuk</SelectItem>
                  <SelectItem value="keluar">Uang Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Jumlah (Rp)</Label>
              <CurrencyInput value={jumlah} onChange={setJumlah} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Keterangan</Label>
              <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={createCash.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createCash.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Riwayat Cash</CardTitle>
          <CardDescription className="text-xs md:text-sm">Data transaksi uang masuk dan keluar</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="all">Semua ({cashRecords.length})</TabsTrigger>
                <TabsTrigger value="masuk">Masuk ({masukCount})</TabsTrigger>
                <TabsTrigger value="keluar">Keluar ({keluarCount})</TabsTrigger>
              </TabsList>
              <Input 
                placeholder="Cari karyawan atau keterangan..." 
                className="w-full sm:w-[250px] h-9" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <TabsContent value={activeTab}>
              <DataTable columns={columns} data={filteredRecords} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Cash</DialogTitle>
          </DialogHeader>
          {editingCash && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Karyawan</Label>
                <Select value={editingCash.karyawanId} onValueChange={(v) => setEditingCash({...editingCash, karyawanId: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {karyawanList.map((k: Karyawan) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <DatePicker 
                  date={new Date(editingCash.tanggal)} 
                  onSelect={(d) => d && setEditingCash({...editingCash, tanggal: d})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={editingCash.tipe} onValueChange={(v) => setEditingCash({...editingCash, tipe: v as 'masuk' | 'keluar'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masuk">Uang Masuk</SelectItem>
                    <SelectItem value="keluar">Uang Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <CurrencyInput value={editingCash.jumlah} onChange={(v) => setEditingCash({...editingCash, jumlah: v})} />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Textarea 
                  value={editingCash.keterangan || ''} 
                  onChange={(e) => setEditingCash({...editingCash, keterangan: e.target.value})} 
                  placeholder="Opsional"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                <Button onClick={handleEdit} disabled={updateCash.isPending}>
                  {updateCash.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Cash?</AlertDialogTitle>
            <AlertDialogDescription>Data akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {deleteCash.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
