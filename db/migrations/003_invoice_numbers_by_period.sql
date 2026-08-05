-- Invoice numbers key on the start of the Leistungszeitraum rather than the issue
-- date, so work rendered in December keeps that tax year when it is billed in January.
--
-- Rows written before this migration hold an issue date. They are left in place as a
-- record of numbers already handed out; they only ever collide with a future period
-- start under the same prefix, which would skip a sequence number rather than reuse one.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'invoice_number_counters' AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE invoice_number_counters RENAME COLUMN invoice_date TO period_start;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'voided_invoice_numbers' AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE voided_invoice_numbers RENAME COLUMN invoice_date TO period_start;
  END IF;
END $$;
