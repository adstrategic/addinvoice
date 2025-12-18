import React from "react";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDFTemplate } from "@/components/invoices/InvoicePDFTemplate";
import { createServerApiClient } from "@/lib/api/server-client";
import { sendInvoiceEmail } from "@/lib/email/client";
import type { InvoiceResponse } from "@/features/invoices";

interface SendInvoiceRequest {
  email: string;
  subject: string;
  message: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sequence: string } }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get sequence from params
    const sequence = parseInt(params.sequence);
    if (isNaN(sequence)) {
      return NextResponse.json(
        { error: "Invalid sequence number" },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body: SendInvoiceRequest = await request.json();
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: email, subject, message" },
        { status: 400 }
      );
    }

    // 4. Create server-side API client
    const apiClient = await createServerApiClient();

    // 5. Fetch invoice data from backend
    const response = await apiClient.get<{
      success: boolean;
      data: InvoiceResponse;
    }>(`/invoices/${sequence}`);

    if (!response.data.success || !response.data.data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice: InvoiceResponse = response.data.data;

    // 6. Validate invoice has required data
    if (!invoice.client) {
      return NextResponse.json(
        { error: "Invoice client data missing" },
        { status: 400 }
      );
    }

    // 7. Get company data (generic for now)
    const companyData = invoice.business;

    // 8. Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDFTemplate
        invoice={invoice}
        client={invoice.client}
        company={companyData}
      />
    );

    // 9. Send email with PDF attachment via Resend
    await sendInvoiceEmail({
      to: email,
      subject: subject,
      message: message,
      pdfBuffer: Buffer.from(pdfBuffer),
      invoiceNumber: invoice.invoiceNumber,
    });

    // 10. Update invoice status to SENT in the database
    try {
      await apiClient.patch(`/invoices/${invoice.id}/send`);
    } catch (error) {
      // Log but don't fail if status update fails
      // Email was sent successfully, so we still return success
      // User can manually mark as sent if needed
      console.warn("Failed to update invoice status:", error);
    }

    // 11. Return success
    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send invoice",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
