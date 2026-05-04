// src/middleware/auth.ts
import { Context, Next } from 'hono'
import { getCookie }      from 'hono/cookie'
import { verifyJWT }      from '../utils/security'
import type { HonoEnv }  from '../types'

/** Applied to all /admin and /api protected routes */
export async function adminAuth(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const token = getCookie(c, 'kb_jwt')

  if (!token) return c.redirect('/login')

  const payload = await verifyJWT(token, c.env.SESSION_SECRET)
  if (!payload) return c.redirect('/login')

  // Expose admin identity to downstream handlers via context variables
  c.set('adminAuthed', true)
  c.set('adminId',    payload.sub)
  c.set('adminEmail', payload.email)
  c.set('adminName',  payload.name)

  await next()
}

/** Non-redirecting boolean check (used inside public routes that need admin awareness) */
export async function isAdmin(c: Context<HonoEnv>): Promise<boolean> {
  const token = getCookie(c, 'kb_jwt')
  if (!token) return false
  const payload = await verifyJWT(token, c.env.SESSION_SECRET)
  return !!payload
}
