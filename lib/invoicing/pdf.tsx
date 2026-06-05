import React from "react"
import fs from "node:fs"
import path from "node:path"
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"
import type { Client, InvoiceLineItem } from "./types"
import { formatEur, formatHours, KLEINUNTERNEHMER_NOTICE } from "./grouping"

// Palette: the invoice green accent over the resume's light-mode text scale,
// so the document reads as a sibling of the printed resume.
const accent = "#0a7a5c"
const ink = "#0d1b2e"
const inkSoft = "#374e6a"
const muted = "#6b87a4"
const faint = "#9aabbf"
const hairline = "#d8dee6"
const rowline = "#eef1f5"

const senderName = "John Moorman"
const senderRole = "Artistic Administration"
const senderAddress = "REDACTED"
const senderEmail = "john@johnmoorman.com"
const taxNumber = "REDACTED"
const iban = "REDACTED"

let fontsRegistered = false
let dmSansAvailable = false
let monoAvailable = false

function assetPath(...segments: string[]): string {
  return path.join(process.cwd(), "public", ...segments)
}

function registerFamily(family: string, faces: Array<[string, number]>): boolean {
  const fonts = faces
    .filter(([filename]) => fs.existsSync(assetPath("fonts", filename)))
    .map(([filename, fontWeight]) => ({ src: assetPath("fonts", filename), fontWeight }))
  if (fonts.length === 0) return false
  Font.register({ family, fonts })
  return true
}

function ensureFontsRegistered() {
  if (fontsRegistered) return
  dmSansAvailable = registerFamily("DM Sans", [
    ["DMSans-Regular.ttf", 400],
    ["DMSans-Medium.ttf", 500],
    ["DMSans-SemiBold.ttf", 600],
    ["DMSans-Bold.ttf", 700],
    ["DMSans-ExtraBold.ttf", 800],
  ])
  monoAvailable = registerFamily("JetBrains Mono", [
    ["JetBrainsMono-Regular.ttf", 400],
    ["JetBrainsMono-Medium.ttf", 500],
    ["JetBrainsMono-SemiBold.ttf", 600],
    ["JetBrainsMono-Bold.ttf", 700],
  ])
  // Addresses and German compounds should never be auto-hyphenated.
  Font.registerHyphenationCallback((word) => [word])
  fontsRegistered = true
}

// Register before the stylesheet so family fallbacks resolve to real names.
ensureFontsRegistered()

// Sans text falls back to Helvetica, mono to its built-in equivalent, so the
// document still renders if the bundled TTFs are ever missing in production.
const sans = dmSansAvailable ? "DM Sans" : "Helvetica"
const sansBold = dmSansAvailable ? "DM Sans" : "Helvetica-Bold"
const mono = monoAvailable ? "JetBrains Mono" : "Helvetica"

const letterheadPath = assetPath("images", "invoices", "letterhead.png")
const letterheadAvailable = fs.existsSync(letterheadPath)

function formatGermanDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  return `${match[3]}.${match[2]}.${match[1]}`
}

function formatGermanPeriod(value: string) {
  return value
    .replace(/\d{4}-\d{2}-\d{2}/g, (date) => formatGermanDate(date))
    .replace(/\bdays\b/g, "Tage")
    .replace(/\bday\b/g, "Tag")
}

function formatIban(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim()
}

// formatHours returns a dot decimal; invoices read in German, so use a comma.
function formatHoursDe(value: number): string {
  return formatHours(value).replace(".", ",")
}

export interface InvoiceDocumentProps {
  invoiceNo: string
  issuedDate: string
  client: Pick<Client, "name" | "bill_to" | "ust_id">
  periodSummary: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  vat: number
  total: number
  isKleinunternehmer: boolean
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingHorizontal: 52,
    paddingBottom: 48,
    color: ink,
    fontFamily: sans,
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Letterhead
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexGrow: 1,
    paddingRight: 16,
  },
  name: {
    color: ink,
    fontFamily: sansBold,
    fontWeight: 800,
    fontSize: 25,
    letterSpacing: -0.5,
    lineHeight: 1.05,
  },
  role: {
    color: inkSoft,
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 11.5,
    letterSpacing: 0.2,
    marginTop: 4,
  },
  mark: {
    height: 40,
    width: 40,
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 13,
  },
  contactItem: {
    color: muted,
    fontFamily: sans,
    fontSize: 9,
  },
  contactSep: {
    color: faint,
    fontSize: 9,
  },
  divider: {
    borderBottomColor: hairline,
    borderBottomWidth: 1,
    marginTop: 12,
  },

  // Section scaffolding
  sectionLabel: {
    borderBottomColor: hairline,
    borderBottomWidth: 1,
    color: accent,
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 8.5,
    letterSpacing: 2,
    paddingBottom: 6,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Title + invoice number
  titleRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 18,
  },
  docTitle: {
    color: accent,
    fontFamily: sansBold,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  invoiceNoBlock: {
    alignItems: "flex-end",
  },
  invoiceNoLabel: {
    color: muted,
    fontFamily: mono,
    fontSize: 7.5,
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  invoiceNoValue: {
    color: ink,
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 11,
  },

  // Recipient + meta
  billRow: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "space-between",
  },
  billToCol: {
    flexGrow: 1,
    maxWidth: 300,
  },
  billToText: {
    color: ink,
    fontFamily: sans,
    fontSize: 10.5,
    lineHeight: 1.35,
  },
  billToMeta: {
    color: muted,
    fontFamily: mono,
    fontSize: 9,
    marginTop: 5,
  },
  metaCol: {
    alignItems: "flex-end",
  },
  metaRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginBottom: 5,
  },
  metaLabel: {
    color: muted,
    fontFamily: sans,
    fontSize: 9,
    marginRight: 12,
    textAlign: "right",
  },
  metaValue: {
    color: ink,
    fontFamily: mono,
    fontSize: 9,
    minWidth: 130,
    textAlign: "right",
  },

  // Line items
  serviceCaption: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  serviceCaptionLabel: {
    color: muted,
    fontFamily: sans,
    fontSize: 9,
    marginRight: 8,
  },
  serviceCaptionValue: {
    color: ink,
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 10.5,
  },
  tableHeader: {
    borderBottomColor: hairline,
    borderBottomWidth: 1,
    color: muted,
    flexDirection: "row",
    fontFamily: mono,
    fontSize: 7.5,
    letterSpacing: 0.8,
    paddingBottom: 6,
    textTransform: "uppercase",
  },
  tableRow: {
    borderBottomColor: rowline,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 5,
  },
  cellDate: { color: ink, fontFamily: mono, fontSize: 9, width: 158 },
  cellDesc: { color: ink, fontFamily: sans, fontSize: 9.5, flexGrow: 1, paddingRight: 12 },
  cellSpacer: { flexGrow: 1 },
  cellNum: { color: ink, fontFamily: mono, fontSize: 9, textAlign: "right", width: 74 },

  // Totals
  summaryBlock: {
    marginTop: 10,
  },
  totals: {
    alignSelf: "flex-end",
    width: 256,
  },
  totalRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
  },
  totalLabel: {
    color: muted,
    fontFamily: sans,
    fontSize: 9.5,
  },
  totalValue: {
    color: ink,
    fontFamily: mono,
    fontSize: 9.5,
  },
  grandTotalRow: {
    borderTopColor: hairline,
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 8,
  },
  grandTotalLabel: {
    color: ink,
    fontFamily: sansBold,
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  grandTotalValue: {
    color: accent,
    fontFamily: mono,
    fontWeight: 700,
    fontSize: 12.5,
  },

  // Payment
  paymentSection: {
    marginTop: 12,
  },
  notice: {
    color: inkSoft,
    fontFamily: sans,
    fontSize: 9,
    lineHeight: 1.45,
    marginBottom: 9,
  },
  payRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginBottom: 3,
  },
  payLabel: {
    color: muted,
    fontFamily: sans,
    fontSize: 9,
    width: 92,
  },
  payValue: {
    color: ink,
    fontFamily: sans,
    fontSize: 9.5,
  },
  payValueMono: {
    color: ink,
    fontFamily: mono,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  terms: {
    color: muted,
    fontFamily: sans,
    fontSize: 9,
    marginTop: 9,
  },

  // Footer
  footerRule: {
    borderTopColor: hairline,
    borderTopWidth: 1,
    bottom: 40,
    left: 52,
    position: "absolute",
    right: 52,
  },
  footerIdentity: {
    bottom: 26,
    color: faint,
    fontFamily: mono,
    fontSize: 7.5,
    left: 52,
    letterSpacing: 0.3,
    position: "absolute",
    right: 52,
    textAlign: "center",
  },
})

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

export function InvoiceDocument(props: InvoiceDocumentProps) {
  ensureFontsRegistered()

  const { lineItems, subtotal, vat, total, isKleinunternehmer } = props
  const uniqueDescriptions = Array.from(new Set(lineItems.map((item) => item.description)))
  const sharedDescription = uniqueDescriptions.length === 1 ? uniqueDescriptions[0] : null
  const totalHours = lineItems.reduce((sum, item) => sum + item.hours, 0)
  const vatPercent = subtotal > 0 ? Math.round((vat / subtotal) * 100) : 0

  return (
    <Document title={props.invoiceNo} author={senderName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{senderName}</Text>
            <Text style={styles.role}>{senderRole}</Text>
          </View>
          {letterheadAvailable ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt.
            <Image src={letterheadPath} style={styles.mark} />
          ) : null}
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactItem}>{senderAddress}</Text>
          <Text style={styles.contactSep}>·</Text>
          <Text style={styles.contactItem}>{senderEmail}</Text>
          <Text style={styles.contactSep}>·</Text>
          <Text style={styles.contactItem}>Steuernummer: {taxNumber}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.titleRow}>
          <Text style={styles.docTitle}>Rechnung</Text>
          <View style={styles.invoiceNoBlock}>
            <Text style={styles.invoiceNoLabel}>Rechnungsnr.</Text>
            <Text style={styles.invoiceNoValue}>{props.invoiceNo}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Rechnung an</Text>
          <View style={styles.billRow}>
            <View style={styles.billToCol}>
              <Text style={styles.billToText}>{props.client.bill_to}</Text>
              {props.client.ust_id ? (
                <Text style={styles.billToMeta}>USt-IdNr.: {props.client.ust_id}</Text>
              ) : null}
            </View>
            <View style={styles.metaCol}>
              <MetaRow label="Datum" value={formatGermanDate(props.issuedDate)} />
              <MetaRow label="Leistungszeitraum" value={formatGermanPeriod(props.periodSummary)} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Leistungen</Text>
          {sharedDescription ? (
            <View style={styles.serviceCaption}>
              <Text style={styles.serviceCaptionLabel}>Leistung</Text>
              <Text style={styles.serviceCaptionValue}>{sharedDescription}</Text>
            </View>
          ) : null}
          <View style={styles.tableHeader} fixed>
            <Text style={styles.cellDate}>Datum</Text>
            {sharedDescription ? <View style={styles.cellSpacer} /> : <Text style={styles.cellDesc}>Beschreibung</Text>}
            <Text style={styles.cellNum}>Stunden</Text>
            <Text style={styles.cellNum}>Satz</Text>
            <Text style={styles.cellNum}>Betrag</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={`${item.date}-${index}`} style={styles.tableRow} wrap={false}>
              <Text style={styles.cellDate}>{formatGermanPeriod(item.date)}</Text>
              {sharedDescription ? (
                <View style={styles.cellSpacer} />
              ) : (
                <Text style={styles.cellDesc}>{item.description}</Text>
              )}
              <Text style={styles.cellNum}>{formatHoursDe(item.hours)}</Text>
              <Text style={styles.cellNum}>{formatEur(item.rate)}</Text>
              <Text style={styles.cellNum}>{formatEur(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBlock} wrap={false}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Stunden gesamt</Text>
              <Text style={styles.totalValue}>{formatHoursDe(totalHours)}</Text>
            </View>
            {isKleinunternehmer ? null : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Zwischensumme (netto)</Text>
                  <Text style={styles.totalValue}>{formatEur(subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>zzgl. Umsatzsteuer {vatPercent} %</Text>
                  <Text style={styles.totalValue}>{formatEur(vat)}</Text>
                </View>
              </>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Gesamtbetrag</Text>
              <Text style={styles.grandTotalValue}>{formatEur(total)}</Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.sectionLabel}>Zahlung</Text>
            {isKleinunternehmer ? <Text style={styles.notice}>{KLEINUNTERNEHMER_NOTICE}</Text> : null}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Kontoinhaber</Text>
              <Text style={styles.payValue}>{senderName}</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>IBAN</Text>
              <Text style={styles.payValueMono}>{formatIban(iban)}</Text>
            </View>
            <Text style={styles.terms}>Zahlbar innerhalb von 14 Tagen ab Rechnungsdatum.</Text>
          </View>
        </View>

        <View style={styles.footerRule} fixed />
        <Text style={styles.footerIdentity} fixed>
          {senderName} · {senderEmail}
        </Text>
      </Page>
    </Document>
  )
}

export async function renderInvoicePdfBuffer(props: InvoiceDocumentProps): Promise<Buffer> {
  ensureFontsRegistered()
  return renderToBuffer(<InvoiceDocument {...props} />)
}
