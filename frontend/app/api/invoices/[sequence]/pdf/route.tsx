import React from "react";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDFTemplate } from "@/components/invoices/InvoicePDFTemplate";
import { createServerApiClient } from "@/lib/api/server-client";
import type { InvoiceResponse } from "@/features/invoices/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sequence: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get sequence from params (await params in Next.js 15+)
    const { sequence: sequenceParam } = await params;
    const sequence = parseInt(sequenceParam);
    if (isNaN(sequence)) {
      return NextResponse.json(
        { error: "Invalid sequence number" },
        { status: 400 }
      );
    }

    // 3. Create server-side API client
    const apiClient = await createServerApiClient();

    // 4. Fetch invoice data from backend
    const response = await apiClient.get<{
      success: boolean;
      data: InvoiceResponse;
    }>(`/invoices/${sequence}`);

    if (!response.data.success || !response.data.data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = response.data.data;

    // 5. Validate invoice has required data
    if (!invoice.client) {
      return NextResponse.json(
        { error: "Invoice client data missing" },
        { status: 400 }
      );
    }

    // 6. Get company data (generic for now)
    const companyData = invoice.business;

    // 7. Render PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDFTemplate
        invoice={invoice}
        client={invoice.client}
        company={companyData}
      />
    );

    // 8. Convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);

    // 9. Return PDF
    return new NextResponse(pdfArray, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
