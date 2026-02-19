"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateBusiness,
  useSetDefaultBusiness,
  useUploadLogo,
  useBusinesses,
  type CreateBusinessDto,
} from "@/features/businesses";
import { CreateCompanyForm } from "@/features/businesses/components/CreateCompanyForm";

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createBusinessMutation = useCreateBusiness();
  const setDefaultBusinessMutation = useSetDefaultBusiness();
  const uploadLogoMutation = useUploadLogo();
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingBusinesses && (businessesData?.data?.length ?? 0) > 0) {
      router.push("/");
    }
  }, [businessesData, isLoadingBusinesses, router]);

  const handleSubmit = async (
    data: CreateBusinessDto,
    logoFile: File | null,
  ) => {
    try {
      setIsSubmitting(true);

      const business = await createBusinessMutation.mutateAsync(data);
      await setDefaultBusinessMutation.mutateAsync(business.id);

      if (logoFile) {
        try {
          await uploadLogoMutation.mutateAsync({
            id: business.id,
            file: logoFile,
          });
        } catch (error) {
          console.error("Failed to upload logo:", error);
        }
      }

      toast({
        title: "Setup complete!",
        description: "Your business has been created successfully.",
      });

      router.push("/");
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBusinesses) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if ((businessesData?.data?.length ?? 0) > 0) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome! Let&apos;s set up your business
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
            <CreateCompanyForm
              formId="setup-company-form"
              idPrefix="setup-company"
              logoRequired
              onSubmit={handleSubmit}
            >
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  form="setup-company-form"
                  disabled={
                    isSubmitting ||
                    createBusinessMutation.isPending ||
                    setDefaultBusinessMutation.isPending
                  }
                  className="gap-2"
                >
                  {isSubmitting ||
                  createBusinessMutation.isPending ||
                  setDefaultBusinessMutation.isPending
                    ? "Setting up..."
                    : "Complete Setup"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CreateCompanyForm>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
