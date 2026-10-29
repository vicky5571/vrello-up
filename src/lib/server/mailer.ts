import nodemailer from "nodemailer";

/**
 * Returns true if SMTP transport configuration is present.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || "Vrello <no-reply@vrelloup.dev>";
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Send an account approval notification email.
 * Fail-silent if SMTP is not configured or if sending fails.
 */
export async function sendApprovalEmail(to: string, name: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[mailer] SMTP_HOST not set. Skipping approval email.");
    return;
  }

  const appUrl = getAppUrl();
  const html = `
    <p>Hi ${name},</p>
    <p>Your Vrello account has been approved. You can now sign in at:</p>
    <p><a href="${appUrl}/login">${appUrl}/login</a></p>
    <p>Welcome to the team.</p>
    <p>— Vrello Admin</p>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: "Your Vrello account is approved",
      html,
    });
  } catch (error) {
    console.error("[mailer] Failed to send approval email:", error);
  }
}

/**
 * Send an account rejection notification email.
 * Fail-silent if SMTP is not configured or if sending fails.
 */
export async function sendRejectionEmail(
  to: string,
  name: string,
  reason?: string
): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[mailer] SMTP_HOST not set. Skipping rejection email.");
    return;
  }

  const html = `
    <p>Hi ${name},</p>
    <p>Your request for a Vrello account could not be approved at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>If you believe this is an error, please contact your administrator.</p>
    <p>— Vrello Admin</p>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: "Your Vrello account request",
      html,
    });
  } catch (error) {
    console.error("[mailer] Failed to send rejection email:", error);
  }
}

