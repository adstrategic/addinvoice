"use client"
import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Pencil, Trash2, FileText, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
}

type InvoiceDraft = {
  id: number
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  clientName: string
  companyName: string
  companyAddress: string
  companyNIT: string
  companyEmail: string
  companyPhone: string
  items: InvoiceItem[]
  notes: string
  terms: string
  logo: string | null
  subtotal: number
  totalTax: number
  total: number
  createdAt: string
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<InvoiceDraft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<InvoiceDraft | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = () => {
    const savedDrafts = JSON.parse(localStorage.getItem("invoiceDrafts") || "[]")
    setDrafts(savedDrafts)
  }

  const handleViewDraft = (draft: InvoiceDraft) => {
    setSelectedDraft(draft)
    setShowViewDialog(true)
  }

  const handleEditDraft = (draft: InvoiceDraft) => {
    localStorage.setItem("editingDraft", JSON.stringify(draft))
    router.push("/invoices/new")
  }

  const handleDeleteDraft = (id: number) => {
    setDraftToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteDraft = () => {
    if (draftToDelete === null) return

    const updatedDrafts = drafts.filter((d) => d.id !== draftToDelete)
    localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts))
    setDrafts(updatedDrafts)
    setShowDeleteDialog(false)
    setDraftToDelete(null)

    toast({
      title: "Draft deleted",
      description: "The draft has been removed successfully.",
    })
  }

  const handleClearAll = () => {
    setShowClearAllDialog(true)
  }

  const confirmClearAll = () => {
    localStorage.removeItem("invoiceDrafts")
    setDrafts([])
    setShowClearAllDialog(false)

    toast({
      title: "All drafts cleared",
      description: "All saved drafts have been permanently deleted.",
    })
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Saved Drafts</h1>
            <p className="text-muted-foreground mt-1">
              You have {drafts.length} saved {drafts.length === 1 ? "draft" : "drafts"}.
            </p>
          </div>
          {drafts.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive bg-transparent"
            >
              <Trash className="h-4 w-4" />
              Clear all drafts
            </Button>
          )}
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No drafts saved yet</h3>
              <p className="text-muted-foreground text-center mb-6">Create your first invoice to see it here.</p>
              <Button onClick={() => router.push("/invoices/new")}>Create Invoice</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Draft Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-medium">{draft.clientName || "Unnamed Client"}</TableCell>
                      <TableCell>{draft.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(draft.issueDate)}</TableCell>
                      <TableCell className="font-semibold">${draft.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {draft.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleViewDraft(draft)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleEditDraft(draft)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteDraft(draft.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Draft Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Complete details of the draft invoice</DialogDescription>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-6 py-4">
              {/* Header with logo */}
              <div className="flex justify-between items-start pb-6 border-b">
                <div>
                  {selectedDraft.logo && (
                    <img src={selectedDraft.logo || "/placeholder.svg"} alt="Company Logo" className="h-16 mb-4" />
                  )}
                  <h2 className="text-2xl font-bold text-foreground">{selectedDraft.companyName}</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                    {selectedDraft.companyAddress}
                  </p>
                  {selectedDraft.companyNIT && (
                    <p className="text-sm text-muted-foreground">NIT: {selectedDraft.companyNIT}</p>
                  )}
                  {selectedDraft.companyEmail && (
                    <p className="text-sm text-muted-foreground">{selectedDraft.companyEmail}</p>
                  )}
                  {selectedDraft.companyPhone && (
                    <p className="text-sm text-muted-foreground">{selectedDraft.companyPhone}</p>
                  )}
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-foreground">INVOICE</h3>
                  <p className="text-sm text-muted-foreground">#{selectedDraft.invoiceNumber}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {selectedDraft.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-3">
                    Issue Date: {formatDate(selectedDraft.issueDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">Due Date: {formatDate(selectedDraft.dueDate)}</p>
                </div>
              </div>

              {/* Client info */}
              <div className="py-4 border-b">
                <p className="text-sm font-semibold text-foreground mb-1">Bill To:</p>
                <p className="text-foreground">{selectedDraft.clientName}</p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Items / Services</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDraft.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.tax}%</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${calculateItemTotal(item).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold text-foreground">${selectedDraft.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax:</span>
                    <span className="font-semibold text-foreground">${selectedDraft.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">${selectedDraft.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes and terms */}
              {selectedDraft.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-foreground mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedDraft.notes}</p>
                </div>
              )}
              {selectedDraft.terms && (
                <div className="pt-4">
                  <p className="text-sm font-semibold text-foreground mb-1">Terms & Conditions:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedDraft.terms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedDraft && <Button onClick={() => handleEditDraft(selectedDraft)}>Edit Draft</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDraft}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Drafts</DialogTitle>
            <DialogDescription>
              This will permanently delete all saved drafts. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearAllDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
