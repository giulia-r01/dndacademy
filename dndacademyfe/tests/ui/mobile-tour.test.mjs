import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseURL=process.env.UI_BASE_URL??'http://localhost:3000'
let browser
before(async()=>{browser=await chromium.launch({headless:true,...(process.env.UI_BROWSER_PATH?{executablePath:process.env.UI_BROWSER_PATH}:{})})})
after(async()=>{await browser?.close()})
async function setup({master=false,viewport={width:390,height:844}}={}){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true})
  await context.addInitScript(()=>localStorage.setItem('token','mobile-tour-fixture'))
  const page=await context.newPage(),writes=[],errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname
    if(request.method()==='OPTIONS')return route.fulfill({status:204})
    if(request.method()!=='GET')writes.push(path)
    const body=path==='/api/users/me'?{id:1,username:'tester',email:'tester@example.test',role:master?'MASTER':'PLAYER',learningLevel:'BEGINNER',avatarUrl:null}:path==='/api/combat/history'?{items:[],totalPages:0,totalElements:0,page:0,size:12}:[]
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)})
  })
  return {context,page,writes,errors}
}
const modal=page=>page.locator('[data-tour-mobile]')
async function visibleFrame(page){
  await page.waitForFunction(()=>{
    const dialog=document.querySelector('[data-tour-mobile]')
    if(!dialog)return false
    const r=dialog.getBoundingClientRect()
    const visible=[...dialog.querySelectorAll('header button,footer button')].every(b=>{const rect=b.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight})
    return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth&&visible
  })
}
for(const master of [false,true])test(`modale mobile completa: avanti, indietro, stessa pagina e nessuna scrittura, master=${master}`,async()=>{
  const f=await setup({master})
  const origin=master?'/admin?from=mobile-tour':'/dashboard?from=mobile-tour'
  const steps=master?['campaign','characters','learning','resources','chapters','users','player','finish']:['campaign','character','lesson','quiz','combat','reward','history','profile','finish']
  try{
    await f.page.goto(`${baseURL}${origin}`)
    await modal(f.page).waitFor()
    assert.equal(await f.page.locator('[data-tour-shade],[data-tour-step]').count(),0)
    assert.equal(await modal(f.page).getByRole('button',{name:'Indietro',exact:true}).isDisabled(),true)
    await modal(f.page).getByRole('button',{name:'Avanti',exact:true}).click()
    await modal(f.page).getByRole('button',{name:'Indietro',exact:true}).click()
    for(const [index,id]of steps.entries()){
      assert.equal(await modal(f.page).getAttribute('data-tour-mobile'),id)
      assert.equal(await modal(f.page).getByRole('progressbar').getAttribute('value'),String(index+1))
      await visibleFrame(f.page)
      assert.equal(new URL(f.page.url()).pathname+new URL(f.page.url()).search,origin)
      await modal(f.page).getByText('Esempio · Nessuna modifica ai dati reali',{exact:true}).waitFor()
      await modal(f.page).getByRole('button',{name:index===steps.length-1?'Termina tour':'Avanti',exact:true}).click()
    }
    await modal(f.page).waitFor({state:'detached'})
    assert.equal(await f.page.evaluate(()=>document.body.style.overflow),'')
    assert.equal(await f.page.locator('[inert]').count(),0)
    const role=master?'MASTER':'PLAYER',audience=master?'master':'player'
    assert.deepEqual(await f.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),`dndacademy:tour:v2:1:${role}:${audience}`),{version:2,status:'completed'})
    assert.deepEqual(f.writes,[]);assert.deepEqual(f.errors,[])
  }finally{await f.context.close()}
})

test('mobile: uscita e riapertura dal profilo senza perdere URL o dati non salvati',async()=>{
  const f=await setup()
  try{
    await f.page.goto(`${baseURL}/profile?from=mobile#dati`)
    await modal(f.page).getByRole('button',{name:'Esci dal tour',exact:true}).click()
    await f.page.getByLabel('Username',{exact:true}).fill('bozza_non_salvata')
    await f.page.getByRole('button',{name:'Apri menu account',exact:true}).click()
    await f.page.getByRole('menuitem',{name:'Ripeti il tour',exact:true}).click()
    await modal(f.page).waitFor()
    for(let i=0;i<4;i++)await f.page.keyboard.press('Tab')
    assert.equal(await f.page.evaluate(()=>!!document.activeElement.closest('[data-tour-mobile]')),true)
    await f.page.keyboard.press('Escape')
    await modal(f.page).waitFor({state:'detached'})
    assert.equal(await f.page.getByLabel('Username',{exact:true}).inputValue(),'bozza_non_salvata')
    assert.equal(new URL(f.page.url()).pathname+new URL(f.page.url()).search+new URL(f.page.url()).hash,'/profile?from=mobile#dati')
    assert.equal(await f.page.locator('[inert]').count(),0)
    await f.page.reload()
    await f.page.getByLabel('Username',{exact:true}).waitFor()
    assert.equal(await modal(f.page).count(),0)
    assert.deepEqual(f.writes,[]);assert.deepEqual(f.errors,[])
  }finally{await f.context.close()}
})

test('telefono orizzontale e schermo piccolo: una sola modale, controlli sempre visibili',async()=>{
  const f=await setup({master:true,viewport:{width:844,height:390}})
  try{
    await f.page.goto(`${baseURL}/admin`)
    await modal(f.page).waitFor()
    await visibleFrame(f.page)
    await modal(f.page).getByRole('button',{name:'Avanti',exact:true}).click()
    await f.page.setViewportSize({width:320,height:568})
    await visibleFrame(f.page)
    assert.equal(await modal(f.page).getAttribute('data-tour-mobile'),'characters')
    assert.equal(new URL(f.page.url()).pathname,'/admin')
    assert.equal(await f.page.locator('[data-tour-shade]').count(),0)
    if(process.env.UI_SCREENSHOT_DIR){
      await mkdir(process.env.UI_SCREENSHOT_DIR,{recursive:true})
      await f.page.screenshot({path:`${process.env.UI_SCREENSHOT_DIR}/mobile-tour-master-small.png`})
    }
    assert.deepEqual(f.errors,[])
  }finally{await f.context.close()}
})

test('mobile: scadenza sessione chiude la guida e ripristina la pagina di login',async()=>{
  const f=await setup()
  try{
    await f.page.goto(`${baseURL}/dashboard`)
    await modal(f.page).waitFor()
    await f.page.evaluate(()=>window.dispatchEvent(new Event('session-expired')))
    await f.page.waitForURL('**/login')
    assert.equal(await modal(f.page).count(),0)
    assert.equal(await f.page.locator('[inert]').count(),0)
    assert.equal(await f.page.evaluate(()=>document.body.style.overflow),'')
    await f.page.getByRole('button',{name:'Accedi',exact:true}).waitFor()
    assert.deepEqual(f.errors,[])
  }finally{await f.context.close()}
})

for(const viewport of [{width:768,height:1024},{width:1024,height:480}])test(`tablet touch ${viewport.width}x${viewport.height} mantiene il percorso guidato`,async()=>{
  const f=await setup({viewport})
  try{
    await f.page.goto(`${baseURL}/dashboard`)
    await f.page.locator('[data-tour-step="start"]').waitFor()
    await f.page.waitForURL('**/tour/player/home')
    assert.equal(await modal(f.page).count(),0)
    const guide=f.page.locator('[data-tour-step="start"]')
    await guide.getByRole('button',{name:'Esci dal tour',exact:true}).click()
    await f.page.waitForURL('**/dashboard')
    assert.equal(await f.page.locator('[inert]').count(),0)
    assert.deepEqual(f.errors,[])
  }finally{await f.context.close()}
})
