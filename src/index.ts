// src/index.ts
import { Hono }          from 'hono'
import { authRoutes }    from './routes/auth'
import { adminRoutes }   from './routes/admin'
import { apiRoutes }     from './routes/api'
import { publicRoutes }  from './routes/public'
import { paymentRoutes } from './routes/payment'
import { publicLookupPage } from './pages/public-lookup'
import type { HonoEnv }  from './types'

const app = new Hono<HonoEnv>()

/* ── Public homepage ─── */
app.get('/', c => c.html(publicLookupPage()))

/* ── Auth ─────────────── */
app.route('/', authRoutes)

/* ── Admin pages ──────── /admin/* */
app.route('/admin', adminRoutes)

/* ── REST API ─────────── /api/* */
app.route('/api', apiRoutes)

/* ── Public API ────────── /api/public/* */
app.route('/api/public', publicRoutes)

/* ── Payment ───────────── /payment/* */
app.route('/payment', paymentRoutes)

/* ── 404 fallback ──────── */
app.notFound(c =>
  c.html(`<!DOCTYPE html><html><body style="background:#050b18;color:#7a92b5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
  <div style="font-size:48px;">📒</div>
  <h1 style="color:#c9a84c;font-family:Georgia,serif;margin:0;">404 — Not Found</h1>
  <a href="/" style="color:#7a92b5;font-size:14px;text-decoration:none;border:1px solid #1e3a5f;padding:8px 20px;border-radius:8px;margin-top:8px;">← Go Home</a>
  </body></html>`, 404)
)

/* ── Global error handler ── */
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.html(`<!DOCTYPE html><html><body style="background:#050b18;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;">
  <div style="font-size:48px;">⚠️</div>
  <h1 style="margin:0;font-family:Georgia,serif;">Something went wrong</h1>
  <p style="color:#455a77;font-size:13px;">${err.message || 'Internal Server Error'}</p>
  <a href="/" style="color:#c9a84c;text-decoration:none;font-size:14px;">← Go Home</a>
  </body></html>`, 500)
})

export default app
