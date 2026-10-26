import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
const shots = process.env.UI_SCREENSHOT_DIR
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

const ownCharacter = { id: 10, campaignId: 1, name: "Valen Moonsong", race: "Elfo", characterClass: "Bardo", level: 1, currentHp: 10, maxHp: 10, armorClass: 14, imageUrl: "https://res.cloudinary.com/test/player.png", playerUsername: "tester" }
const npc = { id: 20, name: "Goblin delle Miniere", description: "Un nemico delle gallerie.", imageUrl: "https://res.cloudinary.com/test/goblin.png", maxHp: 15, armorClass: 13, dexterity: 12, attackModifier: 2, damageDie: 6, damageModifier: 1, enemy: true }
const player = { participantId: 1, characterId: 10, npcId: null, name: ownCharacter.name, characterClass: "Bardo", currentHp: 10, maxHp: 10, armorClass: 14, imageUrl: ownCharacter.imageUrl, alive: true, enemy: false, initiative: 8, spellcaster: true, weaponName: "Stocco", damageDie: 8, spellName: "Incantesimo", spellDamageDie: 4 }
const goblin = { ...player, participantId: 2, characterId: null, npcId: 20, name: npc.name, imageUrl: npc.imageUrl, currentHp: 15, maxHp: 15, armorClass: 13, enemy: true, initiative: 9 }

async function setup(viewport = { width: 1600, height: 1000 }, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" })
  const page = await context.newPage()
  await context.addInitScript(() => localStorage.setItem("token", "ui-test-fixture"))
  let fighters = [{ ...goblin }, { ...player }, { ...goblin, participantId: 3, initiative: 5 }]
  let current = 2, events = [], npcs = [{ ...npc }], creates = 0, uploads = 0
  if (options.completed) {
    current = null
    fighters[1].currentHp = 0
    fighters[1].alive = false
    events.push({ attackerId: 3, attackerName: npc.name, targetId: 1, targetName: player.name, enemy: true, hit: true, critical: false, attackRoll: 13, totalAttack: 17, targetArmorClass: 14, damage: 8, targetHpBefore: 3, targetRemainingHp: 0 })
  }
  const status = () => ({ combatId: 1, campaignId: 1, chapterId: 3, encounterId: 1, currentTurnParticipantId: current, completed: !!options.completed, combatOver: !!options.completed, outcome: options.completed ? "ENEMY_VICTORY" : null, completedAt: null, events, fighters: fighters.map(f => ({ ...f, currentTurn: f.participantId === current })) })
  await page.route("https://res.cloudinary.com/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="248" height="380"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#274c41"/><stop offset="1" stop-color="#081a27"/></linearGradient></defs><path fill="url(#a)" d="M0 0h248v380H0z"/><circle cx="124" cy="100" r="43" fill="#ae976e"/><path d="M35 380V230q0-90 89-90t89 90v150" fill="#182c3a"/><path d="m124 150 45 230H79z" fill="#365b49"/></svg>' }))
  await page.route("**/api/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    const reply = (json, code = 200) => route.fulfill({ status: code, contentType: "application/json", body: JSON.stringify(json) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (path.endsWith("/api/users/me")) return reply({ id: 1, username: "tester", email: "test@example.test", role: "MASTER", learningLevel: "BEGINNER" })
    if (path.endsWith("/api/characters/me")) return reply([ownCharacter])
    if (/\/combat\/chapter\/3\/start$/.test(path)) return reply({ id: 1 })
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
  return { context, page, counts: () => ({ creates, uploads }) }
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
