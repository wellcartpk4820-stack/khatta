// src/routes/auth.ts
import { Hono }        from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import {
  hashPassword, verifyPassword,
  createJWT, generateToken, uuid, escapeHtml,
} from '../utils/security'
import { loginPage }          from '../pages/login'
import { forgotPasswordPage } from '../pages/forgot-password'
import { resetPasswordPage }  from '../pages/reset-password'
import { setupPage }          from '../pages/setup'
import { sendEmail }          from '../utils/email'
import type { HonoEnv, Admin } from '../types'

export const authRoutes = new Hono<HonoEnv>()

// ─────────────────────────────────────────────────────────────────────────────
// SETUP  — only accessible when no admin account exists yet
// ─────────────────────────────────────────────────────────────────────────────

authRoutes.get('/setup', async c => {
  const existing = await c.env.DB.prepare(`SELECT id FROM admins LIMIT 1`).first()
  if (existing) return c.redirect('/login')
  return c.html(setupPage())
})

authRoutes.post('/setup', async c => {
  const existing = await c.env.DB.prepare(`SELECT id FROM admins LIMIT 1`).first()
  if (existing) return c.redirect('/login')

  const form     = await c.req.formData()
  const name     = (form.get('name')     as string || '').trim()
  const email    = (form.get('email')    as string || '').trim().toLowerCase()
  const password = (form.get('password') as string || '')
  const confirm  = (form.get('confirm')  as string || '')

  if (!name || !email || !password)
    return c.html(setupPage('All fields are required.'), 400)
  if (password !== confirm)
    return c.html(setupPage('Passwords do not match.'), 400)
  if (password.length < 8)
    return c.html(setupPage('Password must be at least 8 characters.'), 400)

  const password_hash = await hashPassword(password)
  const id = uuid()

  await c.env.DB.prepare(
    `INSERT INTO admins (id, email, name, password_hash) VALUES (?, ?, ?, ?)`
  ).bind(id, email, name, password_hash).run()

  return c.redirect('/login?setup=1')
})

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN / LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

authRoutes.get('/login', c => {
  const setup = c.req.query('setup')
  const reset = c.req.query('reset')
  return c.html(loginPage(undefined, setup === '1', reset === '1'))
})

authRoutes.post('/login', async c => {
  const form     = await c.req.formData()
  const email    = (form.get('email')    as string || '').trim().toLowerCase()
  const password = (form.get('password') as string || '')

  // Check if any admin exists — prompt setup if not
  const adminCount = await c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM admins`).first<{ cnt: number }>()
  if (!adminCount || adminCount.cnt === 0) return c.redirect('/setup')

  const admin = await c.env.DB.prepare(
    `SELECT * FROM admins WHERE LOWER(email) = ?`
  ).bind(email).first<Admin>()

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return c.html(loginPage('Invalid email or password.'), 401)
  }

  const token = await createJWT(
    { sub: admin.id, email: admin.email, name: admin.name },
    c.env.SESSION_SECRET,
    8   // 8-hour session
  )

  setCookie(c, 'kb_jwt', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'Lax',
    path:     '/',
    maxAge:   8 * 60 * 60,
  })

  return c.redirect('/admin')
})

authRoutes.post('/logout', c => {
  deleteCookie(c, 'kb_jwt', { path: '/' })
  return c.redirect('/login')
})

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

authRoutes.get('/forgot-password', c => c.html(forgotPasswordPage()))

authRoutes.post('/forgot-password', async c => {
  const form  = await c.req.formData()
  const email = (form.get('email') as string || '').trim().toLowerCase()

  if (!email) return c.html(forgotPasswordPage('Email is required.'), 400)

  // Constant-time response — never reveal whether the email exists
  const successMsg = 'If that email is registered, a reset link has been sent. Check your inbox.'

  const admin = await c.env.DB.prepare(
    `SELECT * FROM admins WHERE LOWER(email) = ?`
  ).bind(email).first<Admin>()

  // No admin found → still show success to prevent enumeration
  if (!admin) return c.html(forgotPasswordPage(undefined, successMsg))

  if (!c.env.BREVO_API_KEY || !c.env.BREVO_FROM_EMAIL) {
    return c.html(
      forgotPasswordPage('Email service is not configured. Ask your server admin to set BREVO_API_KEY.'),
      500
    )
  }

  const resetToken   = generateToken()                                          // 64-char random hex
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString()    // 1 hour

  await c.env.DB.prepare(
    `UPDATE admins SET reset_token=?, reset_expires=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(resetToken, resetExpires, admin.id).run()

  const resetLink = `${c.env.APP_URL}/reset-password?token=${resetToken}`

  await sendEmail({
    to:        admin.email,
    toName:    admin.name,
    subject:   'KhataBook — Password Reset Request',
    html:      resetEmailHtml(admin.name, resetLink),
    apiKey:    c.env.BREVO_API_KEY,
    fromEmail: c.env.BREVO_FROM_EMAIL,
    fromName:  c.env.BREVO_FROM_NAME || 'KhataBook',
  })

  return c.html(forgotPasswordPage(undefined, successMsg))
})

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

authRoutes.get('/reset-password', async c => {
  const token = (c.req.query('token') || '').trim()
  if (!token) return c.redirect('/forgot-password')

  const admin = await c.env.DB.prepare(
    `SELECT id FROM admins WHERE reset_token=? AND reset_expires > CURRENT_TIMESTAMP`
  ).bind(token).first()

  if (!admin)
    return c.html(resetPasswordPage(token, 'This reset link is invalid or has expired.'))

  return c.html(resetPasswordPage(token))
})

authRoutes.post('/reset-password', async c => {
  const form     = await c.req.formData()
  const token    = (form.get('token')    as string || '').trim()
  const password = (form.get('password') as string || '')
  const confirm  = (form.get('confirm')  as string || '')

  if (!token) return c.redirect('/forgot-password')

  if (password !== confirm)
    return c.html(resetPasswordPage(token, 'Passwords do not match.'), 400)
  if (password.length < 8)
    return c.html(resetPasswordPage(token, 'Password must be at least 8 characters.'), 400)

  const admin = await c.env.DB.prepare(
    `SELECT id FROM admins WHERE reset_token=? AND reset_expires > CURRENT_TIMESTAMP`
  ).bind(token).first<{ id: string }>()

  if (!admin)
    return c.html(resetPasswordPage(token, 'This reset link is invalid or has expired.'), 400)

  const password_hash = await hashPassword(password)

  await c.env.DB.prepare(`
    UPDATE admins
    SET password_hash=?, reset_token=NULL, reset_expires=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(password_hash, admin.id).run()

  return c.redirect('/login?reset=1')
})

// ─────────────────────────────────────────────────────────────────────────────
// Email template — password reset
// ─────────────────────────────────────────────────────────────────────────────

function resetEmailHtml(name: string, resetLink: string): string {
  const safeName = escapeHtml(name)
  const safeLink = escapeHtml(resetLink)
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1627;border-radius:12px;overflow:hidden;max-width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#c9a84c,#8a6520);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#050b18;font-size:28px;font-weight:800;">📒 KhataBook</h1>
          <p style="margin:8px 0 0;color:rgba(5,11,24,0.7);font-size:14px;">Password Reset Request</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="color:#7a92b5;font-size:15px;margin:0 0 20px;">
            Dear <strong style="color:#e2e8f0;">${safeName}</strong>,
          </p>
          <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 28px;">
            A password reset was requested for your KhataBook admin account.
            Click the button below to choose a new password.
            This link is valid for <strong style="color:#c9a84c;">1 hour</strong>.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${safeLink}"
               style="background:linear-gradient(135deg,#c9a84c,#8a6520);color:#050b18;font-weight:800;
                      font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;display:inline-block;">
              🔑 Reset My Password
            </a>
          </div>
          <p style="color:#455a77;font-size:12px;text-align:center;line-height:1.6;">
            If you didn't request this, you can safely ignore this email —
            your password will not change.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#050b18;padding:20px 40px;text-align:center;">
          <p style="color:#455a77;font-size:12px;margin:0;">KhataBook — Personal Ledger System</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}
