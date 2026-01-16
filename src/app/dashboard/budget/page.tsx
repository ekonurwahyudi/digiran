'use client'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Calculator, Settings, Pencil, Trash2, CheckCircle } from 'lucide-react'

interface GlAccount { id: string; code: string; description: string; keterangan: string }
interface Regional { id: string; code: string; name: string }
interface Budget {
  id: string; glAccountId: string; year: number; totalAmount: number
  q1Amount: number; q2Amount: number; q3Amount: number; q4Amount: number
  glAccount: GlAccount; allocations: { regionalCode: string; quarter: number; amount: number }[]
}

export default function BudgetPage() {
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([])
  const [regionals, setRegionals] = useState<Regional[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedGl, setSelectedGl] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [totalAmount, setTotalAmount] = useState(0)
  const [quarters, setQuarters] = useState({ q1: 0, q2: 0, q3: 0, q4: 0 })
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [showAllocation, setShowAllocation] = useState(false)
  const [message, setMessage] = useState('')
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editTotal, setEditTotal] = useState(0)
  const [editQuarters, setEditQuarters] = useState({ q1: 0, q2: 0, q3: 0, q4: 0 })

  useEffect(() => {
    fetch('/api/gl-account').then(r => r.json()).then(setGlAccounts)
    fetch('/api/regional').then(r => r.json()).then(setRegionals)
  }, [])

  useEffect(() => { loadBudgets() }, [year])
  const loadBudgets = () => { fetch(`/api/budget?year=${year}`).then(r => r.json()).then(setBudgets) }

  const autoSplitQuarters = () => {
    const perQuarter = Math.floor(totalAmount / 4)
    setQuarters({ q1: perQuarter, q2: perQuarter, q3: perQuarter, q4: totalAmount - perQuarter * 3 })
  }

  const autoSplitEditQuarters = () => {
    const perQuarter = Math.floor(editTotal / 4)
    setEditQuarters({ q1: perQuarter, q2: perQuarter, q3: perQuarter, q4: editTotal - perQuarter * 3 })
  }

  const saveBudget = async () => {
    await fetch('/api/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ glAccountId: selectedGl, year, totalAmount, q1Amount: quarters.q1, q2Amount: quarters.q2, q3Amount: quarters.q3, q4Amount: quarters.q4 }),
    })
    loadBudgets(); setSelectedGl(''); setTotalAmount(0); setQuarters({ q1: 0, q2: 0, q3: 0, q4: 0 })
    setMessage('Anggaran berhasil disimpan!'); setTimeout(() => setMessage(''), 3000)
  }

  const openAllocation = (budget: Budget) => {
    setSelectedBudget(budget); setShowAllocation(true)
    const allocs: Record<string, number> = {}
    for (let q = 1; q <= 4; q++) {
      regionals.forEach((reg) => {
        const existing = budget.allocations.find(a => a.quarter === q && a.regionalCode === reg.code)
        allocs[`q${q}_${reg.code}`] = existing?.amount || 0
      })
    }
    setAllocations(allocs)
  }

  const autoSplitRegional = (quarter: number) => {
    const qAmount = selectedBudget?.[`q${quarter}Amount` as keyof Budget] as number || 0
    const count = regionals.length
    const perRegional = Math.floor(qAmount / count)
    const newAllocs = { ...allocations }
    regionals.forEach((reg, idx) => {
      newAllocs[`q${quarter}_${reg.code}`] = idx === count - 1 ? qAmount - perRegional * (count - 1) : perRegional
    })
    setAllocations(newAllocs)
  }

  const saveAllocations = async () => {
    if (!selectedBudget) return
    const allocs: { budgetId: string; quarter: number; regionalCode: string; amount: number }[] = []
    for (let q = 1; q <= 4; q++) {
      regionals.forEach((reg) => {
        allocs.push({ budgetId: selectedBudget.id, quarter: q, regionalCode: reg.code, amount: allocations[`q${q}_${reg.code}`] || 0 })
      })
    }
    await fetch('/api/budget/allocation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allocations: allocs }) })
    setShowAllocation(false); loadBudgets()
    setMessage('Alokasi regional berhasil disimpan!'); setTimeout(() => setMessage(''), 3000)
  }

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget); setEditTotal(budget.totalAmount)
    setEditQuarters({ q1: budget.q1Amount, q2: budget.q2Amount, q3: budget.q3Amount, q4: budget.q4Amount })
    setShowEditDialog(true)
  }

  const handleEdit = async () => {
    if (!editingBudget) return
    await fetch(`/api/budget/${editingBudget.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount: editTotal, q1Amount: editQuarters.q1, q2Amount: editQuarters.q2, q3Amount: editQuarters.q3, q4Amount: editQuarters.q4 }),
    })
    setShowEditDialog(false); setEditingBudget(null); loadBudgets()
    setMessage('Anggaran berhasil diupdate!'); setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/budget/${deleteId}`, { method: 'DELETE' })
    setShowDeleteDialog(false); setDeleteId(null); loadBudgets()
    setMessage('Anggaran berhasil dihapus!'); setTimeout(() => setMessage(''), 3000)
  }

  const columns: ColumnDef<Budget>[] = [
    { accessorKey: 'glAccount.code', header: 'GL Account', cell: ({ row }) => `${row.original.glAccount.code} - ${row.original.glAccount.description}` },
    { accessorKey: 'totalAmount', header: () => <div className="text-right">Total (Rp)</div>, cell: ({ row }) => <div className="text-right">{(row.getValue('totalAmount') as number).toLocaleString('id-ID')}</div> },
    { accessorKey: 'q1Amount', header: () => <div className="text-right">Q1 (Rp)</div>, cell: ({ row }) => <div className="text-right">{(row.getValue('q1Amount') as number).toLocaleString('id-ID')}</div> },
    { accessorKey: 'q2Amount', header: () => <div className="text-right">Q2 (Rp)</div>, cell: ({ row }) => <div className="text-right">{(row.getValue('q2Amount') as number).toLocaleString('id-ID')}</div> },
    { accessorKey: 'q3Amount', header: () => <div className="text-right">Q3 (Rp)</div>, cell: ({ row }) => <div className="text-right">{(row.getValue('q3Amount') as number).toLocaleString('id-ID')}</div> },
    { accessorKey: 'q4Amount', header: () => <div className="text-right">Q4 (Rp)</div>, cell: ({ row }) => <div className="text-right">{(row.getValue('q4Amount') as number).toLocaleString('id-ID')}</div> },
    { id: 'actions', header: 'Aksi', cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => openAllocation(row.original)}><Settings className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => { setDeleteId(row.original.id); setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Input Anggaran Tahunan</h1><p className="text-muted-foreground text-sm">Kelola anggaran per GL Account dan alokasi regional</p></div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Tahun:</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027, 2028].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2"><CheckCircle className="h-4 w-4" />{message}</div>}

      <Card className="border">
        <CardHeader><CardTitle>Form Input Anggaran</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>GL Account</Label>
              <Select value={selectedGl} onValueChange={setSelectedGl}>
                <SelectTrigger><SelectValue placeholder="Pilih GL Account" /></SelectTrigger>
                <SelectContent>{glAccounts.map(gl => <SelectItem key={gl.id} value={gl.id}>{gl.code} - {gl.description}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Total Anggaran (Rp)</Label><CurrencyInput value={totalAmount} onChange={setTotalAmount} /></div>
            <div className="flex items-end"><Button variant="secondary" onClick={autoSplitQuarters}><Calculator className="h-4 w-4 mr-2" />Bagi Otomatis</Button></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (
              <div key={q} className="space-y-2"><Label>Q{i + 1} (Rp)</Label><CurrencyInput value={quarters[q]} onChange={(v) => setQuarters({ ...quarters, [q]: v })} /></div>
            ))}
          </div>
          <Button onClick={saveBudget} disabled={!selectedGl}>Simpan Anggaran</Button>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader><CardTitle>Daftar Anggaran Tahun {year}</CardTitle></CardHeader>
        <CardContent><DataTable columns={columns} data={budgets} searchKey="glAccount.code" searchPlaceholder="Cari GL Account..." /></CardContent>
      </Card>

      {/* Allocation Modal */}
      {showAllocation && selectedBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-5xl w-full max-h-[90vh] overflow-auto border">
            <CardHeader><CardTitle>Alokasi Regional - {selectedBudget.glAccount.code}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map(q => (
                <div key={q} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Q{q} (Total: {(selectedBudget[`q${q}Amount` as keyof Budget] as number).toLocaleString('id-ID')})</span>
                    <Button variant="secondary" size="sm" onClick={() => autoSplitRegional(q)}><Calculator className="h-3 w-3 mr-1" />Bagi Otomatis</Button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {regionals.map((reg) => (
                      <div key={reg.id} className="space-y-1">
                        <Label className="text-xs">{reg.name}</Label>
                        <CurrencyInput value={allocations[`q${q}_${reg.code}`] || 0} onChange={(v) => setAllocations({ ...allocations, [`q${q}_${reg.code}`]: v })} className="h-8 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={saveAllocations}>Simpan Alokasi</Button>
                <Button variant="outline" onClick={() => setShowAllocation(false)}>Tutup</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit Anggaran - {editingBudget?.glAccount.code}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2"><Label>Total Anggaran (Rp)</Label><CurrencyInput value={editTotal} onChange={setEditTotal} /></div>
              <Button variant="secondary" onClick={autoSplitEditQuarters}><Calculator className="h-4 w-4 mr-2" />Bagi Otomatis</Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (
                <div key={q} className="space-y-2"><Label>Q{i + 1} (Rp)</Label><CurrencyInput value={editQuarters[q]} onChange={(v) => setEditQuarters({ ...editQuarters, [q]: v })} /></div>
              ))}
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button><Button onClick={handleEdit}>Simpan</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Anggaran?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
