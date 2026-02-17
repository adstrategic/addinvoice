import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = "no-reply@news.addinvoicesai.com";

export interface SendEmailWithPdfParams {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
  fromEmail?: string;
}

/**
 * Send an email with a PDF attachment using Resend.
 * Used by queue workers for invoice and receipt emails.
 * Throws EmailValidationError for invalid recipient/validation (do not retry).
 * Throws Error for 5xx/network (retry with backoff).
 */
export async function sendEmailWithPdf({
  to,
  subject,
  html,
  pdfBuffer,
  filename,
  fromEmail = DEFAULT_FROM,
}: SendEmailWithPdfParams): Promise<void> {
  if (!resend) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please configure Resend API key.",
    );
  }

  type ResendErrorShape = {
    name?: string;
    message?: string;
    statusCode?: number | null;
  };

  let data: { id: string } | null = null;

  await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });
}

export interface SendFailureNotificationParams {
  to: string;
  subject: string;
  html: string;
  fromEmail?: string;
}

/**
 * Send a plain text/html email (no PDF). Used for failure notifications to workspace owner.
 */
export async function sendFailureNotificationEmail({
  to,
  subject,
  html,
  fromEmail = DEFAULT_FROM,
}: SendFailureNotificationParams): Promise<void> {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set; skipping failure notification",
    );
    return;
  }
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message || "Failed to send notification email");
  }
}

export interface NotifySendFailureParams {
  type: "invoice" | "receipt";
  recipientEmail: string;
  invoiceNumber?: string;
  /** When set, send notification to this email instead of resolving workspace owner. */
  notifyToEmail?: string;
}

/**
 * Send a "send failed" notification. If params.notifyToEmail is set, use it;
 * otherwise resolve workspace owner email via Clerk and send there.
 * Swallows errors (logs only) so notification failure does not affect the job.
 */
export async function notifySendFailure(
  workspaceId: number,
  params: NotifySendFailureParams,
): Promise<void> {
  const { type, recipientEmail, invoiceNumber, notifyToEmail } = params;
  try {
    const toEmail = notifyToEmail;
    if (!toEmail) {
      console.warn(
        `[email] No notification email for workspace ${workspaceId}; skipping send-failure notification`,
      );
      return;
    }
    const subject =
      type === "invoice"
        ? "Invoice could not be sent"
        : "Payment receipt could not be sent";
    const context =
      type === "invoice"
        ? `The invoice${invoiceNumber ? ` ${invoiceNumber}` : ""} could not be sent`
        : `The payment receipt${invoiceNumber ? ` for invoice ${invoiceNumber}` : ""} could not be sent`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email delivery failed</h2>
        <p style="margin: 20px 0; line-height: 1.6; color: #666;">
          ${context} to <strong>${recipientEmail}</strong> because the email address appears to be invalid or could not be delivered.
        </p>
        <p style="margin: 20px 0; line-height: 1.6; color: #666;">
          Please check the recipient address and try again.
        </p>
      </div>
    `;
    await sendFailureNotificationEmail({
      to: toEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error(
      "[email] Failed to send failure notification to workspace owner:",
      err instanceof Error ? err.message : err,
    );
  }
}
