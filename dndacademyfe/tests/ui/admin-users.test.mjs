import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function setup({ role = "MASTER", listError = false, mobile = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })
  await context.addInitScript(() => localStorage.setItem("token", "test-token"))
  const page = await context.newPage()
  const me = { id: 1, username: "master", email: "master@example.test", role, learningLevel: "ADVANCED" }
  let users = [me, { id: 2, username: "alice", email: "alice@example.test", role: "PLAYER", learningLevel: "BEGINNER" }, { id: 3, username: "bob", email: "bob@example.test", role: "MASTER", learningLevel: "INTERMEDIATE" }]
  const calls = []
  let failSave = false
  await page.route("**/api/**", async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (path === "/api/users/me") return reply(me)
    calls.push({ path, method: request.method() })
    if (path === "/api/users") return listError ? reply({ message: "Elenco non disponibile" }, 503) : reply(users)
    if (path === "/api/users/2/role" && request.method() === "PATCH") {
      assert.equal(request.headers().authorization, "Bearer test-token")
      if (failSave) return reply({ message: "Cambio ruolo non consentito" }, 403)
      users = users.map((item) => item.id === 2 ? { ...item, role: request.postDataJSON().role } : item)
      return reply(users[1])
    }
    return reply({ message: "Endpoint inatteso" }, 404)
  })
  await page.goto(`${baseURL}/admin/users`)
  return { page, context, calls, allowList: () => { listError = false }, failSave: () => { failSave = true }, allowSave: () => { failSave = false } }
}

test("statistiche, filtri, conferma, promozione e ritorno a Player", async () => {
  const { page, context, calls } = await setup()
  try {
    await page.getByRole("button", { name: /Rendi Master\s*:\s*alice/ }).waitFor()
    await page.getByText("3 utenti su 3", { exact: true }).waitFor()
    await page.getByText("Non puoi modificare il tuo ruolo.", { exact: true }).waitFor()
    await page.getByRole("searchbox", { name: "Cerca utente" }).fill("ALICE@")
    await page.getByText("1 utenti su 3", { exact: true }).waitFor()
    await page.getByRole("button", { name: /Rendi Master\s*:\s*alice/ }).click()
    await page.getByRole("button", { name: "Annulla", exact: true }).click()
    assert.equal(calls.filter((item) => item.method === "PATCH").length, 0)
    await page.getByRole("button", { name: /Rendi Master\s*:\s*alice/ }).click()
    await page.getByRole("button", { name: "Conferma", exact: true }).click()
    await page.getByText("Il ruolo di alice è ora Master.", { exact: true }).waitFor()
    await page.getByRole("button", { name: /Riporta a Player\s*:\s*alice/ }).click()
    await page.getByRole("button", { name: "Conferma", exact: true }).click()
    await page.getByText("Il ruolo di alice è ora Player.", { exact: true }).waitFor()
    await page.getByRole("searchbox").fill("")
    await page.getByRole("combobox", { name: "Ruolo", exact: true }).selectOption("PLAYER")
    await page.getByText("1 utenti su 3", { exact: true }).waitFor()
    await page.getByRole("combobox", { name: "Livello di apprendimento", exact: true }).selectOption("ADVANCED")
    await page.getByText("Nessun utente corrisponde ai filtri selezionati.", { exact: true }).waitFor()
    assert.equal(calls.filter((item) => item.method === "PATCH").length, 2)
  } finally { await context.close() }
})

test("errori di caricamento e salvataggio recuperabili su mobile", async () => {
  const fixture = await setup({ listError: true, mobile: true })
  const { page, context } = fixture
  try {
    await page.getByRole("alert").filter({ hasText: "Elenco non disponibile" }).waitFor()
    fixture.allowList()
    await page.getByRole("button", { name: "Riprova", exact: true }).click()
    await page.getByRole("button", { name: /Rendi Master\s*:\s*alice/ }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    fixture.failSave()
    await page.getByRole("button", { name: /Rendi Master\s*:\s*alice/ }).click()
    await page.getByRole("button", { name: "Conferma", exact: true }).click()
    await page.getByRole("alert").filter({ hasText: "Cambio ruolo non consentito" }).waitFor()
    assert.equal(await page.getByRole("dialog").count(), 1)
    fixture.allowSave()
    await page.getByRole("button", { name: "Conferma", exact: true }).click()
    await page.getByText("Il ruolo di alice è ora Master.", { exact: true }).waitFor()
  } finally { await context.close() }
})

test("un Player non carica l’elenco utenti", async () => {
  const { page, context, calls } = await setup({ role: "PLAYER" })
  try {
    await page.getByRole("alert").filter({ hasText: "Accesso riservato" }).waitFor()
    assert.equal(calls.length, 0)
    assert.equal(await page.getByRole("button", { name: /Rendi Master/ }).count(), 0)
  } finally { await context.close() }
})
