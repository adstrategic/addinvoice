"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, FileText, Plus } from "lucide-react"
import { useState, useEffect } from "react"

type CompanyTemplate = {
  id: number
  name: string
  nit: string
  address: string
  email: string
  phone: string
  logo: string | null
  template: string
  isDefault: boolean
}

type TemplateSelectionDialogProps = {
  open: boolean
  onSelect: (template: CompanyTemplate | null) => void
  onOpenChange: (open: boolean) => void
}

export function TemplateSelectionDialog({ open, onSelect, onOpenChange }: TemplateSelectionDialogProps) {
  const [companies, setCompanies] = useState<CompanyTemplate[]>([])

  useEffect(() => {
    const savedCompanies = localStorage.getItem("companies")
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies))
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Invoice Template</DialogTitle>
          <DialogDescription>
            Select a company template to pre-fill invoice details, or start from scratch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Start from Scratch Option */}
          <Card
            className="bg-card border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onSelect(null)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">Start from Scratch</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create a new invoice without using a template</p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Company Templates */}
          {companies.length > 0 && (
            <>
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Company Templates
                </h3>
              </div>

              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="bg-card border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onSelect(company)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {company.logo ? (
                          <img
                            src={company.logo || "/placeholder.svg"}
                            alt={company.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-foreground truncate">{company.name}</h3>
                          {company.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{company.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">NIT: {company.nit || "Not set"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground capitalize">{company.template} Template</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {companies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No company templates found</p>
              <p className="text-sm text-muted-foreground mt-1">Add companies in Configuration to create templates</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
