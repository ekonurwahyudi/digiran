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

// StatusBadge component like in transaction page
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

interface GlAccount {
  id: string
  code: string
  description: string
}

interface ImprestItem {
  id: string
  tanggal: Date
  uraian: string
  glAccountId: string
  glAccount?: GlAccount
  jumlah: number
}

interface ImprestFund {
  id: string
  kelompokKegiatan: string
  regionalCode?: string
  items: ImprestItem[]
  status: 'draft' | 'open' | 'proses' | 'close'
  totalAmount: number
  debit: number
  keterangan?: string
  imprestFundCardId?: string
  imprestFundCard?: ImprestFundCard
  
  // Finance fields
  noTiketMydx?: string
  tglSerahFinance?: Date
  picFinance?: string
  noHpFinance?: string
  tglTransferVendor?: Date
  nilaiTransfer?: number
  
  // Task Checklist
  taskPengajuan: boolean
  taskTransferVendor: boolean
  taskTerimaBerkas: boolean
  taskUploadMydx: boolean
  taskSerahFinance: boolean
  taskVendorDibayar: boolean
  
  createdAt: Date
  updatedAt: Date
  transactions?: Transaction[]
}

interface ImprestFundCard {
  id: string
  nomorKartu: string
  user: string
  saldo: number
  pic: string
  isActive: boolean
}

interface Vendor {
  id: string
  name: string
  alamat?: string
  pic?: string
  phone?: string
  email?: string
}

interface Transaction {
  id: string
  glAccountId: string
  glAccount: GlAccount
  quarter: number
  regionalCode: string
  kegiatan: string
  regionalPengguna: string
  year: number
  status: string
  imprestFundId?: string
}

interface Regional {
  id: string
  code: string
  name: string
}

export default function ImprestFundPage() {
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([])
  const [imprestFunds, setImprestFunds] = useState<ImprestFund[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [autoSaving, setAutoSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // Edit states
  const [editingImprest, setEditingImprest] = useState<ImprestFund | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUraianOpen, setIsUraianOpen] = useState(false)
  
  // Vendors for dropdown
  const [vendors, setVendors] = useState<Vendor[]>([])
  
  // Regional allocation states
  const [regionals, setRegionals] = useState<Regional[]>([])
  const [selectedRegionalCode, setSelectedRegionalCode] = useState('')
  
  // Top Up states
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [imprestFundCards, setImprestFundCards] = useState<ImprestFundCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState(0)
  const [topUpKeterangan, setTopUpKeterangan] = useState('')
  
  // Selected card for input form (default to first card)
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
  
  // Search state for history table
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!kelompokKegiatan || items.length === 0) return

    const autoSaveTimer = setTimeout(() => {
      if (validateItems()) {
        autoSaveDraft()
      }
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [kelompokKegiatan, items])

  const autoSaveDraft = async () => {
    setAutoSaving(true)
    try {
      const response = await fetch('/api/imprest-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompokKegiatan,
          items: items.map(item => ({
            tanggal: item.tanggal,
            uraian: item.uraian,
            glAccountId: item.glAccountId,
            jumlah: item.jumlah
          })),
          status: 'draft'
        })
      })

      if (response.ok) {
        setMessage('Draft tersimpan otomatis')
        setTimeout(() => setMessage(''), 2000)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    }
    setAutoSaving(false)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load GL Accounts, Imprest Funds, Vendors, Regionals, and Cards in parallel
      const [glResponse, imprestResponse, vendorResponse, regionalResponse, cardResponse] = await Promise.all([
        fetch('/api/gl-account'),
        fetch('/api/imprest-fund'),
        fetch('/api/vendor'),
        fetch('/api/regional'),
        fetch('/api/imprest-fund-card')
      ])
      
      const glData = await glResponse.json()
      const imprestData = await imprestResponse.json()
      const vendorData = await vendorResponse.json()
      const regionalData = await regionalResponse.json()
      const cardData = await cardResponse.json()
      
      setGlAccounts(Array.isArray(glData) ? glData : [])
      setImprestFunds(Array.isArray(imprestData) ? imprestData : [])
      setVendors(Array.isArray(vendorData) ? vendorData : [])
      setRegionals(Array.isArray(regionalData) ? regionalData : [])
      
      const activeCards = Array.isArray(cardData) ? cardData.filter((c: ImprestFundCard) => c.isActive) : []
      setImprestFundCards(activeCards)
      
      // Set default card to first card if not already set
      if (activeCards.length > 0 && !selectedInputCardId) {
        setSelectedInputCardId(activeCards[0].id)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: ImprestItem = {
      id: Date.now().toString(),
      tanggal: new Date(),
      uraian: '',
      glAccountId: '',
      glAccount: undefined,
      jumlah: 0
    }

    setItems([...items, newItem])
    setMessage('Baris baru ditambahkan!')
    setTimeout(() => setMessage(''), 3000)
  }

  const updateItem = (itemId: string, field: keyof ImprestItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        
        // Update glAccount object when glAccountId changes
        if (field === 'glAccountId') {
          updatedItem.glAccount = glAccounts.find(gl => gl.id === value)
        }
        
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

  const deleteImprestFund = async () => {
    if (!deleteItemId) return
    
    try {
      const response = await fetch(`/api/imprest-fund/${deleteItemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage('Imprest Fund berhasil dihapus!')
        setShowDeleteDialog(false)
        setDeleteItemId(null)
        loadData()
      } else {
        setMessage('Gagal menghapus Imprest Fund!')
      }
    } catch (error) {
      console.error('Error deleting imprest fund:', error)
      setMessage('Gagal menghapus Imprest Fund!')
    }
    
    setTimeout(() => setMessage(''), 3000)
  }

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
      const response = await fetch('/api/imprest-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompokKegiatan,
          regionalCode: selectedRegionalCode || null, // Optional for draft
          imprestFundCardId: selectedInputCardId || null,
          items: items.map(item => ({
            tanggal: item.tanggal,
            uraian: item.uraian,
            glAccountId: item.glAccountId,
            jumlah: item.jumlah
          })),
          status: 'draft'
        })
      })

      if (response.ok) {
        setMessage('Draft berhasil disimpan!')
        // Reset form
        setKelompokKegiatan('')
        setSelectedRegionalCode('')
        setItems([])
        // Reset to first card
        if (imprestFundCards.length > 0) {
          setSelectedInputCardId(imprestFundCards[0].id)
        }
        // Reload data
        loadData()
      } else {
        setMessage('Gagal menyimpan draft!')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
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
      const response = await fetch('/api/imprest-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompokKegiatan,
          regionalCode: selectedRegionalCode,
          imprestFundCardId: selectedInputCardId || null,
          items: items.map(item => ({
            tanggal: item.tanggal,
            uraian: item.uraian,
            glAccountId: item.glAccountId,
            jumlah: item.jumlah
          })),
          status: 'open'
        })
      })

      if (response.ok) {
        setMessage('Imprest Fund berhasil disubmit dan status berubah menjadi Open!')
        // Reset form
        setKelompokKegiatan('')
        setSelectedRegionalCode('')
        setItems([])
        // Reset to first card
        if (imprestFundCards.length > 0) {
          setSelectedInputCardId(imprestFundCards[0].id)
        }
        // Reload data
        loadData()
      } else {
        setMessage('Gagal submit Imprest Fund!')
      }
    } catch (error) {
      console.error('Error submitting imprest fund:', error)
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
      const response = await fetch('/api/imprest-fund/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imprestFundCardId: selectedCardId,
          debit: topUpAmount,
          keterangan: topUpKeterangan
        })
      })

      if (response.ok) {
        setMessage('Top Up berhasil!')
        setShowTopUpDialog(false)
        setSelectedCardId('')
        setTopUpAmount(0)
        setTopUpKeterangan('')
        loadData()
      } else {
        const error = await response.json()
        setMessage(error.error || 'Gagal melakukan top up!')
      }
    } catch (error) {
      console.error('Error top up:', error)
      setMessage('Gagal melakukan top up!')
    }
    
    setTimeout(() => setMessage(''), 3000)
  }

  const handleEditImprest = async () => {
    if (!editingImprest) return

    // Validate items if status is draft
    if (editingImprest.status === 'draft') {
      const hasInvalidItems = editingImprest.items.some(item => 
        !item.tanggal || 
        !item.uraian.trim() || 
        !item.glAccountId || 
        item.jumlah <= 0
      )

      if (hasInvalidItems) {
        setMessage('Semua field pada uraian harus diisi dengan benar!')
        setTimeout(() => setMessage(''), 3000)
        return
      }
    }

    // Auto-calculate task values based on Finance Information
    const taskUploadMydx = !!editingImprest.noTiketMydx
    const taskSerahFinance = !!editingImprest.tglSerahFinance
    const taskVendorDibayar = !!editingImprest.tglTransferVendor

    // Auto determine status based on completion (for non-draft)
    let finalStatus = editingImprest.status
    if (editingImprest.status !== 'draft') {
      const isComplete = editingImprest.taskTransferVendor && 
                        editingImprest.taskTerimaBerkas &&
                        taskUploadMydx &&
                        taskSerahFinance &&
                        taskVendorDibayar
      
      finalStatus = isComplete ? 'close' : 'proses'
    }

    try {
      const response = await fetch(`/api/imprest-fund/${editingImprest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompokKegiatan: editingImprest.kelompokKegiatan,
          regionalCode: editingImprest.regionalCode,
          keterangan: editingImprest.keterangan,
          debit: editingImprest.debit,
          status: finalStatus,
          items: editingImprest.items.map(item => ({
            tanggal: item.tanggal,
            uraian: item.uraian,
            glAccountId: item.glAccountId,
            jumlah: item.jumlah
          })),
          // Finance fields
          noTiketMydx: editingImprest.noTiketMydx,
          tglSerahFinance: editingImprest.tglSerahFinance,
          picFinance: editingImprest.picFinance,
          noHpFinance: editingImprest.noHpFinance,
          tglTransferVendor: editingImprest.tglTransferVendor,
          nilaiTransfer: editingImprest.nilaiTransfer,
          // Task fields - auto-calculated based on Finance Information
          taskPengajuan: true,
          taskTransferVendor: editingImprest.taskTransferVendor,
          taskTerimaBerkas: editingImprest.taskTerimaBerkas,
          taskUploadMydx: taskUploadMydx,
          taskSerahFinance: taskSerahFinance,
          taskVendorDibayar: taskVendorDibayar
        })
      })

      if (response.ok) {
        setMessage('Imprest Fund berhasil diupdate!')
        setShowEditDialog(false)
        setEditingImprest(null)
        loadData()
      } else {
        setMessage('Gagal update Imprest Fund!')
      }
    } catch (error) {
      console.error('Error updating imprest fund:', error)
      setMessage('Gagal update Imprest Fund!')
    }
    
    setTimeout(() => setMessage(''), 3000)
  }

  // File upload functions
  const loadImprestFiles = async (imprestId: string) => {
    // Load files from first transaction (all transactions should have same files)
    try {
      const imprest = imprestFunds.find(i => i.id === imprestId)
      if (imprest?.transactions && imprest.transactions.length > 0) {
        const response = await fetch(`/api/transaction/${imprest.transactions[0].id}/files`)
        if (response.ok) {
          const filesData = await response.json()
          setFiles(filesData)
        } else {
          setFiles([])
        }
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

    // Get all transaction IDs for file upload (sync to all transactions)
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

        // Upload file to ALL transactions linked to this imprest fund
        for (const transaction of transactions) {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch(`/api/transaction/${transaction.id}/files`, {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const newFile = await response.json()
            // Only add to state from first transaction to avoid duplicates in UI
            if (!firstUploadedFile) {
              firstUploadedFile = newFile
            }
          } else {
            const error = await response.json()
            console.error(`Gagal upload ke transaction ${transaction.id}:`, error.error)
          }
        }

        // Add to files state (only once)
        if (firstUploadedFile) {
          setFiles(prev => [firstUploadedFile, ...prev])
        }
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
      // Delete file from ALL transactions linked to this imprest fund
      // We need to find and delete files with same originalName from all transactions
      const fileToDelete = files.find(f => f.id === fileId)
      if (!fileToDelete) return

      let deleteSuccess = false

      for (const transaction of transactions) {
        // Get files for this transaction
        const filesResponse = await fetch(`/api/transaction/${transaction.id}/files`)
        if (filesResponse.ok) {
          const transactionFiles = await filesResponse.json()
          // Find file with same originalName
          const matchingFile = transactionFiles.find((f: any) => f.originalName === fileToDelete.originalName)
          if (matchingFile) {
            const response = await fetch(`/api/transaction/${transaction.id}/files?fileId=${matchingFile.id}`, {
              method: 'DELETE'
            })
            if (response.ok) {
              deleteSuccess = true
            }
          }
        }
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
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB'
    } else {
      return bytes + ' B'
    }
  }

  const handleFilePreview = (file: any) => {
    if (file.mimeType.includes('image')) {
      setPreviewImage(file.filePath)
    } else {
      window.open(file.filePath, '_blank')
    }
  }

  const getFileIcon = (file: any) => {
    const mimeType = file.mimeType.toLowerCase()
    const fileName = file.originalName.toLowerCase()
    
    if (mimeType.includes('image')) {
      return (
        <div className="w-10 h-10 rounded overflow-hidden border">
          <img 
            src={file.filePath} 
            alt={file.originalName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
              if (nextElement) nextElement.style.display = 'flex'
            }}
          />
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center" style={{display: 'none'}}>
            <Image className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      )
    }
    
    if (mimeType.includes('pdf')) {
      return (
        <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
      )
    }
    
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
        fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return (
        <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
        </div>
      )
    }
    
    if (mimeType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return (
        <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center">
          <Presentation className="h-5 w-5 text-orange-600" />
        </div>
      )
    }
    
    if (mimeType.includes('word') || mimeType.includes('document') || 
        fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return (
        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
      )
    }
    
    return (
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
        <File className="h-5 w-5 text-gray-600" />
      </div>
    )
  }

  const totalAmount = items.reduce((sum, item) => sum + item.jumlah, 0)

  const validateItems = () => {
    return items.every(item => 
      item.tanggal && 
      item.uraian.trim() !== '' && 
      item.glAccountId !== '' && 
      item.jumlah > 0
    )
  }

  // Filter and count by status - ensure imprestFunds is an array
  const imprestFundsArray = Array.isArray(imprestFunds) ? imprestFunds : []
  
  const filteredImprestFunds = imprestFundsArray.filter(imprest => {
    // Filter by tab
    if (activeTab !== 'all' && imprest.status !== activeTab) return false
    // Filter by search query
    if (searchQuery && !imprest.kelompokKegiatan.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const draftCount = imprestFundsArray.filter(t => t.status === 'draft').length
  const openCount = imprestFundsArray.filter(t => t.status === 'open').length
  const prosesCount = imprestFundsArray.filter(t => t.status === 'proses').length
  const closeCount = imprestFundsArray.filter(t => t.status === 'close').length

  const historyColumns: ColumnDef<ImprestFund>[] = [
    { 
      accessorKey: 'kelompokKegiatan', 
      header: 'Kegiatan',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.kelompokKegiatan}>
          {row.original.kelompokKegiatan}
        </div>
      )
    },
    { 
      accessorKey: 'imprestFundCard.user', 
      header: 'User IF',
      cell: ({ row }) => row.original.imprestFundCard?.user || '-'
    },
    { 
      accessorKey: 'items', 
      header: 'Jumlah Item', 
      cell: ({ row }) => `${row.original.items.length} item`
    },
    { 
      accessorKey: 'totalAmount', 
      header: () => <div className="text-right">Kredit (Rp)</div>, 
      cell: ({ row }) => <div className="text-right font-medium">{row.original.totalAmount.toLocaleString('id-ID')}</div>
    },
    { 
      accessorKey: 'debit', 
      header: () => <div className="text-right">Debit (Rp)</div>, 
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {row.original.debit > 0 ? row.original.debit.toLocaleString('id-ID') : '-'}
        </div>
      )
    },
    { 
      accessorKey: 'status', 
      header: 'Status', 
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Tanggal Dibuat', 
      cell: ({ row }) => format(row.original.createdAt, 'dd MMM yyyy HH:mm', { locale: idLocale })
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              setViewingImprest(row.original); 
              loadImprestFiles(row.original.id);
              setShowViewDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {(row.original.status === 'draft' || row.original.status === 'open' || row.original.status === 'proses') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { 
                setEditingImprest(row.original); 
                setIsUraianOpen(false);
                loadImprestFiles(row.original.id);
                setShowEditDialog(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setDeleteItemId(row.original.id)
              setShowDeleteDialog(true)
            }}
            className="text-red-500 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <TableSkeleton title="Imprest Fund" showFilters={false} showActions={true} rows={5} columns={5} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Imprest Fund</h1>
          <p className="text-muted-foreground text-sm">Kelola dana imprest dan pencatatan penggunaan</p>
        </div>
        <Button onClick={() => setShowTopUpDialog(true)} className="gap-2" variant="default">
          <Plus className="h-4 w-4" />
          Top Up
        </Button>
      </div>

      {message && (
        <div className={`border px-4 py-3 rounded-xl flex items-center gap-2 ${
          message.includes('otomatis') 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : message.includes('berhasil') || message.includes('ditambahkan')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle className="h-4 w-4" />
          {message}
        </div>
      )}

      {autoSaving && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
          Menyimpan draft...
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Saldo IF */}
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo IF</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {(5000000).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sisa Saldo */}
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sisa Saldo</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {(imprestFundCards.reduce((sum, card) => sum + card.saldo, 0)).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Belum Refund */}
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Belum Refund</p>
                <p className="text-2xl font-bold text-orange-600">
                  Rp {imprestFundsArray
                    .filter(i => i.status === 'open' || i.status === 'proses')
                    .reduce((sum, i) => sum + i.totalAmount, 0)
                    .toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Hourglass className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Form */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Input Imprest Fund
          </CardTitle>
          <CardDescription>Buat pencatatan imprest fund baru</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 3 Column Layout: Kelompok Kegiatan, Imprest Fund Card, Alokasi Anggaran */}
          <div className="grid grid-cols-3 gap-4">
            {/* Kelompok Kegiatan - Left */}
            <div className="space-y-2">
              <Label>Kelompok Kegiatan</Label>
              <Input 
                value={kelompokKegiatan}
                onChange={(e) => setKelompokKegiatan(e.target.value)}
                placeholder="Masukkan kelompok kegiatan"
                required
              />
            </div>

            {/* Imprest Fund Card - Center */}
            <div className="space-y-2">
              <Label>Imprest Fund Card (User)</Label>
              <Select value={selectedInputCardId} onValueChange={setSelectedInputCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kartu" />
                </SelectTrigger>
                <SelectContent>
                  {imprestFundCards.map(card => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alokasi Anggaran Regional - Right */}
            <div className="space-y-2">
              <Label>Alokasi Anggaran Regional</Label>
              <Select value={selectedRegionalCode} onValueChange={setSelectedRegionalCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih regional" />
                </SelectTrigger>
                <SelectContent>
                  {regionals.map(r => (
                    <SelectItem key={r.id} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={addItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Uraian
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Belum ada uraian penggunaan</p>
                  <p className="text-xs text-muted-foreground">Klik "Tambah Uraian" untuk menambah item</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                  <div className="col-span-2">Tanggal</div>
                  <div className="col-span-4">Uraian</div>
                  <div className="col-span-3">GL Account</div>
                  <div className="col-span-2">Jumlah (Rp)</div>
                  <div className="col-span-1">Aksi</div>
                </div>
                
                {/* Editable Rows */}
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg bg-white border-gray-200">
                    {/* Tanggal */}
                    <div className="col-span-2">
                      <DatePicker 
                        date={item.tanggal} 
                        onSelect={(date) => date && updateItem(item.id, 'tanggal', date)}
                        placeholder="Pilih tanggal"
                      />
                    </div>
                    
                    {/* Uraian */}
                    <div className="col-span-4">
                      <Textarea 
                        value={item.uraian}
                        onChange={(e) => updateItem(item.id, 'uraian', e.target.value)}
                        placeholder="Masukkan uraian penggunaan"
                        className="min-h-[40px] resize-none"
                      />
                    </div>
                    
                    {/* GL Account */}
                    <div className="col-span-3">
                      <Select 
                        value={item.glAccountId} 
                        onValueChange={(value) => updateItem(item.id, 'glAccountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih GL Account" />
                        </SelectTrigger>
                        <SelectContent>
                          {glAccounts.map(gl => (
                            <SelectItem key={gl.id} value={gl.id}>
                              {gl.code} - {gl.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Jumlah */}
                    <div className="col-span-2">
                      <CurrencyInput 
                        value={item.jumlah}
                        onChange={(value) => updateItem(item.id, 'jumlah', value)}
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setDeleteItemId(item.id); setShowDeleteDialog(true) }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Total */}
                <div className="flex justify-end">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-800">
                        Rp {totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {selectedInputCardId && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-600">Saldo IF:</span>
                          <span className="font-semibold text-gray-800">
                            Rp {(imprestFundCards.find(c => c.id === selectedInputCardId)?.saldo || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-600">Sisa Saldo IF:</span>
                          <span className={`font-semibold ${
                            ((imprestFundCards.find(c => c.id === selectedInputCardId)?.saldo || 0) - totalAmount) < 0 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            Rp {((imprestFundCards.find(c => c.id === selectedInputCardId)?.saldo || 0) - totalAmount).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={saveDraft} disabled={!kelompokKegiatan || items.length === 0 || !validateItems()}>
              <Save className="h-4 w-4 mr-2" />
              Simpan Draft
            </Button>
            <Button onClick={submitImprest} disabled={!kelompokKegiatan || items.length === 0 || !validateItems()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Section with Status Tabs */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Pencatatan Imprest Fund
          </CardTitle>
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
              
              {/* Search moved to right */}
              <Input 
                placeholder="Cari kelompok kegiatan..." 
                className="w-[250px] h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <TabsContent value="all">
              <DataTable 
                columns={historyColumns} 
                data={filteredImprestFunds}
              />
            </TabsContent>

            <TabsContent value="draft">
              <DataTable 
                columns={historyColumns} 
                data={filteredImprestFunds}
              />
            </TabsContent>

            <TabsContent value="open">
              <DataTable 
                columns={historyColumns} 
                data={filteredImprestFunds}
              />
            </TabsContent>

            <TabsContent value="proses">
              <DataTable 
                columns={historyColumns} 
                data={filteredImprestFunds}
              />
            </TabsContent>

            <TabsContent value="close">
              <DataTable 
                columns={historyColumns} 
                data={filteredImprestFunds}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Imprest Fund Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={editingImprest?.status === 'draft' ? 'max-w-6xl max-h-[90vh] overflow-y-auto' : 'max-w-5xl max-h-[90vh] overflow-y-auto p-0'}>
          <DialogHeader className={editingImprest?.status === 'draft' ? '' : 'px-6 pt-6 pb-2'}>
            <DialogTitle>Edit Imprest Fund</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {editingImprest?.status === 'draft' 
                ? 'Ubah data imprest fund' 
                : 'Ubah data imprest fund dan lengkapi informasi yang diperlukan'}
            </p>
          </DialogHeader>
          {editingImprest && (
            <>
              {/* Draft Mode - Simple Table Layout */}
              {editingImprest.status === 'draft' && (
                <div className="space-y-6">
                  {/* Kelompok Kegiatan */}
                  <div className="space-y-2">
                    <Label>Kelompok Kegiatan</Label>
                    <Input 
                      value={editingImprest.kelompokKegiatan}
                      onChange={(e) => setEditingImprest({...editingImprest, kelompokKegiatan: e.target.value})}
                    />
                  </div>

                  {/* Alokasi Anggaran Regional */}
                  <div className="space-y-2">
                    <Label>Alokasi Anggaran Regional</Label>
                    <Select 
                      value={editingImprest.regionalCode || ''} 
                      onValueChange={(value) => setEditingImprest({...editingImprest, regionalCode: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih regional" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionals.map(r => (
                          <SelectItem key={r.id} value={r.code}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Detail Uraian Penggunaan - Table Style */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Detail Uraian Penggunaan</Label>
                      <Button 
                        onClick={() => {
                          const newItem: ImprestItem = {
                            id: Date.now().toString(),
                            tanggal: new Date(),
                            uraian: '',
                            glAccountId: '',
                            glAccount: undefined,
                            jumlah: 0
                          }
                          setEditingImprest({
                            ...editingImprest, 
                            items: [...editingImprest.items, newItem]
                          })
                        }} 
                        className="gap-2"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Uraian
                      </Button>
                    </div>

                    {editingImprest.items.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">Belum ada uraian penggunaan</p>
                          <p className="text-xs text-muted-foreground">Klik "Tambah Uraian" untuk menambah item</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 border-b font-medium text-sm">
                          <div className="col-span-2">Tanggal</div>
                          <div className="col-span-3">Uraian</div>
                          <div className="col-span-4">GL Account</div>
                          <div className="col-span-2">Jumlah (Rp)</div>
                          <div className="col-span-1 text-center">Aksi</div>
                        </div>
                        
                        {/* Table Rows */}
                        <div className="divide-y">
                          {editingImprest.items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50">
                              {/* Tanggal */}
                              <div className="col-span-2">
                                <DatePicker 
                                  date={item.tanggal} 
                                  onSelect={(date) => {
                                    if (date) {
                                      const updatedItems = editingImprest.items.map(i => 
                                        i.id === item.id ? { ...i, tanggal: date } : i
                                      )
                                      setEditingImprest({...editingImprest, items: updatedItems})
                                    }
                                  }}
                                  placeholder="Pilih tanggal"
                                />
                              </div>
                              
                              {/* Uraian */}
                              <div className="col-span-3">
                                <Input 
                                  value={item.uraian}
                                  onChange={(e) => {
                                    const updatedItems = editingImprest.items.map(i => 
                                      i.id === item.id ? { ...i, uraian: e.target.value } : i
                                    )
                                    setEditingImprest({...editingImprest, items: updatedItems})
                                  }}
                                  placeholder="Masukkan uraian"
                                />
                              </div>
                              
                              {/* GL Account */}
                              <div className="col-span-4">
                                <Select 
                                  value={item.glAccountId} 
                                  onValueChange={(value) => {
                                    const selectedGl = glAccounts.find(gl => gl.id === value)
                                    const updatedItems = editingImprest.items.map(i => 
                                      i.id === item.id ? { ...i, glAccountId: value, glAccount: selectedGl } : i
                                    )
                                    setEditingImprest({...editingImprest, items: updatedItems})
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih GL Account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {glAccounts.map(gl => (
                                      <SelectItem key={gl.id} value={gl.id}>
                                        {gl.code} - {gl.description}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Jumlah */}
                              <div className="col-span-2">
                                <CurrencyInput 
                                  value={item.jumlah}
                                  onChange={(value) => {
                                    const updatedItems = editingImprest.items.map(i => 
                                      i.id === item.id ? { ...i, jumlah: value } : i
                                    )
                                    const newTotal = updatedItems.reduce((sum, i) => sum + i.jumlah, 0)
                                    setEditingImprest({...editingImprest, items: updatedItems, totalAmount: newTotal})
                                  }}
                                />
                              </div>
                              
                              {/* Delete Button */}
                              <div className="col-span-1 flex justify-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    const updatedItems = editingImprest.items.filter(i => i.id !== item.id)
                                    const newTotal = updatedItems.reduce((sum, i) => sum + i.jumlah, 0)
                                    setEditingImprest({...editingImprest, items: updatedItems, totalAmount: newTotal})
                                  }}
                                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Total */}
                        <div className="flex justify-end p-4 bg-blue-50 border-t">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                            <span className="text-lg font-bold text-blue-600">
                              Rp {editingImprest.totalAmount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Save as draft - keep status as draft
                        handleEditImprest()
                      }}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Simpan
                    </Button>
                    <Button 
                      onClick={async () => {
                        // Validate regional code for submit
                        if (!editingImprest.regionalCode) {
                          setMessage('Alokasi anggaran regional harus dipilih untuk submit!')
                          setTimeout(() => setMessage(''), 3000)
                          return
                        }

                        // Submit - change status to open
                        const updatedImprest = {...editingImprest, status: 'open' as const}
                        setEditingImprest(updatedImprest)
                        
                        // Call API to update with open status
                        try {
                          const response = await fetch(`/api/imprest-fund/${editingImprest.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              kelompokKegiatan: updatedImprest.kelompokKegiatan,
                              regionalCode: updatedImprest.regionalCode,
                              status: 'open',
                              items: updatedImprest.items.map(item => ({
                                tanggal: item.tanggal,
                                uraian: item.uraian,
                                glAccountId: item.glAccountId,
                                jumlah: item.jumlah
                              }))
                            })
                          })

                          if (response.ok) {
                            setMessage('Imprest Fund berhasil disubmit dan status berubah menjadi Open!')
                            setShowEditDialog(false)
                            setEditingImprest(null)
                            loadData()
                          } else {
                            setMessage('Gagal submit Imprest Fund!')
                          }
                        } catch (error) {
                          console.error('Error submitting imprest fund:', error)
                          setMessage('Gagal submit Imprest Fund!')
                        }
                        
                        setTimeout(() => setMessage(''), 3000)
                      }}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              {/* Non-Draft Mode - Complex Layout with Sidebar */}
              {editingImprest.status !== 'draft' && (
            <div className="grid grid-cols-3 gap-0">
              {/* Left Side - Form */}
              <div className="col-span-2 px-6 pb-6 space-y-4 border-r">
                {/* Kelompok Kegiatan */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Kelompok Kegiatan</Label>
                  <Input 
                    value={editingImprest.kelompokKegiatan}
                    onChange={(e) => setEditingImprest({...editingImprest, kelompokKegiatan: e.target.value})}
                    disabled
                  />
                </div>

                {/* Alokasi Anggaran Regional */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Alokasi Anggaran Regional</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                    <span className="text-sm">
                      {(() => {
                        const regional = regionals.find(r => r.code === editingImprest.regionalCode)
                        return regional ? regional.name : editingImprest.regionalCode || 'Tidak ada'
                      })()}
                    </span>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="flex items-center h-10">
                      <Badge variant={editingImprest.status === 'close' ? 'default' : editingImprest.status === 'proses' ? 'secondary' : 'destructive'}>
                        {editingImprest.status === 'close' ? 'Close' : editingImprest.status === 'proses' ? 'Proses' : 'Open'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Jumlah Item</Label>
                    <div className="flex items-center h-10">
                      <span className="text-sm font-medium">{editingImprest.items.length} item</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Total Amount</Label>
                    <div className="flex items-center h-10">
                      <span className="text-sm font-medium">Rp {editingImprest.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Uraian Section - With Collapsible Card */}
                <div className="pt-4 border-t">
                  <Collapsible open={isUraianOpen} onOpenChange={setIsUraianOpen}>
                    <Card className="border-2">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 rounded-t-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-base font-semibold">Detail Uraian Penggunaan</span>
                          </div>
                          {isUraianOpen ? (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-0 space-y-4">
                  
                  {editingImprest.items.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">Belum ada uraian penggunaan</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingImprest.items.map((item, index) => (
                          <div key={item.id} className="p-4 border rounded-lg bg-white space-y-3">
                            {/* Item Header */}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Uraian {index + 1}</span>
                            </div>

                            {/* Item Fields - Read Only */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-sm text-muted-foreground">Tanggal</Label>
                                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                                  <span className="text-sm">{format(item.tanggal, 'dd MMM yyyy', { locale: idLocale })}</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm text-muted-foreground">Jumlah (Rp)</Label>
                                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                                  <span className="text-sm">{item.jumlah.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm text-muted-foreground">GL Account</Label>
                              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                                <span className="text-sm">{item.glAccount?.code} - {item.glAccount?.description}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm text-muted-foreground">Uraian</Label>
                              <div className="min-h-[60px] p-3 border rounded-md bg-muted">
                                <span className="text-sm">{item.uraian}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>

                {/* Informasi Finance */}
                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Informasi Finance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">No. Tiket Mydx</Label>
                      <Input 
                        value={editingImprest.noTiketMydx || ''} 
                        onChange={(e) => setEditingImprest({...editingImprest, noTiketMydx: e.target.value})} 
                        placeholder="Masukkan no. tiket"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Tgl Serahkan ke Finance</Label>
                      <DatePicker 
                        date={editingImprest.tglSerahFinance ? new Date(editingImprest.tglSerahFinance) : undefined} 
                        onSelect={(date) => setEditingImprest({...editingImprest, tglSerahFinance: date})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">PIC Finance</Label>
                      <Input 
                        value={editingImprest.picFinance || ''} 
                        onChange={(e) => setEditingImprest({...editingImprest, picFinance: e.target.value})} 
                        placeholder="Masukkan PIC"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">No HP Finance</Label>
                      <Input 
                        value={editingImprest.noHpFinance || ''} 
                        onChange={(e) => setEditingImprest({...editingImprest, noHpFinance: e.target.value})} 
                        placeholder="Masukkan no. HP"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Tgl Transfer ke Vendor</Label>
                      <DatePicker 
                        date={editingImprest.tglTransferVendor ? new Date(editingImprest.tglTransferVendor) : undefined} 
                        onSelect={(date) => setEditingImprest({...editingImprest, tglTransferVendor: date})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Nilai Transfer (Rp)</Label>
                      <CurrencyInput 
                        value={editingImprest.nilaiTransfer || 0} 
                        onChange={(value) => setEditingImprest({...editingImprest, nilaiTransfer: value})} 
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
                  <Button onClick={handleEditImprest}>Simpan Perubahan</Button>
                </div>
              </div>

              {/* Right Side - Status & Tasks */}
              <div className="col-span-1 px-5 py-6 bg-muted/30">
                {/* Status */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <span className="text-sm font-semibold">Status</span>
                  <StatusBadge status={
                    (editingImprest.taskTransferVendor && editingImprest.taskTerimaBerkas &&
                     !!editingImprest.noTiketMydx && !!editingImprest.tglSerahFinance &&
                     !!editingImprest.tglTransferVendor) 
                      ? 'close' 
                      : 'proses'
                  } />
                </div>

                {/* Task Checklist */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Task Checklist</p>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${true ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${true ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingImprest.taskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox 
                        id="task-transfer" 
                        checked={editingImprest.taskTransferVendor}
                        onCheckedChange={(checked) => setEditingImprest({...editingImprest, taskTransferVendor: !!checked})}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label htmlFor="task-transfer" className={`text-sm cursor-pointer ${editingImprest.taskTransferVendor ? 'text-green-700' : ''}`}>Transfer ke Vendor</label>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${editingImprest.taskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox 
                        id="task-berkas" 
                        checked={editingImprest.taskTerimaBerkas}
                        onCheckedChange={(checked) => setEditingImprest({...editingImprest, taskTerimaBerkas: !!checked})}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label htmlFor="task-berkas" className={`text-sm cursor-pointer ${editingImprest.taskTerimaBerkas ? 'text-green-700' : ''}`}>Terima kwitansi IF</label>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.noTiketMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox 
                        checked={!!editingImprest.noTiketMydx}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className={`text-sm ${!!editingImprest.noTiketMydx ? 'text-green-700' : 'text-muted-foreground'}`}>Upload ke Mydx</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.tglSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox 
                        checked={!!editingImprest.tglSerahFinance}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className={`text-sm ${!!editingImprest.tglSerahFinance ? 'text-green-700' : 'text-muted-foreground'}`}>Serahkan berkas ke Finance</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!!editingImprest.tglTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox 
                        checked={!!editingImprest.tglTransferVendor}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className={`text-sm ${!!editingImprest.tglTransferVendor ? 'text-green-700' : 'text-muted-foreground'}`}>Refund Finance</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Lampiran File</p>
                    {files.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {files.length} file{files.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload Form - only show if has transactions */}
                  {editingImprest.transactions && editingImprest.transactions.length > 0 && (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="text-xs h-8"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {uploading && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          Uploading...
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, XLS, PPT, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  )}

                  {/* File List */}
                  {files.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-300">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Belum ada file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="group flex items-center gap-2 p-2 bg-white/50 border rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFilePreview(file)}
                              className="h-6 w-6 p-0"
                              title={file.mimeType.includes('image') ? 'Preview gambar' : 'Lihat file'}
                            >
                              <Eye className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              title="Hapus file"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteItemId && deleteItemId.length > 20 ? 'Hapus Imprest Fund?' : 'Hapus Uraian?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItemId && deleteItemId.length > 20 
                ? 'Tindakan ini tidak dapat dibatalkan. Imprest Fund akan dihapus secara permanen.'
                : 'Tindakan ini tidak dapat dibatalkan. Uraian akan dihapus dari daftar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteItemId(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteItemId) {
                  // Check if it's imprest fund ID (longer) or item ID (shorter)
                  if (deleteItemId.length > 20) {
                    deleteImprestFund()
                  } else {
                    deleteItem(deleteItemId)
                  }
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Imprest Fund Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
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
                  <Input 
                    value={regionals.find(r => r.code === viewingImprest.regionalCode)?.name || viewingImprest.regionalCode || '-'} 
                    disabled 
                    className="bg-muted/50 font-medium" 
                  />
                </div>

                {/* Basic Info Grid */}
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
                    <Input 
                      value={viewingImprest.debit > 0 ? viewingImprest.debit.toLocaleString('id-ID') : '-'} 
                      disabled 
                      className="bg-muted/50 font-medium text-green-600" 
                    />
                  </div>
                </div>

                {/* Card & Date Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Kartu Imprest Fund</Label>
                    <Input 
                      value={viewingImprest.imprestFundCard ? `${viewingImprest.imprestFundCard.nomorKartu} - ${viewingImprest.imprestFundCard.user}` : '-'} 
                      disabled 
                      className="bg-muted/50 font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Tanggal Dibuat</Label>
                    <Input value={format(viewingImprest.createdAt, 'dd MMMM yyyy HH:mm', { locale: idLocale })} disabled className="bg-muted/50 font-medium" />
                  </div>
                </div>

                {/* Uraian Section - Collapsible */}
                {viewingImprest.items && viewingImprest.items.length > 0 && (
                  <div className="pt-4 border-t">
                    <Collapsible defaultOpen>
                      <Card className="border-2">
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 rounded-t-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-600" />
                              <span className="text-base font-semibold">Detail Uraian Penggunaan</span>
                            </div>
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-3">
                            {viewingImprest.items.map((item, index) => (
                              <div key={item.id} className="p-4 border rounded-lg bg-white space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Uraian {index + 1}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-sm text-muted-foreground">Tanggal</Label>
                                    <Input value={format(item.tanggal, 'dd MMM yyyy', { locale: idLocale })} disabled className="bg-muted/50" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-sm text-muted-foreground">Jumlah (Rp)</Label>
                                    <Input value={item.jumlah.toLocaleString('id-ID')} disabled className="bg-muted/50" />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm text-muted-foreground">GL Account</Label>
                                  <Input value={`${item.glAccount?.code} - ${item.glAccount?.description}`} disabled className="bg-muted/50" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm text-muted-foreground">Uraian</Label>
                                  <div className="min-h-[40px] p-3 border rounded-md bg-muted/50">
                                    <span className="text-sm">{item.uraian}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>
                )}

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
                      <Label className="text-sm text-muted-foreground">Tgl Transfer ke Vendor</Label>
                      <Input value={viewingImprest.tglTransferVendor ? format(new Date(viewingImprest.tglTransferVendor), 'dd MMMM yyyy', { locale: idLocale }) : '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Nilai Transfer (Rp)</Label>
                      <Input value={viewingImprest.nilaiTransfer ? viewingImprest.nilaiTransfer.toLocaleString('id-ID') : '-'} disabled className="bg-muted/50 font-medium" />
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                {viewingImprest.keterangan && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Keterangan</Label>
                    <Textarea value={viewingImprest.keterangan} disabled className="bg-muted/50 font-medium min-h-[60px] resize-none" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>Tutup</Button>
                  {(viewingImprest.status === 'draft' || viewingImprest.status === 'open' || viewingImprest.status === 'proses') && (
                    <Button onClick={() => { 
                      setShowViewDialog(false); 
                      setEditingImprest(viewingImprest);
                      setIsUraianOpen(false);
                      loadImprestFiles(viewingImprest.id);
                      setShowEditDialog(true);
                    }}>Edit</Button>
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
                      <Checkbox checked={viewingImprest.taskPengajuan} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskPengajuan ? 'text-green-700' : ''}`}>Pengajuan Pengadaan</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskTransferVendor ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskTransferVendor} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskTransferVendor ? 'text-green-700' : ''}`}>Transfer ke Vendor</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskTerimaBerkas ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskTerimaBerkas} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskTerimaBerkas ? 'text-green-700' : ''}`}>Terima kwitansi IF</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskUploadMydx ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskUploadMydx} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskUploadMydx ? 'text-green-700' : ''}`}>Upload ke Mydx</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskSerahFinance ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskSerahFinance} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskSerahFinance ? 'text-green-700' : ''}`}>Serahkan berkas ke Finance</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${viewingImprest.taskVendorDibayar ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <Checkbox checked={viewingImprest.taskVendorDibayar} disabled className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                      <span className={`text-sm ${viewingImprest.taskVendorDibayar ? 'text-green-700' : ''}`}>Refund Finance</span>
                    </div>
                  </div>
                </div>

                {/* File Display Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Lampiran File</p>
                    {files.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {files.length} file{files.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {files.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50/50 rounded-lg border border-dashed border-gray-300">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Belum ada file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="group flex items-center gap-2 p-2 bg-white/50 border rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFilePreview(file)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={file.mimeType.includes('image') ? 'Preview gambar' : 'Lihat file'}
                          >
                            <Eye className="h-3 w-3 text-blue-600" />
                          </Button>
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

      {/* Top Up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Imprest Fund</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tambahkan saldo ke kartu imprest fund
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Kartu Imprest Fund</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kartu" />
                </SelectTrigger>
                <SelectContent>
                  {imprestFundCards.map(card => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nomorKartu} - {card.user} (Saldo: Rp {card.saldo.toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Top Up (Rp)</Label>
              <CurrencyInput
                value={topUpAmount}
                onChange={setTopUpAmount}
              />
            </div>

            <div className="space-y-2">
              <Label>Keterangan (Opsional)</Label>
              <Textarea
                value={topUpKeterangan}
                onChange={(e) => setTopUpKeterangan(e.target.value)}
                placeholder="Masukkan keterangan top up"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowTopUpDialog(false)
                  setSelectedCardId('')
                  setTopUpAmount(0)
                  setTopUpKeterangan('')
                }}
              >
                Batal
              </Button>
              <Button onClick={handleTopUp}>
                <Plus className="h-4 w-4 mr-2" />
                Top Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Preview Gambar</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {previewImage && (
              <div className="flex justify-center">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={() => {
                    setMessage('Gagal memuat gambar')
                    setTimeout(() => setMessage(''), 3000)
                    setPreviewImage(null)
                  }}
                />
              </div>
            )}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPreviewImage(null)}
              >
                Tutup
              </Button>
              <Button
                onClick={() => window.open(previewImage!, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Buka di Tab Baru
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}