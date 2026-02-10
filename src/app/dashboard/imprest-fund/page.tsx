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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, CheckCircle, Eye, Save, FileText, Calendar, CreditCard, Pencil, ChevronDown, ChevronRight, BookOpen, Hourglass, File, Image, FileSpreadsheet, Presentation } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TableSkeleton } from '@/components/loading'
import { cn } from '@/lib/utils'
import { useImprestFunds, useImprestFundCards, useCreateImprestFund, useUpdateImprestFund, useDeleteImprestFund, useTopUpImprestFund } from '@/lib/hooks/useImprestFund'
import { useGlAccounts, useRegionals, useVendors } from '@/lib/hooks/useMaster'
import api from '@/lib/axios'

function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase()
  return (
    <Badge className={cn(
      "gap-1.5",
      statusLower === 'close' ? 'bg-green-100 text-green-600 hover:bg-green-100' : 
      statusLower === 'proses' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-100' : 
      statusLower === 'open' ? 'bg-blue-100 text-blue-600 hover:bg-blue-100' :
      'bg-gray-100 text-gray-600 hover:bg-gray-100'
    )}>
      {statusLower === 'close' && <CheckCircle className="h-3 w-3" />}
      {statusLower === 'proses' && <Hourglass className="h-3 w-3" />}
      {statusLower === 'open' && <BookOpen className="h-3 w-3" />}
      {statusLower === 'close' ? 'Close' : statusLower === 'proses' ? 'Proses' : statusLower === 'open' ? 'Open' : 'Draft'}
    </Badge>
  )
}

interface GlAccount { id: string; code: string; description: string }
interface ImprestItem { id: string; tanggal: Date; uraian: string; glAccountId: string; glAccount?: GlAccount; jumlah: number }
interface ImprestFundCard { id: string; nomorKartu: string; user: string; saldo: number; pic: string; isActive: boolean }
interface Vendor { id: string; name: string; alamat?: string; pic?: string; phone?: string; email?: string }
interface Transaction { id: string; glAccountId: string; glAccount: GlAccount; quarter: number; regionalCode: string; kegiatan: string; regionalPengguna: string; year: number; status: string; imprestFundId?: string }
interface Regional { id: string; code: string; name: string }

interface ImprestFund {
  id: string; kelompokKegiatan: string; regionalCode?: string; items: ImprestItem[]
  status: 'draft' | 'open' | 'proses' | 'close'; totalAmount: number; debit: number; keterangan?: string
  imprestFundCardId?: string; imprestFundCard?: ImprestFundCard
  noTiketMydx?: string; tglSerahFinance?: Date; picFinance?: string; noHpFinance?: string
  tglTransferVendor?: Date; nilaiTransfer?: number
  taskPengajuan: boolean; taskTransferVendor: boolean; taskTerimaBerkas: boolean
  taskUploadMydx: boolean; taskSerahFinance: boolean; taskVendorDibayar: boolean
  createdAt: Date; updatedAt: Date; transactions?: Transaction[]
}

export default function ImprestFundPage() {
  const [message, setMessage] = useState('')
  const [autoSaving, setAutoSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // Edit states
  const [editingImprest, setEditingImprest] = useState<ImprestFund | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUraianOpen, setIsUraianOpen] = useState(false)
  const [isViewUraianOpen, setIsViewUraianOpen] = useState(false)
  
  // Regional allocation states
  const [selectedRegionalCode, setSelectedRegionalCode] = useState('')
  
  // Top Up states
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState(0)
  const [topUpKeterangan, setTopUpKeterangan] = useState('')
  
  // Selected card for input form
  const [selectedInputCardId, setSelectedInputCardId] = useState('')
  
  // Form states
  const [kelompokKegiatan, setKelompokKegiatan] = useState('')
  const [items, setItems] = useState<ImprestItem[]>([])
  
  // Dialog states
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [viewingImprest, setViewingImprest] = useState<ImprestFund | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  
  // File upload states
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // TanStack Query hooks
  const { data: glAccounts = [], isLoading: glLoading } = useGlAccounts()
  const { data: regionals = [], isLoading: regionalLoading } = useRegionals()
  const { data: vendors = [] } = useVendors(false)
  const { data: imprestFundsData = [], isLoading: imprestLoading } = useImprestFunds()
  const { data: imprestFundCardsData = [], isLoading: cardsLoading } = useImprestFundCards()
  
  const createImprestFund = useCreateImprestFund()
  const updateImprestFund = useUpdateImprestFund()
  const deleteImprestFund = useDeleteImprestFund()
  const topUpImprestFund = useTopUpImprestFund()

  const imprestFunds = Array.isArray(imprestFundsData) ? imprestFundsData : []
  const imprestFundCards = Array.isArray(imprestFundCardsData) ? imprestFundCardsData.filter((c: ImprestFundCard) => c.isActive) : []
  const loading = glLoading || regionalLoading || imprestLoading || cardsLoading

  // Set default card when loaded
  useEffect(() => {
    if (imprestFundCards.length > 0 && !selectedInputCardId) {
      setSelectedInputCardId(imprestFundCards[0].id)
    }
  }, [imprestFundCards, selectedInputCardId])

  const addItem = () => {
    const newItem: ImprestItem = { id: Date.now().toString(), tanggal: new Date(), uraian: '', glAccountId: '', glAccount: undefined, jumlah: 0 }
    setItems([...items, newItem])
    setMessage('Baris baru ditambahkan!')
    setTimeout(() => setMessage(''), 3000)
  }

  const updateItem = (itemId: string, field: keyof ImprestItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'glAccountId') updatedItem.glAccount = glAccounts.find((gl: GlAccount) => gl.id === value)
        return updatedItem
      }
      return item
    })
    setItems(updatedItems)
  }

  const deleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
    setDeleteItemId(null)
    setShowDeleteDialog(false)
    setMessage('Item berhasil dihapus!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteImprestFund = async () => {
    if (!deleteItemId) return
    try {
      await deleteImprestFund.mutateAsync(deleteItemId)
      setMessage('Imprest Fund berhasil dihapus!')
      setShowDeleteDialog(false)
      setDeleteItemId(null)
    } catch (error) {
      setMessage('Gagal menghapus Imprest Fund!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const validateItems = () => items.every(item => item.tanggal && item.uraian.trim() !== '' && item.glAccountId !== '' && item.jumlah > 0)

  const saveDraft = async () => {
    if (!kelompokKegiatan || items.length === 0) {
      setMessage('Kelompok kegiatan dan minimal 1 item harus diisi!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    if (!validateItems()) {
      setMessage('Semua field pada uraian harus diisi dengan benar!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    try {
      await createImprestFund.mutateAsync({
        kelompokKegiatan, regionalCode: selectedRegionalCode || null, imprestFundCardId: selectedInputCardId || null,
        items: items.map(item => ({ tanggal: item.tanggal, uraian: item.uraian, glAccountId: item.glAccountId, jumlah: item.jumlah })),
        status: 'draft'
      })
      setMessage('Draft berhasil disimpan!')
      setKelompokKegiatan(''); setSelectedRegionalCode(''); setItems([])
      if (imprestFundCards.length > 0) setSelectedInputCardId(imprestFundCards[0].id)
    } catch (error) {
      setMessage('Gagal menyimpan draft!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const submitImprest = async () => {
    if (!kelompokKegiatan || items.length === 0) {
      setMessage('Kelompok kegiatan dan minimal 1 item harus diisi!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    if (!selectedRegionalCode) {
      setMessage('Alokasi anggaran regional harus dipilih!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    if (!validateItems()) {
      setMessage('Semua field pada uraian harus diisi dengan benar!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    try {
      await createImprestFund.mutateAsync({
        kelompokKegiatan, regionalCode: selectedRegionalCode, imprestFundCardId: selectedInputCardId || null,
        items: items.map(item => ({ tanggal: item.tanggal, uraian: item.uraian, glAccountId: item.glAccountId, jumlah: item.jumlah })),
        status: 'open'
      })
      setMessage('Imprest Fund berhasil disubmit dan status berubah menjadi Open!')
      setKelompokKegiatan(''); setSelectedRegionalCode(''); setItems([])
      if (imprestFundCards.length > 0) setSelectedInputCardId(imprestFundCards[0].id)
    } catch (error) {
      setMessage('Gagal submit Imprest Fund!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleTopUp = async () => {
    if (!selectedCardId || topUpAmount <= 0) {
      setMessage('Pilih kartu dan masukkan jumlah top up yang valid!')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    try {
      await topUpImprestFund.mutateAsync({ imprestFundCardId: selectedCardId, amount: topUpAmount, keterangan: topUpKeterangan })
      setMessage('Top Up berhasil!')
      setShowTopUpDialog(false); setSelectedCardId(''); setTopUpAmount(0); setTopUpKeterangan('')
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Gagal melakukan top up!')
    }
    setTimeout(() => setMessage(''), 3000)
  }


  const handleEditImprest = async () => {
    if (!editingImprest) return
    if (editingImprest.status === 'draft') {
      const hasInvalidItems = editingImprest.items.some(item => !item.tanggal || !item.uraian.trim() || !item.glAccountId || item.jumlah <= 0)
      if (hasInvalidItems) {
        setMessage('Semua field pada uraian harus diisi dengan benar!')
        setTimeout(() => setMessage(''), 3000)
        return
      }
    }

    const taskUploadMydx = !!editingImprest.noTiketMydx
    const taskSerahFinance = !!editingImprest.tglSerahFinance
    const taskVendorDibayar = !!editingImprest.tglTransferVendor

    let finalStatus = editingImprest.status
    if (editingImprest.status !== 'draft') {
      const isComplete = editingImprest.taskTransferVendor && editingImprest.taskTerimaBerkas && taskUploadMydx && taskSerahFinance && taskVendorDibayar
      finalStatus = isComplete ? 'close' : 'proses'
    }

    try {
      await updateImprestFund.mutateAsync({
        id: editingImprest.id,
        data: {
          kelompokKegiatan: editingImprest.kelompokKegiatan, regionalCode: editingImprest.regionalCode,
          keterangan: editingImprest.keterangan, debit: editingImprest.debit, status: finalStatus,
          items: editingImprest.items.map(item => ({ tanggal: item.tanggal, uraian: item.uraian, glAccountId: item.glAccountId, jumlah: item.jumlah })),
          noTiketMydx: editingImprest.noTiketMydx, tglSerahFinance: editingImprest.tglSerahFinance,
          picFinance: editingImprest.picFinance, noHpFinance: editingImprest.noHpFinance,
          tglTransferVendor: editingImprest.tglTransferVendor, nilaiTransfer: editingImprest.nilaiTransfer,
          taskPengajuan: true, taskTransferVendor: editingImprest.taskTransferVendor, taskTerimaBerkas: editingImprest.taskTerimaBerkas,
          taskUploadMydx, taskSerahFinance, taskVendorDibayar
        }
      })
      setMessage('Imprest Fund berhasil diupdate!')
      setShowEditDialog(false); setEditingImprest(null)
    } catch (error) {
      setMessage('Gagal update Imprest Fund!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const loadImprestFiles = async (imprestId: string) => {
    try {
      const imprest = imprestFunds.find((i: ImprestFund) => i.id === imprestId)
      if (imprest?.transactions && imprest.transactions.length > 0) {
        const filesData = await api.get(`/transaction/${imprest.transactions[0].id}/files`)
        setFiles(Array.isArray(filesData) ? filesData : [])
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error('Error loading files:', error)
      setFiles([])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || !editingImprest) return
    const transactions = editingImprest.transactions
    if (!transactions || transactions.length === 0) {
      setMessage('Tidak ada transaksi terkait untuk upload file')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    setUploading(true)
    try {
      for (const file of Array.from(selectedFiles)) {
        if (file.size > 10 * 1024 * 1024) {
          setMessage(`File ${file.name} terlalu besar (max 10MB)`)
          setTimeout(() => setMessage(''), 3000)
          continue
        }
        let firstUploadedFile = null
        for (const transaction of transactions) {
          const formData = new FormData()
          formData.append('file', file)
          try {
            const newFile = await api.post(`/transaction/${transaction.id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            if (!firstUploadedFile) firstUploadedFile = newFile
          } catch (error) {
            console.error(`Gagal upload ke transaction ${transaction.id}`)
          }
        }
        if (firstUploadedFile) setFiles(prev => [firstUploadedFile, ...prev])
      }
      if (selectedFiles.length > 0) {
        setMessage(`File berhasil diupload ke ${transactions.length} transaksi terkait!`)
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
    const transactions = editingImprest?.transactions
    if (!transactions || transactions.length === 0) return
    try {
      const fileToDelete = files.find(f => f.id === fileId)
      if (!fileToDelete) return
      let deleteSuccess = false
      for (const transaction of transactions) {
        try {
          const transactionFiles = await api.get(`/transaction/${transaction.id}/files`) as unknown as any[]
          const matchingFile = transactionFiles.find((f: any) => f.originalName === fileToDelete.originalName)
          if (matchingFile) {
            await api.delete(`/transaction/${transaction.id}/files?fileId=${matchingFile.id}`)
            deleteSuccess = true
          }
        } catch (error) {}
      }
      if (deleteSuccess) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        setMessage(`File berhasil dihapus dari ${transactions.length} transaksi terkait!`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Gagal hapus file')
        setTimeout(() => setMessage(''), 3000)
      }
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

  const totalAmount = items.reduce((sum, item) => sum + item.jumlah, 0)

  const filteredImprestFunds = imprestFunds.filter((imprest: ImprestFund) => {
    if (activeTab !== 'all' && imprest.status !== activeTab) return false
    if (searchQuery && !imprest.kelompokKegiatan.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const draftCount = imprestFunds.filter((t: ImprestFund) => t.status === 'draft').length
  const openCount = imprestFunds.filter((t: ImprestFund) => t.status === 'open').length
  const prosesCount = imprestFunds.filter((t: ImprestFund) => t.status === 'proses').length
  const closeCount = imprestFunds.filter((t: ImprestFund) => t.status === 'close').length

  const historyColumns: ColumnDef<ImprestFund>[] = [
    { accessorKey: 'kelompokKegiatan', header: 'Kegiatan', cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.original.kelompokKegiatan}>{row.original.kelompokKegiatan}</div> },
    { accessorKey: 'imprestFundCard.user', header: 'User IF', cell: ({ row }) => row.original.imprestFundCard?.user || '-' },
    { accessorKey: 'items', header: 'Jumlah Item', cell: ({ row }) => `${row.original.items.length} item` },
    { accessorKey: 'totalAmount', header: () => <div className="text-right">Kredit (Rp)</div>, cell: ({ row }) => <div className="text-right font-medium">{row.original.totalAmount.toLocaleString('id-ID')}</div> },
    { accessorKey: 'debit', header: () => <div className="text-right">Debit (Rp)</div>, cell: ({ row }) => <div className="text-right font-medium text-green-600">{row.original.debit > 0 ? row.original.debit.toLocaleString('id-ID') : '-'}</div> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Tanggal Dibuat', cell: ({ row }) => format(row.original.createdAt, 'dd MMM yyyy HH:mm', { locale: idLocale }) },
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => { setViewingImprest(row.original); loadImprestFiles(row.original.id); setShowViewDialog(true) }}><Eye className="h-4 w-4" /></Button>
        {(row.original.status === 'draft' || row.original.status === 'open' || row.original.status === 'proses') && (
          <Button variant="outline" size="sm" onClick={() => { setEditingImprest(row.original); setIsUraianOpen(false); loadImprestFiles(row.original.id); setShowEditDialog(true) }}><Pencil className="h-4 w-4" /></Button>
        )}
        <Button variant="outline" size="sm" onClick={() => { setDeleteItemId(row.original.id); setShowDeleteDialog(true) }} className="text-red-500 hover:text-red-700 hover:border-red-300"><Trash2 className="h-4 w-4" /></Button>
      </div>
    )}
  ]

  if (loading) {
    return <TableSkeleton title="Imprest Fund" showFilters={false} showActions={true} rows={5} columns={5} />
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Imprest Fund</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Kelola dana imprest dan pencatatan penggunaan</p>
        </div>
        <Button onClick={() => setShowTopUpDialog(true)} className="gap-2 w-full sm:w-auto" variant="default" size="sm">
          <Plus className="h-4 w-4" />Top Up
        </Button>
      </div>

      {message && (
        <div className={`border px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-2 text-sm ${
          message.includes('otomatis') ? 'bg-blue-50 border-blue-200 text-blue-700' : 
          message.includes('berhasil') || message.includes('ditambahkan') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle className="h-4 w-4" />{message}
        </div>
      )}

      {autoSaving && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-2 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>Menyimpan draft...
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="border">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs md:text-sm text-muted-foreground">Saldo IF</p><p className="text-lg md:text-2xl font-bold text-blue-600">Rp {(5000000).toLocaleString('id-ID')}</p></div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center"><CreditCard className="h-5 w-5 md:h-6 md:w-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs md:text-sm text-muted-foreground">Sisa Saldo</p><p className="text-lg md:text-2xl font-bold text-green-600">Rp {(imprestFundCards.reduce((sum: number, card: ImprestFundCard) => sum + card.saldo, 0)).toLocaleString('id-ID')}</p></div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs md:text-sm text-muted-foreground">Belum Refund</p><p className="text-lg md:text-2xl font-bold text-orange-600">Rp {imprestFunds.filter((i: ImprestFund) => i.status === 'open' || i.status === 'proses').reduce((sum: number, i: ImprestFund) => sum + i.totalAmount, 0).toLocaleString('id-ID')}</p></div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center"><Hourglass className="h-5 w-5 md:h-6 md:w-6 text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Form */}
      <Card className="border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg"><CreditCard className="h-4 w-4 md:h-5 md:w-5" />Input Imprest Fund</CardTitle>
          <CardDescription className="text-xs md:text-sm">Buat pencatatan imprest fund baru</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2"><Label className="text-xs md:text-sm">Kelompok Kegiatan</Label><Input value={kelompokKegiatan} onChange={(e) => setKelompokKegiatan(e.target.value)} placeholder="Masukkan kelompok kegiatan" required /></div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Imprest Fund Card (User)</Label>
              <Select value={selectedInputCardId} onValueChange={setSelectedInputCardId}>
                <SelectTrigger><SelectValue placeholder="Pilih kartu" /></SelectTrigger>
                <SelectContent>{imprestFundCards.map((card: ImprestFundCard) => <SelectItem key={card.id} value={card.id}>{card.user}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Alokasi Anggaran Regional</Label>
              <Select value={selectedRegionalCode} onValueChange={setSelectedRegionalCode}>
                <SelectTrigger><SelectValue placeholder="Pilih regional" /></SelectTrigger>
                <SelectContent>{regionals.map((r: Regional) => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-end"><Button onClick={addItem} className="gap-2" size="sm"><Plus className="h-4 w-4" />Tambah Uraian</Button></div>
            {items.length === 0 ? (
              <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center"><FileText className="h-5 w-5 md:h-6 md:w-6 text-gray-400" /></div>
                  <p className="text-xs md:text-sm text-muted-foreground">Belum ada uraian penggunaan</p>
                  <p className="text-xs text-muted-foreground">Klik "Tambah Uraian" untuk menambah item</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                  <div className="col-span-2">Tanggal</div><div className="col-span-4">Uraian</div><div className="col-span-3">GL Account</div><div className="col-span-2">Jumlah (Rp)</div><div className="col-span-1">Aksi</div>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-3 border rounded-lg bg-white border-gray-200">
                    <div className="md:col-span-2">
                      <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Tanggal</Label>
                      <DatePicker date={item.tanggal} onSelect={(date) => date && updateItem(item.id, 'tanggal', date)} placeholder="Pilih tanggal" />
                    </div>
                    <div className="md:col-span-4">
                      <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Uraian</Label>
                      <Textarea value={item.uraian} onChange={(e) => updateItem(item.id, 'uraian', e.target.value)} placeholder="Masukkan uraian penggunaan" className="min-h-[40px] resize-none" />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="md:hidden text-xs text-muted-foreground mb-1 block">GL Account</Label>
                      <Select value={item.glAccountId} onValueChange={(value) => updateItem(item.id, 'glAccountId', value)}>
                        <SelectTrigger><SelectValue placeholder="Pilih GL Account" /></SelectTrigger>
                        <SelectContent>{glAccounts.map((gl: GlAccount) => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Jumlah (Rp)</Label>
                      <CurrencyInput value={item.jumlah} onChange={(value) => updateItem(item.id, 'jumlah', value)} />
                    </div>
                    <div className="md:col-span-1 flex md:justify-center"><Button variant="outline" size="sm" onClick={() => { setDeleteItemId(item.id); setShowDeleteDialog(true) }} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-blue-700">Total Amount:</span><span className="text-lg font-bold text-blue-800">Rp {totalAmount.toLocaleString('id-ID')}</span></div>
                    {selectedInputCardId && (
                      <>
                        <div className="flex items-center gap-2 text-sm"><span className="font-medium text-gray-600">Saldo IF:</span><span className="font-semibold text-gray-800">Rp {(imprestFundCards.find((c: ImprestFundCard) => c.id === selectedInputCardId)?.saldo || 0).toLocaleString('id-ID')}</span></div>
                        <div className="flex items-center gap-2 text-sm"><span className="font-medium text-gray-600">Sisa Saldo IF:</span><span className={`font-semibold ${((imprestFundCards.find((c: ImprestFundCard) => c.id === selectedInputCardId)?.saldo || 0) - totalAmount) < 0 ? 'text-red-600' : 'text-green-600'}`}>Rp {((imprestFundCards.find((c: ImprestFundCard) => c.id === selectedInputCardId)?.saldo || 0) - totalAmount).toLocaleString('id-ID')}</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={saveDraft} disabled={!kelompokKegiatan || items.length === 0 || !validateItems() || createImprestFund.isPending}>
              <Save className="h-4 w-4 mr-2" />{createImprestFund.isPending ? 'Menyimpan...' : 'Simpan Draft'}
            </Button>
            <Button onClick={submitImprest} disabled={!kelompokKegiatan || items.length === 0 || !validateItems() || createImprestFund.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />{createImprestFund.isPending ? 'Menyimpan...' : 'Submit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Riwayat Pencatatan Imprest Fund</CardTitle>
          <CardDescription>Data imprest fund yang telah dibuat</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">Semua ({imprestFunds.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({draftCount})</TabsTrigger>
                <TabsTrigger value="open">Open ({openCount})</TabsTrigger>
                <TabsTrigger value="proses">Proses ({prosesCount})</TabsTrigger>
                <TabsTrigger value="close">Close ({closeCount})</TabsTrigger>
              </TabsList>
              <Input placeholder="Cari kelompok kegiatan..." className="w-[250px] h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <TabsContent value={activeTab}><DataTable columns={historyColumns} data={filteredImprestFunds} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Top Up Imprest Fund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Kartu</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger><SelectValue placeholder="Pilih kartu" /></SelectTrigger>
                <SelectContent>{imprestFundCards.map((card: ImprestFundCard) => <SelectItem key={card.id} value={card.id}>{card.user} - Saldo: Rp {card.saldo.toLocaleString('id-ID')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Jumlah Top Up</Label><CurrencyInput value={topUpAmount} onChange={setTopUpAmount} /></div>
            <div className="space-y-2"><Label>Keterangan</Label><Textarea value={topUpKeterangan} onChange={e => setTopUpKeterangan(e.target.value)} placeholder="Keterangan top up (opsional)" /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTopUpDialog(false)}>Batal</Button>
              <Button onClick={handleTopUp} disabled={topUpImprestFund.isPending}>{topUpImprestFund.isPending ? 'Memproses...' : 'Top Up'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => { setShowViewDialog(open); if (!open) setIsViewUraianOpen(false) }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Detail Imprest Fund</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Informasi lengkap imprest fund</p>
          </DialogHeader>
          {viewingImprest && (
            <div className="grid grid-cols-3 gap-0">
              {/* Left Side - Details */}
              <div className="col-span-2 px-6 pb-6 space-y-4 border-r">
                {/* Kelompok Kegiatan */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Kelompok Kegiatan</Label>
                  <Input value={viewingImprest.kelompokKegiatan} disabled className="bg-muted/50 font-medium" />
                </div>

                {/* Alokasi Anggaran Regional */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Alokasi Anggaran Regional</Label>
                  <Input value={regionals.find((r: Regional) => r.code === viewingImprest.regionalCode)?.name || '-'} disabled className="bg-muted/50 font-medium" />
                </div>

                {/* Jumlah Item, Total Kredit, Debit/Top Up */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Jumlah Item</Label>
                    <Input value={`${viewingImprest.items.length} item`} disabled className="bg-muted/50 font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Total Kredit (Rp)</Label>
                    <Input value={viewingImprest.totalAmount.toLocaleString('id-ID')} disabled className="bg-muted/50 font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Debit/Top Up (Rp)</Label>
                    <Input value={viewingImprest.debit > 0 ? viewingImprest.debit.toLocaleString('id-ID') : '-'} disabled className="bg-muted/50 font-medium" />
                  </div>
                </div>

                {/* Kartu Imprest Fund, Tanggal Dibuat */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Kartu Imprest Fund</Label>
                    <Input value={viewingImprest.imprestFundCard ? `${viewingImprest.imprestFundCard.nomorKartu} - ${viewingImprest.imprestFundCard.user}` : '-'} disabled className="bg-muted/50 font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Tanggal Dibuat</Label>
                    <Input value={format(new Date(viewingImprest.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })} disabled className="bg-muted/50 font-medium" />
                  </div>
                </div>

                {/* Detail Uraian - Collapsible with Card Shadow */}
                <Collapsible open={isViewUraianOpen} onOpenChange={setIsViewUraianOpen}>
                  <div className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Detail Uraian Penggunaan</span>
                        </div>
                        {isViewUraianOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t">
                        <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 text-xs font-medium">
                          <div className="col-span-2">Tanggal</div>
                          <div className="col-span-4">Uraian</div>
                          <div className="col-span-3">GL Account</div>
                          <div className="col-span-3 text-right">Jumlah</div>
                        </div>
                        {viewingImprest.items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 p-3 border-t text-sm">
                            <div className="col-span-2">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}</div>
                            <div className="col-span-4">{item.uraian}</div>
                            <div className="col-span-3 truncate">{item.glAccount?.code} - {item.glAccount?.description}</div>
                            <div className="col-span-3 text-right font-medium whitespace-nowrap">Rp {item.jumlah.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                        <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50 border-t text-sm font-semibold">
                          <div className="col-span-9 text-right">Total:</div>
                          <div className="col-span-3 text-right text-blue-600 whitespace-nowrap">Rp {viewingImprest.totalAmount.toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Finance Info Section */}
                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Informasi Finance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">No. Tiket Mydx</Label>
                      <Input value={viewingImprest.noTiketMydx || '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Tgl Serahkan ke Finance</Label>
                      <Input value={viewingImprest.tglSerahFinance ? format(new Date(viewingImprest.tglSerahFinance), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">PIC Finance</Label>
                      <Input value={viewingImprest.picFinance || '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">No HP Finance</Label>
                      <Input value={viewingImprest.noHpFinance || '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Tgl Transfer Vendor</Label>
                      <Input value={viewingImprest.tglTransferVendor ? format(new Date(viewingImprest.tglTransferVendor), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Nilai Transfer (Rp)</Label>
                      <Input value={viewingImprest.nilaiTransfer ? viewingImprest.nilaiTransfer.toLocaleString('id-ID') : '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>Tutup</Button>
                  {(viewingImprest.status === 'draft' || viewingImprest.status === 'open' || viewingImprest.status === 'proses') && (
                    <Button onClick={() => { setShowViewDialog(false); setEditingImprest(viewingImprest); setShowEditDialog(true) }}>Edit</Button>
                  )}
                </div>
              </div>

              {/* Right Side - Status & Task Checklist */}
              <div className="col-span-1 px-5 py-6 bg-muted/30">
                {/* Status */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <span className="text-sm font-semibold">Status</span>
                  <StatusBadge status={viewingImprest.status} />
                </div>

                {/* Task Checklist */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Task Checklist</p>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskPengajuan ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskPengajuan} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskPengajuan ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskTransferVendor} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskTransferVendor ? 'text-green-700' : ''}`}>Transfer ke Vendor</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskTerimaBerkas} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskTerimaBerkas ? 'text-green-700' : ''}`}>Terima kwitansi IF</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskUploadMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskUploadMydx} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskUploadMydx ? 'text-green-700' : ''}`}>Upload ke Mydx</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskSerahFinance} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskSerahFinance ? 'text-green-700' : ''}`}>Serahkan berkas ke Finance</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskVendorDibayar ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskVendorDibayar} disabled className="data-[state=checked]:bg-green-500" />
                      <span className={`text-sm ${viewingImprest.taskVendorDibayar ? 'text-green-700' : ''}`}>Refund Finance</span>
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold">Lampiran File</p>
                  {files.length > 0 ? (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-dashed">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Lihat file di mode Edit</p>
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
        <DialogContent className={editingImprest?.status === 'draft' ? 'max-w-6xl max-h-[90vh] overflow-y-auto' : 'max-w-5xl max-h-[90vh] overflow-y-auto p-0'}>
          <DialogHeader className={editingImprest?.status === 'draft' ? '' : 'px-6 pt-6 pb-2'}>
            <DialogTitle>Edit Imprest Fund</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{editingImprest?.status === 'draft' ? 'Ubah data imprest fund' : 'Ubah data imprest fund dan lengkapi informasi yang diperlukan'}</p>
          </DialogHeader>
          {editingImprest && (
            <>
              {editingImprest.status === 'draft' && (
                <div className="space-y-6">
                  <div className="space-y-2"><Label>Kelompok Kegiatan</Label><Input value={editingImprest.kelompokKegiatan} onChange={(e) => setEditingImprest({...editingImprest, kelompokKegiatan: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Alokasi Anggaran Regional</Label>
                    <Select value={editingImprest.regionalCode || ''} onValueChange={(value) => setEditingImprest({...editingImprest, regionalCode: value})}>
                      <SelectTrigger><SelectValue placeholder="Pilih regional" /></SelectTrigger>
                      <SelectContent>{regionals.map((r: Regional) => <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Detail Uraian Penggunaan</Label>
                      <Button onClick={() => { const newItem: ImprestItem = { id: Date.now().toString(), tanggal: new Date(), uraian: '', glAccountId: '', glAccount: undefined, jumlah: 0 }; setEditingImprest({...editingImprest, items: [...editingImprest.items, newItem]}) }} className="gap-2" size="sm"><Plus className="h-4 w-4" />Tambah Uraian</Button>
                    </div>
                    {editingImprest.items.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="flex flex-col items-center gap-3"><div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><FileText className="h-6 w-6 text-gray-400" /></div><p className="text-sm text-muted-foreground">Belum ada uraian penggunaan</p></div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 border-b font-medium text-sm">
                          <div className="col-span-2">Tanggal</div><div className="col-span-3">Uraian</div><div className="col-span-4">GL Account</div><div className="col-span-2">Jumlah (Rp)</div><div className="col-span-1 text-center">Aksi</div>
                        </div>
                        <div className="divide-y">
                          {editingImprest.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50">
                              <div className="col-span-2"><DatePicker date={item.tanggal} onSelect={(date) => { if (date) { const updatedItems = editingImprest.items.map(i => i.id === item.id ? { ...i, tanggal: date } : i); setEditingImprest({...editingImprest, items: updatedItems}) }}} placeholder="Pilih tanggal" /></div>
                              <div className="col-span-3"><Input value={item.uraian} onChange={(e) => { const updatedItems = editingImprest.items.map(i => i.id === item.id ? { ...i, uraian: e.target.value } : i); setEditingImprest({...editingImprest, items: updatedItems}) }} placeholder="Masukkan uraian" /></div>
                              <div className="col-span-4">
                                <Select value={item.glAccountId} onValueChange={(value) => { const selectedGl = glAccounts.find((gl: GlAccount) => gl.id === value); const updatedItems = editingImprest.items.map(i => i.id === item.id ? { ...i, glAccountId: value, glAccount: selectedGl } : i); setEditingImprest({...editingImprest, items: updatedItems}) }}>
                                  <SelectTrigger><SelectValue placeholder="Pilih GL Account" /></SelectTrigger>
                                  <SelectContent>{glAccounts.map((gl: GlAccount) => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2"><CurrencyInput value={item.jumlah} onChange={(value) => { const updatedItems = editingImprest.items.map(i => i.id === item.id ? { ...i, jumlah: value } : i); const newTotal = updatedItems.reduce((sum, i) => sum + i.jumlah, 0); setEditingImprest({...editingImprest, items: updatedItems, totalAmount: newTotal}) }} /></div>
                              <div className="col-span-1 flex justify-center"><Button variant="ghost" size="sm" onClick={() => { const updatedItems = editingImprest.items.filter(i => i.id !== item.id); const newTotal = updatedItems.reduce((sum, i) => sum + i.jumlah, 0); setEditingImprest({...editingImprest, items: updatedItems, totalAmount: newTotal}) }} className="text-red-500 hover:text-red-700 h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button></div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end p-4 bg-blue-50 border-t"><div className="flex items-center gap-3"><span className="text-sm font-medium text-gray-700">Total Amount:</span><span className="text-lg font-bold text-blue-600">Rp {editingImprest.totalAmount.toLocaleString('id-ID')}</span></div></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                    <Button variant="outline" onClick={handleEditImprest} className="gap-2" disabled={updateImprestFund.isPending}><Save className="h-4 w-4" />{updateImprestFund.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
                    <Button onClick={async () => {
                      if (!editingImprest.regionalCode) { setMessage('Alokasi anggaran regional harus dipilih untuk submit!'); setTimeout(() => setMessage(''), 3000); return }
                      const updatedImprest = {...editingImprest, status: 'open' as const}
                      try {
                        await updateImprestFund.mutateAsync({ id: editingImprest.id, data: { kelompokKegiatan: updatedImprest.kelompokKegiatan, regionalCode: updatedImprest.regionalCode, status: 'open', items: updatedImprest.items.map(item => ({ tanggal: item.tanggal, uraian: item.uraian, glAccountId: item.glAccountId, jumlah: item.jumlah })) }})
                        setMessage('Imprest Fund berhasil disubmit dan status berubah menjadi Open!')
                        setShowEditDialog(false); setEditingImprest(null)
                      } catch (error) { setMessage('Gagal submit Imprest Fund!') }
                      setTimeout(() => setMessage(''), 3000)
                    }} className="gap-2" disabled={updateImprestFund.isPending}><CheckCircle className="h-4 w-4" />Submit</Button>
                  </div>
                </div>
              )}
              {editingImprest.status !== 'draft' && (
                <div className="grid grid-cols-3 gap-0">
                  <div className="col-span-2 px-6 pb-6 space-y-4 border-r">
                    {/* Kelompok Kegiatan */}
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Kelompok Kegiatan</Label>
                      <Input value={editingImprest.kelompokKegiatan} onChange={(e) => setEditingImprest({...editingImprest, kelompokKegiatan: e.target.value})} />
                    </div>

                    {/* Alokasi Anggaran Regional */}
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Alokasi Anggaran Regional</Label>
                      <Input value={regionals.find((r: Regional) => r.code === editingImprest.regionalCode)?.name || '-'} disabled className="bg-muted/50 font-medium" />
                    </div>

                    {/* Jumlah Item, Total Kredit, Debit/Top Up */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Jumlah Item</Label>
                        <Input value={`${editingImprest.items.length} item`} disabled className="bg-muted/50 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Total Kredit (Rp)</Label>
                        <Input value={editingImprest.totalAmount.toLocaleString('id-ID')} disabled className="bg-muted/50 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Debit/Top Up (Rp)</Label>
                        <Input value={editingImprest.debit > 0 ? editingImprest.debit.toLocaleString('id-ID') : '-'} disabled className="bg-muted/50 font-medium" />
                      </div>
                    </div>

                    {/* Kartu Imprest Fund, Tanggal Dibuat */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Kartu Imprest Fund</Label>
                        <Input value={editingImprest.imprestFundCard ? `${editingImprest.imprestFundCard.nomorKartu} - ${editingImprest.imprestFundCard.user}` : '-'} disabled className="bg-muted/50 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Tanggal Dibuat</Label>
                        <Input value={format(new Date(editingImprest.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })} disabled className="bg-muted/50 font-medium" />
                      </div>
                    </div>
                    
                    {/* Detail Uraian - Collapsible with Card Shadow */}
                    <Collapsible open={isUraianOpen} onOpenChange={setIsUraianOpen}>
                      <div className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold">Detail Uraian Penggunaan</span>
                            </div>
                            {isUraianOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 text-xs font-medium">
                              <div className="col-span-2">Tanggal</div>
                              <div className="col-span-4">Uraian</div>
                              <div className="col-span-3">GL Account</div>
                              <div className="col-span-3 text-right">Jumlah</div>
                            </div>
                            {editingImprest.items.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 p-3 border-t text-sm">
                                <div className="col-span-2">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}</div>
                                <div className="col-span-4">{item.uraian}</div>
                                <div className="col-span-3 truncate">{item.glAccount?.code} - {item.glAccount?.description}</div>
                                <div className="col-span-3 text-right font-medium whitespace-nowrap">Rp {item.jumlah.toLocaleString('id-ID')}</div>
                              </div>
                            ))}
                            <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50 border-t text-sm font-semibold">
                              <div className="col-span-9 text-right">Total:</div>
                              <div className="col-span-3 text-right text-blue-600 whitespace-nowrap">Rp {editingImprest.totalAmount.toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>

                    {/* Finance Info Section */}
                    <div className="pt-4 border-t space-y-4">
                      <p className="text-sm font-semibold text-muted-foreground">Informasi Finance</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No. Tiket Mydx</Label><Input value={editingImprest.noTiketMydx || ''} onChange={(e) => setEditingImprest({...editingImprest, noTiketMydx: e.target.value})} /></div>
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Serahkan ke Finance</Label><DatePicker date={editingImprest.tglSerahFinance ? new Date(editingImprest.tglSerahFinance) : undefined} onSelect={(date) => setEditingImprest({...editingImprest, tglSerahFinance: date})} /></div>
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">PIC Finance</Label><Input value={editingImprest.picFinance || ''} onChange={(e) => setEditingImprest({...editingImprest, picFinance: e.target.value})} /></div>
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">No HP Finance</Label><Input value={editingImprest.noHpFinance || ''} onChange={(e) => setEditingImprest({...editingImprest, noHpFinance: e.target.value})} /></div>
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Tgl Transfer Vendor</Label><DatePicker date={editingImprest.tglTransferVendor ? new Date(editingImprest.tglTransferVendor) : undefined} onSelect={(date) => setEditingImprest({...editingImprest, tglTransferVendor: date})} /></div>
                        <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">Nilai Transfer (Rp)</Label><CurrencyInput value={editingImprest.nilaiTransfer || 0} onChange={(value) => setEditingImprest({...editingImprest, nilaiTransfer: value})} /></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                      <Button onClick={handleEditImprest} disabled={updateImprestFund.isPending}>{updateImprestFund.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
                    </div>
                  </div>

                  {/* Right Side - Status & Task Checklist */}
                  <div className="col-span-1 px-5 py-6 bg-muted/30">
                    {/* Status */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <span className="text-sm font-semibold">Status</span>
                      <StatusBadge status={editingImprest.status} />
                    </div>

                    {/* Task Checklist */}
                    <div className="space-y-4">
                      <p className="text-sm font-semibold">Task Checklist</p>
                      <div className="space-y-3">
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingImprest.taskPengajuan ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={editingImprest.taskPengajuan} disabled className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${editingImprest.taskPengajuan ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingImprest.taskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={editingImprest.taskTransferVendor} onCheckedChange={(c) => setEditingImprest({...editingImprest, taskTransferVendor: !!c})} className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${editingImprest.taskTransferVendor ? 'text-green-700' : ''}`}>Transfer ke Vendor</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingImprest.taskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={editingImprest.taskTerimaBerkas} onCheckedChange={(c) => setEditingImprest({...editingImprest, taskTerimaBerkas: !!c})} className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${editingImprest.taskTerimaBerkas ? 'text-green-700' : ''}`}>Terima kwitansi IF</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.noTiketMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={!!editingImprest.noTiketMydx} disabled className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${!!editingImprest.noTiketMydx ? 'text-green-700' : ''}`}>Upload ke Mydx</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.tglSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={!!editingImprest.tglSerahFinance} disabled className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${!!editingImprest.tglSerahFinance ? 'text-green-700' : ''}`}>Serahkan berkas ke Finance</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.tglTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <Checkbox checked={!!editingImprest.tglTransferVendor} disabled className="data-[state=checked]:bg-green-500" />
                          <span className={`text-sm ${!!editingImprest.tglTransferVendor ? 'text-green-700' : ''}`}>Refund Finance</span>
                        </div>
                      </div>
                    </div>
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
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleFilePreview(file)}><p className="text-sm font-medium truncate">{file.originalName}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p></div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
            <AlertDialogDescription>Item akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteItemId && items.find(i => i.id === deleteItemId)) deleteItem(deleteItemId); else handleDeleteImprestFund() }} className="bg-red-500 hover:bg-red-600">{deleteImprestFund.isPending ? 'Menghapus...' : 'Hapus'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl"><img src={previewImage} alt="Preview" className="w-full h-auto" /></DialogContent>
        </Dialog>
      )}
    </div>
  )
}
