import type { AdvanceResponse } from "@addinvoice/schemas";
import { useAuth } from "@clerk/nextjs";

export function useDownloadAdvancePdf() {
  const { getToken } = useAuth();

  const downloadPdf = async (advance: AdvanceResponse) => {
    const token = await getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/advances/${advance.sequence}/pdf`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to generate PDF");

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `advance-${String(advance.sequence)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  };

  return downloadPdf;
}
