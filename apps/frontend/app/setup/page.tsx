"use client";

import { useState } from "react";
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
import { FunnelGuard } from "@/components/guards/funnel-guard";

/** TipTap JSON — defaults for new businesses created from /setup only */
const setupDefaultNotes: Record<string, unknown> = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Thank you for your business. Please review all invoice details carefully and contact us with any questions or concerns within 3 business days. We appreciate the opportunity to serve you.",
        },
      ],
    },
  ],
};

const setupDefaultTerms: Record<string, unknown> = {
  type: "doc",
  content: [
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Payment is due according to the terms listed on this invoice.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Late payments may be subject to additional fees or interest.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "All sales/services provided are considered accepted unless reported otherwise within 3 business days.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Deposits and completed work are non-refundable unless otherwise agreed in writing.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "By submitting, the customer agrees to these terms and conditions.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

interface SetupPageContentProps {
  onSetupInProgressChange: (inProgress: boolean) => void;
}

function SetupPageContent({ onSetupInProgressChange }: SetupPageContentProps) {
  const router = useRouter();
  const createBusinessMutation = useCreateBusiness();
  const setDefaultBusinessMutation = useSetDefaultBusiness();
  const uploadLogoMutation = useUploadLogo();
  const { isLoading: isLoadingBusinesses } = useBusinesses();
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  const handleSubmit = async (
    data: CreateBusinessDTO,
    logoFile: File | null,
  ) => {
    setIsCompletingSetup(true);
    onSetupInProgressChange(true);
    try {
      const business = await createBusinessMutation.mutateAsync(data);
      await setDefaultBusinessMutation.mutateAsync(business.id);
      if (logoFile) {
        await uploadLogoMutation.mutateAsync({
          id: business.id,
          file: logoFile,
        });
      }
      toast.success("Setup complete!", {
        description: "The business has been created successfully.",
      });
      router.push("/clients");
    } finally {
      setIsCompletingSetup(false);
      onSetupInProgressChange(false);
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
              defaultValues={{
                defaultNotes: setupDefaultNotes,
                defaultTerms: setupDefaultTerms,
              }}
              onSubmit={handleSubmit}
            >
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  form="setup-company-form"
                  disabled={isCompletingSetup}
                  className="gap-2"
                >
                  {isCompletingSetup ? "Setting up..." : "Complete Setup"}
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

export default function SetupPage() {
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  return (
    <FunnelGuard requiredStep="setup" enabled={!isSetupInProgress}>
      <SetupPageContent onSetupInProgressChange={setIsSetupInProgress} />
    </FunnelGuard>
  );
}
