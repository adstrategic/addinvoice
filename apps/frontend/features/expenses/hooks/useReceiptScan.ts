"use client";

import { useCallback, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { CreateExpenseDTO } from "@addinvoice/schemas";
import type { ReceiptScanResult } from "../service/expenses.service";
import { expensesService } from "../service/expenses.service";

const setFormValuesFromScan = (
  form: UseFormReturn<CreateExpenseDTO>,
  result: ReceiptScanResult,
): void => {
  const opts = { shouldDirty: true as const };
  if (result.total != null && result.total > 0) {
    form.setValue("total", result.total, opts);
  }
  if (result.tax != null && result.tax >= 0) {
    form.setValue("tax", result.tax, opts);
  }
  if (result.expenseDate) {
    const date = new Date(result.expenseDate);
    if (!Number.isNaN(date.getTime())) {
      form.setValue("expenseDate", date, opts);
    }
  }
  if (result.description?.trim()) {
    form.setValue("description", result.description.trim(), opts);
  }
};

/**
 * Encapsulates receipt scan + form prefill: calls the scan API and applies
 * extracted fields to the form. Tracks loading state and ignores stale
 * results when the user selects a new file before the previous scan finishes.
 */
export function useReceiptScan(form: UseFormReturn<CreateExpenseDTO>) {
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const scanIdRef = useRef(0);

  const scanAndPrefill = useCallback(
    async (file: File): Promise<void> => {
      const id = ++scanIdRef.current;
      setIsScanningReceipt(true);
      try {
        const result = await expensesService.scanReceipt(file);
        if (id !== scanIdRef.current) return;

        setFormValuesFromScan(form, result);

        if (result.total != null && result.total > 0) {
          toast.success("Receipt scanned", {
            description: "Form fields have been filled from the receipt.",
          });
        }
      } catch {
        if (id !== scanIdRef.current) return;
        toast.error("Receipt scan failed", {
          description:
            "Could not read receipt data. You can still enter the details manually.",
        });
      } finally {
        if (id === scanIdRef.current) {
          setIsScanningReceipt(false);
        }
      }
    },
    [form],
  );

  return { scanAndPrefill, isScanningReceipt };
}
