import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import { skipAutomaticTour } from "./helpers/tour.mjs"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function setup(mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })
  await context.addInitScript(() => localStorage.setItem("token", "rich-text-fixture"))
  await skipAutomaticTour(context)
  const page = await context.newPage(), errors = []
  page.on("pageerror", error => errors.push(error.message))
  let campaign = { id: 1, name: "Pietraluce", description: "La prima avventura", difficulty: "BEGINNER", chaptersCount: 1, masterUsername: "master" }
  let lesson = { id: 10, title: "Le basi", content: "Testo originale\nSeconda riga", orderIndex: 1, unlockedByDefault: true, quiz: null }
  let chapter = { id: 3, campaignId: 1, campaignName: "Pietraluce", title: "La convocazione", description: "Inizia la storia", storyText: "Una storia ancora da scrivere", orderIndex: 1, lessonId: 10, lessonTitle: "Le basi", quizId: null, rewardBadgeId: null, hasCombat: false }
  const writes = []
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    const reply = value => route.fulfill({ contentType: "application/json", body: JSON.stringify(value) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (request.method() === "PUT") {
      writes.push({ path, body: request.postDataJSON() })
      if (path === "/api/campaigns/1") { campaign = { ...campaign, ...request.postDataJSON() }; return reply(campaign) }
      if (path === "/api/lessons/10") { lesson = { ...lesson, ...request.postDataJSON() }; return reply(lesson) }
      if (path === "/api/campaigns/chapters/3") { chapter = { ...chapter, ...request.postDataJSON() }; return reply(chapter) }
    }
    if (path === "/api/users/me") return reply({ id: 1, username: "master", email: "master@example.test", role: "MASTER", learningLevel: "BEGINNER", avatarUrl: null })
    if (path === "/api/campaigns") return reply([campaign])
    if (path === "/api/lessons") return reply([lesson])
    if (path === "/api/lessons/10") return reply(lesson)
    if (path === "/api/lessons/me/progress") return reply([{ lessonId: 10, unlocked: true, completed: false }])
    if (path === "/api/campaigns/1/chapters") return reply([chapter])
    if (path === "/api/campaigns/1/chapters/player") return reply([{ ...chapter, chapterId: chapter.id, unlocked: true, completed: false, lessonCompleted: false, quizPassed: false, combatWon: false }])
    if (path === "/api/campaigns/me/progress") return reply([{ campaignId: 1, campaignName: campaign.name, campaignDescription: campaign.description, joined: true, unlocked: true, completed: false, difficulty: "BEGINNER" }])
    if (path === "/api/characters/me") return reply([{ id: 11, campaignId: 1, name: "Nyx", race: "Tiefling", characterClass: "Monaco", level: 1, imageUrl: null }])
    if (path === "/api/badges" || path === "/api/quizzes") return reply([])
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: `Endpoint inatteso: ${path}` }) })
  })
  return { context, page, errors, writes, lesson: () => lesson, campaign: () => campaign, chapter: () => chapter, setLessonContent: content => { lesson = { ...lesson, content } } }
}

async function format(page, label, text, marks) {
  const dialog = page.getByRole("dialog")
  const root = await dialog.count() ? dialog : page
  const field = root.getByRole("textbox", { name: label, exact: true })
  await field.fill(text)
  await field.press("ControlOrMeta+A")
  for (const mark of marks) await root.getByRole("group", { name: `Formattazione ${label}`, exact: true }).getByRole("button", { name: mark, exact: true }).click()
  return field
}
async function shot(page, name) {
  if (!process.env.UI_SCREENSHOT_DIR) return
  await mkdir(process.env.UI_SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

for (const mobile of [false, true]) test(`Master formatta campagna, lezione e storia; Player legge il risultato, mobile=${mobile}`, async () => {
  const f = await setup(mobile), { page } = f
  try {
    await page.goto(`${baseURL}/admin/campaigns`)
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    const dialog = page.getByRole("dialog")
    const field = await format(page, "Descrizione", "Un viaggio nella nebbia", ["Grassetto"])
    await field.locator("strong").waitFor()
    await dialog.getByRole("button", { name: "Salva modifiche", exact: true }).click()
    await dialog.waitFor({ state: "detached" })
    assert.match(f.campaign().description, /\*\*/)
    await page.reload()
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await dialog.getByRole("textbox", { name: "Descrizione", exact: true }).locator("strong").waitFor()
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click()

    await page.goto(`${baseURL}/admin/lessons`)
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await format(page, "Contenuto", "Il dado racconta la tua prova", ["Grassetto", "Corsivo"])
    await shot(page, `rich-editor-${mobile ? "mobile" : "desktop"}`)
    await dialog.getByRole("button", { name: "Salva modifiche", exact: true }).click()
    await dialog.waitFor({ state: "detached" })
    assert.ok(f.lesson().content.includes("Il dado racconta"))

    await page.goto(`${baseURL}/admin/campaigns/1/chapters`)
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    await format(page, "Testo narrativo", "La campana risuona nella valle", ["Corsivo"])
    await dialog.getByRole("button", { name: "Salva modifiche", exact: true }).click()
    await dialog.waitFor({ state: "detached" })
    assert.equal(f.writes.length, 3)

    await page.goto(`${baseURL}/campaigns/1`)
    await page.locator(".rich-text strong").filter({ hasText: "Un viaggio nella nebbia" }).waitFor()
    await page.goto(`${baseURL}/campaigns/1/chapters/3`)
    const story = page.getByRole("region", { name: "Storia del capitolo", exact: true })
    await story.locator("em").filter({ hasText: "La campana risuona" }).waitFor()
    const readingSize = await story.locator(".rich-text-reading").evaluate(el => parseFloat(getComputedStyle(el).fontSize))
    assert.ok(readingSize >= 17 && readingSize <= 18)
    await page.goto(`${baseURL}/lessons/10?campaignId=1&chapterId=3`)
    await page.locator(".rich-text-reading strong em, .rich-text-reading em strong").filter({ hasText: "Il dado racconta" }).waitFor()
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontSize), "17px")
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await shot(page, `rich-reading-${mobile ? "mobile" : "desktop"}`)
    assert.deepEqual(f.errors, [])
  } finally { await f.context.close() }
})

test("Editor: limiti del testo salvato, annulla e validazione del contenuto vuoto", async () => {
  const f = await setup(), { page } = f
  try {
    await page.goto(`${baseURL}/admin/lessons`)
    await page.getByRole("button", { name: "Modifica", exact: true }).click()
    const field = page.getByRole("textbox", { name: "Contenuto", exact: true })
    await field.getByText("Testo originale", { exact: false }).waitFor()
    await field.fill("x".repeat(5001))
    await page.getByRole("alert").filter({ hasText: "Limite di 5000 caratteri" }).waitFor()
    assert.ok((await field.innerText()).length < 5000)
    await format(page, "Contenuto", "Un nuovo contenuto", ["Grassetto"])
    await page.getByRole("button", { name: "Annulla modifica", exact: true }).click()
    assert.equal(await field.locator("strong").count(), 0)
    await field.fill("")
    await page.getByRole("dialog").getByRole("button", { name: "Salva modifiche", exact: true }).click()
    await page.getByRole("alert").filter({ hasText: "Il contenuto della lezione" }).waitFor()
    assert.equal(f.writes.length, 0)
    assert.deepEqual(f.errors, [])
  } finally { await f.context.close() }
})

test("Lettura: testo semplice, a capo, elenchi e contenuti HTML non eseguibili", async () => {
  const f = await setup(), { page } = f
  try {
    await page.goto(`${baseURL}/lessons/10`)
    await page.locator(".rich-text-reading br").waitFor({ state: "attached" })
    f.setLessonContent('**Leggi in sicurezza**\n\n- Primo passo\n- Secondo passo\n\n<script>window.richTextAttack = true</script>\n<img src="x" onerror="window.richTextAttack=true">')
    await page.reload()
    await page.locator(".rich-text-reading strong").filter({ hasText: "Leggi in sicurezza" }).waitFor()
    assert.equal(await page.locator(".rich-text-reading li").count(), 2)
    assert.equal(await page.locator(".rich-text-reading script, .rich-text-reading img").count(), 0)
    assert.equal(await page.evaluate(() => window.richTextAttack), undefined)
    assert.deepEqual(f.errors, [])
  } finally { await f.context.close() }
})
