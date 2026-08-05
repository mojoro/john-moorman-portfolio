-- Invoice numbers are now derived from the invoices table: generation takes the
-- lowest sequence not already used for that prefix and period start. A deleted
-- invoice therefore frees its number for reuse, and a generation that fails
-- partway costs nothing, which a monotonic counter could not express.
--
-- invoice_number_counters is no longer read or written by the application. Its
-- rows had already drifted from reality (they still counted invoices that were
-- later deleted), so keeping it around invites someone to trust a stale number.
--
-- OPTIONAL AND DESTRUCTIVE. The application works with or without this table.
-- Run it only once you are happy with the new numbering, and take a Neon branch
-- snapshot first if you want the historical counts preserved.

DROP TABLE IF EXISTS invoice_number_counters;

-- voided_invoice_numbers is deliberately kept. It no longer gates allocation --
-- a voided number is reusable -- but it stays as a log of generation attempts
-- that failed after a number was chosen.
