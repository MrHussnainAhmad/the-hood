import nodemailer from "nodemailer";

type EmailRecipient = string | string[];

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function shellTemplate({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f4f6f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background:linear-gradient(160deg,#2f5d50,#1f3d35);padding:20px 24px;color:#ffffff;">
          <div style="font-size:24px;font-weight:700;letter-spacing:0.2px;">The Hood</div>
          <div style="font-size:12px;opacity:0.82;margin-top:4px;">Service Platform Notification</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          ${body}
          <p style="font-size:12px;line-height:1.6;color:#6b7280;margin-top:28px;">
            This is an automated message from The Hood.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(url: string, label: string) {
  return `<p style="margin:20px 0 0;">
    <a href="${url}" style="display:inline-block;background:#2f5d50;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">${label}</a>
  </p>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: EmailRecipient;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured. Skipping email:", subject);
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@thehood.local";

  await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  });

  return true;
}

export function renderAccountCreatedEmail(name: string) {
  return shellTemplate({
    title: "Welcome to The Hood",
    preheader: "Your account has been created successfully.",
    body: `
      <h1 style="margin:0 0 10px;font-size:24px;color:#111827;">Welcome, ${name || "there"}.</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Your The Hood account is now created. You can sign in and continue your journey.
      </p>
    `,
  });
}

export function renderVerifyEmailTemplate(name: string, verificationUrl: string) {
  return shellTemplate({
    title: "Verify your email",
    preheader: "Confirm your email address for The Hood.",
    body: `
      <h1 style="margin:0 0 10px;font-size:24px;color:#111827;">Verify your email</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, please confirm your email to activate your account.
      </p>
      ${ctaButton(verificationUrl, "Verify Email")}
      <p style="margin-top:14px;font-size:12px;color:#6b7280;line-height:1.6;">
        This link expires in 24 hours.
      </p>
    `,
  });
}

export function renderAccountDeletedEmail(name: string) {
  return shellTemplate({
    title: "Account Deleted",
    preheader: "Your account has been removed from The Hood.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Account Removed</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, your account has been deleted from The Hood. We are sorry if you had a bad experience.
        If you change your mind in future, we'd love to welcome you back.
      </p>
    `,
  });
}

export function renderPasswordUpdatedEmail(name: string) {
  return shellTemplate({
    title: "Password Updated",
    preheader: "Your password was changed.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Password Changed</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, your password was updated successfully.
      </p>
      <p style="margin-top:12px;font-size:13px;line-height:1.6;color:#9b1c1c;">
        If you did not perform this change, contact support immediately.
      </p>
    `,
  });
}

export function renderPasswordResetEmail(name: string, resetUrl: string) {
  return shellTemplate({
    title: "Reset your password",
    preheader: "Use this link to set a new password.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Password Reset Request</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, use the link below to set your new password.
      </p>
      ${ctaButton(resetUrl, "Reset Password")}
      <p style="margin-top:14px;font-size:12px;color:#6b7280;line-height:1.6;">
        This link expires in 30 minutes.
      </p>
    `,
  });
}

export function renderPaymentConfirmationEmail({
  name,
  orderId,
  amount,
  currency,
}: {
  name: string;
  orderId: string;
  amount: number;
  currency: string;
}) {
  return shellTemplate({
    title: "Payment Confirmed",
    preheader: "Your payment was received.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Payment Confirmed</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, we received your payment for order #${orderId.slice(-8)}.
      </p>
      <p style="margin-top:12px;font-size:14px;color:#111827;"><strong>${currency.toUpperCase()} ${amount.toFixed(2)}</strong></p>
      ${ctaButton(`${getBaseUrl()}/orders/${orderId}`, "View Order")}
    `,
  });
}

export function renderServiceDeliveredEmail({
  name,
  orderId,
  serviceName,
}: {
  name: string;
  orderId: string;
  serviceName: string;
}) {
  return shellTemplate({
    title: "Service Delivered",
    preheader: "Your service has been marked completed.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Service Delivered</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${name || "there"}, your service "${serviceName}" is marked as completed for order #${orderId.slice(-8)}.
      </p>
      ${ctaButton(`${getBaseUrl()}/orders/${orderId}`, "Open Order")}
    `,
  });
}

export function renderProviderServiceRemovedEmail({
  providerName,
  serviceName,
  reason,
}: {
  providerName: string;
  serviceName: string;
  reason?: string | null;
}) {
  const message = reason?.trim()
    ? `Reason provided by admin: ${reason}`
    : `We are sorry, your service "${serviceName}" has been removed from the platform. Please avoid similar violations to prevent account actions. For appeal, contact support.`;
  return shellTemplate({
    title: "Service Removed by Admin",
    preheader: "A provider service was removed.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">Service Removed by Admin</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${providerName || "Provider"}, ${message}
      </p>
    `,
  });
}

export function renderProviderOrderReceivedEmail({
  providerName,
  orderId,
  serviceName,
}: {
  providerName: string;
  orderId: string;
  serviceName: string;
}) {
  return shellTemplate({
    title: "New Order Received",
    preheader: "A new order is assigned to you.",
    body: `
      <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">New Order Received</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
        Hi ${providerName || "Provider"}, you received a new order for "${serviceName}".
      </p>
      ${ctaButton(`${getBaseUrl()}/provider/orders`, "Open Provider Orders")}
      <p style="margin-top:14px;font-size:12px;color:#6b7280;">Order reference: #${orderId.slice(-8)}</p>
    `,
  });
}
