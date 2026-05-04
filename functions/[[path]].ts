// functions/[[path]].ts
// Cloudflare Pages Functions catch-all — passes every request to the Hono app

import app from '../src/index'

// IMPORTANT: Pages Functions receive an EventContext, NOT a raw Request.
// We must extract context.request and context.env and pass them to Hono's fetch handler.
// The old code `export const onRequest = app.fetch` was passing the EventContext
// object as the Request, causing "Worker threw exception" (Error 1101) on every request.
export const onRequest: PagesFunction = (context) => {
  return app.fetch(context.request, context.env, context)
}
