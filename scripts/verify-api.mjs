import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { once } from 'node:events'
const root = process.cwd()
await mkdir(path.join(root,'.wrangler'),{ recursive:true })
const temp = await mkdtemp(path.join(root,'.wrangler','api-check-'))
const config = JSON.parse((await readFile('wrangler.jsonc','utf8')))
config.main = path.join(root,config.main)
config.assets.directory = path.join(root,config.assets.directory)
config.d1_databases[0].migrations_dir = path.join(root,'drizzle/migrations')
config.vars = { APP_ENV:'test',ADMIN_KEY:'integration-test-only-key' }
delete config.routes
const configPath = path.join(temp,'wrangler.json')
await writeFile(configPath,JSON.stringify(config))
const cli = path.join(root,'node_modules/wrangler/bin/wrangler.js')
const persistence = path.join(temp,'state')
let worker, output = ''
let checks = 0
try {
 execFileSync(process.execPath,[cli,'d1','migrations','apply','klasma-db','--local','--config',configPath,'--persist-to',persistence],{ stdio:'pipe' })
 worker = spawn(process.execPath,[cli,'dev','--local','--port','8791','--config',configPath,'--persist-to',persistence],{ stdio:['ignore','pipe','pipe'],windowsHide:true })
 worker.stdout.on('data',chunk => { output += chunk })
 worker.stderr.on('data',chunk => { output += chunk })
 const base = 'http://127.0.0.1:8791'
 for (let attempt = 0;;attempt++) {
  try { if ((await fetch(`${base}/api/health`)).ok) break } catch {}
  if (attempt > 120 || worker.exitCode !== null) throw new Error(`Worker failed to start: ${output}`)
  await new Promise(resolve => setTimeout(resolve,250))
 }
 let cookie = ''
 async function request(url,method = 'GET',body,expected = 200,auth = true,extra = {}) {
  const response = await fetch(base + url,{ method,headers:{ ...(body instanceof FormData ? {} : { 'Content-Type':'application/json' }),...(auth && cookie ? { Cookie:cookie } : {}),...extra },body:body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),redirect:'manual' })
  if (response.status !== expected) await new Promise(resolve => setTimeout(resolve,300))
  assert.equal(response.status,expected,`${method} ${url}: ${response.status} ${await response.clone().text()}`); checks++
  return response
 }
 assert.equal((await (await request('/api/admin/session')).json()).authenticated,false)
 await request('/api/admin/resources','GET',undefined,401)
 await request('/api/admin/session','POST',{ key:'wrong' },401)
 const login = await request('/api/admin/session','POST',{ key:'integration-test-only-key' })
 const header = login.headers.get('set-cookie')
 assert.match(header,/HttpOnly/i); assert.match(header,/SameSite=Strict/i); assert.match(header,/Max-Age=2592000/i)
 cookie = header.split(';')[0]
 assert.equal((await (await request('/api/admin/session')).json()).authenticated,true)
 await request('/api/admin/resources','POST',{},403,true,{ Origin:'https://attacker.invalid' })
 await request('/api/admin/resources','POST',{},400)
 const input = { type:'tools',slug:'integration-tool',title:'测试软件',summary:'说明',content:'正文',metadata:{ platform:'Windows',order:3 },status:'draft',links:[{ kind:'website',url:'https://example.com/',label:'官网' }],tagSlugs:['Tag','Tag','测试'] }
 let tool = (await (await request('/api/admin/resources','POST',input,201)).json()).data
 assert.equal(tool.tags.length,2)
 await request('/api/admin/resources','POST',input,409)
 await request(`/api/admin/resources/${tool.id}`,'PUT',{ ...input,status:'published' },400)
 const form = new FormData();form.set('resourceId',tool.id);form.set('kind','icon');form.set('file',new File([Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXl8AAAAASUVORK5CYII=','base64'))],'icon.png',{ type:'image/png' }));form.set('metadata',JSON.stringify({ width:1,height:1,order:0,label:'图标' }))
 tool = (await (await request('/api/admin/assets','POST',form,201)).json()).data
 const icon = tool.assets[0]
 await request(icon.url,'GET',undefined,404,false)
 await request(icon.url)
 await request('/api/resources/integration-tool','GET',undefined,404,false)
 assert.equal((await (await request('/api/resources?type=tools','GET',undefined,200,false)).json()).data.length,0)
 tool = (await (await request(`/api/admin/resources/${tool.id}`,'PUT',{ ...input,status:'published' })).json()).data
 assert.equal(tool.metadata.platform,'Windows')
 assert.equal((await (await request('/api/resources?type=tools','GET',undefined,200,false)).json()).data[0].assets[0].url,icon.url)
 await request(icon.url,'GET',undefined,200,false)
 await request(`/api/admin/assets/${icon.id}`,'DELETE',{},409)
 await request(`/api/admin/assets/${icon.id}`,'PUT',{ label:'新图标',order:2 })
 await request('/api/admin/assets/external','POST',{ resourceId:tool.id,kind:'screenshot',url:'javascript:alert(1)',label:'bad',metadata:{ width:1,height:1,order:0 } },400)
 await request('/api/admin/assets/external','POST',{ resourceId:tool.id,kind:'screenshot',url:'https://example.com/screenshot.png',label:'截图',metadata:{ width:1280,height:800,order:1 } },201)
 const libraryInput = { ...input,type:'library',slug:'integration-asset',title:'测试资产',metadata:{ category:'sfm',code:'EVERY 20 TICKS DO\nEND',assetKind:'code',order:0 },status:'published' }
 let asset = (await (await request('/api/admin/resources','POST',libraryInput,201)).json()).data
 const file = new FormData();file.set('resourceId',asset.id);file.set('kind','attachment');file.set('file',new File(['<script>alert(1)</script>'],'payload.html',{ type:'text/html' }))
 asset = (await (await request('/api/admin/assets','POST',file,201)).json()).data
 const attachment = await request(asset.assets[0].url,'GET',undefined,200,false)
 assert.match(attachment.headers.get('content-type'),/octet-stream/)
 assert.match(attachment.headers.get('content-disposition'),/attachment/)
 const publicAsset = (await (await request('/api/resources/integration-asset','GET',undefined,200,false)).json()).data
 assert.equal(publicAsset.metadata.code,libraryInput.metadata.code)
 assert.equal(publicAsset.assets.length,1)
 await request(`/api/admin/resources/${asset.id}`,'PUT',{ ...libraryInput,status:'draft' })
 await request(asset.assets[0].url,'GET',undefined,404,false)
 await request(`/api/admin/resources/${asset.id}`,'DELETE',{},204)
 await request(`/api/admin/resources/${tool.id}`,'PUT',{ ...input,status:'draft' })
 await request(icon.url,'GET',undefined,404,false)
 await request(`/api/admin/resources/${tool.id}`,'DELETE',{},204)
 await request(icon.url,'GET',undefined,404,true)
 // Race publication against removal of the only icon; one side must fail safely.
 const raceInput = { ...input,slug:'publication-race' }
 let race = (await (await request('/api/admin/resources','POST',raceInput,201)).json()).data
 form.set('resourceId',race.id)
 race = (await (await request('/api/admin/assets','POST',form,201)).json()).data
 const raceResults = await Promise.all([
  fetch(base + `/api/admin/resources/${race.id}`,{ method:'PUT',headers:{ 'Content-Type':'application/json',Cookie:cookie },body:JSON.stringify({ ...raceInput,status:'published' }) }),
  fetch(base + `/api/admin/assets/${race.assets[0].id}`,{ method:'DELETE',headers:{ 'Content-Type':'application/json',Cookie:cookie },body:'{}' }),
 ])
 assert.ok(raceResults.every(response => [200,204,409].includes(response.status)))
 const raced = (await (await request('/api/admin/resources')).json()).data.find(item => item.id === race.id)
 assert.ok(raced.status === 'draft' || raced.assets.some(asset => asset.kind === 'icon'))
 await request(`/api/admin/resources/${race.id}`,'DELETE',{},204)
 await request('/api/admin/resources','GET',undefined,401,false,{ 'Cf-Access-Authenticated-User-Email':'forged@example.com','X-Admin-Key':'integration-test-only-key' })
 await request('/api/not-found','GET',undefined,404,false)
 await request('/api/admin/session','DELETE',{},204)
 cookie = 'klasma_session=tampered'
 await request('/api/admin/resources','GET',undefined,401)
 console.log(`API checks passed: ${checks} real Worker requests, isolated D1/R2, auth, CRUD, publication, media, tags and draft isolation.`)
} catch (error) { console.error(error); console.error(output); throw error }
finally {
 if (worker && worker.exitCode === null) {
  if (process.platform === 'win32') execFileSync('taskkill',['/pid',String(worker.pid),'/t','/f'],{ stdio:'ignore' })
  else { worker.kill('SIGTERM'); await once(worker,'exit') }
 }
 const resolved = path.resolve(temp)
 assert.ok(resolved.startsWith(path.join(root,'.wrangler','api-check-')))
 await rm(resolved,{ recursive:true,force:true,maxRetries:15,retryDelay:300 })
}
