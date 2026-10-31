import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { chromium } from "playwright"

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000"
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function setup() {
  const context = await browser.newContext()
  const page = await context.newPage()
  const profile = { id: 1, username: "alice", email: "alice@example.test", role: "PLAYER", learningLevel: "BEGINNER", avatarUrl: null }
  let releaseProfile, profileStarted, loginCount = 0, profileFailure = false
  let profileGate = Promise.resolve()
  const navigations = []
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations.push(new URL(frame.url()).pathname)
  })
  await page.route("**/auth/login", (route) => {
    loginCount++
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ token: `session-${loginCount}` }) })
  })
  await page.route("**/api/**", async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) })
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 })
    if (path === "/api/users/me") {
      profileStarted?.()
      await profileGate
      return profileFailure ? reply({ message: "Profilo temporaneamente non disponibile" }, 503) : reply(profile)
    }
    if (path === "/api/users/me/password") return route.fulfill({ status: 204 })
    if (["/api/lessons/me/progress", "/api/quizzes/me/results", "/api/badges/me"].includes(path)) return reply([])
    // The dashboard data is not relevant to session establishment.
    return reply([])
  })
  return {
    page, context, navigations,
    blockProfile() {
      profileGate = new Promise((resolve) => { releaseProfile = resolve })
      return new Promise((resolve) => { profileStarted = resolve })
    },
    releaseProfile: () => { releaseProfile?.(); profileStarted = undefined },
    failProfile: () => { profileFailure = true },
    allowProfile: () => { profileFailure = false },
  }
}

async function submitLogin(page) {
  await page.getByRole("textbox", { name: "Username", exact: true }).fill("alice")
  await page.getByLabel("Password", { exact: true }).fill("Replacement2!")
  await page.getByRole("button", { name: "Accedi", exact: true }).click()
}

test("primo login: attende il profilo prima della dashboard e non torna al login", async () => {
  const f = await setup()
  try {
    await f.page.goto(`${baseURL}/login`)
    const profileRequested = f.blockProfile()
    await submitLogin(f.page)
    await profileRequested
    // While /me is held, the app must keep the login in progress.
    assert.equal(f.navigations.includes("/dashboard"), false)
    assert.equal(await f.page.getByRole("button", { name: "Accesso in corso...", exact: true }).count(), 1)
    f.releaseProfile()
    await f.page.waitForURL(`${baseURL}/dashboard`)
    await f.page.getByRole("heading", { name: "Ciao, alice", exact: true }).waitFor()
    const dashboardIndex = f.navigations.indexOf("/dashboard")
    assert.equal(f.navigations.slice(dashboardIndex + 1).includes("/login"), false)
    await f.page.reload()
    await f.page.getByRole("heading", { name: "Ciao, alice", exact: true }).waitFor()
    assert.equal(new URL(f.page.url()).pathname, "/dashboard")
  } finally { f.releaseProfile(); await f.context.close() }
})

test("dopo il cambio password il primo nuovo accesso resta in dashboard", async () => {
  const f = await setup()
  try {
    await f.page.goto(`${baseURL}/login`)
    await submitLogin(f.page)
    await f.page.waitForURL(`${baseURL}/dashboard`)
    await f.page.getByRole("heading", { name: "Ciao, alice", exact: true }).waitFor()
    await f.page.getByRole("link", { name: "Vai al tuo profilo", exact: true }).click()
    await f.page.getByLabel("Password attuale", { exact: true }).fill("Original1!")
    await f.page.getByLabel("Nuova password", { exact: true }).fill("Replacement2!")
    await f.page.getByLabel("Conferma nuova password", { exact: true }).fill("Replacement2!")
    await f.page.getByRole("button", { name: "Aggiorna password", exact: true }).click()
    await f.page.waitForURL(/\/login\?passwordChanged=1/)
    const profileRequested = f.blockProfile()
    await submitLogin(f.page)
    await profileRequested
    f.releaseProfile()
    await f.page.waitForURL(`${baseURL}/dashboard`)
    await f.page.getByRole("heading", { name: "Ciao, alice", exact: true }).waitFor()
    assert.equal(await f.page.evaluate(() => localStorage.getItem("token")), "session-2")
  } finally { f.releaseProfile(); await f.context.close() }
})

test("profilo non disponibile durante il login: errore recuperabile prima di aprire la dashboard", async () => {
  const f = await setup()
  try {
    f.failProfile()
    await f.page.goto(`${baseURL}/login`)
    await submitLogin(f.page)
    await f.page.getByRole("alert").filter({ hasText: "Profilo temporaneamente non disponibile" }).waitFor()
    assert.equal(new URL(f.page.url()).pathname, "/login")
    assert.equal(f.navigations.includes("/dashboard"), false)
    f.allowProfile()
    await submitLogin(f.page)
    await f.page.waitForURL(`${baseURL}/dashboard`)
    await f.page.getByRole("heading", { name: "Ciao, alice", exact: true }).waitFor()
  } finally { await f.context.close() }
})
