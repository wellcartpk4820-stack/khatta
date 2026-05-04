// functions/[[path]].ts
// Cloudflare Pages Functions catch-all — passes every request to the Hono app
import app from '../src/index'

export const onRequest = app.fetch
