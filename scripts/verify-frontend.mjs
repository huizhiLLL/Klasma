import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
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
 const { catalog } = await vite.ssrLoadModule('/src/app/data/catalog.ts')
 const { projects } = await vite.ssrLoadModule('/src/app/features/projects/registry.ts')
 render(HomePage,{},'Klasma')
 for (const tool of catalog.tools()) {
  const html = render(ToolsPage,{ slug:tool.slug,search:'' },tool.name)
  if (tool.slug === 'pocket') {
   assert.ok(html.includes('上一张截图') && html.includes('下一张截图'))
   assert.ok(!html.includes('媒体缩略图轮播'))
  }
 }
 render(LibraryPage,{ search:'' },'工程资产分类')
 for (const category of catalog.categories()) {
  render(LibraryPage,{ category:category.slug,search:'' },category.name)
  for (const asset of catalog.assets(category.slug)) {
   render(LibraryPage,{ category:category.slug,slug:asset.slug,search:'' },asset.title)
   if (asset.attachment) await access(`public${asset.attachment.href}`)
  }
 }
 for (const project of projects) {
  render(ProjectsPage,{ slug:project.slug,search:'' },project.name)
  const page = await project.load()
  render(page.default,{},'示例')
 }
 for (const Component of [ToolsPage,LibraryPage,ProjectsPage]) {
  for (const [state,text] of [['empty','这里还没有'],['error','暂时没能读取'],['loading','正在打开']]) render(Component,{ search:`?preview=${state}` },text)
  render(Component,{ slug:'does-not-exist',category:'does-not-exist',search:'' },'没有找到')
 }
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
