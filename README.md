# 📒 KhataBook — Personal Ledger System

A professional personal khata (ledger) system built on **Cloudflare Workers** with **Hono**, **D1** database, **R2** object storage, **Brevo** email, and **PayFast** payment integration. Dark, refined design with gold accents.

---

## Features

| Feature | Details |
|---|---|
| **Admin Login** | Secure cookie-based session auth |
| **Person Records** | UUID khata ID, name, CNIC, father name, address, mobile, bank/wallet |
| **Ledger Entries** | Lent / Borrowed, payment mode, date, due date, purpose, proof upload, status |
| **Proof Storage** | Audio / Video / Image / PDF / Doc uploaded to Cloudflare R2 |
| **Status Tracking** | Pending → Settled / Paid / Received / Partial / Cancelled |
| **Email Reminders** | Brevo API with due-date reminders and payment links |
| **Public Lookup** | Anyone can search by name, father name, CNIC, or Khata/Entry ID |
| **PayFast Payments** | Public users pay outstanding lent amounts online |
| **Date Filtering** | Filter entries by date range in admin & public view |
| **Print / PDF** | Browser print with CSS print stylesheet — clean A4 layout |
| **Responsive** | Mobile-first, fully device-friendly |

---

## Quick Start

### 1 — Install & Configure

```bash
git clone <your-repo>
cd khata-book
npm install
```

Edit `wrangler.toml` — fill in your D1 database ID after step 2.

### 2 — Create Cloudflare Resources

```bash
# Create D1 database
npm run db:create
# → Copy the database_id into wrangler.toml

# Create R2 bucket
npm run r2:create

# Apply database schema (local dev)
npm run db:migrate

# Apply schema to deployed database
npm run db:migrate:remote
```

### 3 — Set Secrets

```bash
wrangler secret put ADMIN_EMAIL           # your-email@domain.com
wrangler secret put ADMIN_PASSWORD_HASH   # sha256 hex of your password (see below)
wrangler secret put SESSION_SECRET        # any long random string
wrangler secret put BREVO_API_KEY         # from brevo.com → SMTP & API → API Keys
wrangler secret put BREVO_FROM_EMAIL      # your verified sender email
wrangler secret put BREVO_FROM_NAME       # KhataBook
wrangler secret put PAYFAST_MERCHANT_ID   # from PayFast dashboard
wrangler secret put PAYFAST_SECURED_KEY   # from PayFast dashboard
wrangler secret put PAYFAST_STORE_ID      # from PayFast dashboard
```

**Generate your password hash** (run in Node.js or browser console):
```js
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPassword123'))
const hex  = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
console.log(hex)
```

### 4 — Update APP_URL

In `wrangler.toml` set:
```toml
[vars]
APP_URL = "https://khata.yourdomain.com"
```

### 5 — Deploy

```bash
# Local development
npm run dev

# Deploy to Cloudflare
npm run deploy
```

---

## URL Map

### Admin (password protected)
| URL | Description |
|---|---|
| `/login` | Admin login |
| `/admin` | Dashboard with stats |
| `/admin/persons` | All persons list + search |
| `/admin/persons/:id` | Person detail with full ledger |
| `/admin/entries` | All entries with filters |
| `/admin/reminders` | Overdue & upcoming due entries |

### Public (no login)
| URL | Description |
|---|---|
| `/` | Public search — anyone can look up records |
| `/payment/success` | PayFast success redirect |
| `/payment/failed` | PayFast failure redirect |

### REST API
| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/api/persons` | Admin | Create person |
| `PUT` | `/api/persons/:id` | Admin | Update person |
| `DELETE` | `/api/persons/:id` | Admin | Delete person + entries |
| `POST` | `/api/entries` | Admin | Create entry (multipart/form-data) |
| `PUT` | `/api/entries/:id` | Admin | Update entry |
| `DELETE` | `/api/entries/:id` | Admin | Delete entry |
| `GET` | `/api/proof/:entryId` | Admin | Stream proof file from R2 |
| `POST` | `/api/reminders/send/:id` | Admin | Send email reminder |
| `GET` | `/api/public/lookup` | Public | Search persons/entries |
| `POST` | `/api/public/pay` | Public | Initiate PayFast payment |
| `POST` | `/api/public/pay-all` | Public | Pay all pending entries |
| `POST` | `/payment/ipn` | PayFast | IPN callback handler |

---

## Email Reminders

Reminders are sent via **Brevo**. The system finds the person's email by scanning their **Bank/Wallet Details** or **Notes** field for a valid email address.

To enable reminders for a person — add their email anywhere in the Bank Details field:
```
HBL IBAN: PK36HABB0000000000000000 | user@gmail.com
```

---

## PayFast Integration

PayFast is used for **public users to pay back lent amounts** online. The flow:

1. Public user searches for their name
2. Sees entries where **Lent** (admin gave them money) and status is pending/partial
3. Clicks **Pay via PayFast** → redirected to PayFast gateway
4. On completion, PayFast calls `/payment/ipn` → entry status updated to `paid`
5. Admin receives confirmation email

Configure PayFast sandbox for testing by setting `PayFast_BASE_URL` to the sandbox URL in `wrangler.toml`.

---

## Print / PDF

Every page with a ledger table has a **Print Khata** button. Uses CSS `@media print` to:
- Hide sidebar, buttons, modals
- Show clean black-on-white ledger
- Format for A4 paper

Use browser's **Save as PDF** to generate PDF reports.

---

## Project Structure

```
khata-book/
├── schema.sql                 # D1 database schema
├── wrangler.toml              # Cloudflare config
├── src/
│   ├── index.ts               # Main Hono app — route mounting
│   ├── types.ts               # TypeScript interfaces
│   ├── middleware/
│   │   └── auth.ts            # Cookie session auth middleware
│   ├── utils/
│   │   ├── security.ts        # sha256, uuid, format helpers, escapeHtml
│   │   └── email.ts           # Brevo email sender + templates
│   ├── payment/
│   │   ├── PayFastCall.ts     # Token generation + callback validation
│   │   ├── PayFast.ts         # Payment initiation → HTML redirect
│   │   └── handleIPN.ts       # IPN callback → mark entry paid
│   ├── routes/
│   │   ├── auth.ts            # GET/POST /login, POST /logout
│   │   ├── admin.ts           # Admin page routes (HTML)
│   │   ├── api.ts             # CRUD REST API + proof serving + reminders
│   │   ├── public.ts          # Public lookup + pay endpoints
│   │   └── payment.ts         # /payment/ipn, /success, /failed
│   └── pages/
│       ├── layout.ts          # Base HTML layout + design system
│       ├── login.ts           # Login page
│       ├── dashboard.ts       # Admin dashboard
│       ├── persons.ts         # Persons list
│       ├── person-detail.ts   # Person detail + entries + modals
│       ├── entries.ts         # All entries admin view
│       ├── reminders.ts       # Overdue + upcoming reminders
│       ├── public-lookup.ts   # Public search page (full HTML)
│       └── payment-result.ts  # PayFast success/failure pages
```

---

## Security Notes

- Admin password stored as SHA-256 hash — never plain text
- Sessions stored in D1 with 8-hour expiry, sliding renewal
- All proof files served through auth-checked route — not publicly accessible
- Public lookup only exposes: name, CNIC, father name, mobile, address — never bank details or internal notes
- PayFast IPN validated with HMAC SHA-256 hash before processing
- All user-facing HTML is escape-sanitised via `escapeHtml()`
