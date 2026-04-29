"use client";

import { useEffect, useState } from "react";
import type {
  AdvanceResponse,
  BusinessResponse,
  ClientResponse,
  CreateAdvanceDTO,
} from "@addinvoice/schemas";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CalendarIcon,
  ClipboardCheck,
  Download,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Send,
  FileText,
} from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { enUS } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ClientSection } from "./form-fields/ClientSection";
import type { AdvanceImageDraft } from "../types/api";
import { SendAdvanceDialog } from "@/components/send-advance-dialog";
import { useDownloadAdvancePdf } from "../hooks/useDownloadAdvancePDF";
import { useSendAdvance } from "../hooks/useAdvances";
import type { AdvanceMutationCallbacks } from "../hooks/useAdvanceActions";

export type { AdvanceImageDraft };

type AdvanceFormProps = {
  form: UseFormReturn<CreateAdvanceDTO>;
  mode: "create" | "edit";
  images: AdvanceImageDraft[];
  isLoading: boolean;
  isLoadingAdvance: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (imageId: string) => void;
  createdClient?: ClientResponse | null;
  existingAdvance?: AdvanceResponse | null;
  selectedBusiness?: BusinessResponse | null;
  saveBeforeSend?: (callbacks?: AdvanceMutationCallbacks) => Promise<void>;
};

export function AdvanceForm({
  mode,
  form,
  existingAdvance,
  images,
  isLoading,
  isLoadingAdvance,
  createdClient,
  selectedBusiness,
  saveBeforeSend,
  onAddImages,
  onRemoveImage,
  onSubmit,
  onCancel,
}: AdvanceFormProps) {
  const router = useRouter();
  const [selectedClientFromSelector, setSelectedClientFromSelector] =
    useState<ClientResponse | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isSavingBeforeSend, setIsSavingBeforeSend] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const downloadPdf = useDownloadAdvancePdf();
  const sendAdvance = useSendAdvance();
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    setSelectedClientFromSelector(null);
  }, [existingAdvance?.id, mode]);

  // Preview priority:
  // 1. Draft clientData while creating a new client
  // 2. Client explicitly selected in the selector
  // 3. Persisted client from the existing advance
  // 4. Newly created inline client fallback during create flow
  const isCreateClientMode = form.watch("createClient") === true;
  const watchedClientDataName = form.watch("clientData.name");
  const watchedClientDataPhone = form.watch("clientData.phone");

  const previewClientName = isCreateClientMode
    ? (watchedClientDataName ?? "—")
    : (selectedClientFromSelector?.name ??
      existingAdvance?.client?.name ??
      createdClient?.name ??
      "—");

  const previewClientPhone = isCreateClientMode
    ? (watchedClientDataPhone ?? "—")
    : (selectedClientFromSelector?.phone ??
      existingAdvance?.client?.phone ??
      createdClient?.phone ??
      "—");
  const previewBusinessLogo =
    selectedBusiness?.logo ?? existingAdvance?.business?.logo ?? null;

  if (isLoadingAdvance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Loading advance...
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (!existingAdvance) return;
    setIsExporting(true);
    try {
      await downloadPdf(existingAdvance);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendClick = async () => {
    if (mode === "edit" && saveBeforeSend && isDirty) {
      setIsSavingBeforeSend(true);
      let didOpen = false;
      await saveBeforeSend({
        onSuccess: () => {
          didOpen = true;
          setSendDialogOpen(true);
          setIsSavingBeforeSend(false);
        },
      });
      if (!didOpen) {
        setIsSavingBeforeSend(false);
      }
      return;
    }
    setSendDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-28">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "create" ? "New Work Advance" : "Edit Work Advance"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Turn your field work into professional reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Controller
                  name="projectName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="projectName">
                        Project / Job Name *
                      </FieldLabel>
                      <FieldContent className="relative">
                        <ClipboardCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="projectName"
                          className="pl-9"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-5">
                <div className="space-y-2">
                  <Controller
                    name="advanceDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="advanceDate">Date</FieldLabel>
                        <FieldContent className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", {
                                    locale: enUS,
                                  })
                                ) : (
                                  <span>Select date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="location">Location</FieldLabel>
                        <FieldContent className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="location"
                            className="pl-9"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Section */}
          <ClientSection
            form={form}
            initialClient={createdClient ?? existingAdvance?.client ?? null}
            mode={mode}
            onSelectClient={setSelectedClientFromSelector}
          />

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Work Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Controller
                  name="workCompleted"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="notes">Progress Notes</FieldLabel>
                      <FieldContent className="relative">
                        <Textarea
                          id="notes"
                          className="min-h-[140px]"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Visual Evidence (Images)</Label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.previewUrl}
                        alt="Advance attachment preview"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(image.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-white">
                          Remove
                        </span>
                      </button>
                    </div>
                  ))}

                  <Label
                    htmlFor="images"
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50"
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-xs font-medium">Add Photo</span>
                  </Label>
                </div>

                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => onAddImages(event.target.files)}
                />

                {images.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No images added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-border/50">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Live Preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Preview is active while creating and editing
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[700px] bg-white p-6 text-black">
                <div className="mb-8 border-b-2 border-black/10 pb-6">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
                      Work Progress Report
                    </h1>
                    <div className="mb-4 mt-4 h-1 w-20 rounded-full bg-primary"></div>
                    <div className="flex items-start w-full justify-between gap-6">
                      <div className="space-y-1 text-sm font-medium text-gray-600">
                        <p>
                          <span className="text-gray-400">PROJECT:</span>{" "}
                          <span className="font-bold text-gray-900">
                            {form.watch("projectName") || "—"}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">DATE:</span>{" "}
                          <span className="text-gray-900">
                            {format(form.watch("advanceDate"), "PPP", {
                              locale: enUS,
                            }) || "—"}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">CLIENT:</span>{" "}
                          <span className="text-gray-900">
                            {previewClientName}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">PHONE:</span>{" "}
                          <span className="text-gray-900">
                            {previewClientPhone}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">LOCATION:</span>{" "}
                          <span className="text-gray-900">
                            {form.watch("location") || "—"}
                          </span>
                        </p>
                      </div>
                      {previewBusinessLogo ? (
                        <div className="flex h-[120px] max-w-[320px] shrink-0 items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewBusinessLogo}
                            alt="Business logo"
                            className="block max-h-full w-auto max-w-full object-contain object-left"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="mb-3 border-l-4 border-primary pl-3 text-lg font-bold text-gray-900">
                      Work Completed
                    </h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
                      {form.watch("workCompleted")?.trim() ||
                        "No work details added yet."}
                    </p>
                  </section>

                  {images.length > 0 && (
                    <section className="border-t border-gray-100 pt-4">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                        Site Photos
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {images.map((image) => (
                          <div
                            key={`preview-${image.id}`}
                            className="aspect-4/3 overflow-hidden rounded-lg border border-gray-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.previewUrl}
                              alt="Site photo preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mode === "edit" && existingAdvance ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:left-64">
          <div className="mx-auto flex max-w-7xl gap-2 pb-2 overflow-x-auto">
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || form.formState.isSubmitting || !isDirty}
              className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
            >
              {isLoading || form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="text-xs">Save</span>
            </Button>
            <Button
              type="button"
              onClick={handleSendClick}
              disabled={isSavingBeforeSend}
              className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
            >
              {isSavingBeforeSend ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="text-xs">Send</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/advances/${existingAdvance.sequence}`)
              }
              className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Preview</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="text-xs">Export</span>
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "edit" && existingAdvance ? (
        <SendAdvanceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          advanceId={existingAdvance.id}
          clientEmail={existingAdvance.client?.email}
          clientName={existingAdvance.client?.name ?? "Client"}
          projectName={existingAdvance.projectName}
          sending={sendAdvance.isPending}
          onSend={({ advanceId, payload }) =>
            sendAdvance.mutateAsync({ advanceId, payload })
          }
        />
      ) : null}
    </div>
  );
}
