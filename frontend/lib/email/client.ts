import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendInvoiceEmailParams {
  to: string;
  subject: string;
  message: string;
  pdfBuffer: Buffer;
  invoiceNumber: string;
  fromEmail?: string;
}

export async function sendInvoiceEmail({
  to,
  subject,
  message,
  pdfBuffer,
  invoiceNumber,
  fromEmail = "no-reply@news.addinvoicesai.com", // Default Resend email, should be replaced with verified domain
}: SendInvoiceEmailParams) {
  if (!resend) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please configure Resend API key."
    );
  }

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoiceNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find the invoice attached as a PDF.
          </p>
        </div>
      `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }

  return data;
}
