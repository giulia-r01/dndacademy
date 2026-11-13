import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { validateApiOrigin } from "../../config/api-origin.mjs"

for (const origin of ['http://localhost:8081', 'http://localhost:8080', 'http://127.0.0.1:8081', 'http://[::1]:8081', 'https://backend.example.com']) {
  test(`origine locale valida: ${origin}`, () => {
    assert.equal(validateApiOrigin(origin), origin)
  })
}

for (const origin of [undefined, '', ' ', 'backend.example.com', '/api', 'ftp://backend.example.com', 'http://backend.example.com', 'https://backend.example.com/', 'https://backend.example.com/api', 'https://backend.example.com?key=value', 'https://backend.example.com#section', 'https://user:password@backend.example.com', ' https://backend.example.com', 'https://backend.example.com\\api', 'https://backend.example.com:99999']) {
  test(`configurazione rifiutata: ${String(origin)}`, () => {
    assert.throws(() => validateApiOrigin(origin), /NEXT_PUBLIC_API_URL/)
  })
}

for (const origin of ['http://localhost:8081', 'https://localhost:8081', 'http://127.0.0.1:8081', 'https://127.0.0.1:8081', 'http://[::1]:8081', 'https://[::1]:8081', 'http://backend.example.com']) {
  test(`Vercel rifiuta il backend locale o HTTP: ${origin}`, () => {
    assert.throws(() => validateApiOrigin(origin, true), /NEXT_PUBLIC_API_URL/)
  })
}

test('Vercel accetta il backend HTTPS anche per un deploy di preview', () => {
  const origin = 'https://backend-collaudo.up.railway.app'
  assert.equal(validateApiOrigin(origin, true), origin)
})

for (const [value, vercel, expected] of [
  ['', '0', /Configurare NEXT_PUBLIC_API_URL/],
  ['https://backend.example.com/api', '0', /senza credenziali, percorsi/],
  ['http://localhost:8081', '1', /Su Vercel NEXT_PUBLIC_API_URL/],
]) {
  test(`next build interrompe la compilazione con configurazione errata (${vercel}, ${value})`, () => {
    const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      env: { ...process.env, NEXT_PUBLIC_API_URL: value, VERCEL: vercel },
      encoding: 'utf8',
      timeout: 30000,
    })
    assert.ifError(result.error)
    assert.equal(result.status, 1)
    assert.match(result.stdout + result.stderr, expected)
    assert.doesNotMatch(result.stdout + result.stderr, /Creating an optimized production build/)
  })
}
