"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bell, Send, Clock, CheckCircle2, AlertCircle, Search, Calendar, SendHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { SendInvoiceDialog } from "@/components/send-invoice-dialog"
import { MassReminderDialog } from "@/components/mass-reminder-dialog"

// Mock reminders data
const pendingReminders = [
  {
    id: "1",
    invoiceId: "INV-002",
    client: "TechStart Inc",
    amount: 3280,
    dueDate: "2025-01-18",
    daysOverdue: 3,
    lastReminder: "2025-01-20",
    reminderCount: 1,
  },
  {
    id: "2",
    invoiceId: "INV-004",
    client: "Digital Ventures",
    amount: 4190,
    dueDate: "2025-01-20",
    daysOverdue: 1,
    lastReminder: null,
    reminderCount: 0,
  },
  {
    id: "3",
    invoiceId: "INV-008",
    client: "Creative Studios",
    amount: 5670,
    dueDate: "2025-01-10",
    daysOverdue: 11,
    lastReminder: "2025-01-15",
    reminderCount: 2,
  },
]

const scheduledReminders = [
  {
    id: "4",
    invoiceId: "INV-006",
    client: "Innovation Labs",
    amount: 2890,
    dueDate: "2025-01-25",
    scheduledDate: "2025-01-26",
    status: "scheduled",
  },
  {
    id: "5",
    invoiceId: "INV-007",
    client: "Tech Solutions",
    amount: 4500,
    dueDate: "2025-01-28",
    scheduledDate: "2025-01-29",
    status: "scheduled",
  },
]

const reminderHistory = [
  {
    id: "1",
    invoiceId: "INV-001",
    client: "Acme Corp",
    amount: 5420,
    sentDate: "2025-01-19",
    status: "delivered",
    result: "Paid on 2025-01-20",
  },
  {
    id: "2",
    invoiceId: "INV-003",
    client: "Global Solutions",
    amount: 7650,
    sentDate: "2025-01-18",
    status: "delivered",
    result: "Paid on 2025-01-19",
  },
  {
    id: "3",
    invoiceId: "INV-002",
    client: "TechStart Inc",
    amount: 3280,
    sentDate: "2025-01-20",
    status: "delivered",
    result: "No response",
  },
]

export default function RemindersPage() {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [massReminderDialogOpen, setMassReminderDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{ id: string; client: string } | null>(null)

  const handleSendReminder = (invoiceId: string, client: string) => {
    setSelectedInvoice({ id: invoiceId, client })
    setSendDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reminders</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage payment reminders for overdue invoices
            </p>
          </div>
          <Button onClick={() => setMassReminderDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <SendHorizontal className="h-4 w-4" />
            Send Mass Reminders
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">3</div>
              <p className="text-xs text-muted-foreground mt-1">Invoices need attention</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">2</div>
              <p className="text-xs text-muted-foreground mt-1">Reminders queued</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Sent Today</CardTitle>
              <Send className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">5</div>
              <p className="text-xs text-muted-foreground mt-1">Reminders delivered</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">78%</div>
              <p className="text-xs text-muted-foreground mt-1">Payment after reminder</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Scheduled</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Reminders */}
          <TabsContent value="pending" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Overdue Invoices</CardTitle>
                    <CardDescription className="hidden sm:block">
                      Invoices that require payment reminders
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search invoices..." className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                          <Bell className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{reminder.invoiceId}</p>
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive text-xs">
                              {reminder.daysOverdue}d overdue
                            </Badge>
                            {reminder.reminderCount > 0 && (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                                {reminder.reminderCount} sent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{reminder.client}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {reminder.dueDate}
                            {reminder.lastReminder && (
                              <span className="hidden sm:inline"> • Last: {reminder.lastReminder}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-foreground">${reminder.amount.toLocaleString()}</p>
                        </div>
                        <Button
                          onClick={() => handleSendReminder(reminder.invoiceId, reminder.client)}
                          size="sm"
                          className="gap-2 shrink-0"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Send</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Reminders */}
          <TabsContent value="scheduled" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Scheduled Reminders</CardTitle>
                <CardDescription className="hidden sm:block">
                  Automatic reminders that will be sent soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduledReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-chart-4/20 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-chart-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-foreground">{reminder.invoiceId}</p>
                            <Badge variant="secondary" className="bg-chart-4/20 text-chart-4">
                              Scheduled
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{reminder.client}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {reminder.dueDate} • Will send: {reminder.scheduledDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-foreground">${reminder.amount.toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-transparent shrink-0">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminder History */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Reminder History</CardTitle>
                    <CardDescription className="hidden sm:block">Past reminders and their outcomes</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search history..." className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminderHistory.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-foreground">{reminder.invoiceId}</p>
                            <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">
                              {reminder.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{reminder.client}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent: {reminder.sentDate} • {reminder.result}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-foreground">${reminder.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedInvoice && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceId={selectedInvoice.id}
          clientName={selectedInvoice.client}
        />
      )}

      <MassReminderDialog open={massReminderDialogOpen} onOpenChange={setMassReminderDialogOpen} />
    </AppLayout>
  )
}
