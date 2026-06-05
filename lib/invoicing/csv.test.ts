import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseTimesheetCsv } from "./csv"

describe("timesheet CSV import", () => {
  it("parses date, hours, and task rows from a headered CSV", () => {
    const result = parseTimesheetCsv(`date,hours,task\n2026-05-13,1.5,Email follow-up\n2026-05-14,2,"Scheduling, prep"`)

    assert.deepEqual(result.entries, [
      { workDate: "2026-05-13", hours: 1.5, task: "Email follow-up" },
      { workDate: "2026-05-14", hours: 2, task: "Scheduling, prep" },
    ])
  })

  it("accepts common header aliases from exported timesheets", () => {
    const result = parseTimesheetCsv(`Work Date,Duration,Description\n13.05.2026,1,Admin\n05/14/2026,0.75,Calls`)

    assert.deepEqual(result.entries, [
      { workDate: "2026-05-13", hours: 1, task: "Admin" },
      { workDate: "2026-05-14", hours: 0.75, task: "Calls" },
    ])
  })

  it("converts hh:mm:ss duration values to two-decimal hour amounts", () => {
    const result = parseTimesheetCsv(`date,hours,task\n2026-05-13,01:30:00,Pairing\n2026-05-14,02:10:30,Implementation`)

    assert.deepEqual(result.entries, [
      { workDate: "2026-05-13", hours: 1.5, task: "Pairing" },
      { workDate: "2026-05-14", hours: 2.18, task: "Implementation" },
    ])
  })

  it("parses explicit date ranges for single timesheet entries", () => {
    const result = parseTimesheetCsv(`date,hours,task\n21.05.2026 - 31.05.2026,41,Showdeck administration`)

    assert.deepEqual(result.entries, [
      { workDate: "2026-05-21", workEndDate: "2026-05-31", hours: 41, task: "Showdeck administration" },
    ])
  })

  it("reports row-level validation errors without importing partial data", () => {
    assert.throws(
      () => parseTimesheetCsv(`date,hours,task\n2026-05-13,0,No time\n2026-05-14,1,`),
      /Row 2: hours must be greater than 0; Row 3: task is required/
    )
  })

  it("parses the Michel Hotels exported timesheet CSV shape", () => {
    const result = parseTimesheetCsv(`Datum,Zeitaufwand (gesamt 19.17 h),Task,Client,Invoiced?\n13/5/2026,0.5,Sitemaps für alle Websites erstellt,Michel Hotels,TRUE\n22/5/2026,1.08,"Eigenständige Spec-Prüfung, Quell-PDFs und Assets heruntergeladen, Projekt aufgesetzt",Michel Hotels,TRUE\n28/5/2026,1.01,"Polish, QA und Übergabe: CTA-Buttons, mobile Gutters und Whitespace gefixt",Michel Hotels,FALSE`)

    assert.deepEqual(result.entries, [
      {
        workDate: "2026-05-13",
        hours: 0.5,
        task: "Sitemaps für alle Websites erstellt",
        clientName: "Michel Hotels",
        invoiced: true,
      },
      {
        workDate: "2026-05-22",
        hours: 1.08,
        task: "Eigenständige Spec-Prüfung, Quell-PDFs und Assets heruntergeladen, Projekt aufgesetzt",
        clientName: "Michel Hotels",
        invoiced: true,
      },
      {
        workDate: "2026-05-28",
        hours: 1.01,
        task: "Polish, QA und Übergabe: CTA-Buttons, mobile Gutters und Whitespace gefixt",
        clientName: "Michel Hotels",
        invoiced: false,
      },
    ])
  })
})
