"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Save,
  Plus,
  Trash2,
  Building2,
  User,
  FileText,
  SettingsIcon,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBusinesses, useCreateBusiness } from "@/features/businesses";
import { CreateCompanyDialog } from "../../../features/businesses/components/CreateCompanyDialog";
import { CompanyCards } from "../../../features/businesses/components/CompanyCards";
import { useBusinessDelete } from "@/features/businesses/hooks/useBusinessDelete";
import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { SubscriptionManager } from "@/components/subscription/subscription-manager";

type InvoiceConfig = {
  prefix: string;
  nextNumber: number;
  numberFormat: string;
  remindersEnabled: boolean;
  reminderMessage: string;
  reminderAfter: string;
  reminderFrequency: string;
};

type GeneralConfig = {
  colorPalette: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  paymentNotifications: boolean;
  overdueNotifications: boolean;
};

export default function ConfigurationPage() {
  const { toast } = useToast();
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  // Businesses API hooks
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const createBusinessMutation = useCreateBusiness();
  const {
    isDeleteModalOpen,
    businessToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting,
  } = useBusinessDelete();

  const businesses = businessesData?.data || [];

  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    prefix: "INV-",
    nextNumber: 8,
    numberFormat: "001",
    remindersEnabled: true,
    reminderMessage:
      "Hello [client], this is a friendly reminder that invoice #[number] is still pending payment. Thank you for your attention.",
    reminderAfter: "7",
    reminderFrequency: "weekly",
  });

  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    colorPalette: "adstrategic",
    notificationsEnabled: true,
    emailNotifications: true,
    paymentNotifications: true,
    overdueNotifications: true,
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);

  const handleAddCompany = () => {
    setShowCreateCompanyDialog(true);
  };

  const handleDeleteCompany = (business: (typeof businesses)[0]) => {
    openDeleteModal(business);
  };

  const handleSaveInvoiceConfig = () => {
    localStorage.setItem("invoiceConfig", JSON.stringify(invoiceConfig));
    setSuccessMessage("Invoice settings saved successfully!");
    setShowSuccessDialog(true);
  };

  const handleImportConfiguration = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string);
            if (config.invoiceConfig) setInvoiceConfig(config.invoiceConfig);
            if (config.generalConfig) setGeneralConfig(config.generalConfig);

            localStorage.setItem(
              "invoiceConfig",
              JSON.stringify(config.invoiceConfig),
            );
            localStorage.setItem(
              "generalConfig",
              JSON.stringify(config.generalConfig),
            );

            toast({
              title: "Configuration imported",
              description: "All settings have been imported successfully.",
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid configuration file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportConfiguration = () => {
    const config = {
      invoiceConfig,
      generalConfig,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adinvoices-config-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Configuration exported",
      description: "Your settings have been downloaded.",
    });
  };

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, company, and invoice settings
          </p>
        </div>

        <Tabs defaultValue="user" className="space-y-6">
          <TabsList className="gap-4">
            <TabsTrigger
              value="user"
              className="gap-2"
              data-tour-id="config-profile"
            >
              <User className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="gap-2"
              data-tour-id="config-company"
            >
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            {/* <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="gap-2"
              data-tour-id="config-notifications"
            >
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger> */}
          </TabsList>

          {/* User Configuration */}
          <TabsContent value="user" className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Manage your user settings and preferences
            </p>

            {/* Subscription Management */}
            <div data-tour-id="config-billing">
              <SubscriptionManager />
            </div>

            <Separator />

            <SignOutButton>
              <Button variant="destructive" className="cursor-pointer">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </SignOutButton>

            <Separator />

            <UserProfile />
          </TabsContent>

          {/* Company Configuration */}
          <TabsContent value="company" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Your Companies
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage multiple companies and their settings
                </p>
              </div>
              <Button
                className="gap-2"
                onClick={handleAddCompany}
                disabled={createBusinessMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </div>

            <CompanyCards
              businesses={businesses}
              isLoading={isLoadingBusinesses}
              onDeleteRequested={handleDeleteCompany}
              onSaveSuccess={() => {
                setSuccessMessage("Business settings saved successfully!");
                setShowSuccessDialog(true);
              }}
            />
          </TabsContent>

          <CreateCompanyDialog
            open={showCreateCompanyDialog}
            onOpenChange={setShowCreateCompanyDialog}
            onSuccess={() => {
              toast({
                title: "Company created",
                description: "The new company has been added.",
              });
            }}
          />

          {/* Invoice Configuration */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Invoice Templates</CardTitle>
                <CardDescription>
                  Create and manage invoice templates for different companies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">
                      Default Template
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Standard invoice layout
                    </p>
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
                    <p className="font-semibold text-foreground">
                      Modern Template
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clean and minimal design
                    </p>
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
                <CardDescription>
                  Configure automatic invoice number generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Prefix</Label>
                    <Input
                      placeholder="INV-"
                      className="mt-1"
                      value={invoiceConfig.prefix}
                      onChange={(e) =>
                        setInvoiceConfig({
                          ...invoiceConfig,
                          prefix: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Next Number</Label>
                    <Input
                      type="number"
                      placeholder="001"
                      className="mt-1"
                      value={invoiceConfig.nextNumber}
                      onChange={(e) =>
                        setInvoiceConfig({
                          ...invoiceConfig,
                          nextNumber: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Number Format</Label>
                  <Select
                    value={invoiceConfig.numberFormat}
                    onValueChange={(v) =>
                      setInvoiceConfig({ ...invoiceConfig, numberFormat: v })
                    }
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
                <CardDescription>
                  Configure automatic payment reminders for pending invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">
                      Enable Automatic Reminders
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Send reminders for overdue invoices
                    </p>
                  </div>
                  <Switch
                    checked={invoiceConfig.remindersEnabled}
                    onCheckedChange={(v) =>
                      setInvoiceConfig({
                        ...invoiceConfig,
                        remindersEnabled: v,
                      })
                    }
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
                        onChange={(e) =>
                          setInvoiceConfig({
                            ...invoiceConfig,
                            reminderMessage: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use [client] for client name and [number] for invoice
                        number
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Send Reminder After</Label>
                        <Select
                          value={invoiceConfig.reminderAfter}
                          onValueChange={(v) =>
                            setInvoiceConfig({
                              ...invoiceConfig,
                              reminderAfter: v,
                            })
                          }
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
                          onValueChange={(v) =>
                            setInvoiceConfig({
                              ...invoiceConfig,
                              reminderFrequency: v,
                            })
                          }
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
                <CardDescription>
                  Customize the look and feel of your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Managed in sidebar menu
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dark / Light Mode
                  </p>
                </div>

                <div>
                  <Label>Color Palette</Label>
                  <Select
                    value={generalConfig.colorPalette}
                    onValueChange={(v) => {
                      setGeneralConfig({ ...generalConfig, colorPalette: v });
                      localStorage.setItem(
                        "generalConfig",
                        JSON.stringify({ ...generalConfig, colorPalette: v }),
                      );
                      toast({
                        title: "Color palette updated",
                        description: "Your color preference has been saved.",
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adstrategic">
                        ADSTRATEGIC (Aqua)
                      </SelectItem>
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
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-semibold text-foreground">
                      Enable Notifications
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about invoices and payments
                    </p>
                  </div>
                  <Switch
                    checked={generalConfig.notificationsEnabled}
                    onCheckedChange={(v) =>
                      setGeneralConfig({
                        ...generalConfig,
                        notificationsEnabled: v,
                      })
                    }
                  />
                </div>

                {generalConfig.notificationsEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">
                          Email Notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Get notified via email
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.emailNotifications}
                        onCheckedChange={(v) =>
                          setGeneralConfig({
                            ...generalConfig,
                            emailNotifications: v,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">
                          Payment Notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          When an invoice is paid
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.paymentNotifications}
                        onCheckedChange={(v) =>
                          setGeneralConfig({
                            ...generalConfig,
                            paymentNotifications: v,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">
                          Overdue Notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          When an invoice becomes overdue
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.overdueNotifications}
                        onCheckedChange={(v) =>
                          setGeneralConfig({
                            ...generalConfig,
                            overdueNotifications: v,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export or import your configuration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={handleImportConfiguration}
                  >
                    <Upload className="h-4 w-4" />
                    Import Configuration
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={handleExportConfiguration}
                  >
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
            <DialogTitle className="text-2xl font-bold text-center">
              Success!
            </DialogTitle>
            <DialogDescription className="text-center">
              {successMessage}
            </DialogDescription>
            <DialogFooter className="w-full">
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full"
              >
                Continue
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={closeDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {businessToDelete?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
