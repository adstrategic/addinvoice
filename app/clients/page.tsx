"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { AddClientDialog } from "@/components/add-client-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  contact?: string;
  totalInvoices: number;
  totalAmount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    // Load clients from localStorage
    const savedClients = JSON.parse(localStorage.getItem("clients") || "[]");

    // Load invoices to calculate stats
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );
    const allInvoices = [...emittedInvoices, ...draftInvoices];

    // Calculate stats for each client
    const clientsWithStats = savedClients.map((client: any) => {
      const clientInvoices = allInvoices.filter(
        (inv: any) =>
          inv.clientName?.toLowerCase() === client.name.toLowerCase()
      );

      const totalInvoices = clientInvoices.length;
      const totalAmount = clientInvoices.reduce((sum: number, inv: any) => {
        return sum + (inv.total || 0);
      }, 0);

      return {
        ...client,
        totalInvoices,
        totalAmount,
        status: client.status || "active",
      };
    });

    setClients(clientsWithStats);
  };

  const filteredClients = clients.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery)
    );
  });

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = clients.filter((c) => {
    if (!c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    return (
      createdDate.getMonth() === currentMonth &&
      createdDate.getFullYear() === currentYear
    );
  }).length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalAmount, 0);

  const handleViewDetails = (clientId: string) => {
    toast({
      title: "View client details",
      description: `Opening details for client ${clientId}...`,
    });
    // In a real app, this would navigate to a client detail page
    console.log(`Viewing client ${clientId}`);
  };

  const handleEdit = (client: { id: string; name: string }) => {
    toast({
      title: "Edit client",
      description: `Opening edit form for ${client.name}...`,
    });
    // In a real app, this would open an edit dialog or navigate to edit page
    console.log(`Editing client ${client.id}`);
  };

  const handleViewInvoices = (client: { id: string; name: string }) => {
    toast({
      title: "View invoices",
      description: `Showing invoices for ${client.name}...`,
    });
    // In a real app, this would navigate to invoices filtered by this client
    router.push(`/invoices?client=${client.id}`);
  };

  const handleSendEmail = (client: { name: string; email: string }) => {
    toast({
      title: "Send email",
      description: `Opening email to ${client.email}...`,
    });
    // In a real app, this would open the user's email client
    window.location.href = `mailto:${client.email}`;
  };

  const handleDelete = (client: { id: string; name: string }) => {
    const existingClients = JSON.parse(localStorage.getItem("clients") || "[]");
    const updatedClients = existingClients.filter(
      (c: any) => c.id !== client.id
    );
    localStorage.setItem("clients", JSON.stringify(updatedClients));
    loadClients();
    toast({
      title: "Client deleted",
      description: `${client.name} has been deleted.`,
      variant: "destructive",
    });
  };

  const handleClientAdded = () => {
    loadClients();
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Clients
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your client relationships
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 w-full sm:w-auto"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Add Client
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {totalClients}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                Active
              </CardTitle>
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {activeClients}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                New This Month
              </CardTitle>
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {newThisMonth}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                ${totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-4 sm:mb-6 bg-card border-border">
          <CardContent className="pt-4 sm:pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
              All Clients{" "}
              {filteredClients.length !== clients.length &&
                `(${filteredClients.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {clients.length === 0
                    ? "No clients yet. Add your first client to get started."
                    : "No clients found matching your search"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
                          <p className="font-semibold text-foreground text-sm sm:text-base">
                            {client.name}
                          </p>
                          <Badge
                            variant="default"
                            className="bg-primary/20 text-primary hover:bg-primary/30"
                          >
                            {client.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          {client.email && (
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </p>
                          )}
                          {client.phone && (
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {client.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[60px] sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {client.totalInvoices} invoices
                        </p>
                        <p className="font-semibold text-foreground text-sm sm:text-base">
                          ${client.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(client.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewInvoices(client)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoices
                          </DropdownMenuItem>
                          {client.email && (
                            <DropdownMenuItem
                              onClick={() => handleSendEmail(client)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(client)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddClientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onClientAdded={handleClientAdded}
      />
    </AppLayout>
  );
}
