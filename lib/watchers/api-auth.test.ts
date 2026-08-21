import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { authorizeCron, authorizeIngestApi } from "./api-auth"

const VALID_TOKEN = "t".repeat(40)

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/watchers/ingest", { headers })
}

afterEach(() => {
  delete process.env.WATCHER_INGEST_TOKEN
  delete process.env.CRON_SECRET
})

describe("ingest API authorization", () => {
  it("hides the API entirely when no token is configured", async () => {
    const denied = await authorizeIngestApi(request({ authorization: `Bearer ${VALID_TOKEN}` }))
    assert.equal(denied?.response.status, 404)
  })

  it("treats a short token as unconfigured rather than trusted", async () => {
    process.env.WATCHER_INGEST_TOKEN = "short"
    const denied = await authorizeIngestApi(request({ authorization: "Bearer short" }))
    assert.equal(denied?.response.status, 404)
  })

  it("rejects a missing or wrong bearer token", async () => {
    process.env.WATCHER_INGEST_TOKEN = VALID_TOKEN
    assert.equal((await authorizeIngestApi(request()))?.response.status, 401)
    assert.equal((await authorizeIngestApi(request({ authorization: "Bearer nope" })))?.response.status, 401)
    assert.equal((await authorizeIngestApi(request({ authorization: VALID_TOKEN })))?.response.status, 401)
  })

  it("admits a correct bearer token, however it is cased or spaced", async () => {
    process.env.WATCHER_INGEST_TOKEN = VALID_TOKEN
    assert.equal(await authorizeIngestApi(request({ authorization: `Bearer ${VALID_TOKEN}` })), null)
    assert.equal(await authorizeIngestApi(request({ authorization: `bearer  ${VALID_TOKEN}` })), null)
  })

  it("never accepts the token from a query string", async () => {
    process.env.WATCHER_INGEST_TOKEN = VALID_TOKEN
    const viaQuery = new Request(`https://example.com/api/watchers/ingest?token=${VALID_TOKEN}`)
    assert.equal((await authorizeIngestApi(viaQuery))?.response.status, 401)
  })
})

describe("cron authorization", () => {
  it("rejects everything when CRON_SECRET is unset", () => {
    assert.equal(authorizeCron(request({ authorization: "Bearer anything" }))?.response.status, 401)
    // An unset secret must not make "Bearer undefined" a valid credential.
    assert.equal(authorizeCron(request({ authorization: "Bearer undefined" }))?.response.status, 401)
  })

  it("admits Vercel's bearer header and rejects a wrong one", () => {
    process.env.CRON_SECRET = VALID_TOKEN
    assert.equal(authorizeCron(request({ authorization: `Bearer ${VALID_TOKEN}` })), null)
    assert.equal(authorizeCron(request({ authorization: "Bearer wrong" }))?.response.status, 401)
    assert.equal(authorizeCron(request())?.response.status, 401)
  })
})
