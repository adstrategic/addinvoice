import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerApiClient } from "@/lib/api/server-client";
import { sendInvoiceEmail } from "@/lib/email/client";

interface SendInvoiceRequest {
  email: string;
  subject: string;
  message: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sequence: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sequence: sequenceParam } = await params;
    const sequence = parseInt(sequenceParam);
    if (isNaN(sequence)) {
      return NextResponse.json(
        { error: "Invalid sequence number" },
        { status: 400 }
      );
    }

    const body: SendInvoiceRequest = await request.json();
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: email, subject, message" },
        { status: 400 }
      );
    }

    const apiClient = await createServerApiClient();
    const invoiceRes = await apiClient.get<{ data: { id: number; invoiceNumber: string; client: unknown } }>(
      `/invoices/${sequence}`
    );
    const invoice = invoiceRes.data?.data;
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (!invoice.client) {
      return NextResponse.json(
        { error: "Invoice client data missing" },
        { status: 400 }
      );
    }

    const token = await getToken();
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const pdfResponse = await fetch(`${baseURL}/api/v1/invoices/${sequence}/pdf`, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      let errBody: unknown = { error: "Failed to generate PDF" };
      try {
        errBody = JSON.parse(errText);
      } catch {
        if (errText) errBody = { error: errText };
      }
      return NextResponse.json(errBody, { status: pdfResponse.status });
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    await sendInvoiceEmail({
      to: email,
      subject,
      message,
      pdfBuffer,
      invoiceNumber: invoice.invoiceNumber,
    });

    try {
      await apiClient.patch(`/invoices/${invoice.id}/send`);
    } catch (error) {
      console.warn("Failed to update invoice status:", error);
    }

    return NextResponse.json({
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
