// src/utils/security.ts
import type { JWTPayload } from '../types'

// ── Existing helpers ──────────────────────────────────────────────────────────

/** SHA-256 → lowercase hex string */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Cryptographically-random 64-char hex token */
export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Escape HTML to prevent XSS in server-rendered pages */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** UUID v4 using Web Crypto */
export function uuid(): string {
  return crypto.randomUUID()
}

/** Format amount as PKR / currency string */
export function formatAmount(n: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Format date for display */
export function formatDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format datetime for display */
export function formatDateTime(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Check if due date is overdue */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// ── Password hashing (PBKDF2) ─────────────────────────────────────────────────
// Stores passwords as "saltHex:hashHex" — never plain text or simple SHA-256.

export async function hashPassword(password: string): Promise<string> {
  const encoder    = new TextEncoder()
  const salt       = crypto.getRandomValues(new Uint8Array(16))
  const keyMat     = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const derived    = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMat, 256
  )
  const saltHex = toHex(salt)
  const hashHex = toHex(new Uint8Array(derived))
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false
    const salt    = fromHex(saltHex)
    const encoder = new TextEncoder()
    const keyMat  = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    )
    const derived    = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      keyMat, 256
    )
    return toHex(new Uint8Array(derived)) === hashHex
  } catch {
    return false
  }
}

// ── JWT (HS256) ───────────────────────────────────────────────────────────────

export async function createJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInHours = 8
): Promise<string> {
  const now         = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + expiresInHours * 3600 }
  const header      = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body        = b64url(JSON.stringify(fullPayload))
  const key         = await hmacKey(secret)
  const enc         = new TextEncoder()
  const sig         = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  const sigB64      = b64url(String.fromCharCode(...new Uint8Array(sig)))
  return `${header}.${body}.${sigB64}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, signature] = parts
    const key      = await hmacKey(secret)
    const enc      = new TextEncoder()
    const sigBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(`${header}.${body}`))
    if (!valid) return null
    const payload: JWTPayload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
}

function b64url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}
