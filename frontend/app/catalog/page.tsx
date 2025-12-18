"use client"

import type React from "react"

import { AppLayout } from "@/components/app-layout"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Package, Plus, Mic, Search, Filter, Edit, Trash2, MoreVertical, Building2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type CatalogItem = {
  id: string
  name: string
  description: string
  price: number
  companyId: number
  createdAt: string
}

type Company = {
  id: number
  name: string
  logo: string | null
}

export default function CatalogPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([])
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "price">("name")

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  // Form State
  const [currentItem, setCurrentItem] = useState<Partial<CatalogItem>>({
    name: "",
    description: "",
    price: 0,
    companyId: undefined,
  })
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)



  useEffect(() => {
    // Load data
    const savedItems = localStorage.getItem("catalogItems")
    const savedCompanies = localStorage.getItem("companies")

    if (savedItems) {
      setItems(JSON.parse(savedItems))
    }
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies))
    }
  }, [])

  useEffect(() => {
    // Filter items
    let result = [...items]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    }

    if (selectedCompanyFilter !== "all") {
      result = result.filter((item) => item.companyId.toString() === selectedCompanyFilter)
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else {
        return a.price - b.price
      }
    })

    setFilteredItems(result)
  }, [items, searchQuery, selectedCompanyFilter, sortBy])

  const handleSaveItem = () => {
    if (!currentItem.name || !currentItem.price || !currentItem.companyId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields (Name, Price, Company).",
        variant: "destructive",
      })
      return
    }

    const newItem: CatalogItem = {
      id: currentItem.id || Date.now().toString(),
      name: currentItem.name,
      description: currentItem.description || "",
      price: Number(currentItem.price),
      companyId: Number(currentItem.companyId),
      createdAt: currentItem.createdAt || new Date().toISOString(),
    }

    let updatedItems
    if (isEditing) {
      updatedItems = items.map((item) => (item.id === newItem.id ? newItem : item))
      toast({
        title: "Item updated",
        description: "The product/service has been updated successfully.",
      })
    } else {
      updatedItems = [...items, newItem]
      toast({
        title: "Item created",
        description: "The product/service has been added to your catalog.",
      })
    }

    setItems(updatedItems)
    localStorage.setItem("catalogItems", JSON.stringify(updatedItems))
    setIsAddModalOpen(false)
    resetForm()
  }

  const handleDeleteItem = () => {
    if (itemToDelete) {
      const updatedItems = items.filter((item) => item.id !== itemToDelete)
      setItems(updatedItems)
      localStorage.setItem("catalogItems", JSON.stringify(updatedItems))
      toast({
        title: "Item deleted",
        description: "The product/service has been removed.",
      })
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    }
  }

  const resetForm = () => {
    setCurrentItem({
      name: "",
      description: "",
      price: 0,
      companyId: undefined,
    })
    setIsEditing(false)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const openEditModal = (item: CatalogItem) => {
    setCurrentItem(item)
    setIsEditing(true)
    setIsAddModalOpen(true)
  }

  const openDeleteModal = (id: string) => {
    setItemToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const getCompanyName = (id: number) => {
    const company = companies.find((c) => c.id === id)
    return company ? company.name : "Unknown Company"
  }



  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8" />
              Catalog
            </h1>
            <p className="text-muted-foreground mt-1">
              Save your products and services and link them to the correct company.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Link href="/catalog/voice">
              <Button variant="outline" className="gap-2 flex-1 md:flex-none w-full">
                <Mic className="h-4 w-4" />
                Catalog by Voice
              </Button>
            </Link>
            <Button className="gap-2 flex-1 md:flex-none" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or services..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price">Price (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-secondary/20">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {items.length === 0
                ? "Your catalog is empty. Add your first product or service."
                : "No items match your search filters."}
            </p>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-card border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Building2 className="h-3 w-3" />
                        {getCompanyName(item.companyId)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDeleteModal(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                    {item.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Item" : "Add New Item"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the details of your product or service."
                  : "Create a new product or service for your catalog."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Web Design Service"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the product or service..."
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={currentItem.price}
                    onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={currentItem.companyId?.toString()}
                    onValueChange={(v) => setCurrentItem({ ...currentItem, companyId: Number(v) })}
                  >
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem}>{isEditing ? "Save Changes" : "Create Item"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteItem}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
