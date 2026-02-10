'use client'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Wallet, TrendingUp, TrendingDown, CheckCircle, Pencil, Trash2, AlertTriangle, Eye, Check, ChevronsUpDown, BookOpen, Hourglass, Filter, FileSpreadsheet, FileText, File, Image, Presentation } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { cn } from '@/lib/utils'
import { TableSkeleton } from '@/components/loading'
import { useTransactions, useRemainingBudget, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/lib/hooks/useTransaction'
import { useGlAccounts, useRegionals, useVendors, usePicAnggaran } from '@/lib/hooks/useMaster'
import { useBudgets } from '@/lib/hooks/useBudget'
import api from '@/lib/axios'

interface GlAccount { id: string; code: string; description: string }
interface Regional { id: string; code: string; name: string }
interface Vendor { id: string; name: string; alamat?: string; pic?: string; phone?: string; email?: string }
interface RemainingInfo { allocated: number; used: number; remaining: number }
interface Budget { 
  id: string; glAccountId: string; glAccount: GlAccount; year: number
  rkap: number; releasePercent: number; totalAmount: number
  q1Amount: number; q2Amount: number; q3Amount: number; q4Amount: number
}

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
  { value: 'TanpaPPN', label: 'Non-PPN' }, { value: 'PPN11', label: 'PPN 11%' },
  { value: 'PPNJasa2', label: 'PPH Jasa 2%' }, { value: 'PPNInklaring1.1', label: 'Inklaring 1.1%' },
]
const JENIS_PENGADAAN = [
  { value: 'PadiUMKM', label: 'PadiUMKM' }, { value: 'InpresFund', label: 'Impress Fund' },
  { value: 'Nopes', label: 'Nopes' }, { value: 'SPPD', label: 'SPPD' }, { value: 'Lainnya', label: 'Lainnya' },
]

function calculatePPN(nilaiSebelumPPN: number, jenisPajak: string) {
  let nilaiPertanggungan = nilaiSebelumPPN, nilaiPPN = 0
  if (jenisPajak === 'PPN11') { 
    nilaiPPN = nilaiSebelumPPN * 0.11
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN 
  }
  else if (jenisPajak === 'PPNJasa2') { 
    nilaiPPN = nilaiSebelumPPN * 0.02
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN 
  }
  else if (jenisPajak === 'PPNInklaring1.1') { 
    nilaiPPN = nilaiSebelumPPN * 0.011
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN 
  }
  return { nilaiPertanggungan, nilaiPPN, nilaiSebelumPPN }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(
      "gap-1.5",
      status === 'Close' ? 'bg-green-100 text-green-600' : 
      status === 'Proses' ? 'bg-yellow-100 text-yellow-600' : 
      'bg-blue-100 text-blue-600'
    )}>
      {status === 'Close' && <CheckCircle className="h-3 w-3" />}
      {status === 'Proses' && <Hourglass className="h-3 w-3" />}
      {status === 'Open' && <BookOpen className="h-3 w-3" />}
      {status}
    </Badge>
  )
}

export default function TransactionPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Filter states
  const [filterGl, setFilterGl] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [filterRegional, setFilterRegional] = useState('')
  const [filterPengadaan, setFilterPengadaan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [selectedGl, setSelectedGl] = useState('')
  const [quarter, setQuarter] = useState('1')
  const [regional, setRegional] = useState('')
  const [kegiatan, setKegiatan] = useState('')
  const [regionalPengguna, setRegionalPengguna] = useState('')
  const [tanggalKwitansi, setTanggalKwitansi] = useState<Date | undefined>()
  const [nilaiKwitansi, setNilaiKwitansi] = useState(0)
  const [jenisPengadaan, setJenisPengadaan] = useState('')

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
  
  // File upload states
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // TanStack Query hooks
  const { data: glAccounts = [], isLoading: glLoading } = useGlAccounts()
  const { data: regionals = [], isLoading: regionalLoading } = useRegionals()
  const { data: vendors = [] } = useVendors(false)
  const { data: transactions = [], isLoading: transactionLoading } = useTransactions(year)
  const { data: picAnggaranList = [] } = usePicAnggaran(year)
  const { data: remaining } = useRemainingBudget(selectedGl, parseInt(quarter), regional, year)
  const { data: budgets = [] } = useBudgets(year)
  
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const picAnggaran = picAnggaranList.length > 0 ? picAnggaranList[0] : null
  const loading = glLoading || regionalLoading || transactionLoading

  // Set default regional when loaded
  useEffect(() => {
    if (regionals.length > 0 && !regional) {
      setRegional(regionals[0].code)
    }
  }, [regionals, regional])

  // Status counts
  const openCount = transactions.filter((t: Transaction) => t.status === 'Open').length
  const prosesCount = transactions.filter((t: Transaction) => t.status === 'Proses').length
  const closeCount = transactions.filter((t: Transaction) => t.status === 'Close').length

  // Filtered transactions by tab and filters
  const filteredTransactions = transactions.filter((t: Transaction) => {
    if (activeTab !== 'all' && t.status !== activeTab) return false
    if (filterGl && t.glAccountId !== filterGl) return false
    if (filterQuarter && t.quarter !== parseInt(filterQuarter)) return false
    if (filterRegional && t.regionalCode !== filterRegional) return false
    if (filterPengadaan && t.jenisPengadaan !== filterPengadaan) return false
    if (searchQuery && !t.kegiatan.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const editPpnCalc = calculatePPN(editNilaiKwitansi, editJenisPajak)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remaining || remaining.remaining <= 0) return
    
    try {
      await createTransaction.mutateAsync({
        glAccountId: selectedGl, quarter: parseInt(quarter), regionalCode: regional, 
        kegiatan, regionalPengguna, year, 
        tanggalKwitansi: tanggalKwitansi?.toISOString(), 
        nilaiKwitansi, jenisPengadaan
      })
      setMessage('Transaksi berhasil disimpan!')
      setKegiatan(''); setRegionalPengguna(''); setTanggalKwitansi(undefined); setNilaiKwitansi(0); setJenisPengadaan('')
    } catch (error) {
      setMessage('Terjadi kesalahan!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const openViewDialog = (t: Transaction) => { 
    setViewingTransaction(t); 
    loadTransactionFiles(t.id);
    setShowViewDialog(true) 
  }

  const openEditDialog = (t: Transaction) => {
    setEditingTransaction(t)
    setEditGl(t.glAccountId); setEditQuarter(t.quarter.toString()); setEditRegional(t.regionalCode)
    setEditKegiatan(t.kegiatan); setEditRegionalPengguna(t.regionalPengguna)
    setEditTanggalKwitansi(t.tanggalKwitansi ? new Date(t.tanggalKwitansi) : undefined)
    setEditNilaiKwitansi(t.nilaiTanpaPPN); setEditJenisPajak(t.jenisPajak || 'TanpaPPN')
    setEditKeterangan(t.keterangan || ''); setEditJenisPengadaan(t.jenisPengadaan || '')
    setEditVendorId(t.vendorId || ''); setEditNoTiketMydx(t.noTiketMydx || '')
    setEditTglSerahFinance(t.tglSerahFinance ? new Date(t.tglSerahFinance) : undefined)
    setEditPicFinance(t.picFinance || ''); setEditNoHpFinance(t.noHpFinance || '')
    setEditTglTransferVendor(t.tglTransferVendor ? new Date(t.tglTransferVendor) : undefined)
    setEditNilaiTransfer(t.nilaiTransfer); setEditTaskTransferVendor(t.taskTransferVendor); setEditTaskTerimaBerkas(t.taskTerimaBerkas)
    loadTransactionFiles(t.id)
    setShowEditDialog(true)
  }

  const loadTransactionFiles = async (transactionId: string) => {
    try {
      const filesData = await api.get(`/transaction/${transactionId}/files`)
      setFiles(Array.isArray(filesData) ? filesData : [])
    } catch (error) {
      console.error('Error loading files:', error)
      setFiles([])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || !editingTransaction) return

    setUploading(true)
    
    try {
      for (const file of Array.from(selectedFiles)) {
        if (file.size > 10 * 1024 * 1024) {
          setMessage(`File ${file.name} terlalu besar (max 10MB)`)
          setTimeout(() => setMessage(''), 3000)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const newFile = await api.post(`/transaction/${editingTransaction.id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setFiles(prev => [newFile, ...prev])
      }
      
      if (selectedFiles.length > 0) {
        setMessage('File berhasil diupload!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      setMessage('Terjadi kesalahan saat upload file')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!editingTransaction) return

    try {
      await api.delete(`/transaction/${editingTransaction.id}/files?fileId=${fileId}`)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setMessage('File berhasil dihapus!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting file:', error)
      setMessage('Terjadi kesalahan saat hapus file')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    else if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
    else return bytes + ' B'
  }

  const handleFilePreview = (file: any) => {
    if (file.mimeType.includes('image')) setPreviewImage(file.filePath)
    else window.open(file.filePath, '_blank')
  }

  const getFileIcon = (file: any) => {
    const mimeType = file.mimeType.toLowerCase()
    const fileName = file.originalName.toLowerCase()
    
    if (mimeType.includes('image')) {
      return (
        <div className="w-10 h-10 rounded overflow-hidden border">
          <img src={file.filePath} alt={file.originalName} className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; const next = e.currentTarget.nextElementSibling as HTMLElement; if (next) next.style.display = 'flex' }} />
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center" style={{display: 'none'}}><Image className="h-5 w-5 text-blue-600" /></div>
        </div>
      )
    }
    if (mimeType.includes('pdf')) return <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center"><FileText className="h-5 w-5 text-red-600" /></div>
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
      return <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center"><FileSpreadsheet className="h-5 w-5 text-green-600" /></div>
    if (mimeType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
      return <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center"><Presentation className="h-5 w-5 text-orange-600" /></div>
    if (mimeType.includes('word') || mimeType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
      return <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
    return <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><File className="h-5 w-5 text-gray-600" /></div>
  }

  const handleEdit = async () => {
    if (!editingTransaction) return
    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        data: {
          glAccountId: editGl, quarter: parseInt(editQuarter), regionalCode: editRegional, kegiatan: editKegiatan, regionalPengguna: editRegionalPengguna,
          tanggalKwitansi: editTanggalKwitansi?.toISOString(), nilaiKwitansi: editNilaiKwitansi, jenisPajak: editJenisPajak, keterangan: editKeterangan,
          jenisPengadaan: editJenisPengadaan, vendorId: editVendorId || null, noTiketMydx: editNoTiketMydx, tglSerahFinance: editTglSerahFinance?.toISOString(),
          picFinance: editPicFinance, noHpFinance: editNoHpFinance, tglTransferVendor: editTglTransferVendor?.toISOString(),
          nilaiTransfer: editNilaiTransfer, taskTransferVendor: editTaskTransferVendor, taskTerimaBerkas: editTaskTerimaBerkas,
        }
      })
      setShowEditDialog(false); setEditingTransaction(null)
      setMessage('Transaksi berhasil diupdate!')
    } catch (error) {
      setMessage('Terjadi kesalahan!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteTransaction.mutateAsync(deleteId)
      setShowDeleteDialog(false); setDeleteId(null)
      setMessage('Transaksi berhasil dihapus!')
    } catch (error) {
      setMessage('Terjadi kesalahan!')
    }
    setTimeout(() => setMessage(''), 3000)
  }


  const handleExport = async () => {
    const MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
    
    const transactionsWithDate = filteredTransactions.filter((t: Transaction) => t.tglSerahFinance)
    const transactionsWithoutDate = filteredTransactions.filter((t: Transaction) => !t.tglSerahFinance)
    
    const groupedByMonth: { [key: number]: Transaction[] } = {}
    transactionsWithDate.forEach((t: Transaction) => {
      const month = new Date(t.tglSerahFinance!).getMonth()
      if (!groupedByMonth[month]) groupedByMonth[month] = []
      groupedByMonth[month].push(t)
    })

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Transaksi')
    
    ws.columns = [
      { width: 5 }, { width: 18 }, { width: 15 }, { width: 60 }, { width: 15 },
      { width: 25 }, { width: 18 }, { width: 12 }, { width: 18 }, { width: 15 }, { width: 10 }
    ]
    
    ws.addRow(['Unit', ':', 'DC, DEFA OPERATION & TECHNICAL SUPPORT TIF'])
    ws.addRow(['Cost Center', ':', 'TF3H4000'])
    ws.addRow(['Periode', ':', year.toString()])
    ws.addRow([])
    
    const headerRow = ws.addRow(['No', 'Tgl Serahkan Berkas ke FC', 'Tanggal Kwitansi', 'Kegiatan', 'Regional', 'Vendor', 'Nilai Kwitansi', 'Jenis Pajak', 'Nilai Tanpa PPN', 'Nilai PPN', 'Status'])
    headerRow.font = { bold: true }
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    })
    
    let rowNum = 1
    
    Object.keys(groupedByMonth).map(Number).sort((a, b) => a - b).forEach(month => {
      ws.addRow([])
      const monthRow = ws.addRow(['', '', '', MONTHS[month]])
      monthRow.getCell(4).font = { bold: true, size: 12 }
      
      groupedByMonth[month].sort((a, b) => new Date(a.tglSerahFinance!).getTime() - new Date(b.tglSerahFinance!).getTime()).forEach(t => {
        const row = ws.addRow([
          rowNum++, format(new Date(t.tglSerahFinance!), 'dd-MM-yy'),
          t.tanggalKwitansi ? format(new Date(t.tanggalKwitansi), 'dd-MM-yyyy') : '-',
          t.kegiatan, regionals.find((r: Regional) => r.code === t.regionalCode)?.name || t.regionalCode,
          t.vendor?.name || '-', t.nilaiKwitansi,
          JENIS_PAJAK.find(p => p.value === t.jenisPajak)?.label || 'Non-PPN',
          Math.round(t.nilaiTanpaPPN), Math.round(t.nilaiPPN), t.status
        ])
        row.eachCell(cell => { cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } })
        row.getCell(7).numFmt = '#,##0'; row.getCell(9).numFmt = '#,##0'; row.getCell(10).numFmt = '#,##0'
      })
    })
    
    if (transactionsWithoutDate.length > 0) {
      ws.addRow([])
      const pendingRow = ws.addRow(['', '', '', 'BELUM SERAH KE FINANCE'])
      pendingRow.getCell(4).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } }
      
      transactionsWithoutDate.forEach((t: Transaction) => {
        const row = ws.addRow([
          rowNum++, '-', t.tanggalKwitansi ? format(new Date(t.tanggalKwitansi), 'dd-MM-yyyy') : '-',
          t.kegiatan, regionals.find((r: Regional) => r.code === t.regionalCode)?.name || t.regionalCode,
          t.vendor?.name || '-', t.nilaiKwitansi,
          JENIS_PAJAK.find(p => p.value === t.jenisPajak)?.label || 'Non-PPN',
          Math.round(t.nilaiTanpaPPN), Math.round(t.nilaiPPN), t.status
        ])
        row.eachCell(cell => { cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } })
        row.getCell(7).numFmt = '#,##0'; row.getCell(9).numFmt = '#,##0'; row.getCell(10).numFmt = '#,##0'
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Transaksi_${year}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
  }

  const handleExportKKA = async () => {
    const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const QUARTER_MONTHS: { [key: number]: number[] } = { 1: [0, 1, 2], 2: [3, 4, 5], 3: [6, 7, 8], 4: [9, 10, 11] }
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const workbook = new ExcelJS.Workbook()
    
    const logoRes = await fetch('/infranexia.png')
    const logoBlob = await logoRes.blob()
    const logoBuffer = await logoBlob.arrayBuffer()
    const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' })
    
    for (let q = 1; q <= 4; q++) {
      const ws = workbook.addWorksheet(`KKA Q${q}`)
      const quarterTransactions = filteredTransactions.filter((t: Transaction) => t.quarter === q)
      const quarterMonths = QUARTER_MONTHS[q]
      
      const glAccountIds = Array.from(new Set(quarterTransactions.map((t: Transaction) => t.glAccountId)))
      budgets.forEach((b: Budget) => {
        const qAmount = q === 1 ? b.q1Amount : q === 2 ? b.q2Amount : q === 3 ? b.q3Amount : b.q4Amount
        if (qAmount > 0 && !glAccountIds.includes(b.glAccountId)) glAccountIds.push(b.glAccountId)
      })
      
      ws.columns = [{ width: 5 }, { width: 12 }, { width: 50 }, { width: 18 }, { width: 18 }, { width: 18 }]
      
      let currentRow = 1
      
      for (const glId of glAccountIds) {
        const glAccount = glAccounts.find((g: GlAccount) => g.id === glId)
        if (!glAccount) continue
        
        const budget = budgets.find((b: Budget) => b.glAccountId === glId)
        const qBudget = budget ? (q === 1 ? budget.q1Amount : q === 2 ? budget.q2Amount : q === 3 ? budget.q3Amount : budget.q4Amount) : 0
        const monthlyBudget = qBudget / 3
        const glTransactions = quarterTransactions.filter((t: Transaction) => t.glAccountId === glId)
        
        ws.addImage(logoId, { tl: { col: 5, row: currentRow - 1 }, ext: { width: 100, height: 35 } })
        currentRow += 3
        
        ws.mergeCells(currentRow, 1, currentRow, 6)
        ws.getCell(currentRow, 1).value = 'KARTU KENDALI ANGGARAN'
        ws.getCell(currentRow, 1).font = { bold: true, size: 11 }
        ws.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getCell(currentRow, 1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        currentRow += 1
        
        ws.mergeCells(currentRow, 1, currentRow, 2)
        ws.getCell(currentRow, 1).value = 'Unit'
        ws.getCell(currentRow, 1).border = { left: { style: 'thin' } }
        ws.getCell(currentRow, 3).value = ':   DC, DEFA OPERATION & TECHNICAL SUPPORT TIF'
        ws.getCell(currentRow, 4).value = 'GL Account'
        ws.mergeCells(currentRow, 5, currentRow, 6)
        ws.getCell(currentRow, 5).value = ':   ' + glAccount.code
        ws.getCell(currentRow, 6).border = { right: { style: 'thin' } }
        currentRow++
        
        ws.mergeCells(currentRow, 1, currentRow, 2)
        ws.getCell(currentRow, 1).value = 'Cost Center'
        ws.getCell(currentRow, 1).border = { left: { style: 'thin' } }
        ws.getCell(currentRow, 3).value = ':   TF3H4000'
        ws.getCell(currentRow, 4).value = 'Deskripsi akun'
        ws.mergeCells(currentRow, 5, currentRow, 6)
        ws.getCell(currentRow, 5).value = ':   ' + glAccount.description
        ws.getCell(currentRow, 6).border = { right: { style: 'thin' } }
        currentRow++
        
        ws.mergeCells(currentRow, 1, currentRow, 2)
        ws.getCell(currentRow, 1).value = 'Periode'
        ws.getCell(currentRow, 1).border = { left: { style: 'thin' } }
        ws.getCell(currentRow, 3).value = `:   ${year} (Q.${q})`
        ws.getCell(currentRow, 6).border = { right: { style: 'thin' } }
        currentRow++
        
        ws.getCell(currentRow, 1).border = { left: { style: 'thin' } }
        ws.getCell(currentRow, 6).border = { right: { style: 'thin' } }
        currentRow++
        
        const headers = ['NO', 'TANGGAL', 'KEGIATAN', 'BUDGET', 'PENGGUNAAN', 'SISA BUDGET']
        headers.forEach((h, i) => {
          const cell = ws.getCell(currentRow, i + 1)
          cell.value = h
          cell.font = { bold: true }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        })
        currentRow++
        
        let rowNum = 1
        let runningBudget = 0
        let totalPenggunaan = 0
        
        interface DataRow { date: Date; kegiatan: string; budget: number; penggunaan: number; isBudget: boolean }
        const dataRows: DataRow[] = []
        
        quarterMonths.forEach(monthIdx => {
          if (year < currentYear || (year === currentYear && monthIdx <= currentMonth)) {
            dataRows.push({
              date: new Date(year, monthIdx, 1),
              kegiatan: `Anggaran ${glAccount.description} Bulan ${MONTHS[monthIdx]}`,
              budget: monthlyBudget, penggunaan: 0, isBudget: true
            })
          }
        })
        
        glTransactions.forEach((t: Transaction) => {
          dataRows.push({
            date: t.tanggalKwitansi ? new Date(t.tanggalKwitansi) : new Date(t.tanggalEntry),
            kegiatan: t.kegiatan, budget: 0, penggunaan: t.nilaiKwitansi, isBudget: false
          })
        })
        
        dataRows.sort((a, b) => a.date.getTime() - b.date.getTime())
        
        dataRows.forEach(d => {
          const row = ws.getRow(currentRow)
          row.getCell(1).value = rowNum++
          row.getCell(1).alignment = { horizontal: 'center' }
          row.getCell(2).value = format(d.date, 'dd-MM-yyyy')
          row.getCell(3).value = d.kegiatan
          
          if (d.isBudget) {
            row.getCell(4).value = d.budget
            row.getCell(4).numFmt = '#,##0'
            runningBudget += d.budget
          } else {
            row.getCell(5).value = d.penggunaan
            row.getCell(5).numFmt = '#,##0'
            totalPenggunaan += d.penggunaan
          }
          
          row.getCell(6).value = runningBudget - totalPenggunaan
          row.getCell(6).numFmt = '#,##0'
          
          for (let c = 1; c <= 6; c++) {
            row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
          }
          currentRow++
        })
        
        const sisaRow = ws.getRow(currentRow)
        for (let c = 1; c <= 6; c++) {
          sisaRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
          sisaRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
        }
        sisaRow.getCell(3).value = 'Sisa anggaran'
        sisaRow.getCell(3).font = { bold: true }
        sisaRow.getCell(3).alignment = { horizontal: 'right' }
        sisaRow.getCell(4).value = runningBudget
        sisaRow.getCell(4).numFmt = '#,##0'
        sisaRow.getCell(4).font = { bold: true }
        sisaRow.getCell(5).value = totalPenggunaan
        sisaRow.getCell(5).numFmt = '#,##0'
        sisaRow.getCell(5).font = { bold: true }
        sisaRow.getCell(6).value = runningBudget - totalPenggunaan
        sisaRow.getCell(6).numFmt = '#,##0'
        sisaRow.getCell(6).font = { bold: true }
        currentRow += 3
        
        ws.getCell(currentRow, 1).value = 'Yang Membuat,'
        ws.mergeCells(currentRow, 4, currentRow, 6)
        ws.getCell(currentRow, 4).value = 'Menyetujui,'
        ws.getCell(currentRow, 4).alignment = { horizontal: 'center' }
        currentRow++
        
        ws.getCell(currentRow, 1).value = 'Pemegang Imprest Fund'
        ws.mergeCells(currentRow, 4, currentRow, 6)
        ws.getCell(currentRow, 4).value = 'Penanggung jawab Anggaran/Atasan Pemegang Imprst Fund'
        ws.getCell(currentRow, 4).alignment = { horizontal: 'center' }
        currentRow += 4
        
        const namaPemegang = picAnggaran?.namaPemegangImprest || 'NIDA'
        const nikPemegang = picAnggaran?.nikPemegangImprest || '700661'
        const namaPenanggung = picAnggaran?.namaPenanggungJawab || 'IRWAN'
        const nikPenanggung = picAnggaran?.nikPenanggungJawab || '720410'
        
        ws.getCell(currentRow, 1).value = namaPemegang
        ws.mergeCells(currentRow, 4, currentRow, 6)
        ws.getCell(currentRow, 4).value = namaPenanggung
        ws.getCell(currentRow, 4).alignment = { horizontal: 'center' }
        currentRow++
        
        ws.getCell(currentRow, 1).value = `NIK: ${nikPemegang}`
        ws.mergeCells(currentRow, 4, currentRow, 6)
        ws.getCell(currentRow, 4).value = `NIK: ${nikPenanggung}`
        ws.getCell(currentRow, 4).alignment = { horizontal: 'center' }
        
        currentRow += 5
      }
    }
    
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `KKA_${year}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
  }

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: 'tanggalKwitansi', header: 'Tgl Kwitansi', cell: ({ row }) => row.original.tanggalKwitansi ? format(new Date(row.original.tanggalKwitansi), 'dd MMM yy', { locale: idLocale }) : '-' },
    { accessorKey: 'glAccount.code', header: 'GL Account', cell: ({ row }) => row.original.glAccount.code },
    { accessorKey: 'quarter', header: 'Kuartal', cell: ({ row }) => `Q${row.getValue('quarter')}` },
    { accessorKey: 'regionalCode', header: 'Regional', cell: ({ row }) => regionals.find((r: Regional) => r.code === row.original.regionalCode)?.name || row.original.regionalCode },
    { accessorKey: 'kegiatan', header: 'Kegiatan' },
    { accessorKey: 'nilaiTanpaPPN', header: () => <div className="text-right">Nilai (Rp)</div>, cell: ({ row }) => <div className="text-right">{row.original.nilaiTanpaPPN.toLocaleString('id-ID')}</div> },
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

  const isSubmitDisabled = !selectedGl || !regional || (remaining !== null && remaining !== undefined && remaining.remaining <= 0)

  if (loading) {
    return <TableSkeleton title="Pencatatan Transaksi" showFilters={true} showActions={true} rows={8} columns={7} />
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div><h1 className="text-xl md:text-2xl font-bold">Input Pencatatan Anggaran</h1><p className="text-muted-foreground text-xs md:text-sm">Catat penggunaan anggaran per kegiatan</p></div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Tahun:</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027, 2028].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4" />{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3">
          <Card className="border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Form Pencatatan</CardTitle>
              <CardDescription className="text-xs md:text-sm">Isi detail kegiatan dan nilai anggaran</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">GL Account</Label>
                    <Select value={selectedGl} onValueChange={setSelectedGl}>
                      <SelectTrigger><SelectValue placeholder="Pilih GL Account" /></SelectTrigger>
                      <SelectContent>{glAccounts.map((gl: GlAccount) => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Kuartal</Label>
                    <Select value={quarter} onValueChange={setQuarter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Alokasi Regional</Label>
                    <Select value={regional} onValueChange={setRegional}>
                      <SelectTrigger><SelectValue placeholder="Pilih Regional" /></SelectTrigger>
                      <SelectContent>{regionals.map((r: Regional) => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Jenis Pengadaan</Label>
                    <Select value={jenisPengadaan} onValueChange={setJenisPengadaan}>
                      <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                      <SelectContent>{JENIS_PENGADAAN.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label className="text-xs md:text-sm">Kegiatan</Label><Input value={kegiatan} onChange={e => setKegiatan(e.target.value)} placeholder="Deskripsi kegiatan" required /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-2"><Label className="text-xs md:text-sm">Regional Pengguna</Label><Input value={regionalPengguna} onChange={e => setRegionalPengguna(e.target.value)} placeholder="Regional pengguna" required /></div>
                  <div className="space-y-2"><Label className="text-xs md:text-sm">Tanggal Kwitansi</Label><DatePicker date={tanggalKwitansi} onSelect={setTanggalKwitansi} placeholder="Pilih tanggal" /></div>
                  <div className="space-y-2"><Label className="text-xs md:text-sm">Nilai Sebelum PPN</Label><CurrencyInput value={nilaiKwitansi} onChange={setNilaiKwitansi} /></div>
                </div>
                <Button type="submit" disabled={isSubmitDisabled || createTransaction.isPending} size="sm">
                  {createTransaction.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
                {remaining !== null && remaining !== undefined && remaining.remaining <= 0 && <p className="text-xs md:text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Sisa anggaran 0</p>}
              </form>
            </CardContent>
          </Card>
        </div>
        <Card className="border">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Wallet className="h-4 w-4 md:h-5 md:w-5" />Info Sisa Anggaran</CardTitle>
            <CardDescription className="text-xs md:text-sm">{regionals.find((r: Regional) => r.code === regional)?.name || regional} - Q{quarter}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {remaining ? (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between"><span className="text-xs md:text-sm text-muted-foreground">Alokasi (Rp)</span><span className="text-sm md:text-lg font-semibold text-blue-600 flex items-center gap-1"><TrendingUp className="h-3 w-3 md:h-4 md:w-4" />{remaining.allocated.toLocaleString('id-ID')}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs md:text-sm text-muted-foreground">Terpakai (Rp)</span><span className="text-sm md:text-lg font-semibold text-red-600 flex items-center gap-1"><TrendingDown className="h-3 w-3 md:h-4 md:w-4" />{remaining.used.toLocaleString('id-ID')}</span></div>
                <div className="border-t pt-3 md:pt-4"><div className="flex items-center justify-between"><span className="text-xs md:text-sm font-medium">Sisa (Rp)</span><span className={`text-lg md:text-xl font-bold ${remaining.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{remaining.remaining.toLocaleString('id-ID')}</span></div></div>
              </div>
            ) : <p className="text-muted-foreground text-xs md:text-sm">Pilih GL Account untuk melihat sisa anggaran</p>}
          </CardContent>
        </Card>
      </div>

      {/* Transaction List with Tabs */}
      <Card className="border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Riwayat Pencatatan Anggaran Tahun {year}</CardTitle>
          <CardDescription className="text-xs md:text-sm">Data transaksi dan pencatatan anggaran</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="overflow-x-auto">
                <TabsList className="w-max">
                  <TabsTrigger value="all" className="text-xs md:text-sm">Semua ({transactions.length})</TabsTrigger>
                  <TabsTrigger value="Open" className="text-xs md:text-sm">Open ({openCount})</TabsTrigger>
                  <TabsTrigger value="Proses" className="text-xs md:text-sm">Proses ({prosesCount})</TabsTrigger>
                  <TabsTrigger value="Close" className="text-xs md:text-sm">Selesai ({closeCount})</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex items-center gap-2">
                <Input placeholder="Cari kegiatan..." className="w-full sm:w-[200px] md:w-[250px] h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 flex-shrink-0">
                      <Filter className="h-4 w-4" /><span className="hidden sm:inline">Filter</span>
                      {(filterGl || filterQuarter || filterRegional || filterPengadaan) && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {[filterGl, filterQuarter, filterRegional, filterPengadaan].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="font-medium text-sm">Filter Transaksi</div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">GL Account</Label>
                          <Select value={filterGl || 'all'} onValueChange={v => setFilterGl(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Semua GL Account" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua GL Account</SelectItem>
                              {glAccounts.map((gl: GlAccount) => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Kuartal</Label>
                          <Select value={filterQuarter || 'all'} onValueChange={v => setFilterQuarter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Semua Kuartal" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Kuartal</SelectItem>
                              {[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Regional</Label>
                          <Select value={filterRegional || 'all'} onValueChange={v => setFilterRegional(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Semua Regional" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Regional</SelectItem>
                              {regionals.map((r: Regional) => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Jenis Pengadaan</Label>
                          <Select value={filterPengadaan || 'all'} onValueChange={v => setFilterPengadaan(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Semua Pengadaan" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Pengadaan</SelectItem>
                              {JENIS_PENGADAAN.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {(filterGl || filterQuarter || filterRegional || filterPengadaan) && (
                        <Button size="sm" className="w-full" onClick={() => { setFilterGl(''); setFilterQuarter(''); setFilterRegional(''); setFilterPengadaan('') }}>Reset Filter</Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-9 gap-2" onClick={handleExport}>
                  <FileSpreadsheet className="h-4 w-4" />Export
                </Button>
                <Button size="sm" className="h-9 gap-2" onClick={handleExportKKA}>
                  <FileSpreadsheet className="h-4 w-4" />Export KKA
                </Button>
              </div>
            </div>
            
            <TabsContent value={activeTab}>
              <DataTable columns={columns} data={filteredTransactions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Detail Transaksi</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Informasi lengkap transaksi pencatatan anggaran</p>
          </DialogHeader>
          {viewingTransaction && (
            <div className="grid grid-cols-3 gap-0">
              <div className="col-span-2 px-6 pb-6 space-y-4 border-r">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">GL Account</Label>
                  <Input value={`${viewingTransaction.glAccount.code} - ${viewingTransaction.glAccount.description}`} disabled className="bg-muted/50 font-medium" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Kuartal</Label><Input value={`Q${viewingTransaction.quarter}`} disabled className="bg-muted/50 font-medium" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Regional</Label><Input value={regionals.find((r: Regional) => r.code === viewingTransaction.regionalCode)?.name || '-'} disabled className="bg-muted/50 font-medium" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Regional Pengguna</Label><Input value={viewingTransaction.regionalPengguna} disabled className="bg-muted/50 font-medium" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Kegiatan</Label><Input value={viewingTransaction.kegiatan} disabled className="bg-muted/50 font-medium" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tanggal Kwitansi</Label><Input value={viewingTransaction.tanggalKwitansi ? format(new Date(viewingTransaction.tanggalKwitansi), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Sebelum PPN</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">Rp</span><Input value={viewingTransaction.nilaiTanpaPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })} disabled className="bg-muted/50 font-medium rounded-l-none" /></div></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Jenis Pajak</Label><Input value={JENIS_PAJAK.find(p => p.value === viewingTransaction.jenisPajak)?.label || 'Tanpa PPN'} disabled className="bg-muted/50 font-medium" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Pertanggungan</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">Rp</span><Input value={viewingTransaction.nilaiKwitansi.toLocaleString('id-ID', { maximumFractionDigits: 0 })} disabled className="bg-muted/50 font-medium rounded-l-none" /></div></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">{viewingTransaction.jenisPajak === 'TanpaPPN' ? 'Nilai PPN' : viewingTransaction.jenisPajak === 'PPN11' ? 'Nilai PPN 11%' : viewingTransaction.jenisPajak === 'PPNJasa2' ? 'Nilai PPH Jasa 2%' : viewingTransaction.jenisPajak === 'PPNInklaring1.1' ? 'Nilai Inklaring 1.1%' : 'Nilai PPN'}</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">Rp</span><Input value={viewingTransaction.nilaiPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })} disabled className="bg-muted/50 font-medium rounded-l-none" /></div></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Jenis Pengadaan</Label><Input value={JENIS_PENGADAAN.find(p => p.value === viewingTransaction.jenisPengadaan)?.label || '-'} disabled className="bg-muted/50 font-medium" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Vendor</Label><Input value={viewingTransaction.vendor?.name || '-'} disabled className="bg-muted/50 font-medium" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Keterangan</Label><Textarea value={viewingTransaction.keterangan || '-'} disabled className="bg-muted/50 font-medium min-h-[60px] resize-none" /></div>
                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Informasi Finance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No. Tiket Mydx</Label><Input value={viewingTransaction.noTiketMydx || '-'} disabled className="bg-muted/50 font-medium" /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Serahkan ke Finance</Label><Input value={viewingTransaction.tglSerahFinance ? format(new Date(viewingTransaction.tglSerahFinance), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">PIC Finance</Label><Input value={viewingTransaction.picFinance || '-'} disabled className="bg-muted/50 font-medium" /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No HP Finance</Label><Input value={viewingTransaction.noHpFinance || '-'} disabled className="bg-muted/50 font-medium" /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Transfer Vendor</Label><Input value={viewingTransaction.tglTransferVendor ? format(new Date(viewingTransaction.tglTransferVendor), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Transfer (Rp)</Label><Input value={viewingTransaction.nilaiTransfer ? viewingTransaction.nilaiTransfer.toLocaleString('id-ID') : '-'} disabled className="bg-muted/50 font-medium" /></div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>Tutup</Button>
                  <Button onClick={() => { setShowViewDialog(false); openEditDialog(viewingTransaction) }}>Edit</Button>
                </div>
              </div>
              <div className="col-span-1 px-5 py-6 bg-muted/30">
                <div className="flex items-center justify-between mb-6 pb-4 border-b"><span className="text-sm font-semibold">Status</span><StatusBadge status={viewingTransaction.status} /></div>
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Task Checklist</p>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskPengajuan ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskPengajuan} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskPengajuan ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskTransferVendor} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskTransferVendor ? 'text-green-700' : ''}`}>Transfer dari Vendor</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskTerimaBerkas} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskTerimaBerkas ? 'text-green-700' : ''}`}>Terima Berkas</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskUploadMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskUploadMydx} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskUploadMydx ? 'text-green-700' : ''}`}>Upload Mydx</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskSerahFinance} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskSerahFinance ? 'text-green-700' : ''}`}>Serah ke Finance</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingTransaction.taskVendorDibayar ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={viewingTransaction.taskVendorDibayar} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${viewingTransaction.taskVendorDibayar ? 'text-green-700' : ''}`}>Vendor Dibayar</span></div>
                  </div>
                </div>
                {/* Files Section */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold">Lampiran File</p>
                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada file</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50" onClick={() => handleFilePreview(file)}>
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Edit Transaksi</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Ubah data transaksi dan lengkapi informasi yang diperlukan</p>
          </DialogHeader>
          {editingTransaction && (
            <div className="grid grid-cols-3 gap-0">
              <div className="col-span-2 px-6 pb-6 space-y-4 border-r">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">GL Account</Label>
                  <Select value={editGl} onValueChange={setEditGl}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{glAccounts.map((gl: GlAccount) => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Kuartal</Label><Select value={editQuarter} onValueChange={setEditQuarter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Regional</Label><Select value={editRegional} onValueChange={setEditRegional}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{regionals.map((r: Regional) => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Regional Pengguna</Label><Input value={editRegionalPengguna} onChange={e => setEditRegionalPengguna(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Kegiatan</Label><Input value={editKegiatan} onChange={e => setEditKegiatan(e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tanggal Kwitansi</Label><DatePicker date={editTanggalKwitansi} onSelect={setEditTanggalKwitansi} /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Sebelum PPN</Label><CurrencyInput value={editNilaiKwitansi} onChange={setEditNilaiKwitansi} /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Jenis Pajak</Label><Select value={editJenisPajak} onValueChange={setEditJenisPajak}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JENIS_PAJAK.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Pertanggungan</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">Rp</span><Input value={editPpnCalc.nilaiPertanggungan.toLocaleString('id-ID', { maximumFractionDigits: 0 })} disabled className="bg-muted/50 font-medium rounded-l-none" /></div></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">{editJenisPajak === 'TanpaPPN' ? 'Nilai PPN' : editJenisPajak === 'PPN11' ? 'Nilai PPN 11%' : editJenisPajak === 'PPNJasa2' ? 'Nilai PPH Jasa 2%' : editJenisPajak === 'PPNInklaring1.1' ? 'Nilai Inklaring 1.1%' : 'Nilai PPN'}</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">Rp</span><Input value={editPpnCalc.nilaiPPN.toLocaleString('id-ID', { maximumFractionDigits: 0 })} disabled className="bg-muted/50 font-medium rounded-l-none" /></div></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Jenis Pengadaan</Label><Select value={editJenisPengadaan} onValueChange={setEditJenisPengadaan}><SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger><SelectContent>{JENIS_PENGADAAN.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Vendor</Label><Select value={editVendorId} onValueChange={setEditVendorId}><SelectTrigger><SelectValue placeholder="Pilih vendor" /></SelectTrigger><SelectContent>{vendors.map((v: Vendor) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Keterangan</Label><Textarea value={editKeterangan} onChange={e => setEditKeterangan(e.target.value)} className="min-h-[60px] resize-none" /></div>
                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Informasi Finance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No. Tiket Mydx</Label><Input value={editNoTiketMydx} onChange={e => setEditNoTiketMydx(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Serahkan ke Finance</Label><DatePicker date={editTglSerahFinance} onSelect={setEditTglSerahFinance} /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">PIC Finance</Label><Input value={editPicFinance} onChange={e => setEditPicFinance(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No HP Finance</Label><Input value={editNoHpFinance} onChange={e => setEditNoHpFinance(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Transfer Vendor</Label><DatePicker date={editTglTransferVendor} onSelect={setEditTglTransferVendor} /></div>
                    <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Transfer</Label><CurrencyInput value={editNilaiTransfer || 0} onChange={setEditNilaiTransfer} /></div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                  <Button onClick={handleEdit} disabled={updateTransaction.isPending}>{updateTransaction.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
                </div>
              </div>
              <div className="col-span-1 px-5 py-6 bg-muted/30">
                <div className="flex items-center justify-between mb-6 pb-4 border-b"><span className="text-sm font-semibold">Status</span><StatusBadge status={editingTransaction.status} /></div>
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Task Checklist</p>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingTransaction.taskPengajuan ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={editingTransaction.taskPengajuan} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${editingTransaction.taskPengajuan ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editTaskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={editTaskTransferVendor} onCheckedChange={(c) => setEditTaskTransferVendor(!!c)} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${editTaskTransferVendor ? 'text-green-700' : ''}`}>Transfer dari Vendor</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editTaskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={editTaskTerimaBerkas} onCheckedChange={(c) => setEditTaskTerimaBerkas(!!c)} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${editTaskTerimaBerkas ? 'text-green-700' : ''}`}>Terima Berkas</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editNoTiketMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={!!editNoTiketMydx} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${!!editNoTiketMydx ? 'text-green-700' : ''}`}>Upload Mydx</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editTglSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={!!editTglSerahFinance} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${!!editTglSerahFinance ? 'text-green-700' : ''}`}>Serah ke Finance</span></div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editTglTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}><Checkbox checked={!!editTglTransferVendor} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" /><span className={`text-sm ${!!editTglTransferVendor ? 'text-green-700' : ''}`}>Vendor Dibayar</span></div>
                  </div>
                </div>
                {/* Files Section */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold">Lampiran File</p>
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" />
                      {uploading ? <span className="text-sm text-muted-foreground">Mengupload...</span> : <><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload File</span></>}
                    </label>
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                        <div className="cursor-pointer" onClick={() => handleFilePreview(file)}>{getFileIcon(file)}</div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleFilePreview(file)}>
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>Transaksi akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{deleteTransaction.isPending ? 'Menghapus...' : 'Hapus'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <img src={previewImage} alt="Preview" className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
