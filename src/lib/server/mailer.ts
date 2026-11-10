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

/**
 * Send an overdue equipment loan reminder to the borrower.
 * Fail-silent if SMTP is not configured or if sending fails.
 */
export async function sendBorrowOverdueEmail(
  to: string,
  borrowerName: string,
  borrowCode: string,
  itemsDescription: string,
  dueDate: string
): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[mailer] SMTP_HOST not set. Skipping borrow overdue email.");
    return;
  }

  const appUrl = getAppUrl();
  const html = `
    <p>Halo ${borrowerName},</p>
    <p>Peminjaman peralatan Marcom Anda dengan kode <strong>${borrowCode}</strong> telah melewati batas waktu pengembalian pada <strong>${dueDate}</strong>.</p>
    <p><strong>Peralatan:</strong> ${itemsDescription}</p>
    <p>Harap segera melakukan pengembalian fisik ke gudang logistik atau menghubungi petugas gudang melalui portal Vrello:</p>
    <p><a href="${appUrl}">${appUrl}</a></p>
    <p>Terima kasih atas kerja samanya.</p>
    <p>— Tim Logistik & Operasional Marcom Vrello</p>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: `[Peringatan] Pengembalian Peralatan Marcom: ${borrowCode}`,
      html,
    });
  } catch (error) {
    console.error("[mailer] Failed to send borrow overdue email:", error);
  }
}

/**
 * Send a consolidated overdue equipment digest to logistics managers.
 * Fail-silent if SMTP is not configured or if sending fails.
 */
export async function sendBorrowOverdueDigestEmail(
  to: string[],
  summaryList: Array<{ borrowCode: string; borrowerName: string; dueDate: string; itemsSummary: string }>
): Promise<void> {
  if (!isSmtpConfigured() || to.length === 0 || summaryList.length === 0) {
    return;
  }

  const appUrl = getAppUrl();
  const count = summaryList.length;
  const listItems = summaryList
    .map(
      (s) =>
        `<li><strong>${s.borrowCode}</strong> - ${s.borrowerName} (Jatuh tempo: ${s.dueDate})<br/><em>${s.itemsSummary}</em></li>`
    )
    .join("");

  const html = `
    <p>Yth. Tim Pengelola Gudang & Supervisor,</p>
    <p>Terdapat <strong>${count} peminjaman peralatan</strong> aktif yang saat ini telah melewati batas waktu pengembalian (Overdue):</p>
    <ul>
      ${listItems}
    </ul>
    <p>Silakan buka tab Borrowing Tracking pada aplikasi Vrello untuk tindak lanjut operasional:</p>
    <p><a href="${appUrl}">${appUrl}</a></p>
    <p>— Sistem Notifikasi Otomatis Vrello</p>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to: to.join(", "),
      subject: `[Laporan Harian] ${count} Peminjaman Peralatan Melewati Batas Pengembalian`,
      html,
    });
  } catch (error) {
    console.error("[mailer] Failed to send borrow overdue digest email:", error);
  }
}

