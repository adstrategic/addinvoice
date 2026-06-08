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
  BriefcaseBusiness,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ClientFormModal,
  useClientDelete,
  useClientManager,
} from "@/features/clients";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetailPageLoading } from "@/components/loading-component";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientDelete = useClientDelete({
    onAfterDelete: () => router.push("/clients"),
  });

  const sequence = parseInt(params.sequence as string);

  const editClient = useClientManager({
    mode: "edit",
    sequence: sequence,
  });

  const client = editClient.client;

  if (editClient.isLoadingClient) return <DetailPageLoading />

  if (editClient.clientError || !client) {
    return (
      <div className="max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {client.businessName && (
                  <Badge className="bg-primary/20 text-primary">
                    {client.businessName}
                  </Badge>
                )}
                <h1 className="text-3xl font-bold text-foreground">
                  {client.name}
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Client details and information
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 shrink-0 bg-transparent"
              onClick={() => editClient.openEdit(sequence)}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
              onClick={() => clientDelete.openDeleteModal(client)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete
            </Button>
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 shrink-0 bg-transparent"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  Send Email
                </Button>
              </a>
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
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-foreground hover:underline break-all"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BriefcaseBusiness className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Business Name
                  </p>
                  <p className="text-foreground">{client.businessName}</p>
                </div>
              </div>
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
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p className="text-foreground">{client.address ?? "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileDigit className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    NIT / Tax ID
                  </p>
                  <p className="text-foreground">{client.nit ?? "N/A"}</p>
                </div>
              </div>
            </div>

            {hasReminders && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Reminders
                </h4>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {client.reminderBeforeDueIntervalDays != null && (
                    <span>
                      Before due: every {client.reminderBeforeDueIntervalDays}{" "}
                      day
                      {client.reminderBeforeDueIntervalDays !== 1 ? "s" : ""}
                    </span>
                  )}
                  {client.reminderAfterDueIntervalDays != null && (
                    <span>
                      After due: every {client.reminderAfterDueIntervalDays} day
                      {client.reminderAfterDueIntervalDays !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Form Modal - handles both create and edit */}
      <ClientFormModal
        isOpen={editClient.isOpen}
        onClose={editClient.close}
        mode={editClient.mode}
        initialData={editClient.client}
        form={editClient.form}
        onSubmit={editClient.onSubmit}
        isLoading={editClient.isMutating}
        isLoadingClient={editClient.isLoadingClient}
        clientError={editClient.clientError}
        logoDisplayUrl={editClient.logoDisplayUrl}
        onLogoSelect={editClient.handleLogoSelect}
        isUploadingLogo={editClient.isUploadingLogo}
      />

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
