"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ArrowRight, Upload } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
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
import { useToast } from "@/hooks/use-toast";
import {
  useCreateBusiness,
  useSetDefaultBusiness,
  useUploadLogo,
  useBusinesses,
  type CreateBusinessDto,
} from "@/features/businesses";

// Validation schema matching backend
const setupBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(255, "Business name is too long"),
  nit: z
    .string({ required_error: "NIT/Tax ID is required" })
    .trim()
    .min(1, "NIT/Tax ID cannot be empty")
    .max(50, "NIT/Tax ID cannot exceed 50 characters"),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(1, "Address cannot be empty")
    .max(500, "Address cannot exceed 500 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must have a valid international format (e.g. +573011234567)"
    ),
});

type SetupBusinessForm = z.infer<typeof setupBusinessSchema>;

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createBusinessMutation = useCreateBusiness();
  const setDefaultBusinessMutation = useSetDefaultBusiness();
  const uploadLogoMutation = useUploadLogo();
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if user already has a business
  useEffect(() => {
    if (!isLoadingBusinesses && (businessesData?.data?.length ?? 0) > 0) {
      router.push("/");
    }
  }, [businessesData, isLoadingBusinesses, router]);

  const form = useForm<SetupBusinessForm>({
    resolver: zodResolver(setupBusinessSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      nit: "",
      address: "",
      email: "",
      phone: "",
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: SetupBusinessForm) => {
    try {
      setIsSubmitting(true);

      // Create business
      const business = await createBusinessMutation.mutateAsync(data);

      // Set as default
      await setDefaultBusinessMutation.mutateAsync(business.id);

      // Upload logo if selected
      if (selectedLogoFile) {
        try {
          await uploadLogoMutation.mutateAsync({
            id: business.id,
            file: selectedLogoFile,
          });
        } catch (error) {
          // Log error but don't fail the setup if logo upload fails
          console.error("Failed to upload logo:", error);
        }
      }

      toast({
        title: "Setup complete!",
        description: "Your business has been created successfully.",
      });

      // Redirect to dashboard immediately
      router.push("/");
    } catch (error) {
      // Error is handled by mutation hooks
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking if user has businesses
  if (isLoadingBusinesses) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Don't render setup form if user already has a business (redirect will happen)
  if ((businessesData?.data?.length ?? 0) > 0) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome! Let's set up your business
          </h1>
          <p className="text-muted-foreground">
            We need some basic information to get you started with invoicing
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Enter your business details. You can update these later in
              settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="My Company Inc."
                  className="mt-1"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="nit">
                  NIT / Tax ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nit"
                  placeholder="123456789-0"
                  className="mt-1"
                  {...form.register("nit")}
                />
                {form.formState.errors.nit && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.nit.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="123 Business St, City, Country"
                  className="mt-1"
                  rows={3}
                  {...form.register("address")}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    className="mt-1"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Company Logo (Optional)</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden border border-border">
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
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          setLogoPreview(null);
                          setSelectedLogoFile(null);
                          if (logoInputRef.current) {
                            logoInputRef.current.value = "";
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, max 5MB (JPG, PNG, WebP, SVG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={isSubmitting || createBusinessMutation.isPending}
                  className="gap-2"
                >
                  {isSubmitting || createBusinessMutation.isPending
                    ? "Setting up..."
                    : "Complete Setup"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
