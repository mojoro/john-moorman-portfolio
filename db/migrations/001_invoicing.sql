-- Invoicing webapp schema
-- Run against a Neon dev branch first, then promote once verified.

CREATE TABLE IF NOT EXISTS clients (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  invoice_prefix    TEXT NOT NULL DEFAULT 'SPACIFIK' CHECK (invoice_prefix ~ '^[A-Z0-9_-]+$'),
  bill_to           TEXT NOT NULL,
  ust_id            TEXT,
  hourly_rate_eur   NUMERIC(8,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_number_counters (
  invoice_date      DATE NOT NULL,
  invoice_prefix    TEXT NOT NULL,
  last_number       INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (invoice_date, invoice_prefix)
);

CREATE TABLE IF NOT EXISTS voided_invoice_numbers (
  invoice_no        TEXT PRIMARY KEY,
  invoice_date      DATE NOT NULL,
  invoice_prefix    TEXT NOT NULL,
  reason            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id                    SERIAL PRIMARY KEY,
  invoice_no            TEXT NOT NULL UNIQUE,
  client_id             INT NOT NULL REFERENCES clients(id),
  issued_date           DATE NOT NULL,
  period_summary        TEXT NOT NULL,
  total_hours           NUMERIC(8,2) NOT NULL,
  subtotal_eur          NUMERIC(10,2) NOT NULL,
  vat_rate              NUMERIC(5,4) NOT NULL DEFAULT 0.1900,
  vat_eur               NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_eur             NUMERIC(10,2) NOT NULL,
  is_kleinunternehmer   BOOLEAN NOT NULL DEFAULT TRUE,
  pdf_url               TEXT NOT NULL,
  pdf_blob_path         TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timesheet_entries (
  id          SERIAL PRIMARY KEY,
  work_date   DATE NOT NULL,
  hours       NUMERIC(6,2) NOT NULL CHECK (hours > 0),
  task        TEXT NOT NULL,
  client_id   INT NOT NULL REFERENCES clients(id),
  invoice_id  INT REFERENCES invoices(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timesheet_entries_client_invoice_idx
  ON timesheet_entries (client_id, invoice_id);

CREATE INDEX IF NOT EXISTS timesheet_entries_work_date_idx
  ON timesheet_entries (work_date);

CREATE INDEX IF NOT EXISTS invoices_issued_date_idx
  ON invoices (issued_date DESC);

INSERT INTO clients (name, invoice_prefix, bill_to, ust_id, hourly_rate_eur)
VALUES (
  'Spacifik UG (haftungsbeschränkt)',
  'SPACIFIK',
  $$Spacifik UG (haftungsbeschränkt)
Gerichtstr. 19
13347 Berlin
Germany$$,
  'DE317616086',
  40.00
)
ON CONFLICT (name) DO NOTHING;
