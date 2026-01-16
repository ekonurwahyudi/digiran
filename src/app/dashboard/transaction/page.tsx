'use client'
import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wallet, TrendingUp, TrendingDown, CheckCircle, Pencil, Trash2, AlertTriangle, Eye } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'

interface GlAccount { id: string; code: string; description: string }
interface Regional { id: string; code: string; name: string }
interface Vendor { id: string; name: string; alamat?: string; pic?: string; phone?: string; email?: string }
interface RemainingInfo { allocated: number; used: number; remaining: number }

interface Transaction {
  id: string; glAccountId: string; glAccount: GlAccount; quarter: number; regionalCode: string
  kegiatan: string; regionalPengguna: string; year: number
  tanggalKwitansi?: string; nilaiKwitansi: number; jenisPajak?: string
  nilaiTanpaPPN: number; nilaiPPN: number; keterangan?: string; jenisPengadaan?: string
  vendorId?: string; vendor?: Vendor; tanggalEntry: string; noTiketMydx?: string
  tglSerahFinance?: string; picFinance?: string; noHpFinance?: string
  tglTransferVendor?: string; nilaiTransfer?: number
  taskPengajuan: boolean; taskTransferVendor: boolean; taskTerimaBerkas: boolean
  taskUploadMydx: boolean; taskSerahFinance: boolean; taskVendorDibayar: boolean; status: string
}

const JENIS_PAJAK = [
  { value: 'TanpaPPN', label: 'Tanpa PPN' }, { value: 'PPN11', label: 'PPN 11%' },
  { value: 'PPNJasa2', label: 'PPN Jasa 2%' }, { value: 'PPNInklaring1.1', label: 'PPN Inklaring 1.1%' },
]
const JENIS_PENGADAAN = [
  { value: 'PadiUMKM', label: 'PadiUMKM' }, { value: 'InpresFund', label: 'Inpres Fund' },
  { value: 'Nopes', label: 'Nopes' }, { value: 'Lainnya', label: 'Lainnya' },
]

function calculatePPN(nilaiKwitansi: number, jenisPajak: string) {
  let nilaiTanpaPPN = nilaiKwitansi, nilaiPPN = 0
  if (jenisPajak === 'PPN11') { nilaiTanpaPPN = nilaiKwitansi / 1.11; nilaiPPN = nilaiKwitansi - nilaiTanpaPPN }
  else if (jenisPajak === 'PPNJasa2') { nilaiPPN = nilaiKwitansi * 0.02; nilaiTanpaPPN = nilaiKwitansi - nilaiPPN }
  else if (jenisPajak === 'PPNInklaring1.1') { nilaiPPN = nilaiKwitansi * 0.011; nilaiTanpaPPN = nilaiKwitansi - nilaiPPN }
  return { nilaiTanpaPPN, nilaiPPN }
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={status === 'Close' ? 'bg-green-500' : status === 'Proses' ? 'bg-yellow-500 text-black' : 'bg-gray-300 text-black'}>{status}</Badge>
}

export default function TransactionPage() {
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([])
  const [regionals, setRegionals] = useState<Regional[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [remaining, setRemaining] = useState<RemainingInfo | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Form states
  const [selectedGl, setSelectedGl] = useState('')
  const [quarter, setQuarter] = useState('1')
  const [regional, setRegional] = useState('')
  const [kegiatan, setKegiatan] = useState('')
  const [regionalPengguna, setRegionalPengguna] = useState('')
  const [tanggalKwitansi, setTanggalKwitansi] = useState<Date | undefined>()
  const [nilaiKwitansi, setNilaiKwitansi] = useState(0)

  // Dialog states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Edit form states
  const [editGl, setEditGl] = useState('')
  const [editQuarter, setEditQuarter] = useState('1')
  const [editRegional, setEditRegional] = useState('')
  const [editKegiatan, setEditKegiatan] = useState('')
  const [editRegionalPengguna, setEditRegionalPengguna] = useState('')
  const [editTanggalKwitansi, setEditTanggalKwitansi] = useState<Date | undefined>()
  const [editNilaiKwitansi, setEditNilaiKwitansi] = useState(0)
  const [editJenisPajak, setEditJenisPajak] = useState('TanpaPPN')
  const [editKeterangan, setEditKeterangan] = useState('')
  const [editJenisPengadaan, setEditJenisPengadaan] = useState('')
  const [editVendorId, setEditVendorId] = useState('')
  const [editNoTiketMydx, setEditNoTiketMydx] = useState('')
  const [editTglSerahFinance, setEditTglSerahFinance] = useState<Date | undefined>()
  const [editPicFinance, setEditPicFinance] = useState('')
  const [editNoHpFinance, setEditNoHpFinance] = useState('')
  const [editTglTransferVendor, setEditTglTransferVendor] = useState<Date | undefined>()
  const [editNilaiTransfer, setEditNilaiTransfer] = useState<number | undefined>()
  const [editTaskTransferVendor, setEditTaskTransferVendor] = useState(false)
  const [editTaskTerimaBerkas, setEditTaskTerimaBerkas] = useState(false)

  useEffect(() => {
    fetch('/api/gl-account').then(r => r.json()).then(setGlAccounts)
    fetch('/api/regional').then(r => r.json()).then(data => { setRegionals(data); if (data.length > 0) setRegional(data[0].code) })
    fetch('/api/vendor').then(r => r.json()).then(setVendors)
  }, [])

  useEffect(() => { loadTransactions() }, [year])
  const loadTransactions = () => { fetch(`/api/transaction?year=${year}`).then(r => r.json()).then(setTransactions) }

  useEffect(() => {
    if (selectedGl && regional) {
      fetch(`/api/transaction/remaining?glAccountId=${selectedGl}&quarter=${quarter}&regionalCode=${regional}&year=${year}`)
        .then(r => { if (!r.ok) return { allocated: 0, used: 0, remaining: 0 }; return r.json() })
        .then(setRemaining).catch(() => setRemaining({ allocated: 0, used: 0, remaining: 0 }))
    }
  }, [selectedGl, quarter, regional, year])

  // Status counts
  const openCount = transactions.filter(t => t.status === 'Open').length
  const prosesCount = transactions.filter(t => t.status === 'Proses').length
  const closeCount = transactions.filter(t => t.status === 'Close').length

  // Filtered transactions by tab
  const filteredTransactions = activeTab === 'all' ? transactions : transactions.filter(t => t.status === activeTab)

  const editPpnCalc = calculatePPN(editNilaiKwitansi, editJenisPajak)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remaining || remaining.remaining <= 0) return
    await fetch('/api/transaction', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ glAccountId: selectedGl, quarter: parseInt(quarter), regionalCode: regional, kegiatan, regionalPengguna, year, tanggalKwitansi: tanggalKwitansi?.toISOString(), nilaiKwitansi }),
    })
    setMessage('Transaksi berhasil disimpan!')
    setKegiatan(''); setRegionalPengguna(''); setTanggalKwitansi(undefined); setNilaiKwitansi(0)
    fetch(`/api/transaction/remaining?glAccountId=${selectedGl}&quarter=${quarter}&regionalCode=${regional}&year=${year}`).then(r => r.json()).then(setRemaining).catch(() => {})
    loadTransactions(); setTimeout(() => setMessage(''), 3000)
  }

  const openViewDialog = (t: Transaction) => { setViewingTransaction(t); setShowViewDialog(true) }

  const openEditDialog = (t: Transaction) => {
    setEditingTransaction(t)
    setEditGl(t.glAccountId); setEditQuarter(t.quarter.toString()); setEditRegional(t.regionalCode)
    setEditKegiatan(t.kegiatan); setEditRegionalPengguna(t.regionalPengguna)
    setEditTanggalKwitansi(t.tanggalKwitansi ? new Date(t.tanggalKwitansi) : undefined)
    setEditNilaiKwitansi(t.nilaiKwitansi); setEditJenisPajak(t.jenisPajak || 'TanpaPPN')
    setEditKeterangan(t.keterangan || ''); setEditJenisPengadaan(t.jenisPengadaan || '')
    setEditVendorId(t.vendorId || ''); setEditNoTiketMydx(t.noTiketMydx || '')
    setEditTglSerahFinance(t.tglSerahFinance ? new Date(t.tglSerahFinance) : undefined)
    setEditPicFinance(t.picFinance || ''); setEditNoHpFinance(t.noHpFinance || '')
    setEditTglTransferVendor(t.tglTransferVendor ? new Date(t.tglTransferVendor) : undefined)
    setEditNilaiTransfer(t.nilaiTransfer); setEditTaskTransferVendor(t.taskTransferVendor); setEditTaskTerimaBerkas(t.taskTerimaBerkas)
    setShowEditDialog(true)
  }

  const handleEdit = async () => {
    if (!editingTransaction) return
    await fetch(`/api/transaction/${editingTransaction.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        glAccountId: editGl, quarter: parseInt(editQuarter), regionalCode: editRegional, kegiatan: editKegiatan, regionalPengguna: editRegionalPengguna,
        tanggalKwitansi: editTanggalKwitansi?.toISOString(), nilaiKwitansi: editNilaiKwitansi, jenisPajak: editJenisPajak, keterangan: editKeterangan,
        jenisPengadaan: editJenisPengadaan, vendorId: editVendorId || null, noTiketMydx: editNoTiketMydx, tglSerahFinance: editTglSerahFinance?.toISOString(),
        picFinance: editPicFinance, noHpFinance: editNoHpFinance, tglTransferVendor: editTglTransferVendor?.toISOString(),
        nilaiTransfer: editNilaiTransfer, taskTransferVendor: editTaskTransferVendor, taskTerimaBerkas: editTaskTerimaBerkas,
      }),
    })
    setShowEditDialog(false); setEditingTransaction(null); loadTransactions()
    setMessage('Transaksi berhasil diupdate!'); setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/transaction/${deleteId}`, { method: 'DELETE' })
    setShowDeleteDialog(false); setDeleteId(null); loadTransactions()
    if (selectedGl && regional) { fetch(`/api/transaction/remaining?glAccountId=${selectedGl}&quarter=${quarter}&regionalCode=${regional}&year=${year}`).then(r => r.json()).then(setRemaining).catch(() => {}) }
    setMessage('Transaksi berhasil dihapus!'); setTimeout(() => setMessage(''), 3000)
  }

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: 'tanggalKwitansi', header: 'Tgl Kwitansi', cell: ({ row }) => row.original.tanggalKwitansi ? format(new Date(row.original.tanggalKwitansi), 'dd MMM yy', { locale: idLocale }) : '-' },
    { accessorKey: 'glAccount.code', header: 'GL', cell: ({ row }) => row.original.glAccount.code },
    { accessorKey: 'quarter', header: 'Q', cell: ({ row }) => `Q${row.getValue('quarter')}` },
    { accessorKey: 'regionalCode', header: 'Regional', cell: ({ row }) => regionals.find(r => r.code === row.original.regionalCode)?.name || row.original.regionalCode },
    { accessorKey: 'kegiatan', header: 'Kegiatan' },
    { accessorKey: 'nilaiKwitansi', header: () => <div className="text-right">Nilai (Rp)</div>, cell: ({ row }) => <div className="text-right">{row.original.nilaiKwitansi.toLocaleString('id-ID')}</div> },
    { accessorKey: 'jenisPengadaan', header: 'Pengadaan', cell: ({ row }) => JENIS_PENGADAAN.find(p => p.value === row.original.jenisPengadaan)?.label || '-' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => openViewDialog(row.original)}><Eye className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => { setDeleteId(row.original.id); setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ]

  const isSubmitDisabled = !selectedGl || !regional || (remaining !== null && remaining.remaining <= 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Input Pencatatan Anggaran</h1><p className="text-muted-foreground text-sm">Catat penggunaan anggaran per kegiatan</p></div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Tahun:</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027, 2028].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2"><CheckCircle className="h-4 w-4" />{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border">
            <CardHeader><CardTitle>Form Pencatatan</CardTitle><CardDescription>Isi detail kegiatan dan nilai anggaran</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>GL Account</Label>
                    <Select value={selectedGl} onValueChange={setSelectedGl}>
                      <SelectTrigger><SelectValue placeholder="Pilih GL Account" /></SelectTrigger>
                      <SelectContent>{glAccounts.map(gl => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kuartal</Label>
                    <Select value={quarter} onValueChange={setQuarter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Regional</Label>
                    <Select value={regional} onValueChange={setRegional}>
                      <SelectTrigger><SelectValue placeholder="Pilih Regional" /></SelectTrigger>
                      <SelectContent>{regionals.map(r => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Kegiatan</Label><Input value={kegiatan} onChange={e => setKegiatan(e.target.value)} placeholder="Deskripsi kegiatan" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Regional Pengguna</Label><Input value={regionalPengguna} onChange={e => setRegionalPengguna(e.target.value)} placeholder="Regional pengguna" required /></div>
                  <div className="space-y-2"><Label>Tanggal Kwitansi</Label><DatePicker date={tanggalKwitansi} onSelect={setTanggalKwitansi} placeholder="Pilih tanggal" /></div>
                  <div className="space-y-2"><Label>Nilai Kwitansi (Rp)</Label><CurrencyInput value={nilaiKwitansi} onChange={setNilaiKwitansi} /></div>
                </div>
                <Button type="submit" disabled={isSubmitDisabled}>Simpan</Button>
                {remaining !== null && remaining.remaining <= 0 && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Sisa anggaran 0</p>}
              </form>
            </CardContent>
          </Card>
        </div>
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Info Sisa Anggaran</CardTitle>
            <CardDescription>{regionals.find(r => r.code === regional)?.name || regional} - Q{quarter}</CardDescription>
          </CardHeader>
          <CardContent>
            {remaining ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Alokasi (Rp)</span><span className="text-lg font-semibold text-blue-600 flex items-center gap-1"><TrendingUp className="h-4 w-4" />{remaining.allocated.toLocaleString('id-ID')}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Terpakai (Rp)</span><span className="text-lg font-semibold text-red-600 flex items-center gap-1"><TrendingDown className="h-4 w-4" />{remaining.used.toLocaleString('id-ID')}</span></div>
                <div className="border-t pt-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Sisa (Rp)</span><span className={`text-xl font-bold ${remaining.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{remaining.remaining.toLocaleString('id-ID')}</span></div></div>
              </div>
            ) : <p className="text-muted-foreground text-sm">Pilih GL Account untuk melihat sisa anggaran</p>}
          </CardContent>
        </Card>
      </div>

      {/* Transaction List with Tabs */}
      <Card className="border">
        <CardHeader><CardTitle>Daftar Transaksi</CardTitle><CardDescription>Riwayat pencatatan anggaran tahun {year}</CardDescription></CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Semua ({transactions.length})</TabsTrigger>
              <TabsTrigger value="Open">Open ({openCount})</TabsTrigger>
              <TabsTrigger value="Proses">Proses ({prosesCount})</TabsTrigger>
              <TabsTrigger value="Close">Selesai ({closeCount})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <DataTable columns={columns} data={filteredTransactions} searchKey="kegiatan" searchPlaceholder="Cari kegiatan..." />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detail Transaksi</DialogTitle></DialogHeader>
          {viewingTransaction && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div><p className="text-sm text-muted-foreground">GL Account</p><p className="font-medium">{viewingTransaction.glAccount.code} - {viewingTransaction.glAccount.description}</p></div>
                <StatusBadge status={viewingTransaction.status} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-sm text-muted-foreground">Kuartal</p><p className="font-medium">Q{viewingTransaction.quarter}</p></div>
                <div><p className="text-sm text-muted-foreground">Regional</p><p className="font-medium">{regionals.find(r => r.code === viewingTransaction.regionalCode)?.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Regional Pengguna</p><p className="font-medium">{viewingTransaction.regionalPengguna}</p></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Kegiatan</p><p className="font-medium">{viewingTransaction.kegiatan}</p></div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-sm text-muted-foreground">Tanggal Kwitansi</p><p className="font-medium">{viewingTransaction.tanggalKwitansi ? format(new Date(viewingTransaction.tanggalKwitansi), 'dd MMMM yyyy', { locale: idLocale }) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Nilai Kwitansi</p><p className="font-medium text-blue-600">Rp {viewingTransaction.nilaiKwitansi.toLocaleString('id-ID')}</p></div>
                <div><p className="text-sm text-muted-foreground">Jenis Pajak</p><p className="font-medium">{JENIS_PAJAK.find(p => p.value === viewingTransaction.jenisPajak)?.label || '-'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Nilai Tanpa PPN</p><p className="font-medium">Rp {viewingTransaction.nilaiTanpaPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p></div>
                <div><p className="text-sm text-muted-foreground">Nilai PPN</p><p className="font-medium">Rp {viewingTransaction.nilaiPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Jenis Pengadaan</p><p className="font-medium">{JENIS_PENGADAAN.find(p => p.value === viewingTransaction.jenisPengadaan)?.label || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Vendor</p><p className="font-medium">{viewingTransaction.vendor?.name || '-'}</p></div>
              </div>
              {viewingTransaction.keterangan && <div><p className="text-sm text-muted-foreground">Keterangan</p><p className="font-medium">{viewingTransaction.keterangan}</p></div>}
              <div className="border-t pt-4">
                <p className="font-medium mb-3">Informasi Finance</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">No. Tiket Mydx</p><p className="font-medium">{viewingTransaction.noTiketMydx || '-'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Tgl Serah Finance</p><p className="font-medium">{viewingTransaction.tglSerahFinance ? format(new Date(viewingTransaction.tglSerahFinance), 'dd MMM yyyy', { locale: idLocale }) : '-'}</p></div>
                  <div><p className="text-sm text-muted-foreground">PIC Finance</p><p className="font-medium">{viewingTransaction.picFinance || '-'}</p></div>
                  <div><p className="text-sm text-muted-foreground">No HP Finance</p><p className="font-medium">{viewingTransaction.noHpFinance || '-'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Tgl Transfer Vendor</p><p className="font-medium">{viewingTransaction.tglTransferVendor ? format(new Date(viewingTransaction.tglTransferVendor), 'dd MMM yyyy', { locale: idLocale }) : '-'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Nilai Transfer</p><p className="font-medium">{viewingTransaction.nilaiTransfer ? `Rp ${viewingTransaction.nilaiTransfer.toLocaleString('id-ID')}` : '-'}</p></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="font-medium mb-3">Task Checklist</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskPengajuan} disabled /><span>Pengajuan Pengadaan</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskTransferVendor} disabled /><span>Transfer dari Vendor</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskTerimaBerkas} disabled /><span>Terima berkas pengadaan</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskUploadMydx} disabled /><span>Upload ke Mydx</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskSerahFinance} disabled /><span>Serahkan berkas ke Finance</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={viewingTransaction.taskVendorDibayar} disabled /><span>Vendor sudah dibayar</span></div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>Tutup</Button>
                <Button onClick={() => { setShowViewDialog(false); openEditDialog(viewingTransaction) }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>GL Account</Label>
                <Select value={editGl} onValueChange={setEditGl}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{glAccounts.map(gl => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Kuartal</Label>
                <Select value={editQuarter} onValueChange={setEditQuarter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Regional</Label>
                <Select value={editRegional} onValueChange={setEditRegional}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{regionals.map(r => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Kegiatan</Label><Input value={editKegiatan} onChange={e => setEditKegiatan(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Regional Pengguna</Label><Input value={editRegionalPengguna} onChange={e => setEditRegionalPengguna(e.target.value)} /></div>
              <div className="space-y-2"><Label>Tanggal Kwitansi</Label><DatePicker date={editTanggalKwitansi} onSelect={setEditTanggalKwitansi} /></div>
              <div className="space-y-2"><Label>Nilai Kwitansi (Rp)</Label><CurrencyInput value={editNilaiKwitansi} onChange={setEditNilaiKwitansi} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Jenis Pajak</Label>
                <Select value={editJenisPajak} onValueChange={setEditJenisPajak}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JENIS_PAJAK.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Nilai Tanpa PPN</Label><Input value={`Rp ${editPpnCalc.nilaiTanpaPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} disabled className="bg-gray-50" /></div>
              <div className="space-y-2"><Label>Nilai PPN</Label><Input value={`Rp ${editPpnCalc.nilaiPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} disabled className="bg-gray-50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Jenis Pengadaan</Label>
                <Select value={editJenisPengadaan} onValueChange={setEditJenisPengadaan}><SelectTrigger><SelectValue placeholder="Pilih jenis pengadaan" /></SelectTrigger><SelectContent>{JENIS_PENGADAAN.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Vendor</Label>
                <Select value={editVendorId} onValueChange={setEditVendorId}><SelectTrigger><SelectValue placeholder="Pilih vendor" /></SelectTrigger><SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Keterangan</Label><Textarea value={editKeterangan} onChange={e => setEditKeterangan(e.target.value)} /></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>No. Tiket Mydx</Label><Input value={editNoTiketMydx} onChange={e => setEditNoTiketMydx(e.target.value)} /></div>
              <div className="space-y-2"><Label>Tgl Serah Finance</Label><DatePicker date={editTglSerahFinance} onSelect={setEditTglSerahFinance} /></div>
              <div className="space-y-2"><Label>PIC Finance</Label><Input value={editPicFinance} onChange={e => setEditPicFinance(e.target.value)} /></div>
              <div className="space-y-2"><Label>No HP Finance</Label><Input value={editNoHpFinance} onChange={e => setEditNoHpFinance(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tgl Transfer ke Vendor</Label><DatePicker date={editTglTransferVendor} onSelect={setEditTglTransferVendor} /></div>
              <div className="space-y-2"><Label>Nilai Transfer (Rp)</Label><CurrencyInput value={editNilaiTransfer || 0} onChange={v => setEditNilaiTransfer(v || undefined)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Task Checklist</Label>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2"><Checkbox checked disabled /><span>Pengajuan Pengadaan</span></div>
                <div className="flex items-center gap-2"><Checkbox id="editTaskTransferVendor" checked={editTaskTransferVendor} onCheckedChange={c => setEditTaskTransferVendor(!!c)} /><label htmlFor="editTaskTransferVendor">Transfer dari Vendor</label></div>
                <div className="flex items-center gap-2"><Checkbox id="editTaskTerimaBerkas" checked={editTaskTerimaBerkas} onCheckedChange={c => setEditTaskTerimaBerkas(!!c)} /><label htmlFor="editTaskTerimaBerkas">Terima berkas pengadaan</label></div>
                <div className="flex items-center gap-2"><Checkbox checked={!!editNoTiketMydx} disabled /><span>Upload ke Mydx</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={!!editTglSerahFinance} disabled /><span>Serahkan berkas ke Finance</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={!!editTglTransferVendor} disabled /><span>Vendor sudah dibayar</span></div>
              </div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button><Button onClick={handleEdit}>Simpan</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
