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
  if (!options.login) await context.addInitScript(() => localStorage.setItem("token", "navigation-fixture"))
  const page = await context.newPage()
  const profile = { id: 1, username: "tester", email: "test@example.test", role: options.master ? "MASTER" : "PLAYER", learningLevel: options.level ?? "BEGINNER", avatarUrl: null }
  let joined = !options.newPlayer, completed = false, quizPassed = false, lessonRead = false, claimed = false, starts = 0
  const calls = []
  const campaign = () => ({ campaignId: 1, campaignName: "Le Miniere", campaignDescription: "La prima avventura", difficulty: "BEGINNER", unlocked: true, joined, completed: false, completedAt: null })
  const chapters = () => [
    { chapterId: 3, campaignId: 1, campaignName: "Le Miniere", title: "Il sentiero", description: "Entra nella storia", storyText: "La tua avventura ha inizio.", orderIndex: 1, hasCombat: false, lessonId: 10, lessonTitle: "Le basi", lessonCompleted: quizPassed || lessonRead, quizId: options.noQuiz ? null : 20, quizTitle: "Verifica le basi", quizLessonId: 10, quizPassed, combatWon: false, rewardBadgeId: 1, rewardBadgeName: "Primi passi", unlocked: true, completed, completedAt: completed ? "2026-11-02T10:00:00" : null },
    { chapterId: 4, campaignId: 1, campaignName: "Le Miniere", title: "La caverna", description: "Continua", storyText: "La storia continua.", orderIndex: 2, hasCombat: false, lessonId: null, lessonCompleted: false, quizId: null, quizPassed: false, combatWon: false, rewardBadgeId: null, unlocked: completed, completed: false, completedAt: null },
  ]
  const hero = { id: 11, campaignId: 1, name: "Kael", race: "Nano", characterClass: "Guerriero", level: 1, currentHp: 15, maxHp: 15, armorClass: 14, playerUsername: claimed ? "tester" : null, imageUrl: null, weaponName: "Ascia", damageDie: 6, spellcaster: false }
  await page.route("**/auth/login", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ token: "navigation-fixture" }) }))
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    calls.push({ path, method: request.method() })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (path === "/api/users/me") return reply(profile)
    if (path === "/api/campaigns/me/progress") return options.campaignError ? reply({ message: "Campagne non disponibili" }, 503) : reply(options.empty ? [] : [campaign()])
    if (path === "/api/campaigns") return reply([{ id: 1, name: "Le Miniere", chaptersCount: 2 }, { id: 2, name: "Campagna non iscritta", chaptersCount: 1 }])
    if (path === "/api/campaigns/1/join") { joined = true; return reply({ id: 1, name: "Le Miniere" }) }
    if (path === "/api/campaigns/1/chapters/player") return reply(chapters())
    if (path === "/api/campaigns/1/chapters") return reply(chapters().map(item => ({ ...item, id: item.chapterId })))
    if (path === "/api/campaigns/chapters/3/complete") { assert.equal(options.noQuiz ? lessonRead : quizPassed, true); completed = true; return reply({ chapterId: 3, completed: true, completedAt: "2026-11-02T10:00:00" }) }
    if (path === "/api/lessons/me/progress") return reply([{ lessonId: 10, title: "Le basi", orderIndex: 1, unlocked: true, completed: quizPassed || lessonRead }])
    if (path === "/api/lessons/10/complete") { lessonRead = true; return reply({ lessonId: 10, completed: true, unlocked: true }) }
    if (path === "/api/lessons/10" || path === "/api/lessons/99") return reply({ id: path.endsWith("99") ? 99 : 10, title: "Le basi", content: "Il contenuto della lezione", orderIndex: 1, quiz: options.noQuiz ? null : { id: 20, title: "Verifica le basi" }, chapters: [] })
    if (path === "/api/quizzes/lesson/10") return reply({ id: 20, lessonId: 10, title: "Verifica le basi", passingScore: 70 })
    if (path === "/api/questions/quiz/20") return reply([{ id: 30, text: "Quale dado usi?", answers: [{ id: 40, text: "d20" }, { id: 41, text: "d4" }] }])
    if (path === "/api/quizzes/submit") { quizPassed = true; return reply({ quizId: 20, correctAnswers: 1, totalQuestions: 1, score: 100, passed: true }) }
    if (path === "/api/quizzes/me/results" || path === "/api/badges/me" || path === "/api/npcs" || path === "/api/encounters/chapter/3") return reply([])
    if (path === "/api/characters/me") return reply(claimed ? [{ ...hero, playerUsername: "tester" }] : [])
    if (path === "/api/characters/campaign/1/available") return reply([{ ...hero }])
    if (path === "/api/characters/11/claim") { claimed = true; return reply({ ...hero, playerUsername: "tester" }) }
    if (path === "/api/combat/history") return reply({ items: options.resume ? [{ combatId: 9, campaignId: 1, chapterId: 3, campaignName: "Le Miniere", chapterTitle: "Il sentiero", encounterTitle: "Lo scontro aperto", completed: false }] : [], page: 0, size: 12, totalPages: 1, totalElements: options.resume ? 1 : 0 })
    if (path === "/api/combat/9/status") return reply({ combatId: 9, campaignId: options.wrongResume ? 2 : 1, chapterId: 3, completed: false, combatOver: false, currentTurnParticipantId: 1, events: [], fighters: [{ participantId: 1, characterId: 11, npcId: null, name: "Kael", characterClass: "Guerriero", imageUrl: null, currentHp: 15, maxHp: 15, armorClass: 14, alive: true, enemy: false, currentTurn: true, initiative: 12, spellcaster: false, weaponName: "Ascia", damageDie: 6 }, { participantId: 2, characterId: null, npcId: 1, name: "Goblin", imageUrl: null, currentHp: 10, maxHp: 10, armorClass: 12, alive: true, enemy: true, currentTurn: false, initiative: 10 }] })
    if (path.includes("/start")) { starts++; return reply({ message: "Non deve essere creato un nuovo scontro" }, 400) }
    return reply({ message: `Endpoint inatteso: ${path}` }, 404)
  })
  return { context, page, calls, starts: () => starts }
}
async function screenshot(page, name) {
  if (!process.env.UI_SCREENSHOT_DIR) return
  await mkdir(process.env.UI_SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

test("Player nuovo: dalla home all’iscrizione e al primo capitolo", async () => {
  const { page, context } = await setup({ newPlayer: true })
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("heading", { name: "Inizia la tua prima avventura", exact: true }).waitFor()
    await page.getByRole("link", { name: "Scegli la tua avventura", exact: true }).click()
    await page.getByRole("button", { name: "Unisciti", exact: true }).click()
    await page.waitForURL(`${baseURL}/campaigns/1`)
    await page.getByRole("link", { name: "Apri il prossimo capitolo", exact: true }).click()
    await page.getByRole("heading", { name: "Il sentiero", exact: true }).waitFor()
    assert.equal(await page.getByRole("button", { name: "Completa capitolo", exact: true }).isDisabled(), true)
  } finally { await context.close() }
})

test("Player: campagna, lezione, quiz e capitolo successivo senza perdere il contesto", async () => {
  const { page, context } = await setup()
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("link", { name: "Continua capitolo", exact: true }).click()
    await page.getByRole("link", { name: "Leggi la lezione", exact: true }).click()
    await page.waitForURL(`${baseURL}/lessons/10?campaignId=1&chapterId=3`)
    await page.getByRole("link", { name: "Torna al capitolo", exact: true }).waitFor()
    assert.equal(await page.getByRole("navigation", { name: "Navigazione principale" }).getByRole("link", { name: "Campagne", exact: true }).getAttribute("aria-current"), "page")
    await page.getByRole("link", { name: "Vai al quiz", exact: true }).click()
    await page.getByRole("radio", { name: "d20", exact: true }).check()
    await page.getByRole("button", { name: "Invia quiz", exact: true }).click()
    await page.getByRole("heading", { name: "Quiz superato!", exact: true }).waitFor()
    await page.getByRole("link", { name: "Torna al capitolo e prosegui", exact: true }).click()
    await page.getByRole("button", { name: "Completa capitolo", exact: true }).click()
    await page.getByRole("link", { name: "Vai al prossimo capitolo", exact: true }).click()
    await page.getByRole("heading", { name: "La caverna", exact: true }).waitFor()
    assert.equal(await page.getByRole("button", { name: "Completa capitolo", exact: true }).isEnabled(), true)
  } finally { await context.close() }
})

test("Master: login nella gestione, menu dedicato e cambio area", async () => {
  const { page, context } = await setup({ master: true, login: true })
  try {
    await page.goto(`${baseURL}/login`)
    await page.getByRole("textbox", { name: "Username", exact: true }).fill("tester")
    await page.getByLabel("Password", { exact: true }).fill("Example1!")
    await page.getByRole("button", { name: "Accedi", exact: true }).click()
    await page.waitForURL(`${baseURL}/admin`)
    const nav = page.getByRole("navigation", { name: "Navigazione principale" })
    await nav.getByRole("link", { name: "Utenti", exact: true }).waitFor()
    assert.equal(await nav.getByRole("link", { name: "Storico combattimenti", exact: true }).count(), 0)
    assert.equal(await nav.getByRole("link", { name: "Incontri", exact: true }).count(), 0)
    await screenshot(page, "navigation-master")
    await page.getByRole("button", { name: "Apri menu account", exact: true }).click()
    await page.getByRole("menuitem", { name: "Profilo", exact: true }).click()
    await nav.getByRole("link", { name: "Utenti", exact: true }).waitFor()
    await page.getByRole("navigation", { name: "Scegli area" }).getByRole("link", { name: "Area Player", exact: true }).click()
    await page.waitForURL(`${baseURL}/dashboard`)
    await nav.getByRole("link", { name: "Il tuo percorso", exact: true }).waitFor()
  } finally { await context.close() }
})

test("Personaggi: mantiene la campagna scelta e propone solo quelle a cui sei iscritto", async () => {
  const { page, context, calls } = await setup()
  try {
    await page.goto(`${baseURL}/characters?campaignId=1`)
    await page.getByRole("button", { name: "Scegli personaggio", exact: true }).click()
    await page.getByRole("link", { name: "Continua la campagna", exact: true }).waitFor()
    assert.equal(await page.getByText("Campagna non iscritta", { exact: true }).count(), 0)
    assert.equal(calls.some(call => call.path.includes("campaign/2/available")), false)
  } finally { await context.close() }
})

test("Riprendi combattimento usa lo stato salvato e non crea un nuovo tentativo", async () => {
  const { page, context, starts } = await setup({ resume: true })
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("link", { name: "Riprendi il combattimento", exact: true }).click()
    await page.waitForURL(`${baseURL}/campaigns/1/chapters/3/combat?combatId=9`)
    await page.getByRole("article", { name: "Scheda di Kael", exact: true }).waitFor()
    assert.equal(starts(), 0)
    await page.getByRole("link", { name: "Torna al capitolo", exact: true }).waitFor()
  } finally { await context.close() }
})

test("Ripresa di uno scontro di un’altra campagna viene bloccata", async () => {
  const { page, context } = await setup({ wrongResume: true })
  try {
    await page.goto(`${baseURL}/campaigns/1/chapters/3/combat?combatId=9`)
    await page.getByRole("alert").filter({ hasText: "non appartiene al capitolo" }).waitFor()
    assert.equal(await page.getByRole("article", { name: "Scheda di Kael", exact: true }).count(), 0)
  } finally { await context.close() }
})

test("Un contesto capitolo estraneo alla lezione non genera collegamenti di ritorno errati", async () => {
  const { page, context } = await setup()
  try {
    await page.goto(`${baseURL}/lessons/99?campaignId=1&chapterId=3`)
    await page.getByRole("alert").filter({ hasText: "non è disponibile nel capitolo" }).waitFor()
    assert.equal(await page.getByRole("link", { name: "Torna al capitolo", exact: true }).count(), 0)
  } finally { await context.close() }
})

test("Mobile: menu scorrevole, titoli coerenti e breadcrumb senza overflow", async () => {
  const { page, context } = await setup({ mobile: true })
  try {
    await page.goto(`${baseURL}/campaigns/1/chapters/3`)
    await page.getByRole("heading", { name: "Il sentiero", exact: true }).waitFor()
    await page.getByRole("button", { name: "Apri menu di navigazione", exact: true }).click()
    const nav = page.getByRole("navigation", { name: "Navigazione principale" })
    await nav.getByRole("link", { name: "Storico combattimenti", exact: true }).waitFor()
    assert.equal(await nav.getByRole("link", { name: "Campagne", exact: true }).getAttribute("aria-current"), "page")
    await nav.getByRole("link", { name: "Biblioteca lezioni", exact: true }).click()
    await page.getByRole("heading", { name: "Biblioteca lezioni", exact: true }).waitFor()
    assert.equal(await page.getByRole("button", { name: "Chiudi menu di navigazione", exact: true }).count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await screenshot(page, "navigation-mobile")
  } finally { await context.close() }
})

test("Vecchio indirizzo incontri reindirizza alla rotta del capitolo", async () => {
  const { page, context } = await setup({ master: true })
  try {
    await page.goto(`${baseURL}/admin/encounters?campaignId=1&chapterId=3`)
    await page.waitForURL(`${baseURL}/admin/campaigns/1/chapters/3/encounter`)
    await page.getByRole("heading", { name: "Gestione incontro", exact: true }).waitFor()
    await page.getByRole("navigation", { name: "Percorso di navigazione" }).getByRole("link", { name: "Le Miniere", exact: true }).waitFor()
  } finally { await context.close() }
})

test("Errore campagne: evita suggerimenti inventati e permette di riprovare", async () => {
  const { page, context } = await setup({ campaignError: true })
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("alert").filter({ hasText: "Non riesco a recuperare le campagne" }).waitFor()
    assert.equal(await page.getByRole("link", { name: "Continua capitolo", exact: true }).count(), 0)
    await page.getByRole("button", { name: "Riprova", exact: true }).waitFor()
  } finally { await context.close() }
})

test("Una lezione senza quiz permette di salvare la lettura e completare il capitolo", async () => {
  const { page, context } = await setup({ noQuiz: true })
  try {
    await page.goto(`${baseURL}/lessons/10?campaignId=1&chapterId=3`)
    await page.getByRole("button", { name: "Segna come letta", exact: true }).click()
    await page.getByRole("status").filter({ hasText: "Lezione completata" }).waitFor()
    assert.equal(await page.getByRole("link", { name: "Vai al quiz", exact: true }).count(), 0)
    await page.getByRole("link", { name: "Continua il capitolo", exact: true }).click()
    await page.getByRole("button", { name: "Completa capitolo", exact: true }).click()
    await page.getByRole("link", { name: "Vai al prossimo capitolo", exact: true }).waitFor()
  } finally { await context.close() }
})

test("Catalogo vuoto: la home propone alternative senza promettere un’avventura disponibile", async () => {
  const { page, context } = await setup({ empty: true })
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("heading", { name: "Le tue avventure iniziano qui", exact: true }).waitFor()
    assert.equal(await page.getByRole("link", { name: "Scegli la tua avventura", exact: true }).count(), 0)
    await page.getByRole("link", { name: "Esplora le campagne", exact: true }).waitFor()
  } finally { await context.close() }
})

for (const [level, label, stage] of [["BEGINNER", "Principiante", 1], ["INTERMEDIATE", "Intermedio", 2], ["ADVANCED", "Avanzato", 3]]) {
  test(`Livello ${label}: etichette coerenti e barra nella sidebar`, async () => {
    const { page, context } = await setup({ level })
    try {
      await page.goto(`${baseURL}/dashboard`)
      const account = page.getByRole("button", { name: "Apri menu account", exact: true })
      await account.waitFor()
      assert.match(await account.innerText(), new RegExp(label))
      assert.equal((await account.innerText()).includes(level), false)
      const sidebar = page.getByRole("complementary")
      assert.equal(await sidebar.getByRole("link", { name: "Profilo", exact: true }).count(), 0)
      assert.equal(await sidebar.getByRole("button", { name: "Esci", exact: true }).count(), 0)
      const progress = sidebar.getByRole("progressbar", { name: "Livello di apprendimento", exact: true })
      assert.equal(await progress.getAttribute("aria-valuenow"), String(stage))
      assert.equal(await progress.getAttribute("aria-valuetext"), `${label}, livello ${stage} di 3`)
      await account.click()
      const menu = page.getByRole("menu")
      await menu.getByText(label, { exact: true }).waitFor()
      await menu.getByRole("menuitem", { name: "Profilo", exact: true }).click()
      await page.waitForURL(`${baseURL}/profile`)
      await page.getByRole("heading", { name: "Il tuo profilo", exact: true }).waitFor()
      await page.getByText(`Livello: ${label}`, { exact: true }).waitFor()
    } finally { await context.close() }
  })
}

test("Menu account: tastiera, Escape, Tab e chiusura cliccando fuori", async () => {
  const { page, context } = await setup()
  try {
    await page.goto(`${baseURL}/dashboard`)
    const trigger = page.getByRole("button", { name: "Apri menu account", exact: true })
    await trigger.focus()
    await page.keyboard.press("ArrowDown")
    const profile = page.getByRole("menuitem", { name: "Profilo", exact: true })
    await profile.waitFor()
    assert.equal(await profile.evaluate(element => element === document.activeElement), true)
    await page.keyboard.press("ArrowDown")
    assert.equal(await page.getByRole("menuitem", { name: "Esci", exact: true }).evaluate(element => element === document.activeElement), true)
    await page.keyboard.press("Escape")
    assert.equal(await page.getByRole("menu").count(), 0)
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
    await page.keyboard.press("ArrowUp")
    await page.getByRole("menuitem", { name: "Esci", exact: true }).waitFor()
    assert.equal(await page.getByRole("menuitem", { name: "Esci", exact: true }).evaluate(element => element === document.activeElement), true)
    await page.keyboard.press("Tab")
    assert.equal(await page.getByRole("menu").count(), 0)
    await trigger.click()
    await page.getByRole("heading", { name: "Il tuo percorso", exact: true }).click()
    assert.equal(await page.getByRole("menu").count(), 0)
  } finally { await context.close() }
})

test("Menu account mobile: profilo accessibile, nessun overflow e logout", async () => {
  const { page, context } = await setup({ mobile: true })
  try {
    await page.goto(`${baseURL}/dashboard`)
    await page.getByRole("button", { name: "Apri menu account", exact: true }).click()
    await page.getByRole("menuitem", { name: "Profilo", exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await screenshot(page, "account-menu-mobile")
    await page.getByRole("menuitem", { name: "Profilo", exact: true }).click()
    await page.waitForURL(`${baseURL}/profile`)
    await page.getByRole("button", { name: "Apri menu account", exact: true }).click()
    await page.getByRole("menuitem", { name: "Esci", exact: true }).click()
    await page.waitForURL(`${baseURL}/login`)
    assert.equal(await page.evaluate(() => localStorage.getItem("token")), null)
  } finally { await context.close() }
})
