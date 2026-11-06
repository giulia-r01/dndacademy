import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import { skipAutomaticTour } from "./helpers/tour.mjs"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
const oldUrl = "https://res.cloudinary.com/test/image/upload/v1/seraphina-prima.png"
const newUrl = "https://res.cloudinary.com/test/image/upload/v2/seraphina-nuova.png"
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a52kAAAAASUVORK5CYII=", "base64")
const file = { name: "ritratto-nuovo.png", mimeType: "image/png", buffer: png }
const original = { id: 11, campaignId: 1, name: "Seraphina", race: "Umana", characterClass: "Paladino", level: 1, maxHp: 12, currentHp: 12, armorClass: 18, weaponName: "Spada lunga", damageDie: 8, attackAbility: "STRENGTH", spellcaster: false, spellName: null, spellDamageDie: 0, spellAbility: null, stats: { strength: 14, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 12, charisma: 16 }, playerUsername: null, usedInCombat: false, imageUrl: oldUrl }
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function setup({ mobile = false, empty = false, failUpload = false, slow = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })
  await context.addInitScript(() => localStorage.setItem("token", "character-image-fixture"))
  await skipAutomaticTour(context)
  const page = await context.newPage()
  let characters = empty ? [] : [{ ...original }], uploads = 0, creates = 0, updates = 0, failing = failUpload
  let release
  const gate = slow ? new Promise(resolve => { release = resolve }) : Promise.resolve()
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.route("https://res.cloudinary.com/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="400"><path fill="#286354" d="M0 0h270v400H0z"/><circle cx="135" cy="95" r="42" fill="#d8b078"/><path fill="#a5a5a5" d="M50 400V215q0-65 85-65t85 65v185"/></svg>' }))
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method()
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) })
    if (method === "OPTIONS") return route.fulfill({ status: 204 })
    if (path === "/api/users/me") return reply({ id: 1, username: "master", email: "master@example.test", role: "MASTER", learningLevel: "BEGINNER", avatarUrl: null })
    if (path === "/api/campaigns") return reply([{ id: 1, name: "Pietraluce", difficulty: "BEGINNER" }])
    if (path === "/api/characters/campaign/1/admin") return reply(characters)
    if (path === "/api/characters" && method === "POST") {
      creates++
      const data = request.postDataJSON()
      const created = { ...data, id: 12, currentHp: data.maxHp, playerUsername: null, imageUrl: null, usedInCombat: false }
      characters.push(created)
      return reply(created, 201)
    }
    if (/^\/api\/characters\/\d+\/image$/.test(path) && method === "PATCH") {
      uploads++
      assert.match(request.headers()["content-type"], /multipart\/form-data/)
      await gate
      if (failing) return reply({ message: "Servizio immagini temporaneamente non disponibile" }, 502)
      const id = Number(path.split("/").at(-2))
      characters = characters.map(item => item.id === id ? { ...item, imageUrl: newUrl } : item)
      return reply(characters.find(item => item.id === id))
    }
    if (/^\/api\/characters\/\d+$/.test(path) && method === "PUT") {
      updates++
      const id = Number(path.split("/").at(-1))
      characters = characters.map(item => item.id === id ? { ...item, ...request.postDataJSON() } : item)
      return reply(characters.find(item => item.id === id))
    }
    return reply({ message: `Endpoint inatteso: ${method} ${path}` }, 404)
  })
  return { context, page, errors, counts: () => ({ uploads, creates, updates }), allowUpload: () => { failing = false }, release: () => release?.() }
}
async function edit(page) {
  await page.goto(`${baseURL}/admin/characters`)
  await page.getByRole("button", { name: "Modifica", exact: true }).click()
  await page.getByRole("dialog").waitFor()
}
async function fillNew(page) {
  await page.getByRole("button", { name: "Nuovo personaggio", exact: true }).click()
  const modal = page.getByRole("dialog")
  for (const [name, value] of [["Nome", "Nuovo eroe"], ["Razza", "Umana"], ["Classe", "Guerriero"], ["Nome arma", "Spada"]]) await modal.getByLabel(name, { exact: true }).fill(value)
  return modal
}
async function screenshot(page, name) {
  if (!process.env.UI_SCREENSHOT_DIR) return
  await mkdir(process.env.UI_SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/${name}.png` })
}

for (const mobile of [false, true]) test(`Ritratto Master: riferimento persistente e sostituzione automatica indipendente dalla scheda, mobile=${mobile}`, async () => {
  const { context, page, counts, errors } = await setup({ mobile })
  try {
    await edit(page)
    const modal = page.getByRole("dialog")
    await modal.getByRole("link", { name: "Apri immagine attuale" }).waitFor()
    assert.equal(await modal.getByRole("link", { name: "Apri immagine attuale" }).getAttribute("href"), oldUrl)
    await modal.getByText("Risorsa: seraphina-prima.png", { exact: true }).waitFor()
    await modal.getByLabel("Nome", { exact: true }).fill("Bozza non salvata")
    await modal.getByLabel("Scegli ritratto").setInputFiles(file)
    await modal.getByText("Immagine caricata correttamente:", { exact: false }).waitFor()
    assert.equal(await modal.getByRole("link", { name: "Apri immagine attuale" }).getAttribute("href"), newUrl)
    assert.equal(await modal.getByLabel("Nome", { exact: true }).inputValue(), "Bozza non salvata")
    assert.deepEqual(counts(), { uploads: 1, creates: 0, updates: 0 })
    await modal.getByRole("button", { name: "Annulla", exact: true }).click()
    await page.reload()
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await modal.getByText("Risorsa: seraphina-nuova.png", { exact: true }).waitFor()
    assert.equal(await modal.getByLabel("Nome", { exact: true }).inputValue(), "Seraphina")
    await modal.getByRole("button", { name: "Sostituisci immagine", exact: true }).scrollIntoViewIfNeeded()
    await screenshot(page, mobile ? "character-image-mobile" : "character-image-desktop")
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test("Upload lento: spinner, blocco dei comandi e chiusura protetta fino alla conferma", async () => {
  const { context, page, counts, release, errors } = await setup({ slow: true })
  try {
    await edit(page)
    const modal = page.getByRole("dialog")
    await modal.getByLabel("Scegli ritratto").setInputFiles(file)
    await modal.getByText("Caricamento immagine in corso…", { exact: true }).waitFor()
    assert.equal(await modal.getByRole("region", { name: "Immagine del personaggio" }).getAttribute("aria-busy"), "true")
    assert.equal(await modal.getByRole("button", { name: "Salva modifiche", exact: true }).isDisabled(), true)
    assert.equal(await modal.getByRole("button", { name: "Sostituisci immagine", exact: true }).isDisabled(), true)
    assert.equal(await modal.getByRole("button", { name: "Chiudi modale", exact: true }).isDisabled(), true)
    assert.equal(await modal.getByLabel("Nome", { exact: true }).isDisabled(), true)
    await page.keyboard.press("Escape")
    assert.equal(await modal.count(), 1)
    await screenshot(page, "character-image-uploading")
    release()
    await modal.getByText("Immagine caricata correttamente:", { exact: false }).waitFor()
    assert.equal(await modal.getByRole("button", { name: "Salva modifiche", exact: true }).isEnabled(), true)
    assert.deepEqual(counts(), { uploads: 1, creates: 0, updates: 0 })
    assert.deepEqual(errors, [])
  } finally { release(); await context.close() }
})

test("Validazione e retry: nessuna richiesta per file non validi; un errore conserva il ritratto corrente", async () => {
  const { context, page, counts, allowUpload, errors } = await setup({ failUpload: true })
  try {
    await edit(page)
    const modal = page.getByRole("dialog")
    for (const invalid of [{ name: "test.txt", mimeType: "text/plain", buffer: Buffer.from("test") }, { name: "vuoto.png", mimeType: "image/png", buffer: Buffer.alloc(0) }, { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }]) {
      await modal.getByLabel("Scegli ritratto").setInputFiles(invalid)
      await modal.getByRole("alert").filter({ hasText: "Scegli un’immagine" }).waitFor()
      assert.equal(counts().uploads, 0)
    }
    await modal.getByRole("button", { name: "Sostituisci immagine", exact: true }).focus()
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.keyboard.press("Enter")])
    await chooser.setFiles(file)
    await modal.getByRole("button", { name: "Riprova caricamento", exact: true }).waitFor()
    assert.equal(await modal.getByRole("link", { name: "Apri immagine attuale" }).getAttribute("href"), oldUrl)
    allowUpload()
    await modal.getByRole("button", { name: "Riprova caricamento", exact: true }).click()
    await modal.getByText("Immagine caricata correttamente:", { exact: false }).waitFor()
    assert.equal(await modal.getByRole("link", { name: "Apri immagine attuale" }).getAttribute("href"), newUrl)
    assert.deepEqual(counts(), { uploads: 2, creates: 0, updates: 0 })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test("Creazione con ritratto: anteprima prima del salvataggio e spinner durante il caricamento", async () => {
  const { context, page, counts, release, errors } = await setup({ empty: true, slow: true })
  try {
    await page.goto(`${baseURL}/admin/characters`)
    const modal = await fillNew(page)
    await modal.getByLabel("Scegli ritratto").setInputFiles(file)
    await modal.getByText("File selezionato:", { exact: false }).waitFor()
    assert.equal(counts().uploads, 0)
    await modal.getByRole("button", { name: "Crea personaggio", exact: true }).click()
    await modal.getByText("Caricamento immagine in corso…", { exact: true }).waitFor()
    assert.deepEqual(counts(), { uploads: 1, creates: 1, updates: 0 })
    release()
    await modal.waitFor({ state: "detached" })
    await page.getByText("Personaggio creato e immagine caricata correttamente.", { exact: true }).waitFor()
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await page.getByRole("dialog").getByRole("link", { name: "Apri immagine attuale" }).waitFor()
    assert.deepEqual(errors, [])
  } finally { release(); await context.close() }
})

test("Creazione riuscita con upload fallito: la scheda resta recuperabile senza duplicare il personaggio", async () => {
  const { context, page, counts, allowUpload, errors } = await setup({ empty: true, failUpload: true })
  try {
    await page.goto(`${baseURL}/admin/characters`)
    const modal = await fillNew(page)
    await modal.getByLabel("Scegli ritratto").setInputFiles(file)
    await modal.getByRole("button", { name: "Crea personaggio", exact: true }).click()
    await modal.waitFor({ state: "detached" })
    await page.getByRole("alert").filter({ hasText: "Personaggio creato, ma il ritratto non è stato caricato" }).waitFor()
    assert.deepEqual(counts(), { uploads: 1, creates: 1, updates: 0 })
    allowUpload()
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await modal.getByLabel("Scegli ritratto").setInputFiles(file)
    await modal.getByText("Immagine caricata correttamente:", { exact: false }).waitFor()
    assert.deepEqual(counts(), { uploads: 2, creates: 1, updates: 0 })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
