
CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT    PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Persons (each has a unique UUID as khata ID)
CREATE TABLE IF NOT EXISTS persons (
  id              TEXT PRIMARY KEY,              -- UUID — also the Khata ID
  name            TEXT NOT NULL,
  identity_number TEXT,                          -- CNIC  e.g. 36302-1234567-9
  father_name     TEXT,
  address         TEXT,
  mobile          TEXT,
  bank_details    TEXT,                          -- free-text bank / wallet info
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persons_name    ON persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_cnic    ON persons(identity_number);
CREATE INDEX IF NOT EXISTS idx_persons_father  ON persons(father_name);

-- Entries (each row = one lent / borrowed transaction)
CREATE TABLE IF NOT EXISTS entries (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id              TEXT    NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  amount                 REAL    NOT NULL CHECK(amount > 0),
  type                   TEXT    NOT NULL CHECK(type IN ('lent','borrowed')),
                                              -- lent   = I gave money to them  (they owe me)
                                              -- borrowed = they gave money to me (I owe them)
  payment_mode           TEXT    NOT NULL DEFAULT 'cash',
                                              -- cash / transfer / check / easypaisa / jazzcash / etc.
  entry_date             TEXT    NOT NULL,   -- ISO datetime e.g. 2025-07-04 14:30
  due_date               TEXT,              -- YYYY-MM-DD — when repayment expected
  purpose                TEXT,
  proof_key              TEXT,              -- R2 object key (filename in bucket)
  proof_name             TEXT,              -- original file name shown in UI
  proof_type             TEXT,              -- MIME type e.g. image/jpeg
  status                 TEXT    NOT NULL DEFAULT 'pending'
                                   CHECK(status IN ('pending','settled','paid','received','partial','cancelled')),
  notes                  TEXT,
  payment_transaction_id TEXT,             -- PayFast transaction ID (if paid online)
  reminder_sent          INTEGER DEFAULT 0, -- 0/1 boolean flag
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entries_person ON entries(person_id);
CREATE INDEX IF NOT EXISTS idx_entries_date   ON entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_type   ON entries(type);

-- Reminder log
CREATE TABLE IF NOT EXISTS reminder_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id   INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  sent_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  channel    TEXT DEFAULT 'email'
);
