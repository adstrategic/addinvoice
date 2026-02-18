import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies PDF request to the backend. Authenticates with Clerk, then
 * forwards GET to backend GET /api/v1/invoices/:sequence/pdf and streams
 * the PDF response to the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sequence: string }> },
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
        { status: 400 },
      );
    }

    const token = await getToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseURL}/api/v1/invoices/${sequence}/pdf`;

    const backendResponse = await fetch(url, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      let body: unknown = { error: "Failed to generate PDF" };
      try {
        body = JSON.parse(text);
      } catch {
        if (text) body = { error: text };
      }
      return NextResponse.json(body, {
        status: backendResponse.status,
      });
    }

    const pdfBuffer = await backendResponse.arrayBuffer();
    const contentType =
      backendResponse.headers.get("Content-Type") || "application/pdf";
    const contentDisposition =
      backendResponse.headers.get("Content-Disposition") ||
      `attachment; filename="invoice-${sequence}.pdf"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
