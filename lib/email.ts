import { Resend } from "resend";

type WelcomeArgs = {
  to: string;
  name: string;
  service?: string | null;
  vehicle?: string | null;
};

const FROM = process.env.FROM_EMAIL ?? "Royalty Details <onboarding@resend.dev>";
const REPLY_TO = process.env.REPLY_TO_EMAIL;

let client: Resend | null = null;
function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendWelcomeEmail({ to, name, service, vehicle }: WelcomeArgs) {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome email");
    return;
  }

  const firstName = name.split(/\s+/)[0] || "there";
  const detailLine = [vehicle, service].filter(Boolean).join(" · ");

  const subject = "We got your request — Royalty Details";
  const text = [
    `Hi ${firstName},`,
    "",
    "Thanks for reaching out to Royalty Details. We've received your inquiry and a representative will be in touch shortly via text or call to lock in a date for your detail and walk through payment.",
    detailLine ? `\nWhat we have on file: ${detailLine}` : "",
    "",
    "If you need to reach us before then, just reply to this email.",
    "",
    "— Royalty Details",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:-apple-system,Segoe UI,system-ui,sans-serif;background:#0b0b0c;color:#f5f4ee;padding:32px 24px;">
      <div style="max-width:560px;margin:0 auto;background:#15151a;border:1px solid #2a2a33;border-radius:12px;padding:32px;">
        <h1 style="margin:0 0 4px;color:#c8a96a;font-size:22px;letter-spacing:0.04em;">ROYALTY DETAILS</h1>
        <p style="margin:0 0 20px;color:#9b9aa3;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">Mobile Auto Detailing · North Jersey</p>
        <p style="margin:0 0 14px;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
          Thanks for reaching out. We've received your inquiry and a representative will be in touch shortly
          via <strong>text or call</strong> to lock in a date for your detail and walk through payment.
        </p>
        ${detailLine ? `<p style="margin:0 0 14px;font-size:14px;color:#9b9aa3;">What we have on file: <span style="color:#e0c789;">${escapeHtml(detailLine)}</span></p>` : ""}
        <p style="margin:0 0 0;font-size:14px;color:#9b9aa3;">Need us sooner? Just reply to this email.</p>
        <hr style="border:none;border-top:1px solid #2a2a33;margin:24px 0;" />
        <p style="margin:0;font-size:13px;color:#9b9aa3;">— Royalty Details</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      text,
      html,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    });
  } catch (err) {
    console.error("[email] welcome send failed", err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
