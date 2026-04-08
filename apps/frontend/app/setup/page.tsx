"use client";

import { useEffect } from "react";
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
import {
  useCreateBusiness,
  useSetDefaultBusiness,
  useUploadLogo,
  useBusinesses,
} from "@/features/businesses";
import { CreateCompanyForm } from "@/features/businesses/components/CreateCompanyForm";
import { toast } from "sonner";
import type { CreateBusinessDTO } from "@addinvoice/schemas";
import { useOnboardingStatus } from "@/features/onboarding/hooks/useOnboarding";

export default function SetupPage() {
  const router = useRouter();
  const createBusinessMutation = useCreateBusiness();
  const setDefaultBusinessMutation = useSetDefaultBusiness();
  const uploadLogoMutation = useUploadLogo();
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const { data: onboarding, isLoading: isLoadingOnboarding } =
    useOnboardingStatus();

  // If onboarding not completed yet, send user to onboarding first
  useEffect(() => {
    if (isLoadingOnboarding) return;

    if (!onboarding?.completedAt) {
      router.push("/onboarding");
    }
  }, [isLoadingOnboarding, onboarding?.completedAt, router]);
  useEffect(() => {
    if (!isLoadingBusinesses && (businessesData?.data?.length ?? 0) > 0) {
      router.push("/");
    }
  }, [businessesData, isLoadingBusinesses, router]);

  const handleSubmit = (data: CreateBusinessDTO, logoFile: File | null) => {
    const done = () => {
      toast.success("Setup complete!", {
        description: "The business has been created successfully.",
      });
      router.push("/");
    };
    createBusinessMutation.mutate(data, {
      onSuccess: (business) => {
        setDefaultBusinessMutation.mutate(business.id, {
          onSuccess: () => {
            if (logoFile) {
              uploadLogoMutation.mutate(
                { id: business.id, file: logoFile },
                { onSuccess: done },
              );
            } else {
              done();
            }
          },
        });
      },
    });
  };

  if (isLoadingBusinesses || isLoadingOnboarding) {
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
                    createBusinessMutation.isPending ||
                    setDefaultBusinessMutation.isPending ||
                    uploadLogoMutation.isPending
                  }
                  className="gap-2"
                >
                  {createBusinessMutation.isPending ||
                  setDefaultBusinessMutation.isPending ||
                  uploadLogoMutation.isPending
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
