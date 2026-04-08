"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CreditCard, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspacePaymentMethods } from "@/features/workspace";

interface ConvertEstimateToInvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  estimateNumber?: string;
  isConverting?: boolean;
  onConfirm: (selectedPaymentMethodId: number | null) => void;
}

export function ConvertEstimateToInvoiceModal({
  isOpen,
  onOpenChange,
  estimateNumber,
  isConverting = false,
  onConfirm,
}: ConvertEstimateToInvoiceModalProps) {
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    useWorkspacePaymentMethods();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    number | null
  >(null);

  const enabledPaymentMethods = useMemo(
    () => paymentMethods?.filter((method) => method.isEnabled) ?? [],
    [paymentMethods],
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethodId(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Convert Estimate to Invoice</DialogTitle>
          <DialogDescription>
            Select how the client should pay this invoice before conversion
            {estimateNumber ? ` (${estimateNumber})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            className={`cursor-pointer rounded-lg border p-4 text-left hover:bg-secondary/50 transition-colors ${selectedPaymentMethodId == null ? "border-primary bg-secondary/50" : "border-border"}`}
            onClick={() => setSelectedPaymentMethodId(null)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-foreground" />
              </div>
              <span className="font-medium text-foreground">Manual</span>
            </div>
          </button>

          {enabledPaymentMethods.map((method) => {
            const labels: Record<
              string,
              { name: string; icon: "paypal" | "venmo" | "zelle" | "stripe" }
            > = {
              PAYPAL: { name: "PayPal", icon: "paypal" },
              VENMO: { name: "Venmo", icon: "venmo" },
              ZELLE: { name: "Zelle", icon: "zelle" },
              STRIPE: { name: "Stripe", icon: "stripe" },
            };
            const label = labels[method.type];
            const isSelected = selectedPaymentMethodId === method.id;

            return (
              <button
                key={method.id}
                type="button"
                className={`cursor-pointer rounded-lg border p-4 text-left hover:bg-secondary/50 transition-colors ${isSelected ? "border-primary bg-secondary/50" : "border-border"}`}
                onClick={() => setSelectedPaymentMethodId(method.id)}
              >
                <div className="flex items-center gap-3">
                  {label?.icon === "paypal" && (
                    <Image
                      src="/images/PayPal-icon.png"
                      alt="PayPal"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  {label?.icon === "venmo" && (
                    <Image
                      src="/images/venmo-icon.png"
                      alt="Venmo"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  {label?.icon === "zelle" && (
                    <Image
                      src="/images/zelle-icon.png"
                      alt="Zelle"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  {label?.icon === "stripe" && (
                    <Image
                      src="/images/stripe-icon.webp"
                      alt="Stripe"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <span className="font-medium text-foreground">
                    {label?.name ?? method.type}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {enabledPaymentMethods.length === 0 && !isLoadingPaymentMethods && (
          <p className="text-sm text-muted-foreground">
            No online payment methods are enabled. You can still continue with
            manual payment.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(selectedPaymentMethodId)}
            disabled={isConverting}
            className="gap-2"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting…
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                Confirm and Convert
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
