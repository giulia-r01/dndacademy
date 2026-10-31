import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function setup(options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 } })
  await context.addInitScript(() => localStorage.setItem("token", "profile-test-token"))
  const page = await context.newPage()
  let profile = { id: 1, username: "alice", email: "alice@example.test", role: "PLAYER", learningLevel: "INTERMEDIATE", avatarUrl: null }
  let failProfile = !!options.profileError, failSave = false, failAvatar = false, failCatalog = !!options.catalogError
  const mutations = [], meCalls = []
  const catalog = options.empty ? [] : [
    { id: 1, name: "Primo Quiz", description: "Supera il tuo primo quiz.", unlocked: true, unlockedAt: "2026-10-31T10:00:00" },
    { id: 2, name: "Studente di D&D", description: "Completa 2 lezioni e supera 2 quiz.", unlocked: false, unlockedAt: null },
  ]
  await page.route("https://example.test/avatar.png", (route) => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/1sAAAAASUVORK5CYII=", "base64") }))
  await page.route("**/api/**", async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method()
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) })
    if (method === "OPTIONS") return route.fulfill({ status: 204 })
    if (path === "/api/users/me" && method === "GET") {
      meCalls.push(path)
      return failProfile ? reply({ message: "Servizio temporaneamente non disponibile" }, 503) : reply(profile)
    }
    mutations.push({ path, method })
    if (path === "/api/users/me" && method === "PATCH") {
      if (failSave) return reply({ message: "Email gia registrata" }, 409)
      const payload = request.postDataJSON()
      assert.equal(payload.currentPassword, "Original1!")
      profile = { ...profile, username: payload.username, email: payload.email }
      return reply(profile)
    }
    if (path === "/api/users/me/avatar") {
      if (failAvatar) return reply({ message: "Caricamento immagine non riuscito" }, 502)
      if (method === "PUT") assert.match(request.headers()["content-type"], /multipart\/form-data; boundary=/)
      profile = { ...profile, avatarUrl: method === "DELETE" ? null : "https://example.test/avatar.png" }
      return reply(profile)
    }
    if (path === "/api/users/me/password") {
      assert.deepEqual(request.postDataJSON(), { currentPassword: "Original1!", newPassword: "Replacement2!" })
      return route.fulfill({ status: 204 })
    }
    if (path === "/api/badges/catalog") return failCatalog ? reply({ message: "Badge non disponibili" }, 503) : reply(catalog)
    return reply({ message: `Endpoint inatteso: ${path}` }, 404)
  })
  return { page, context, mutations, meCalls, allowProfile: () => { failProfile = false }, failSave: () => { failSave = true }, allowSave: () => { failSave = false }, failAvatar: () => { failAvatar = true }, allowAvatar: () => { failAvatar = false }, allowCatalog: () => { failCatalog = false } }
}
async function screenshot(page, name) {
  if (!process.env.UI_SCREENSHOT_DIR) return
  await mkdir(process.env.UI_SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

test("profilo: modifica dati, errori recuperabili e header sincronizzato senza richieste duplicate", async () => {
  const f = await setup()
  try {
    await f.page.goto(`${baseURL}/profile`)
    await f.page.getByRole("textbox", { name: "Username", exact: true }).fill("alice_updated")
    assert.equal(f.meCalls.length, 1)
    await f.page.getByRole("textbox", { name: "Email", exact: true }).fill("new@example.test")
    await f.page.getByLabel("Password attuale per confermare i dati", { exact: true }).fill("Original1!")
    f.failSave()
    await f.page.getByRole("button", { name: "Salva dati", exact: true }).click()
    await f.page.getByRole("alert").filter({ hasText: "Email gia registrata" }).waitFor()
    assert.equal(await f.page.getByRole("textbox", { name: "Username", exact: true }).inputValue(), "alice_updated")
    f.allowSave()
    await f.page.getByRole("button", { name: "Salva dati", exact: true }).click()
    await f.page.getByRole("status").filter({ hasText: "Dati del profilo aggiornati" }).waitFor()
    await f.page.getByRole("heading", { name: "Ciao, alice_updated", exact: true }).waitFor()
    assert.equal(await f.page.getByLabel("Password attuale per confermare i dati", { exact: true }).inputValue(), "")
    await screenshot(f.page, "profile-desktop")
  } finally { await f.context.close() }
})

test("profilo mobile: validazione immagini, errore di upload, caricamento e rimozione", async () => {
  const f = await setup({ mobile: true })
  try {
    await f.page.goto(`${baseURL}/profile`)
    await f.page.getByLabel("Immagine profilo", { exact: true }).setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("bad") })
    await f.page.getByRole("alert").filter({ hasText: "Scegli un’immagine" }).waitFor()
    assert.equal(f.mutations.length, 0)
    await f.page.getByLabel("Immagine profilo", { exact: true }).setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from("fixture") })
    f.failAvatar()
    await f.page.getByRole("button", { name: "Carica immagine", exact: true }).click()
    await f.page.getByRole("alert").filter({ hasText: "Caricamento immagine non riuscito" }).waitFor()
    f.allowAvatar()
    await f.page.getByRole("button", { name: "Carica immagine", exact: true }).click()
    await f.page.getByRole("status").filter({ hasText: "Immagine profilo aggiornata" }).waitFor()
    assert.equal(await f.page.getByRole("img", { name: "Immagine profilo di alice" }).count(), 2)
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await screenshot(f.page, "profile-mobile")
    await f.page.getByRole("button", { name: "Rimuovi immagine", exact: true }).click()
    await f.page.getByRole("status").filter({ hasText: "Immagine profilo rimossa" }).waitFor()
    assert.equal(await f.page.getByRole("img", { name: "Immagine profilo di alice" }).count(), 0)
  } finally { await f.context.close() }
})

test("password: conferma, validazione e uscita dalla sessione dopo il salvataggio", async () => {
  const f = await setup()
  try {
    await f.page.goto(`${baseURL}/profile`)
    await f.page.getByLabel("Password attuale", { exact: true }).fill("Original1!")
    await f.page.getByLabel("Nuova password", { exact: true }).fill("Replacement2!")
    await f.page.getByLabel("Conferma nuova password", { exact: true }).fill("Mismatch3!")
    await f.page.getByRole("button", { name: "Aggiorna password", exact: true }).click()
    await f.page.getByRole("alert").filter({ hasText: "Le nuove password non coincidono" }).waitFor()
    assert.equal(f.mutations.length, 0)
    await f.page.getByLabel("Conferma nuova password", { exact: true }).fill("Replacement2!")
    await f.page.getByRole("button", { name: "Aggiorna password", exact: true }).click()
    await f.page.waitForURL(/\/login\?passwordChanged=1/)
    await f.page.getByRole("status").filter({ hasText: "Password aggiornata" }).waitFor()
    assert.equal(await f.page.evaluate(() => localStorage.getItem("token")), null)
  } finally { await f.context.close() }
})

test("un errore di rete sul profilo mantiene il token e consente di riprovare", async () => {
  const f = await setup({ profileError: true })
  try {
    await f.page.goto(`${baseURL}/profile`)
    await f.page.getByRole("alert").filter({ hasText: "Servizio temporaneamente" }).waitFor()
    assert.equal(await f.page.evaluate(() => localStorage.getItem("token")), "profile-test-token")
    f.allowProfile()
    await f.page.getByRole("button", { name: "Riprova", exact: true }).click()
    await f.page.getByRole("textbox", { name: "Username", exact: true }).waitFor()
  } finally { await f.context.close() }
})

test("badge: catalogo Player, date, ricerca, filtri e recupero errore su mobile", async () => {
  const f = await setup({ catalogError: true, mobile: true })
  try {
    await f.page.goto(`${baseURL}/achievements`)
    await f.page.getByRole("alert").filter({ hasText: "Badge non disponibili" }).waitFor()
    f.allowCatalog()
    await f.page.getByRole("button", { name: "Riprova", exact: true }).click()
    await f.page.getByRole("heading", { name: "Primo Quiz", exact: true }).waitFor()
    await f.page.getByText("31/10/2026", { exact: true }).waitFor()
    await f.page.getByRole("combobox", { name: "Stato", exact: true }).selectOption("locked")
    assert.equal(await f.page.getByRole("heading", { name: "Primo Quiz", exact: true }).count(), 0)
    await f.page.getByRole("searchbox", { name: "Cerca badge", exact: true }).fill("non presente")
    await f.page.getByText("Nessun badge corrisponde ai filtri selezionati.", { exact: true }).waitFor()
    await f.page.getByRole("searchbox").fill("")
    await f.page.getByRole("combobox").selectOption("all")
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await screenshot(f.page, "badges-mobile")
  } finally { await f.context.close() }
})

test("badge: catalogo vuoto", async () => {
  const f = await setup({ empty: true })
  try {
    await f.page.goto(`${baseURL}/achievements`)
    await f.page.getByText("Non ci sono ancora badge disponibili. Torna a trovarci per i prossimi traguardi.", { exact: true }).waitFor()
  } finally { await f.context.close() }
})
