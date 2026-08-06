"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Calculator } from "lucide-react";
import type { ControllerFieldState } from "react-hook-form";
import type { CreateEstimateDTO } from "@addinvoice/schemas";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ClientSelector } from "@/components/shared/ClientSelector";
import { useBusinesses } from "@/features/businesses";
import { useCreateEstimate, useNextEstimateNumber } from "../../hooks/useEstimates";
import {
  CLEANING_TYPES,
  buildCleaningItem,
  computeByRooms,
  computeBySquareFeet,
  type CleaningTypeId,
} from "./cleaning-calculator";

interface CleaningCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CalcMode = "squareFeet" | "rooms";

/** Small +/- numeric stepper (no shared stepper component exists in the app). */
function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CleaningCalculatorDialog({
  open,
  onOpenChange,
}: CleaningCalculatorDialogProps) {
  const router = useRouter();

  const { data: businessesData } = useBusinesses();
  const businesses = useMemo(() => businessesData?.data ?? [], [businessesData]);

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [clientId, setClientId] = useState(0);
  const [mode, setMode] = useState<CalcMode>("squareFeet");
  const [typeId, setTypeId] = useState<CleaningTypeId>("regular");
  const [squareFeet, setSquareFeet] = useState("");
  const [rooms, setRooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [showErrors, setShowErrors] = useState(false);

  const { data: nextEstimateNumber } = useNextEstimateNumber(open, businessId);
  const createEstimate = useCreateEstimate();

  // Auto-select the only business; keep selection valid when the list changes.
  useEffect(() => {
    if (!open) return;
    if (businessId != null) return;
    if (businesses.length === 1 && businesses[0]) {
      setBusinessId(businesses[0].id);
    }
  }, [open, businessId, businesses]);

  // Reset transient state each time the dialog is opened.
  useEffect(() => {
    if (open) return;
    setBusinessId(null);
    setClientId(0);
    setMode("squareFeet");
    setTypeId("regular");
    setSquareFeet("");
    setRooms(1);
    setBathrooms(1);
    setShowErrors(false);
  }, [open]);

  const squareFeetNumber = Number(squareFeet);
  const hasValidSquareFeet =
    squareFeet.trim() !== "" && Number.isFinite(squareFeetNumber) && squareFeetNumber > 0;

  const total = useMemo(() => {
    if (mode === "squareFeet") {
      return hasValidSquareFeet ? computeBySquareFeet(typeId, squareFeetNumber) : 0;
    }
    return computeByRooms(typeId, rooms, bathrooms);
  }, [mode, typeId, squareFeetNumber, hasValidSquareFeet, rooms, bathrooms]);

  const clientFieldState = {
    invalid: showErrors && clientId <= 0,
    isDirty: false,
    isTouched: false,
    isValidating: false,
    error:
      showErrors && clientId <= 0
        ? { type: "required", message: "Please select a client" }
        : undefined,
  } as ControllerFieldState;

  const businessMissing = businessId == null;
  const canSubmit =
    !businessMissing &&
    clientId > 0 &&
    !!nextEstimateNumber &&
    total > 0 &&
    !createEstimate.isPending;

  const handleSubmit = async () => {
    setShowErrors(true);
    if (businessMissing || clientId <= 0 || !nextEstimateNumber || total <= 0) {
      return;
    }

    const item =
      mode === "squareFeet"
        ? buildCleaningItem({ mode: "squareFeet", typeId, squareFeet: squareFeetNumber })
        : buildCleaningItem({ mode: "rooms", typeId, rooms, bathrooms });

    const payload: CreateEstimateDTO = {
      businessId,
      clientId,
      estimateNumber: nextEstimateNumber,
      currency: "USD",
      discount: 0,
      discountType: "NONE",
      taxMode: "NONE",
      taxName: null,
      taxPercentage: null,
      items: [item],
      descriptiveItems: [],
    };

    try {
      const result = await createEstimate.mutateAsync(payload);
      onOpenChange(false);
      if (result?.sequence != null) {
        router.push(`/estimates/${result.sequence}`);
      }
    } catch {
      // useCreateEstimate surfaces the error via toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Estimate calculator
          </DialogTitle>
          <DialogDescription>
            Calculate a price and create an estimate with one line item.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cleaning" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning" className="space-y-5 pt-2">
            {businesses.length > 1 && (
              <div className="space-y-2">
                <Label>Business</Label>
                <Select
                  value={businessId != null ? String(businessId) : undefined}
                  onValueChange={(value) => setBusinessId(Number(value))}
                >
                  <SelectTrigger
                    aria-invalid={showErrors && businessMissing}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select a business..." />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={String(business.id)}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showErrors && businessMissing && (
                  <p className="text-sm text-destructive">Please select a business</p>
                )}
              </div>
            )}

            <ClientSelector
              value={clientId}
              onValueChange={setClientId}
              fieldState={clientFieldState}
              initialClient={null}
              mode="create"
              showCreateNew={false}
            />

            {/* Mode switch */}
            <div className="space-y-2">
              <Label>Estimate by</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
                <button
                  type="button"
                  onClick={() => setMode("squareFeet")}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === "squareFeet"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  Square feet
                </button>
                <button
                  type="button"
                  onClick={() => setMode("rooms")}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === "rooms"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  Rooms &amp; bathrooms
                </button>
              </div>
            </div>

            {/* Cleaning type */}
            <div className="space-y-2">
              <Label>Cleaning type</Label>
              <Select
                value={typeId}
                onValueChange={(value) => setTypeId(value as CleaningTypeId)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode-specific inputs */}
            {mode === "squareFeet" ? (
              <div className="space-y-2">
                <Label htmlFor="calc-square-feet">Square feet</Label>
                <Input
                  id="calc-square-feet"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="e.g. 1500"
                  value={squareFeet}
                  onChange={(event) => setSquareFeet(event.target.value)}
                  aria-invalid={showErrors && !hasValidSquareFeet}
                />
                {showErrors && !hasValidSquareFeet && (
                  <p className="text-sm text-destructive">
                    Enter the square feet of the house
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Stepper label="Rooms" value={rooms} onChange={setRooms} />
                <Stepper label="Bathrooms" value={bathrooms} onChange={setBathrooms} />
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                Estimated total
              </span>
              <span className="text-xl font-bold tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {createEstimate.isPending ? "Creating..." : "Create estimate"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
