// src/middleware/auth.ts
import { Context, Next } from 'hono'
import { getCookie }      from 'hono/cookie'
import type { HonoEnv }  from '../types'

export async function adminAuth(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const token = getCookie(c, 'kb_session')

  if (!token) {
    return c.redirect('/login')
  }

  const session = await c.env.DB.prepare(
    `SELECT token FROM admin_sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`
  ).bind(token).first<{ token: string }>()

  if (!session) {
    return c.redirect('/login')
  }

  // Slide session expiry by 8 hours on activity
  await c.env.DB.prepare(
    `UPDATE admin_sessions SET expires_at = datetime('now', '+8 hours') WHERE token = ?`
  ).bind(token).run()

  c.set('adminAuthed', true)
  await next()
}

/** Quick check — returns boolean without redirecting */
export async function isAdmin(c: Context<HonoEnv>): Promise<boolean> {
  const token = getCookie(c, 'kb_session')
  if (!token) return false
  const row = await c.env.DB.prepare(
    `SELECT token FROM admin_sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`
  ).bind(token).first()
  return !!row
}
