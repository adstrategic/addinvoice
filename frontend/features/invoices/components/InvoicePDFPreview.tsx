"use client";

import type { InvoiceResponse } from "../types/api";
import { calculateItemTotal } from "../lib/utils";

interface InvoicePDFPreviewProps {
  invoice: InvoiceResponse;
}

/**
 * Hidden PDF preview component for invoice PDF generation
 * This component renders the invoice in a format suitable for PDF conversion
 */
export function InvoicePDFPreview({ invoice }: InvoicePDFPreviewProps) {
  const clientName =
    invoice.client?.name || invoice.client?.businessName || "Unknown Client";
  const clientAddress = invoice.client?.address || "";
  const clientNIT = invoice.client?.nit || "";

  return (
    <div
      id={`invoice-preview-${invoice.id}`}
      className="fixed -left-[9999px] w-[210mm] bg-white p-8"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.client?.businessName || "Company Name"}
            </h1>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {clientAddress}
            </p>
            {clientNIT && (
              <p className="text-sm text-gray-600">NIT: {clientNIT}</p>
            )}
            {invoice.client?.email && (
              <p className="text-sm text-gray-600">{invoice.client.email}</p>
            )}
            {invoice.client?.phone && (
              <p className="text-sm text-gray-600">{invoice.client.phone}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-600 mt-2">
              Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-4">
          <p className="text-sm font-semibold text-gray-900">Bill To:</p>
          <p className="text-sm text-gray-900">{clientName}</p>
        </div>

        {invoice.items && invoice.items.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Qty
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Price
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Tax
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    {item.tax}%
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    ${calculateItemTotal(item).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ${(invoice.subtotal || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Tax:</span>
              <span className="font-semibold text-gray-900">
                ${(invoice.totalTax || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">
                ${(invoice.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-900">Notes:</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {invoice.notes}
            </p>
          </div>
        )}
        {invoice.terms && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900">
              Terms & Conditions:
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {invoice.terms}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

