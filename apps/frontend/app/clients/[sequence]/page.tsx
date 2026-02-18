"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Mail,
  Building2,
  Phone,
  MapPin,
  FileDigit,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useClientBySequence, useClientDelete } from "@/features/clients";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientDelete = useClientDelete({
    onAfterDelete: () => router.push("/clients"),
  });

  const sequence =
    params?.sequence != null ? parseInt(params.sequence as string) : null;

  const {
    data: client,
    isLoading,
    error,
  } = useClientBySequence(sequence, sequence != null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Client not found</p>
        </div>
      </div>
    );
  }

  const hasReminders =
    client.reminderBeforeDueIntervalDays != null ||
    client.reminderAfterDueIntervalDays != null;

  return (
    <>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {client.name}
                </h1>
                {client.businessName && (
                  <Badge className="bg-primary/20 text-primary">
                    {client.businessName}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Client details and information
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/clients/${sequence}/edit`}>
                  <Button variant="outline" size="icon" className="bg-transparent">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit client</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive bg-transparent"
                  onClick={() => clientDelete.openDeleteModal(client)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete client</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/invoices">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <FileText className="h-4 w-4" />
                    View Invoices
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View invoices</p>
              </TooltipContent>
            </Tooltip>
            {client.email && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href={`mailto:${client.email}`}>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send email</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Client info card */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Contact &amp; identification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Basic details and contact information
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-foreground hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone
                    </p>
                    <p className="text-foreground">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="text-foreground">{client.address}</p>
                  </div>
                </div>
              )}
              {client.nit && (
                <div className="flex items-start gap-3">
                  <FileDigit className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      NIT / Tax ID
                    </p>
                    <p className="text-foreground">{client.nit}</p>
                  </div>
                </div>
              )}
            </div>

            {hasReminders && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Reminders
                </h4>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {client.reminderBeforeDueIntervalDays != null && (
                    <span>
                      Before due: every{" "}
                      {client.reminderBeforeDueIntervalDays} day
                      {client.reminderBeforeDueIntervalDays !== 1 ? "s" : ""}
                    </span>
                  )}
                  {client.reminderAfterDueIntervalDays != null && (
                    <span>
                      After due: every{" "}
                      {client.reminderAfterDueIntervalDays} day
                      {client.reminderAfterDueIntervalDays !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clientToDelete?.description ?? client.name}
        isDeleting={clientDelete.isDeleting}
      />
    </>
  );
}
