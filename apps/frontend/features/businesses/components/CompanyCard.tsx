"use client";

import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBusinessSchema,
  type BusinessResponse,
  type UpdateBusinessDto,
} from "@/features/businesses";
import type { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Save, Trash2, Upload } from "lucide-react";
import {
  useUpdateBusiness,
  useUploadLogo,
  useDeleteLogo,
  useSetDefaultBusiness,
} from "@/features/businesses";
import { useToast } from "@/hooks/use-toast";

type EditCompanyForm = z.infer<typeof updateBusinessSchema>;

function getDefaultValues(company: BusinessResponse): EditCompanyForm {
  return {
    name: company.name,
    nit: company.nit,
    address: company.address,
    email: company.email,
    phone: company.phone,
    defaultTaxMode: company.defaultTaxMode ?? "NONE",
    defaultTaxName: company.defaultTaxName ?? null,
    defaultTaxPercentage:
      company.defaultTaxPercentage != null
        ? Number(company.defaultTaxPercentage)
        : null,
    defaultNotes: company.defaultNotes ?? "",
    defaultTerms: company.defaultTerms ?? "",
  };
}

interface CompanyCardProps {
  company: BusinessResponse;
  onDeleteRequested: (company: BusinessResponse) => void;
  onSaveSuccess?: () => void;
}

export function CompanyCard({
  company,
  onDeleteRequested,
  onSaveSuccess,
}: CompanyCardProps) {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<EditCompanyForm>({
    resolver: zodResolver(updateBusinessSchema),
    mode: "onSubmit",
    defaultValues: getDefaultValues(company),
  });

  const updateBusinessMutation = useUpdateBusiness();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();
  const setDefaultBusinessMutation = useSetDefaultBusiness();

  const onSubmit = async (data: EditCompanyForm) => {
    try {
      const payload: UpdateBusinessDto = { ...data };
      await updateBusinessMutation.mutateAsync({ id: company.id, data: payload });
      form.reset(data);
      onSaveSuccess?.();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    try {
      await uploadLogoMutation.mutateAsync({ id: company.id, file });
    } catch {
      // Error handled by mutation hook
    }
  };

  const displayName = form.watch("name") || company.name;

  return (
    <Card className="bg-card border-border">
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
              <CardTitle className="text-base">{displayName}</CardTitle>
              {company.isDefault && (
                <p className="text-xs text-primary mt-0.5">Default Company</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDeleteRequested(company)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          id={`company-form-${company.id}`}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Company Name</FieldLabel>
                    <Input
                      {...field}
                      placeholder="Company name"
                      className="mt-1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="nit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>NIT / Tax ID</FieldLabel>
                    <Input
                      {...field}
                      placeholder="123456789-0"
                      className="mt-1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Address</FieldLabel>
                  <Textarea
                    {...field}
                    placeholder="Company address"
                    className="mt-1"
                    rows={2}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contact@company.com"
                      className="mt-1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone</FieldLabel>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-border">
              <FieldLabel className="text-base font-medium">
                Invoice defaults
              </FieldLabel>
              <Controller
                name="defaultTaxMode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-muted-foreground">
                      VAT / Tax
                    </FieldLabel>
                    <Select
                      value={field.value ?? "NONE"}
                      onValueChange={(
                        value: "NONE" | "BY_PRODUCT" | "BY_TOTAL",
                      ) => {
                        field.onChange(value);
                        if (value !== "BY_TOTAL") {
                          form.setValue("defaultTaxName", null);
                          form.setValue("defaultTaxPercentage", null);
                        }
                      }}
                    >
                      <SelectTrigger
                        className="mt-1"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select tax mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="BY_PRODUCT">By product</SelectItem>
                        <SelectItem value="BY_TOTAL">By total</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {form.watch("defaultTaxMode") === "BY_TOTAL" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="defaultTaxName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-muted-foreground">
                          Tax name (optional)
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. VAT, Sales Tax"
                          className="mt-1"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="defaultTaxPercentage"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-muted-foreground">
                          Tax percentage (%)
                        </FieldLabel>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          placeholder="0"
                          className="mt-1"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === "" || v == null ? null : Number(v),
                            );
                          }}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              )}
              <Controller
                name="defaultNotes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-muted-foreground">
                      Default notes (for invoices)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Optional default notes on new invoices"
                      className="mt-1"
                      rows={2}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="defaultTerms"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-muted-foreground">
                      Default terms & conditions (for invoices)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Optional default terms on new invoices"
                      className="mt-1"
                      rows={2}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <div>
            <Label>Company Logo</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
              </Button>
              {company.logo && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={async () => {
                    try {
                      await deleteLogoMutation.mutateAsync(company.id);
                    } catch {
                      // Error handled by mutation hook
                    }
                  }}
                  disabled={deleteLogoMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={company.isDefault}
                onCheckedChange={() =>
                  setDefaultBusinessMutation.mutate(company.id)
                }
                disabled={setDefaultBusinessMutation.isPending}
              />
              <Label className="cursor-pointer">Set as default company</Label>
            </div>
            <Button
              type="submit"
              form={`company-form-${company.id}`}
              variant="outline"
              className="gap-2 bg-transparent"
              disabled={
                !form.formState.isDirty || updateBusinessMutation.isPending
              }
            >
              <Save className="h-4 w-4" />
              {updateBusinessMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
