import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { skipAutomaticTour } from './helpers/tour.mjs'

const baseURL=process.env.UI_BASE_URL??'http://localhost:3000'
let browser
before(async()=>{browser=await chromium.launch({headless:true,...(process.env.UI_BROWSER_PATH?{executablePath:process.env.UI_BROWSER_PATH}:{})})})
after(async()=>{await browser?.close()})

async function fixture() {
  const context=await browser.newContext({viewport:{width:390,height:844}})
  await skipAutomaticTour(context)
  const page=await context.newPage()
  let count=0, release, fail=false, started
  const gate=new Promise(resolve=>{release=resolve})
  const requestStarted=new Promise(resolve=>{started=resolve})
  await page.route('**/auth/login',async route=>{
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204})
    count++;started()
    await gate
    if(fail)return route.fulfill({status:503,contentType:'text/html',body:'<html>upstream starting</html>'})
    return route.fulfill({contentType:'application/json',body:JSON.stringify({token:'connection-test-token'})})
  })
  await page.route('**/api/**',route=>{
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204})
    const body=new URL(route.request().url()).pathname==='/api/users/me'?{id:1,username:'alice',email:'alice@example.test',role:'PLAYER',learningLevel:'BEGINNER',avatarUrl:null}:[]
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)})
  })
  await page.goto(`${baseURL}/login`)
  await page.getByRole('textbox',{name:'Username',exact:true}).fill('alice')
  await page.getByLabel('Password',{exact:true}).fill('Original1!')
  return{context,page,release,requestStarted,count:()=>count,fail:()=>{fail=true}}
}

test('risposta lenta: avviso mobile, login in attesa e nessun reinvio della richiesta',async()=>{
  const f=await fixture()
  try{
    await f.page.getByRole('button',{name:'Accedi',exact:true}).click()
    await f.requestStarted
    await f.page.getByRole('status').filter({hasText:'Collegamento a D&D Academy in corso'}).waitFor()
    assert.equal(f.count(),1)
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    assert.equal(await f.page.locator('button[type="submit"]').isDisabled(),true)
    f.release()
    await f.page.waitForURL('**/dashboard')
    await f.page.getByRole('heading',{name:'Ciao, alice',exact:true}).waitFor()
    assert.equal(await f.page.getByRole('status').filter({hasText:'Collegamento a D&D Academy in corso'}).count(),0)
    assert.equal(f.count(),1)
  }finally{f.release();await f.context.close()}
})

test('errore HTML del proxy: messaggio italiano, richiesta non ripetuta e credenziali non accusate',async()=>{
  const f=await fixture()
  try{
    f.fail()
    await f.page.getByRole('button',{name:'Accedi',exact:true}).click()
    await f.requestStarted
    f.release()
    await f.page.getByRole('alert').filter({hasText:'Il server è temporaneamente non disponibile o si sta avviando'}).waitFor()
    assert.equal(f.count(),1)
    assert.equal(new URL(f.page.url()).pathname,'/login')
    assert.equal(await f.page.getByRole('button',{name:'Accedi',exact:true}).isEnabled(),true)
    assert.equal(await f.page.getByText('upstream starting',{exact:false}).count(),0)
  }finally{f.release();await f.context.close()}
})

test('scadenza della richiesta: errore recuperabile e nessun secondo invio del login',async()=>{
  const f=await fixture()
  try{
    await f.page.clock.install()
    await f.page.getByRole('button',{name:'Accedi',exact:true}).click()
    await f.requestStarted
    await f.page.clock.fastForward(120001)
    await f.page.getByRole('alert').filter({hasText:'Il server non ha risposto in tempo'}).waitFor()
    assert.equal(f.count(),1)
    assert.equal(await f.page.getByRole('button',{name:'Accedi',exact:true}).isEnabled(),true)
    assert.equal(await f.page.getByRole('textbox',{name:'Username',exact:true}).inputValue(),'alice')
    assert.equal(await f.page.getByRole('status').filter({hasText:'Collegamento a D&D Academy in corso'}).count(),0)
  }finally{f.release();await f.context.close()}
})
