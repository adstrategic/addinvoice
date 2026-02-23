"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBusinessSchema,
  type CreateBusinessDto,
} from "@/features/businesses";
import type { z } from "zod";
import { Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";

export type CreateCompanyFormValues = z.infer<typeof createBusinessSchema>;

const defaultFormValues: CreateCompanyFormValues = {
  name: "",
  nit: "",
  address: "",
  email: "",
  phone: "",
  defaultTaxMode: "NONE",
  defaultTaxName: null,
  defaultTaxPercentage: null,
  defaultNotes: "",
  defaultTerms: "",
};

function buildPayload(data: CreateCompanyFormValues): CreateBusinessDto {
  return {
    ...data,
    defaultTaxMode: data.defaultTaxMode ?? "NONE",
    defaultTaxName:
      data.defaultTaxMode === "BY_TOTAL" ? (data.defaultTaxName ?? null) : null,
    defaultTaxPercentage:
      data.defaultTaxMode === "BY_TOTAL" &&
      data.defaultTaxPercentage != null &&
      !Number.isNaN(data.defaultTaxPercentage)
        ? data.defaultTaxPercentage
        : null,
    defaultNotes: data.defaultNotes ?? null,
    defaultTerms: data.defaultTerms ?? null,
  };
}

export interface CreateCompanyFormProps {
  onSubmit: (
    data: CreateBusinessDto,
    logoFile: File | null,
  ) => void | Promise<void>;
  logoRequired?: boolean;
  formId?: string;
  defaultValues?: Partial<CreateCompanyFormValues>;
  idPrefix?: string;
  children?: React.ReactNode;
}

export function CreateCompanyForm({
  onSubmit: onSubmitProp,
  logoRequired = true,
  formId,
  defaultValues: defaultValuesProp,
  idPrefix = "create-company",
  children,
}: CreateCompanyFormProps) {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState(false);

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createBusinessSchema),
    mode: "onSubmit",
    defaultValues: { ...defaultFormValues, ...defaultValuesProp },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedLogoFile(file);
    setLogoError(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreview(null);
    setLogoError(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (data: CreateCompanyFormValues) => {
    if (logoRequired && !selectedLogoFile) {
      setLogoError(true);
      return;
    }
    const payload = buildPayload(data);
    await onSubmitProp(payload, selectedLogoFile);
  };

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      <FieldGroup>
        <div className="space-y-4 pt-4 border-t border-border">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${idPrefix}-name`}>
                  Company Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`${idPrefix}-name`}
                  placeholder="My Company Inc."
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
                <FieldLabel htmlFor={`${idPrefix}-nit`}>
                  NIT / Tax ID (optional)
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={`${idPrefix}-nit`}
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
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${idPrefix}-address`}>
                  Address <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${idPrefix}-address`}
                  placeholder="123 Business St, City, Country"
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
                  <FieldLabel htmlFor={`${idPrefix}-email`}>
                    Email <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-email`}
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
                  <FieldLabel htmlFor={`${idPrefix}-phone`}>
                    Phone <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-phone`}
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
        </div>

        {/* Logo section */}
        <div className="space-y-2 pt-4 border-t border-border">
          <FieldLabel>
            Company logo
            {logoRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoSelect}
            className="hidden"
            aria-invalid={logoError}
          />
          <div className="mt-2 flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden border border-border shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Button
                type="button"
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {logoPreview ? "Change logo" : "Upload logo"}
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-destructive hover:text-destructive"
                  onClick={handleRemoveLogo}
                >
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: square image, max 5MB (JPG, PNG, WebP, SVG)
              </p>
              {logoError && (
                <p className="text-sm text-destructive mt-1">
                  Logo is required
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice defaults */}
        <div className="space-y-4 pt-4 border-t border-border">
          <FieldLabel className="text-base font-medium">
            Invoice defaults (optional)
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

      {children}
    </form>
  );
}
