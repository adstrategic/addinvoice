"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
}

export default function EditInvoicePage() {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Web Design Services", quantity: 1, unitPrice: 2500, tax: 10 },
    { id: "2", description: "SEO Optimization", quantity: 1, unitPrice: 1500, tax: 10 },
    { id: "3", description: "Content Creation", quantity: 3, unitPrice: 500, tax: 10 },
  ])

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, tax: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/invoices/INV-001">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Invoice</h1>
              <p className="text-muted-foreground mt-1">Update invoice details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent">
              Cancel
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Information Sidebar */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Company Name</Label>
                <Input placeholder="ADSTRATEGIC" className="mt-1" defaultValue="ADSTRATEGIC" />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  placeholder="123 Business St, City, Country"
                  className="mt-1"
                  rows={2}
                  defaultValue="123 Business St, City, Country"
                />
              </div>
              <div>
                <Label>NIT / Tax ID</Label>
                <Input placeholder="123456789-0" className="mt-1" defaultValue="123456789-0" />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@adstrategic.com"
                  className="mt-1"
                  defaultValue="contact@adstrategic.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" placeholder="+1 (555) 123-4567" className="mt-1" defaultValue="+1 (555) 123-4567" />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input placeholder="INV-001" className="mt-1" defaultValue="INV-001" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select defaultValue="pending">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Issue Date</Label>
                    <Input type="date" className="mt-1" defaultValue="2025-01-15" />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" className="mt-1" defaultValue="2025-02-15" />
                  </div>
                </div>

                <div>
                  <Label>Client Name</Label>
                  <Input placeholder="Enter client name" className="mt-1" defaultValue="Acme Corp" />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground">Items / Services</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Product or service description"
                            className="mt-1"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...items]
                              newItems[index].description = e.target.value
                              setItems(newItems)
                            }}
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              className="mt-1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[index].quantity = Number(e.target.value)
                                setItems(newItems)
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="mt-1"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[index].unitPrice = Number(e.target.value)
                                setItems(newItems)
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Tax (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              className="mt-1"
                              value={item.tax}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[index].tax = Number(e.target.value)
                                setItems(newItems)
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total</Label>
                            <div className="mt-1 h-10 flex items-center px-3 rounded-md bg-muted text-foreground font-semibold">
                              ${calculateItemTotal(item).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add any additional notes or comments..."
                    className="mt-1"
                    rows={3}
                    defaultValue="Thank you for your business!"
                  />
                </div>
                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Payment terms, late fees, etc..."
                    className="mt-1"
                    rows={3}
                    defaultValue="Payment is due within 30 days. Late payments may incur additional fees."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
