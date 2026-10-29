import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
const shots = process.env.UI_SCREENSHOT_DIR
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

const ownCharacter = { id: 10, campaignId: 1, name: "Valen Moonsong", race: "Elfo", characterClass: "Bardo", level: 1, currentHp: 10, maxHp: 10, armorClass: 14, imageUrl: "https://res.cloudinary.com/test/player.png", playerUsername: "tester", weaponName: "Stocco", damageDie: 8, attackAbility: "DEXTERITY", spellcaster: true, spellName: "Incantesimo", spellDamageDie: 4, spellAbility: "CHARISMA", stats: { strength: 10, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 11, charisma: 16 } }
const npc = { id: 20, name: "Goblin delle Miniere", description: "Un nemico delle gallerie.", imageUrl: "https://res.cloudinary.com/test/goblin.png", maxHp: 15, armorClass: 13, dexterity: 12, attackModifier: 2, damageDie: 6, damageModifier: 1, enemy: true }
const player = { participantId: 1, characterId: 10, npcId: null, name: ownCharacter.name, characterClass: "Bardo", currentHp: 10, maxHp: 10, armorClass: 14, imageUrl: ownCharacter.imageUrl, alive: true, enemy: false, initiative: 8, spellcaster: true, weaponName: "Stocco", damageDie: 8, spellName: "Incantesimo", spellDamageDie: 4 }
const goblin = { ...player, participantId: 2, characterId: null, npcId: 20, name: npc.name, imageUrl: npc.imageUrl, currentHp: 15, maxHp: 15, armorClass: 13, enemy: true, initiative: 9 }

async function setup(viewport = { width: 1600, height: 1000 }, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" })
  const page = await context.newPage()
  await context.addInitScript(() => localStorage.setItem("token", "ui-test-fixture"))
  let fighters = [{ ...goblin }, { ...player }, { ...goblin, participantId: 3, initiative: 5 }]
  let current = 2, events = [], npcs = [{ ...npc }], creates = 0, uploads = 0, starts = 0
  if (options.completed) {
    current = null
    fighters[1].currentHp = 0
    fighters[1].alive = false
    events.push({ attackerId: 3, attackerName: npc.name, targetId: 1, targetName: player.name, enemy: true, hit: true, critical: false, attackRoll: 13, totalAttack: 17, targetArmorClass: 14, damage: 8, targetHpBefore: 3, targetRemainingHp: 0 })
  }
  let historyFailure = !!options.historyError
  const historyEntry = (id, extra = {}) => ({ combatId: id, campaignId: 1, campaignName: "Miniere", chapterId: 3, chapterTitle: "Il Sentiero degli Agguati", encounterTitle: "Agguato sul sentiero", characterName: "Valen Moonsong", characterImageUrl: ownCharacter.imageUrl, characterCurrentHp: 9, characterMaxHp: 10, completed: true, outcome: "PLAYER_VICTORY", completedAt: "2026-10-29T10:30:00", ...extra })
  const historyRows = [historyEntry(113), historyEntry(112, { outcome: "ENEMY_VICTORY", characterCurrentHp: 0 }), historyEntry(111, { completed: false, outcome: null, completedAt: null }), ...Array.from({ length: 9 }, (_, i) => historyEntry(110 - i, { encounterTitle: `Scontro ${110 - i}` }))]
  const status = () => ({ combatId: 1, campaignId: 1, chapterId: 3, encounterId: 1, currentTurnParticipantId: current, completed: !!options.completed, combatOver: !!options.completed, outcome: options.completed ? "ENEMY_VICTORY" : null, completedAt: null, events, fighters: fighters.map(f => ({ ...f, currentTurn: f.participantId === current })) })
  await page.route("https://res.cloudinary.com/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="248" height="380"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#274c41"/><stop offset="1" stop-color="#081a27"/></linearGradient></defs><path fill="url(#a)" d="M0 0h248v380H0z"/><circle cx="124" cy="100" r="43" fill="#ae976e"/><path d="M35 380V230q0-90 89-90t89 90v150" fill="#182c3a"/><path d="m124 150 45 230H79z" fill="#365b49"/></svg>' }))
  await page.route("**/api/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    const reply = (json, code = 200) => route.fulfill({ status: code, contentType: "application/json", body: JSON.stringify(json) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (path.endsWith("/api/combat/history")) {
      if (historyFailure) return reply({ message: "Storico temporaneamente non disponibile" }, 503)
      if (options.emptyHistory) return reply({ items: [], page: 0, size: 12, totalPages: 0, totalElements: 0 })
      const pageNumber = Number(url.searchParams.get("page"))
      const rows = options.historyShort ? historyRows.slice(0, 3) : pageNumber === 0 ? historyRows : [historyEntry(101, { encounterTitle: "Scontro precedente" })]
      return reply({ items: rows, page: pageNumber, size: 12, totalPages: options.historyShort ? 1 : 2, totalElements: options.historyShort ? 3 : 13 })
    }
    if (path.endsWith("/api/combat/113/status")) {
      if (options.forbiddenHistoryDetail) return reply({ message: "Combattimento non tuo" }, 403)
      return reply({ ...status(), combatId: 113, completed: true, combatOver: true, outcome: "PLAYER_VICTORY", currentTurnParticipantId: null,
        fighters: [{ ...player, currentHp: 9, currentTurn: false }, { ...goblin, currentHp: 0, alive: false, currentTurn: false }],
        events: [{ attackerId: 1, attackerName: player.name, targetId: 2, targetName: npc.name, enemy: false, hit: true, critical: false, attackRoll: 18, totalAttack: 20, targetArmorClass: 13, damage: 7, targetHpBefore: 6, targetRemainingHp: 0 }],
      })
    }
    if (path.endsWith("/api/users/me")) return reply({ id: 1, username: "tester", email: "test@example.test", role: options.role ?? "MASTER", learningLevel: "BEGINNER" })
    if (path.endsWith("/api/campaigns/1/chapters/player")) return reply([{
      chapterId: 3, campaignId: 1, campaignName: "Miniere", title: "Il Sentiero degli Agguati",
      description: "Un agguato nel bosco", storyText: "La storia del capitolo.", orderIndex: 3,
      hasCombat: true, lessonId: options.quizOnly ? null : 10, lessonTitle: "Le basi del combattimento",
      quizId: 20, quizTitle: "Sei pronto a combattere?", quizLessonId: 10,
      lessonCompleted: options.lessonCompleted ?? true, quizPassed: options.quizPassed ?? true,
      combatWon: options.combatWon ?? false, rewardBadgeId: null, rewardBadgeName: null,
      unlocked: true, completed: false, completedAt: null,
    }])
    if (path.endsWith("/api/characters/me")) return reply(options.noCharacter ? [] : [ownCharacter])
    if (/\/characters\/campaign\/1\/available$/.test(path)) return reply([{ ...ownCharacter, playerUsername: null }])
    if (/\/characters\/10\/claim$/.test(path)) return reply(ownCharacter)
    if (/\/combat\/chapter\/3\/preview$/.test(path)) {
      if (options.previewFailure) return reply({ message: "Capitolo bloccato" }, 403)
      return reply({ chapterId: 3, campaignId: options.wrongCampaign ? 99 : 1, campaignName: "Miniere", chapterTitle: "Il Sentiero degli Agguati", title: "Agguato sul sentiero", description: "Due goblin sbarrano la strada.", participants: [
        { npc, quantity: 2 },
        ...(options.withAlly ? [{ npc: { ...npc, id: 30, name: "Guida delle Miniere", enemy: false }, quantity: 1 }] : []),
      ] })
    }
    if (/\/combat\/chapter\/3\/start$/.test(path)) { starts++; return reply({ id: 1 }) }
    if (/\/combat\/1\/status$/.test(path)) return reply(status())
    if (/\/combat\/1\/npc-turn$/.test(path)) {
      assert.equal(url.searchParams.get("expectedEventCount"), "0")
      events.push({ attackerId: 2, attackerName: npc.name, targetId: 1, targetName: player.name, enemy: true, hit: true, critical: false, attackRoll: 19, totalAttack: 21, targetArmorClass: 14, damage: 7, targetHpBefore: 10, targetRemainingHp: 3 })
      fighters[1].currentHp = 3; current = 1
      return reply(status())
    }
    if (/\/combat\/1\/attack$/.test(path)) {
      const body = request.postDataJSON()
      assert.equal(body.targetId, 3)
      events.push({ attackerId: 1, attackerName: player.name, targetId: 3, targetName: npc.name, enemy: false, hit: true, critical: false, attackRoll: 17, totalAttack: 19, targetArmorClass: 13, damage: 8, targetHpBefore: 15, targetRemainingHp: 7 })
      fighters[2].currentHp = 7; current = 2
      return reply({ ...events.at(-1), actionName: "Stocco", abilityModifier: 2, damageDie: 8, damageRoll: 6, targetDefeated: false, combatOver: false, actionType: "WEAPON" })
    }
    if (/\/api\/npcs\/\d+\/image$/.test(path)) {
      uploads++
      if (options.failUpload) return reply({ message: "Upload di prova non riuscito" }, 400)
      const id = Number(path.split("/").at(-2)), item = npcs.find(n => n.id === id)
      item.imageUrl = npc.imageUrl
      return reply(item)
    }
    if (path.endsWith("/api/npcs")) {
      if (request.method() === "POST") { creates++; const saved = { ...request.postDataJSON(), id: 100, imageUrl: null }; npcs.push(saved); return reply(saved, 201) }
      return reply(npcs)
    }
    return reply({ message: `Endpoint di prova non gestito: ${path}` }, 404)
  })
  return { context, page, allowHistory: () => { historyFailure = false }, starts: () => starts, counts: () => ({ creates, uploads }) }
}
async function screenshot(page, name) { if (shots) { await mkdir(shots, { recursive: true }); await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true }) } }
async function start(page) {
  await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
  await page.getByRole("button", { name: "Inizia il combattimento", exact: true }).click()
  await page.getByRole("heading", { name: "Tocca a Goblin delle Miniere 1" }).waitFor()
}

test("desktop: ritratti grandi, turno NPC, danni, bersaglio e dadi nell'arena", async () => {
  const { context, page } = await setup()
  try {
    await start(page)
    const portrait = await page.getByAltText("Ritratto di Valen Moonsong").locator("..").boundingBox()
    assert.ok(portrait.width >= 240, "Il ritratto deve restare ampio su desktop")
    assert.ok(portrait.height >= 380)
    await page.getByRole("button", { name: "Mostra l'azione di Goblin delle Miniere 1", exact: true }).click()
    await page.getByRole("heading", { name: "Sei stato colpito! −7 HP", exact: true }).waitFor()
    assert.equal(await page.getByRole("progressbar", { name: "HP di Valen Moonsong" }).getAttribute("aria-valuenow"), "3")
    await page.getByText("Registro del combattimento \u00b7 1 azione", { exact: true }).waitFor()
    await page.getByLabel("Bersaglio", { exact: true }).selectOption("3")
    await page.getByAltText("Ritratto di Goblin delle Miniere 2").waitFor()
    await page.getByRole("button", { name: "Attacca", exact: true }).click()
    await page.getByRole("heading", { name: "Colpo a segno!", exact: true }).waitFor()
    const dice = await page.getByLabel("d20, risultato 17", { exact: true }).boundingBox()
    assert.ok(dice.y + dice.height < 1000, "I dadi devono essere visibili senza scorrere su desktop")
    assert.equal(await page.locator("details").filter({ has: page.locator("summary", { hasText: "Registro del combattimento" }) }).getAttribute("open"), null)
    assert.equal(await page.getByLabel("Combattente in vista", { exact: true }).count(), 0)
    await page.getByAltText("Ritratto di Goblin delle Miniere 2").waitFor()
    await screenshot(page, "combat-desktop")
    await page.getByAltText("Ritratto di Goblin delle Miniere 1").waitFor()
    await page.getByRole("button", { name: "Mostra l'azione di Goblin delle Miniere 1", exact: true }).waitFor({ state: "visible" })
    await page.getByText("Registro del combattimento · 2 azioni", { exact: true }).click()
    await page.getByText("2. Valen Moonsong → Goblin delle Miniere 2", { exact: true }).waitFor()
  } finally { await context.close() }
})

test("mobile: ritratti affiancati, comandi accessibili e nessun overflow di pagina", async () => {
  const { context, page } = await setup({ width: 390, height: 844 })
  try {
    await start(page)
    const playerBox = await page.getByAltText("Ritratto di Valen Moonsong").locator("..").boundingBox()
    const enemyBox = await page.getByAltText("Ritratto di Goblin delle Miniere 1").locator("..").boundingBox()
    assert.equal(Math.round(playerBox.y), Math.round(enemyBox.y))
    assert.ok(playerBox.height >= 220)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.getByRole("button", { name: "Mostra l'azione di Goblin delle Miniere 1", exact: true }).click()
    await page.getByRole("heading", { name: "Sei stato colpito! −7 HP", exact: true }).waitFor()
    await page.getByLabel("Bersaglio", { exact: true }).selectOption("3")
    await page.getByRole("button", { name: "Attacca", exact: true }).click()
    await page.getByRole("heading", { name: "Colpo a segno!", exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await screenshot(page, "combat-mobile")
  } finally { await context.close() }
})

for (const failUpload of [false, true]) test(`NPC: creazione con ritratto e ${failUpload ? "recupero da errore upload senza duplicati" : "upload riuscito"}`, async () => {
  const { context, page, counts } = await setup(undefined, { failUpload })
  try {
    await page.goto(`${baseURL}/admin/npcs`)
    await page.getByRole("heading", { name: npc.name, exact: true }).waitFor()
    const portrait = await page.getByAltText(`Ritratto di ${npc.name}`).locator("..").boundingBox()
    assert.ok(portrait.width >= 240 && portrait.width <= 270, "Il ritratto deve mantenere la dimensione delle schede personaggio")
    assert.equal(Math.round(portrait.height), 380)
    if (!failUpload) await screenshot(page, "npc-cards")
    await page.getByRole("button", { name: "Nuovo NPC", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Nome", { exact: true }).fill("Guida delle miniere")
    await dialog.getByLabel("Schieramento", { exact: true }).selectOption("ally")
    await dialog.locator('input[type="file"]').setInputFiles({ name: "ritratto.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a52kAAAAASUVORK5CYII=", "base64") })
    if (!failUpload) await screenshot(page, "npc-form")
    await dialog.getByRole("button", { name: "Crea NPC", exact: true }).click()
    await page.getByRole("heading", { name: "Guida delle miniere", exact: true }).waitFor()
    assert.deepEqual(counts(), { creates: 1, uploads: 1 })
    if (failUpload) await page.getByRole("alert").filter({ hasText: "Scheda salvata. Immagine non caricata" }).waitFor()
    else await page.getByAltText("Ritratto di Guida delle miniere").waitFor()
  } finally { await context.close() }
})

for (const width of [768, 1024, 1280, 1920]) test(`layout adattivo a ${width}px: comandi leggibili e nessun overflow`, async () => {
  const { context, page } = await setup({ width, height: 1000 })
  try {
    await start(page)
    const own = await page.getByRole("article", { name: "Scheda di Valen Moonsong", exact: true }).boundingBox()
    const enemy = await page.getByRole("article", { name: "Scheda di Goblin delle Miniere 1", exact: true }).boundingBox()
    const commands = await page.getByRole("region", { name: "Arena e comandi di combattimento" }).boundingBox()
    assert.equal(Math.round(own.y), Math.round(enemy.y))
    assert.ok(commands.width >= 300, "I comandi non devono essere compressi tra i ritratti")
    if (width >= 1600) {
      assert.ok(commands.x > own.x + own.width && commands.x + commands.width < enemy.x, "Su schermi larghi i comandi stanno tra i due ritratti")
      assert.ok(commands.width < 650, "Il pannello comandi non deve estendersi troppo")
    } else assert.ok(commands.y > own.y, "Con poco spazio i comandi passano sotto i ritratti")
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await screenshot(page, `combat-${width}`)
  } finally { await context.close() }
})

test("sconfitta: il ritratto NPC mostra l’autore dell’ultimo attacco", async () => {
  const { context, page } = await setup(undefined, { completed: true })
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    await page.getByRole("button", { name: "Inizia il combattimento", exact: true }).click()
    await page.getByRole("heading", { name: "Sconfitta", exact: true }).waitFor()
    await page.getByAltText("Ritratto di Goblin delle Miniere 2").waitFor()
    assert.equal(await page.getByRole("progressbar", { name: "HP di Valen Moonsong" }).getAttribute("aria-valuenow"), "0")
    await page.getByRole("button", { name: "Riprova", exact: true }).waitFor()
    await screenshot(page, "combat-defeat")
  } finally { await context.close() }
})

for (const role of ["PLAYER", "MASTER"]) test(`navigazione per ruolo: ${role}`, async () => {
  const { context, page } = await setup(undefined, { role })
  try {
    await page.goto(`${baseURL}/admin`)
    const navigation = page.getByRole("navigation", { name: "Navigazione principale" })
    if (role === "PLAYER") {
      await page.getByRole("heading", { name: "Accesso riservato", exact: true }).waitFor()
      assert.equal(await navigation.getByRole("link", { name: "Backoffice", exact: true }).count(), 0)
    } else {
      await navigation.getByRole("link", { name: "Backoffice", exact: true }).waitFor()
      assert.equal(await page.getByRole("heading", { name: "Accesso riservato", exact: true }).count(), 0)
    }
  } finally { await context.close() }
})

for (const scenario of [
  { name: "lezione e quiz già completati", lessonCompleted: true, quizPassed: true, combatWon: false },
  { name: "tutti i requisiti da svolgere", lessonCompleted: false, quizPassed: false, combatWon: false },
  { name: "progressi misti", lessonCompleted: true, quizPassed: false, combatWon: true },
  { name: "quiz senza lezione del capitolo", quizOnly: true, lessonCompleted: false, quizPassed: true, combatWon: false },
]) test(`requisiti capitolo: ${scenario.name}`, async () => {
  const { context, page } = await setup(undefined, { ...scenario, role: "PLAYER" })
  try {
    await page.goto(`${baseURL}/campaigns/1/chapters/3`)
    await page.getByRole("heading", { name: "Il Sentiero degli Agguati", exact: true }).waitFor()
    async function verifyRequirements() {
      const lesson = page.getByRole("region", { name: "Lezione", exact: true })
      if (scenario.quizOnly) assert.equal(await lesson.count(), 0)
      else {
        await lesson.getByText(scenario.lessonCompleted ? "Lezione completata" : "Da completare", { exact: true }).waitFor()
        assert.equal(await lesson.getByRole("link", { name: scenario.lessonCompleted ? "Rivedi lezione" : "Vai alla lezione", exact: true }).getAttribute("href"), "/lessons/10")
      }
      const quiz = page.getByRole("region", { name: "Quiz", exact: true })
      await quiz.getByText(scenario.quizPassed ? "Quiz superato" : "Da superare", { exact: true }).waitFor()
      assert.equal(await quiz.getByRole("link", { name: scenario.quizPassed ? "Ripeti quiz" : "Vai al quiz", exact: true }).getAttribute("href"), "/lessons/10/quiz")
      const combat = page.getByRole("region", { name: "Combattimento", exact: true })
      await combat.getByText(scenario.combatWon ? "Combattimento vinto" : "Da vincere", { exact: true }).waitFor()
      await combat.getByRole("link", { name: scenario.combatWon ? "Ripeti combattimento" : "Avvia combattimento", exact: true }).waitFor()
      await page.getByRole("button", { name: "Completa capitolo", exact: true }).waitFor()
    }
    await verifyRequirements()
    if (scenario.lessonCompleted && scenario.quizPassed) {
      await page.reload()
      await verifyRequirements()
      await screenshot(page, "chapter-requirements-completed")
    }
  } finally { await context.close() }
})

test("preparazione: scheda completa, ritratto grande e nemici senza avviare lo scontro", async () => {
  const { context, page, starts } = await setup(undefined, { role: "PLAYER" })
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    await page.getByRole("heading", { name: "Agguato sul sentiero", exact: true }).waitFor()
    const hero = page.getByRole("region", { name: "Il tuo personaggio", exact: true })
    const portrait = await hero.getByAltText("Ritratto di Valen Moonsong").locator("..").boundingBox()
    assert.ok(portrait.width >= 240 && portrait.height >= 380)
    await hero.getByText("Stocco", { exact: true }).waitFor()
    await hero.getByText("Incantesimo", { exact: true }).first().waitFor()
    await hero.getByText("Caratteristiche", { exact: true }).waitFor()
    const enemies = page.getByRole("region", { name: "Nemici dell'incontro", exact: true })
    await enemies.getByRole("heading", { name: "Goblin delle Miniere", exact: true }).waitFor()
    await page.getByText("2 nemici", { exact: true }).waitFor()
    assert.equal(await page.getByText(/Il Master deve/).count(), 0)
    assert.equal(starts(), 0)
    await screenshot(page, "combat-preparation-desktop")
  } finally { await context.close() }
})

test("preparazione: aiutanti distinti dai nemici", async () => {
  const { context, page } = await setup(undefined, { withAlly: true })
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    await page.getByRole("region", { name: "Aiutanti dell'incontro", exact: true }).getByRole("heading", { name: "Guida delle Miniere", exact: true }).waitFor()
    await page.getByText("2 nemici", { exact: true }).waitFor()
  } finally { await context.close() }
})

test("preparazione: scelta personaggio nella stessa pagina prima di iniziare", async () => {
  const { context, page, starts } = await setup(undefined, { noCharacter: true })
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    const start = page.getByRole("button", { name: "Inizia il combattimento", exact: true })
    await page.getByRole("button", { name: "Scegli personaggio", exact: true }).waitFor()
    assert.ok(await start.isDisabled())
    await page.getByRole("button", { name: "Scegli personaggio", exact: true }).click()
    await page.getByRole("heading", { name: "Caratteristiche", exact: true }).waitFor()
    assert.equal(await start.isDisabled(), false)
    assert.equal(starts(), 0)
  } finally { await context.close() }
})

for (const options of [{ previewFailure: true }, { wrongCampaign: true }]) test(`preparazione: blocca anteprima non accessibile ${JSON.stringify(options)}`, async () => {
  const { context, page, starts } = await setup(undefined, options)
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    await page.getByRole("alert").waitFor()
    assert.equal(await page.getByRole("heading", { name: "Goblin delle Miniere", exact: true }).count(), 0)
    assert.equal(await page.getByRole("button", { name: "Inizia il combattimento", exact: true }).count(), 0)
    assert.equal(starts(), 0)
  } finally { await context.close() }
})

test("preparazione mobile: ritratto ampio e nessun overflow", async () => {
  const { context, page, starts } = await setup({ width: 390, height: 844 }, { role: "PLAYER" })
  try {
    await page.goto(`${baseURL}/combat?chapterId=3&campaignId=1`)
    await page.getByRole("button", { name: "Inizia il combattimento", exact: true }).waitFor()
    const portrait = await page.getByAltText("Ritratto di Valen Moonsong").locator("..").boundingBox()
    assert.ok(portrait.height >= 380)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(starts(), 0)
    await screenshot(page, "combat-preparation-mobile")
  } finally { await context.close() }
})

test("storico: campagne, personaggi, vittorie, sconfitte e scontri aperti", async () => {
  const { context, page, starts } = await setup(undefined, { role: "PLAYER", historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByRole("heading", { name: "I tuoi combattimenti", exact: true }).waitFor()
    await page.getByText("3 scontri salvati", { exact: true }).waitFor()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).getByText("Vittoria", { exact: true }).waitFor()
    await page.getByRole("article", { name: "Combattimento 112", exact: true }).getByText("Sconfitta", { exact: true }).waitFor()
    await page.getByRole("article", { name: "Combattimento 111", exact: true }).getByText("Non concluso", { exact: true }).waitFor()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).getByText("Miniere", { exact: true }).waitFor()
    assert.equal(starts(), 0)
    await screenshot(page, "combat-history-desktop")
  } finally { await context.close() }
})

test("storico: dettagli e registro leggibili senza azioni di combattimento", async () => {
  const { context, page, starts } = await setup(undefined, { historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).getByRole("button", { name: "Vedi dettagli e registro", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByText("Riepilogo di sola lettura", { exact: true }).waitFor()
    await dialog.getByRole("heading", { name: "Registro \u00b7 1 azione", exact: true }).waitFor()
    await dialog.getByText("7 danni \u00b7 HP 6 \u2192 0", { exact: true }).waitFor()
    assert.equal(await dialog.getByRole("button", { name: "Attacca", exact: true }).count(), 0)
    assert.equal(starts(), 0)
    await screenshot(page, "combat-history-details")
    await dialog.getByRole("button", { name: "Chiudi modale", exact: true }).click()
    assert.equal(await page.getByRole("dialog").count(), 0)
  } finally { await context.close() }
})

test("storico vuoto: invito alle campagne", async () => {
  const { context, page } = await setup(undefined, { emptyHistory: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByRole("heading", { name: "Il tuo diario di battaglia inizia qui", exact: true }).waitFor()
    assert.equal(await page.getByRole("link", { name: "Vai alle campagne", exact: true }).getAttribute("href"), "/campaigns")
  } finally { await context.close() }
})

test("storico: paginazione avanti e indietro", async () => {
  const { context, page } = await setup()
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByText("Pagina 1 di 2", { exact: true }).waitFor()
    await page.getByRole("button", { name: "Successivi", exact: true }).click()
    await page.getByRole("article", { name: "Combattimento 101", exact: true }).waitFor()
    assert.equal(await page.getByRole("article", { name: "Combattimento 113", exact: true }).count(), 0)
    assert.ok(await page.getByRole("button", { name: "Successivi", exact: true }).isDisabled())
    await page.getByRole("button", { name: "Precedenti", exact: true }).click()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).waitFor()
  } finally { await context.close() }
})

test("storico: errore di caricamento e riprova", async () => {
  const { context, page, allowHistory } = await setup(undefined, { historyError: true, historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByRole("alert").filter({ hasText: "Storico temporaneamente non disponibile" }).waitFor()
    allowHistory()
    await page.getByRole("button", { name: "Riprova", exact: true }).click()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).waitFor()
  } finally { await context.close() }
})

test("storico: dettaglio non autorizzato non mostra il registro", async () => {
  const { context, page } = await setup(undefined, { forbiddenHistoryDetail: true, historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).getByRole("button", { name: "Vedi dettagli e registro", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("alert").filter({ hasText: "Combattimento non tuo" }).waitFor()
    assert.equal(await dialog.getByRole("region", { name: "Registro dello scontro", exact: true }).count(), 0)
  } finally { await context.close() }
})

test("storico mobile: elenco e dettaglio senza overflow", async () => {
  const { context, page } = await setup({ width: 390, height: 844 }, { historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    await page.locator("summary").filter({ hasText: "Storico dei combattimenti" }).click()
    const item = page.getByRole("article", { name: "Combattimento 113", exact: true })
    await item.waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await screenshot(page, "combat-history-mobile")
    await item.getByRole("button", { name: "Vedi dettagli e registro", exact: true }).click()
    await page.getByRole("dialog").getByText("Riepilogo di sola lettura", { exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  } finally { await context.close() }
})


test("storico: accordion chiuso inizialmente e richiudibile", async () => {
  const { context, page, starts } = await setup(undefined, { historyShort: true })
  try {
    await page.goto(`${baseURL}/combat`)
    const summary = page.locator("summary").filter({ hasText: "Storico dei combattimenti" })
    await summary.waitFor()
    assert.equal(await summary.locator("..").getAttribute("open"), null)
    assert.equal(await page.getByRole("article", { name: "Combattimento 113", exact: true }).count(), 0)
    await summary.focus()
    await page.keyboard.press("Enter")
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).waitFor()
    await page.getByText(/Ogni tentativo ha un proprio risultato/).waitFor()
    await summary.click()
    await page.getByRole("article", { name: "Combattimento 113", exact: true }).waitFor({ state: "hidden" })
    assert.equal(starts(), 0)
  } finally { await context.close() }
})
