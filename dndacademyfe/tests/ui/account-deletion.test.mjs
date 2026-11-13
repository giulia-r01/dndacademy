import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { skipAutomaticTour } from './helpers/tour.mjs'

const baseURL = process.env.UI_BASE_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.UI_BROWSER_PATH ? { executablePath: process.env.UI_BROWSER_PATH } : {}) }) })
after(async () => { await browser?.close() })

async function fixture({ master = false, noSuccessor = false, planError = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(() => { localStorage.setItem('token', 'deletion-test-token') })
  await skipAutomaticTour(context, 21)
  const page = await context.newPage()
  const requests = []
  let failPlan = planError, responseStatus = 204, release = null
  let gate = Promise.resolve()
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 })
    if (path === '/api/users/me' && request.method() === 'GET') return reply({ id: 21, username: 'alice', email: 'alice@example.test', role: master ? 'MASTER' : 'PLAYER', learningLevel: 'BEGINNER', avatarUrl: null })
    if (path === '/api/users/me/deletion-plan') return failPlan ? reply({ message: 'Verifica temporaneamente non disponibile' }, 503) : reply({ campaigns: master ? 1 : 0, npcs: master ? 2 : 0, successors: master && !noSuccessor ? [{ id: 30, username: 'altro_master' }] : [] })
    if (path === '/api/users/me' && request.method() === 'DELETE') {
      requests.push(request.postDataJSON())
      await gate
      return responseStatus === 204 ? route.fulfill({ status: 204 }) : reply({ message: 'Password attuale non corretta' }, responseStatus)
    }
    return reply({ message: 'Endpoint inatteso' }, 404)
  })
  await page.goto(`${baseURL}/profile`)
  await page.getByRole('button', { name: 'Elimina il mio account', exact: true }).waitFor()
  return { context, page, requests, error: () => { responseStatus = 400 }, succeed: () => { responseStatus = 204 }, allowPlan: () => { failPlan = false }, hold: () => { gate = new Promise(resolve => { release = resolve }); return () => release() } }
}

test('eliminazione profilo mobile: annulla, conferma esplicita, password errata e cancellazione unica', async () => {
  const f = await fixture()
  try {
    await f.page.getByRole('button', { name: 'Elimina il mio account', exact: true }).click()
    const dialog = f.page.getByRole('dialog')
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).waitFor()
    assert.equal(f.requests.length, 0)
    await dialog.getByRole('button', { name: 'Annulla', exact: true }).click()
    assert.equal(await dialog.count(), 0)
    await f.page.getByRole('button', { name: 'Elimina il mio account', exact: true }).click()
    const confirm = dialog.getByRole('button', { name: 'Elimina definitivamente', exact: true })
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).fill('wrong')
    assert.equal(await confirm.isDisabled(), true)
    await dialog.getByRole('checkbox').check()
    f.error()
    await confirm.click()
    await dialog.getByRole('alert').filter({ hasText: 'Password attuale non corretta' }).waitFor()
    assert.equal(await f.page.evaluate(() => localStorage.getItem('token')), 'deletion-test-token')
    assert.equal(await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).inputValue(), '')
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    f.succeed()
    const release = f.hold()
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).fill('Original1!')
    await confirm.click()
    await dialog.getByRole('button', { name: 'Eliminazione in corso…', exact: true }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: 'Annulla', exact: true }).isDisabled(), true)
    assert.equal(await dialog.getByRole('button', { name: 'Chiudi modale', exact: true }).isDisabled(), true)
    release()
    await f.page.waitForURL('**/login?accountDeleted=1')
    await f.page.getByRole('status').filter({ hasText: 'Il tuo account è stato eliminato' }).waitFor()
    assert.equal(await f.page.evaluate(() => localStorage.getItem('token')), null)
    assert.equal(f.requests.length, 2)
    assert.deepEqual(f.requests[1], { currentPassword: 'Original1!', confirmed: true })
  } finally { await f.context.close() }
})

test('eliminazione Master: trasferimento richiesto e inviato insieme alla conferma', async () => {
  const f = await fixture({ master: true })
  try {
    await f.page.getByRole('button', { name: 'Elimina il mio account', exact: true }).click()
    const dialog = f.page.getByRole('dialog')
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).fill('Original1!')
    await dialog.getByRole('checkbox').check()
    const confirm = dialog.getByRole('button', { name: 'Elimina definitivamente', exact: true })
    assert.equal(await confirm.isDisabled(), true)
    await dialog.getByLabel('Master a cui trasferire i contenuti', { exact: true }).selectOption('30')
    await confirm.click()
    await f.page.waitForURL('**/login?accountDeleted=1')
    assert.deepEqual(f.requests, [{ currentPassword: 'Original1!', confirmed: true, successorMasterId: 30 }])
  } finally { await f.context.close() }
})

test('unico Master con contenuti: cancellazione bloccata e spiegazione per promuovere un altro utente', async () => {
  const f = await fixture({ master: true, noSuccessor: true })
  try {
    await f.page.getByRole('button', { name: 'Elimina il mio account', exact: true }).click()
    const dialog = f.page.getByRole('dialog')
    await dialog.getByText('Non ci sono altri Master disponibili.', { exact: false }).waitFor()
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).fill('Original1!')
    await dialog.getByRole('checkbox').check()
    assert.equal(await dialog.getByRole('button', { name: 'Elimina definitivamente', exact: true }).isDisabled(), true)
    assert.equal(f.requests.length, 0)
  } finally { await f.context.close() }
})

test('errore di verifica dei dati: nessuna cancellazione e possibilità di riprovare', async () => {
  const f = await fixture({ planError: true })
  try {
    await f.page.getByRole('button', { name: 'Elimina il mio account', exact: true }).click()
    const dialog = f.page.getByRole('dialog')
    await dialog.getByRole('alert').waitFor()
    assert.equal(await dialog.getByRole('button', { name: 'Elimina definitivamente', exact: true }).count(), 0)
    f.allowPlan()
    await dialog.getByRole('button', { name: 'Riprova', exact: true }).click()
    await dialog.getByLabel('Password attuale per eliminare l’account', { exact: true }).waitFor()
    assert.equal(f.requests.length, 0)
  } finally { await f.context.close() }
})
