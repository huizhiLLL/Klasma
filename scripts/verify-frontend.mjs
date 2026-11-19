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
 const { categories, createCatalog, staticCatalog } = await vite.ssrLoadModule('/src/app/data/catalog.ts')
 const { AdminPage } = await vite.ssrLoadModule('/src/admin/AdminPage.tsx')
 render(HomePage,{},'Klasma')
 render(AdminPage,{ onBack() {} },'正在检查登录状态')
 const mole = staticCatalog.tool('mole')
 const html = render(ToolsPage,{ slug:'mole',search:'' },'Mole')
 assert.ok(html.includes(mole.icon) && html.includes(mole.media[0].src))
 assert.ok(html.includes('媒体缩略图轮播'))
 const portraitTool = { ...mole,media:mole.media.map(image => ({ ...image,width:390,height:844 })) }
 const portraitHtml = render(ToolsPage,{ slug:'mole',search:'',catalog:createCatalog([portraitTool],[]) },'Mole')
 assert.ok(portraitHtml.includes('上一张截图') && portraitHtml.includes('下一张截图'))
 assert.ok(!portraitHtml.includes('媒体缩略图轮播'))
 for (const path of [mole.icon,...mole.media.map(image => image.src)]) {
  const bytes = await readFile(`public${path}`)
  if (path.endsWith('.png')) assert.equal(bytes.subarray(1,4).toString(),'PNG')
  else assert.equal(bytes.subarray(8,12).toString(),'WEBP')
 }
 render(LibraryPage,{ search:'' },'工程资产分类')
 for (const category of categories) {
  render(LibraryPage,{ category:category.slug,search:'' },'这里还没有工程资产')
  const asset = { category:category.slug,slug:'render-asset',title:'渲染检查资产',subtitle:'简短说明',kind:'code',description:'静态正文',code:'test code',notes:'',tags:[],footprint:'',version:'',attachments:[{filename:'workspace-example.txt',href:'/samples/workspace-example.txt'}] }
  render(LibraryPage,{ category:category.slug,slug:asset.slug,search:'',catalog:createCatalog([],[asset]) },asset.title)
 }
 render(ProjectsPage,{ search:'' },'这里还没有作品')
 render(ProjectsPage,{ slug:'does-not-exist',search:'' },'没有找到')
 render(ToolsPage,{ slug:'does-not-exist',search:'' },'没有找到')
 render(LibraryPage,{ category:'does-not-exist',search:'' },'没有找到')
 render(ToolsPage,{ search:'',catalog:createCatalog([],[]) },'这里还没有软件')
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
