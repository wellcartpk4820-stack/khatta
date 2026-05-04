// src/routes/auth.ts
import { Hono }         from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { sha256, generateToken } from '../utils/security'
import { loginPage }    from '../pages/login'
import type { HonoEnv } from '../types'

export const authRoutes = new Hono<HonoEnv>()

/* GET /login */
authRoutes.get('/login', c => c.html(loginPage()))

/* POST /login */
authRoutes.post('/login', async c => {
  const form     = await c.req.formData()
  const email    = (form.get('email')    as string || '').trim().toLowerCase()
  const password = (form.get('password') as string || '')

  const adminEmail = (c.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const pwHash     = await sha256(password)

  if (email !== adminEmail || pwHash !== c.env.ADMIN_PASSWORD_HASH) {
    return c.html(loginPage('Invalid email or password.'), 401)
  }

  const token     = generateToken()
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)`
  ).bind(token, expiresAt).run()

  setCookie(c, 'kb_session', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'Lax',
    path:     '/',
    maxAge:   8 * 60 * 60,
  })

  return c.redirect('/admin')
})

/* POST /logout */
authRoutes.post('/logout', async c => {
  const token = getCookie(c, 'kb_session')
  if (token) {
    await c.env.DB.prepare(`DELETE FROM admin_sessions WHERE token = ?`).bind(token).run()
  }
  deleteCookie(c, 'kb_session', { path: '/' })
  return c.redirect('/login')
})
