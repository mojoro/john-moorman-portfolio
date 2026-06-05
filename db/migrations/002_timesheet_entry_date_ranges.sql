-- Optional end date for a timesheet entry that should render as a date range on invoices.
ALTER TABLE timesheet_entries
  ADD COLUMN IF NOT EXISTS work_end_date DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'timesheet_entries_work_end_date_after_start'
  ) THEN
    ALTER TABLE timesheet_entries
      ADD CONSTRAINT timesheet_entries_work_end_date_after_start
      CHECK (work_end_date IS NULL OR work_end_date >= work_date)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE timesheet_entries
  VALIDATE CONSTRAINT timesheet_entries_work_end_date_after_start;
