"use client"

import type React from "react"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Save, Plus, Trash2, Building2, User, FileText, SettingsIcon, CheckCircle2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type UserConfig = {
  fullName: string
  email: string
  language: string
  timezone: string
  profilePhoto: string | null
}

type CompanyConfig = {
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

type InvoiceConfig = {
  prefix: string
  nextNumber: number
  numberFormat: string
  remindersEnabled: boolean
  reminderMessage: string
  reminderAfter: string
  reminderFrequency: string
}

type GeneralConfig = {
  colorPalette: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  paymentNotifications: boolean
  overdueNotifications: boolean
}

export default function ConfigurationPage() {
  const { toast } = useToast()
  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const companyLogoRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const [userConfig, setUserConfig] = useState<UserConfig>({
    fullName: "John Doe",
    email: "john@example.com",
    language: "en",
    timezone: "utc",
    profilePhoto: null,
  })

  const [companies, setCompanies] = useState<CompanyConfig[]>([
    {
      id: 1,
      name: "ADSTRATEGIC",
      nit: "123456789-0",
      address: "123 Business St, City, Country",
      email: "contact@adstrategic.com",
      phone: "+1 (555) 123-4567",
      logo: null,
      template: "default",
      isDefault: true,
    },
    {
      id: 2,
      name: "Digital Solutions Inc",
      nit: "987654321-0",
      address: "456 Tech Ave, City, Country",
      email: "info@digitalsolutions.com",
      phone: "+1 (555) 987-6543",
      logo: null,
      template: "modern",
      isDefault: false,
    },
  ])

  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    prefix: "INV-",
    nextNumber: 8,
    numberFormat: "001",
    remindersEnabled: true,
    reminderMessage:
      "Hello [client], this is a friendly reminder that invoice #[number] is still pending payment. Thank you for your attention.",
    reminderAfter: "7",
    reminderFrequency: "weekly",
  })

  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    colorPalette: "adstrategic",
    notificationsEnabled: true,
    emailNotifications: true,
    paymentNotifications: true,
    overdueNotifications: true,
  })

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null)

  useEffect(() => {
    const savedUserConfig = localStorage.getItem("userConfig")
    const savedCompanies = localStorage.getItem("companies")
    const savedInvoiceConfig = localStorage.getItem("invoiceConfig")
    const savedGeneralConfig = localStorage.getItem("generalConfig")

    if (savedUserConfig) setUserConfig(JSON.parse(savedUserConfig))
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies))
    if (savedInvoiceConfig) setInvoiceConfig(JSON.parse(savedInvoiceConfig))
    if (savedGeneralConfig) setGeneralConfig(JSON.parse(savedGeneralConfig))
  }, [])

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUserConfig({ ...userConfig, profilePhoto: reader.result as string })
        toast({
          title: "Profile photo uploaded",
          description: "Your profile photo has been updated.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveUserConfig = () => {
    localStorage.setItem("userConfig", JSON.stringify(userConfig))
    setSuccessMessage("User settings saved successfully!")
    setShowSuccessDialog(true)
  }

  const handleAddCompany = () => {
    const newCompany: CompanyConfig = {
      id: Date.now(),
      name: "New Company",
      nit: "",
      address: "",
      email: "",
      phone: "",
      logo: null,
      template: "default",
      isDefault: false,
    }
    setCompanies([...companies, newCompany])
    toast({
      title: "Company added",
      description: "New company has been added. Don't forget to save!",
    })
  }

  const handleDeleteCompany = (id: number) => {
    setCompanyToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteCompany = () => {
    if (companyToDelete) {
      const updatedCompanies = companies.filter((c) => c.id !== companyToDelete)
      setCompanies(updatedCompanies)
      localStorage.setItem("companies", JSON.stringify(updatedCompanies))
      toast({
        title: "Company deleted",
        description: "The company has been removed.",
      })
    }
    setShowDeleteDialog(false)
    setCompanyToDelete(null)
  }

  const handleCompanyLogoUpload = (companyId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const updatedCompanies = companies.map((c) =>
          c.id === companyId ? { ...c, logo: reader.result as string } : c,
        )
        setCompanies(updatedCompanies)
        toast({
          title: "Logo uploaded",
          description: "Company logo has been updated.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateCompany = (id: number, field: keyof CompanyConfig, value: any) => {
    const updatedCompanies = companies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    setCompanies(updatedCompanies)
  }

  const handleSetDefaultCompany = (id: number) => {
    const updatedCompanies = companies.map((c) => ({ ...c, isDefault: c.id === id }))
    setCompanies(updatedCompanies)
  }

  const handleSaveCompany = (id: number) => {
    localStorage.setItem("companies", JSON.stringify(companies))
    setSuccessMessage("Company settings saved successfully!")
    setShowSuccessDialog(true)
  }

  const handleSaveInvoiceConfig = () => {
    localStorage.setItem("invoiceConfig", JSON.stringify(invoiceConfig))
    setSuccessMessage("Invoice settings saved successfully!")
    setShowSuccessDialog(true)
  }

  const handleImportConfiguration = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string)
            if (config.userConfig) setUserConfig(config.userConfig)
            if (config.companies) setCompanies(config.companies)
            if (config.invoiceConfig) setInvoiceConfig(config.invoiceConfig)
            if (config.generalConfig) setGeneralConfig(config.generalConfig)

            localStorage.setItem("userConfig", JSON.stringify(config.userConfig))
            localStorage.setItem("companies", JSON.stringify(config.companies))
            localStorage.setItem("invoiceConfig", JSON.stringify(config.invoiceConfig))
            localStorage.setItem("generalConfig", JSON.stringify(config.generalConfig))

            toast({
              title: "Configuration imported",
              description: "All settings have been imported successfully.",
            })
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid configuration file.",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExportConfiguration = () => {
    const config = {
      userConfig,
      companies,
      invoiceConfig,
      generalConfig,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `adinvoices-config-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Configuration exported",
      description: "Your settings have been downloaded.",
    })
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage your account, company, and invoice settings</p>
        </div>

        <Tabs defaultValue="user" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="user" className="gap-2">
              <User className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* User Configuration */}
          <TabsContent value="user" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <Label>Profile Photo</Label>
                  <input
                    ref={profilePhotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                  <div className="mt-2 flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {userConfig.profilePhoto ? (
                        <img
                          src={userConfig.profilePhoto || "/placeholder.svg"}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => profilePhotoRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      className="mt-1"
                      value={userConfig.fullName}
                      onChange={(e) => setUserConfig({ ...userConfig, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className="mt-1"
                      value={userConfig.email}
                      onChange={(e) => setUserConfig({ ...userConfig, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" className="mt-1" />
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="Confirm new password" className="mt-1" />
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={userConfig.language}
                      onValueChange={(v) => setUserConfig({ ...userConfig, language: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={userConfig.timezone}
                      onValueChange={(v) => setUserConfig({ ...userConfig, timezone: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">EST (UTC-5)</SelectItem>
                        <SelectItem value="pst">PST (UTC-8)</SelectItem>
                        <SelectItem value="cet">CET (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button className="gap-2" onClick={handleSaveUserConfig}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Configuration */}
          <TabsContent value="company" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Your Companies</h3>
                <p className="text-sm text-muted-foreground">Manage multiple companies and their invoice templates</p>
              </div>
              <Button className="gap-2" onClick={handleAddCompany}>
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </div>

            {/* Company Cards */}
            <div className="space-y-4">
              {companies.map((company) => (
                <Card key={company.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                          {company.logo ? (
                            <img
                              src={company.logo || "/placeholder.svg"}
                              alt="Company Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{company.name}</CardTitle>
                          {company.isDefault && <p className="text-xs text-primary mt-0.5">Default Company</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Company Name</Label>
                        <Input
                          placeholder="Company name"
                          className="mt-1"
                          value={company.name}
                          onChange={(e) => handleUpdateCompany(company.id, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>NIT / Tax ID</Label>
                        <Input
                          placeholder="123456789-0"
                          className="mt-1"
                          value={company.nit}
                          onChange={(e) => handleUpdateCompany(company.id, "nit", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Textarea
                        placeholder="Company address"
                        className="mt-1"
                        rows={2}
                        value={company.address}
                        onChange={(e) => handleUpdateCompany(company.id, "address", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="contact@company.com"
                          className="mt-1"
                          value={company.email}
                          onChange={(e) => handleUpdateCompany(company.id, "email", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="mt-1"
                          value={company.phone}
                          onChange={(e) => handleUpdateCompany(company.id, "phone", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Company Logo</Label>
                        <input
                          ref={(el) => {
                            companyLogoRefs.current[company.id] = el
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCompanyLogoUpload(company.id, e)}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="w-full mt-1 gap-2 bg-transparent"
                          onClick={() => companyLogoRefs.current[company.id]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </Button>
                      </div>
                      <div>
                        <Label>Invoice Template</Label>
                        <Select
                          value={company.template}
                          onValueChange={(v) => handleUpdateCompany(company.id, "template", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Template</SelectItem>
                            <SelectItem value="modern">Modern Template</SelectItem>
                            <SelectItem value="classic">Classic Template</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={company.isDefault}
                          onCheckedChange={() => handleSetDefaultCompany(company.id)}
                        />
                        <Label className="cursor-pointer">Set as default company</Label>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={() => handleSaveCompany(company.id)}
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Invoice Configuration */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Invoice Templates</CardTitle>
                <CardDescription>Create and manage invoice templates for different companies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Default Template</p>
                    <p className="text-sm text-muted-foreground">Standard invoice layout</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() =>
                        toast({
                          title: "Edit template",
                          description: "Template editor coming soon!",
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() =>
                        toast({
                          title: "Preview template",
                          description: "Template preview coming soon!",
                        })
                      }
                    >
                      Preview
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Modern Template</p>
                    <p className="text-sm text-muted-foreground">Clean and minimal design</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() =>
                        toast({
                          title: "Edit template",
                          description: "Template editor coming soon!",
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() =>
                        toast({
                          title: "Preview template",
                          description: "Template preview coming soon!",
                        })
                      }
                    >
                      Preview
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() =>
                    toast({
                      title: "Create template",
                      description: "Template creator coming soon!",
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Create New Template
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Invoice Numbering</CardTitle>
                <CardDescription>Configure automatic invoice number generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Prefix</Label>
                    <Input
                      placeholder="INV-"
                      className="mt-1"
                      value={invoiceConfig.prefix}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, prefix: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Next Number</Label>
                    <Input
                      type="number"
                      placeholder="001"
                      className="mt-1"
                      value={invoiceConfig.nextNumber}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, nextNumber: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Number Format</Label>
                  <Select
                    value={invoiceConfig.numberFormat}
                    onValueChange={(v) => setInvoiceConfig({ ...invoiceConfig, numberFormat: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="001">001, 002, 003...</SelectItem>
                      <SelectItem value="0001">0001, 0002, 0003...</SelectItem>
                      <SelectItem value="1">1, 2, 3...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button className="gap-2" onClick={handleSaveInvoiceConfig}>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Automatic Reminders</CardTitle>
                <CardDescription>Configure automatic payment reminders for pending invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Enable Automatic Reminders</p>
                    <p className="text-sm text-muted-foreground">Send reminders for overdue invoices</p>
                  </div>
                  <Switch
                    checked={invoiceConfig.remindersEnabled}
                    onCheckedChange={(v) => setInvoiceConfig({ ...invoiceConfig, remindersEnabled: v })}
                  />
                </div>

                {invoiceConfig.remindersEnabled && (
                  <>
                    <div>
                      <Label>Reminder Message</Label>
                      <Textarea
                        placeholder="Customize your reminder message..."
                        className="mt-1"
                        rows={4}
                        value={invoiceConfig.reminderMessage}
                        onChange={(e) => setInvoiceConfig({ ...invoiceConfig, reminderMessage: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use [client] for client name and [number] for invoice number
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Send Reminder After</Label>
                        <Select
                          value={invoiceConfig.reminderAfter}
                          onValueChange={(v) => setInvoiceConfig({ ...invoiceConfig, reminderAfter: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day overdue</SelectItem>
                            <SelectItem value="3">3 days overdue</SelectItem>
                            <SelectItem value="7">7 days overdue</SelectItem>
                            <SelectItem value="14">14 days overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reminder Frequency</Label>
                        <Select
                          value={invoiceConfig.reminderFrequency}
                          onValueChange={(v) => setInvoiceConfig({ ...invoiceConfig, reminderFrequency: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <Button className="gap-2" onClick={handleSaveInvoiceConfig}>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Configuration */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">Managed in sidebar menu</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Dark / Light Mode</p>
                </div>

                <div>
                  <Label>Color Palette</Label>
                  <Select
                    value={generalConfig.colorPalette}
                    onValueChange={(v) => {
                      setGeneralConfig({ ...generalConfig, colorPalette: v })
                      localStorage.setItem("generalConfig", JSON.stringify({ ...generalConfig, colorPalette: v }))
                      toast({
                        title: "Color palette updated",
                        description: "Your color preference has been saved.",
                      })
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adstrategic">ADSTRATEGIC (Aqua)</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about invoices and payments</p>
                  </div>
                  <Switch
                    checked={generalConfig.notificationsEnabled}
                    onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, notificationsEnabled: v })}
                  />
                </div>

                {generalConfig.notificationsEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Get notified via email</p>
                      </div>
                      <Switch
                        checked={generalConfig.emailNotifications}
                        onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, emailNotifications: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">Payment Notifications</p>
                        <p className="text-sm text-muted-foreground">When an invoice is paid</p>
                      </div>
                      <Switch
                        checked={generalConfig.paymentNotifications}
                        onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, paymentNotifications: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">Overdue Notifications</p>
                        <p className="text-sm text-muted-foreground">When an invoice becomes overdue</p>
                      </div>
                      <Switch
                        checked={generalConfig.overdueNotifications}
                        onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, overdueNotifications: v })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or import your configuration settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={handleImportConfiguration}>
                    <Upload className="h-4 w-4" />
                    Import Configuration
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportConfiguration}>
                    <Save className="h-4 w-4" />
                    Export Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Success!</DialogTitle>
            <DialogDescription className="text-center">{successMessage}</DialogDescription>
            <DialogFooter className="w-full">
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCompany}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
