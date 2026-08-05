import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { authorizeInvoiceApi } from "./api-auth"

const VALID_TOKEN = "t".repeat(40)

function request(headers: Record<string, string> = {}, url = "https://example.com/api/invoicing/clients") {
  return new Request(url, { headers })
}

afterEach(() => {
  delete process.env.INVOICE_API_TOKEN
})

describe("invoicing API authorization", () => {
  it("hides the API entirely when no token is configured", async () => {
    const denied = await authorizeInvoiceApi(request({ authorization: `Bearer ${VALID_TOKEN}` }))
    assert.equal(denied?.response.status, 404)
  })

  it("refuses to trust a token shorter than 32 characters", async () => {
    process.env.INVOICE_API_TOKEN = "short-token"
    const denied = await authorizeInvoiceApi(request({ authorization: "Bearer short-token" }))
    assert.equal(denied?.response.status, 404)
  })

  it("authorizes a correct bearer token", async () => {
    process.env.INVOICE_API_TOKEN = VALID_TOKEN
    assert.equal(await authorizeInvoiceApi(request({ authorization: `Bearer ${VALID_TOKEN}` })), null)
  })

  it("rejects a wrong token, a missing header, and a wrong scheme", async () => {
    process.env.INVOICE_API_TOKEN = VALID_TOKEN
    const wrong = await authorizeInvoiceApi(request({ authorization: `Bearer ${"x".repeat(40)}` }))
    assert.equal(wrong?.response.status, 401)
    assert.equal((await authorizeInvoiceApi(request()))?.response.status, 401)
    assert.equal((await authorizeInvoiceApi(request({ authorization: VALID_TOKEN })))?.response.status, 401)
    assert.equal((await authorizeInvoiceApi(request({ authorization: `Basic ${VALID_TOKEN}` })))?.response.status, 401)
  })

  it("does not accept the token from the query string", async () => {
    process.env.INVOICE_API_TOKEN = VALID_TOKEN
    const denied = await authorizeInvoiceApi(
      request({}, `https://example.com/api/invoicing/clients?token=${VALID_TOKEN}`)
    )
    assert.equal(denied?.response.status, 401)
  })

  it("rejects a token that only shares a prefix with the real one", async () => {
    process.env.INVOICE_API_TOKEN = VALID_TOKEN
    const denied = await authorizeInvoiceApi(request({ authorization: `Bearer ${"t".repeat(39)}` }))
    assert.equal(denied?.response.status, 401)
  })
})
