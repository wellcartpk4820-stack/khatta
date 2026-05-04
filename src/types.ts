// src/types.ts

export interface Env {
  DB:                   D1Database
  BUCKET:               R2Bucket
  APP_URL:              string
  SESSION_SECRET:       string
  ADMIN_EMAIL:          string
  ADMIN_PASSWORD_HASH:  string    // SHA-256 hex of admin password
  BREVO_API_KEY:        string
  BREVO_FROM_EMAIL:     string
  BREVO_FROM_NAME:      string
  PAYFAST_MERCHANT_ID:  string
  PAYFAST_SECURED_KEY:  string
  PAYFAST_STORE_ID:     string
  PayFast_BASE_URL:     string
}

export interface Person {
  id:              string
  name:            string
  identity_number: string | null
  father_name:     string | null
  address:         string | null
  mobile:          string | null
  bank_details:    string | null
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface Entry {
  id:                     number
  person_id:              string
  amount:                 number
  type:                   'lent' | 'borrowed'
  payment_mode:           string
  entry_date:             string
  due_date:               string | null
  purpose:                string | null
  proof_key:              string | null
  proof_name:             string | null
  proof_type:             string | null
  status:                 'pending' | 'settled' | 'paid' | 'received' | 'partial' | 'cancelled'
  notes:                  string | null
  payment_transaction_id: string | null
  reminder_sent:          number
  created_at:             string
  updated_at:             string
}

export interface PersonWithSummary extends Person {
  total_lent:     number
  total_borrowed: number
  entry_count:    number
  net_balance:    number   // positive = they owe me, negative = I owe them
}

export interface EntryWithPerson extends Entry {
  person_name:   string
  person_cnic:   string | null
  father_name:   string | null
}

export type HonoEnv = { Bindings: Env; Variables: { adminAuthed: boolean } }
