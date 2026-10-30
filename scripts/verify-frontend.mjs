import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'

// 组件服务端渲染检查；不启动浏览器，也不替代视觉与交互验收。
const vite = await createServer({ server:{ middlewareMode:true }, appType:'custom' })
let renders = 0
function render(Component,props,expected) {
 const html = renderToString(React.createElement(Component,props))
 assert.ok(html.includes(expected),`Missing rendered content: ${expected}`)
 assert.ok(!html.includes('[object Object]'))
 renders++
 return html
}
try {
 const { default:App } = await vite.ssrLoadModule('/src/App.tsx')
 const { CollectionShell } = await vite.ssrLoadModule('/src/app/components/CollectionShell.tsx')
 const app = render(App,{},'Klasma')
 assert.ok(!app.includes('review-note'))
 for (const collection of ['tools','projects','library']) render(CollectionShell,{ collection,children:'collection content' },'What I')
 const { HomePage } = await vite.ssrLoadModule('/src/app/pages/HomePage.tsx')
 const { ToolsPage } = await vite.ssrLoadModule('/src/app/features/tools/ToolsPage.tsx')
 const { LibraryPage } = await vite.ssrLoadModule('/src/app/features/library/LibraryPage.tsx')
 const { ProjectsPage } = await vite.ssrLoadModule('/src/app/features/projects/ProjectsPage.tsx')
 const { CatalogContext } = await vite.ssrLoadModule('/src/app/data/useCatalog.ts')
 const { categories } = await vite.ssrLoadModule('/src/shared/resource.ts')
 const { AdminPage } = await vite.ssrLoadModule('/src/admin/AdminPage.tsx')
 render(HomePage,{},'Klasma')
 render(AdminPage,{ onBack() {} },'正在检查登录状态')
 function renderCatalog(Component,props,resources,expected,state = 'ready') {
  return render(() => React.createElement(CatalogContext.Provider,{ value:{ state,resources } },React.createElement(Component,props)),{},expected)
 }
 const base = { id:'render-check',type:'tools',slug:'render-tool',title:'渲染检查软件',summary:'简短说明',content:'真实 API 正文',status:'published',metadata:{ platform:'Windows' },createdAt:'2026-10-30T00:00:00Z',updatedAt:'2026-10-30T00:00:00Z',links:[],tags:[],assets:[] }
 const media = [0,1].map(index => ({ id:`image-${index}`,kind:'screenshot',filename:`image-${index}.png`,storageType:'r2',location:'test',mimeType:'image/png',size:10,metadata:{ width:390,height:844,order:index },url:`/api/assets/image-${index}` }))
 const html = renderCatalog(ToolsPage,{ slug:base.slug,search:'' },[{ ...base,assets:media }],base.title)
 assert.ok(html.includes('/api/assets/image-0'))
 assert.ok(html.includes('上一张截图') && html.includes('下一张截图'))
 assert.ok(!html.includes('媒体缩略图轮播'))
 renderCatalog(LibraryPage,{ search:'' },[],'工程资产分类')
 for (const category of categories) {
  const asset = { ...base,type:'library',slug:'render-asset',title:'渲染检查资产',metadata:{ category:category.slug,code:'test code' },assets:[{ ...media[0],kind:'attachment',filename:'code.sfm' }] }
  renderCatalog(LibraryPage,{ category:category.slug,slug:asset.slug,search:'' },[asset],asset.title)
 }
 render(ProjectsPage,{ search:'' },'这里还没有作品')
 render(ProjectsPage,{ slug:'does-not-exist',search:'' },'没有找到')
 for (const Component of [ToolsPage,LibraryPage]) {
  for (const [state,text] of [['error','暂时没能读取'],['loading','正在打开']]) renderCatalog(Component,{ search:'' },[],text,state)
  renderCatalog(Component,{ slug:'does-not-exist',category:'does-not-exist',search:'' },[],'没有找到')
 }
 renderCatalog(ToolsPage,{ search:'' },[],'这里还没有软件')
 // 直接检查 History 导航的查询变更、去重、replace 与滚动保留。
 const { navigate } = await vite.ssrLoadModule('/src/app/routing.ts')
 let location = new URL('https://klasma.local/tools/mole')
 let events = 0, scrolls = 0, pushes = 0, replaces = 0, external = ''
 globalThis.window = {
  location:{ get href() { return location.href }, get origin() { return location.origin }, get pathname() { return location.pathname }, get search() { return location.search }, get hash() { return location.hash }, assign(href) { external = href } },
  history:{ pushState(_state,_title,href) { pushes++; location = new URL(href,location) }, replaceState(_state,_title,href) { replaces++; location = new URL(href,location) } },
  dispatchEvent() { events++ },scrollTo() { scrolls++ },
 }
 try {
  navigate('/tools/mole?preview=empty')
  assert.equal(location.search,'?preview=empty')
  navigate('/tools/mole?preview=empty')
  assert.equal(pushes,1)
  navigate('/library/sfm',{ replace:true,preserveScroll:true })
  assert.equal(replaces,1)
  assert.equal(scrolls,1)
  assert.equal(events,2)
  navigate('https://example.com/')
  assert.equal(external,'https://example.com/')
 } finally { delete globalThis.window }
 const fonts = JSON.parse(await readFile('public/fonts/sources.json','utf8'))
 let verifiedFonts = 0
 for (const family of fonts) for (const file of family.files) {
  const bytes = await readFile(`public/fonts/${file.file}`)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256)
  verifiedFonts++
 }
 const sprite = await readFile('public/icons/lucide/sprite.svg','utf8')
 for (const name of ['house','arrow-left','x','arrow-up-right','rotate-ccw']) assert.ok(sprite.includes(`id="${name}"`),name)
 console.log(`Frontend checks passed: ${renders} renders, ${verifiedFonts} font manifest entries, icons and download files.`)
} finally {
 await vite.close()
}
