// src/utils/email.ts

interface SendEmailOptions {
  to:        string
  toName?:   string
  subject:   string
  html:      string
  apiKey:    string
  fromEmail: string
  fromName:  string
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      opts.apiKey,
    },
    body: JSON.stringify({
      sender:  { email: opts.fromEmail, name: opts.fromName },
      to:      [{ email: opts.to, name: opts.toName || opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo error:', err)
  }
}

/* ─── Email Templates ─────────────────────────────────────── */

export function reminderEmailTemplate(d: {
  personName:  string
  amount:      number
  currency:    string
  dueDate:     string
  purpose:     string | null
  paymentLink: string | null
  appName:     string
}): string {
  const { personName, amount, currency, dueDate, purpose, paymentLink, appName } = d
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1627;border-radius:12px;overflow:hidden;max-width:100%;">
  <tr><td style="background:linear-gradient(135deg,#c9a84c,#a07a2e);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#050b18;font-size:28px;font-weight:800;letter-spacing:-0.5px;">📒 ${appName}</h1>
    <p style="margin:8px 0 0;color:rgba(5,11,24,0.7);font-size:14px;">Payment Reminder</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#7a92b5;font-size:15px;margin:0 0 24px;">Dear <strong style="color:#e2e8f0;">${personName}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.7;">
      This is a friendly reminder that a payment is due from you.
    </p>
    <div style="background:#162035;border:1px solid #1e3a5f;border-radius:10px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr><td style="color:#7a92b5;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Amount Due</td>
            <td align="right" style="color:#c9a84c;font-size:22px;font-weight:700;font-family:monospace;">${currency} ${amount.toFixed(2)}</td></tr>
        <tr><td style="color:#7a92b5;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Due Date</td>
            <td align="right" style="color:#e2e8f0;font-size:14px;">${dueDate}</td></tr>
        ${purpose ? `<tr><td style="color:#7a92b5;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Purpose</td>
            <td align="right" style="color:#e2e8f0;font-size:14px;">${purpose}</td></tr>` : ''}
      </table>
    </div>
    ${paymentLink ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${paymentLink}" style="background:linear-gradient(135deg,#c9a84c,#a07a2e);color:#050b18;font-weight:800;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;display:inline-block;">
        💳 Pay Online Now
      </a>
    </div>` : ''}
    <p style="color:#455a77;font-size:12px;margin:24px 0 0;text-align:center;">
      If you have already made this payment, please ignore this reminder.
    </p>
  </td></tr>
  <tr><td style="background:#050b18;padding:20px 40px;text-align:center;">
    <p style="color:#455a77;font-size:12px;margin:0;">${appName} — Personal Ledger System</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

export function paymentConfirmedEmailTemplate(d: {
  personName: string
  amount:     number
  currency:   string
  txnId:      string
  appName:    string
}): string {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1627;border-radius:12px;overflow:hidden;max-width:100%;">
  <tr><td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">✅ Payment Received</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${d.appName}</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.7;">
      Payment of <strong style="color:#c9a84c;font-size:18px;">${d.currency} ${d.amount.toFixed(2)}</strong> has been successfully received from <strong style="color:#e2e8f0;">${d.personName}</strong>.
    </p>
    <p style="color:#7a92b5;font-size:12px;margin:0;">Transaction ID: <span style="font-family:monospace;color:#94a3b8;">${d.txnId}</span></p>
  </td></tr>
</table></td></tr></table>
</body></html>`
}
