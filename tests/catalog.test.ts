import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalog, categories } from '../src/app/data/catalog.ts'
import type { Resource } from '../src/shared/resource.ts'
const resource = (overrides:Partial<Resource> = {}):Resource => ({ id:'test',type:'tools',slug:'real-tool',title:'真实软件',summary:'摘要',content:'正文',status:'published',metadata:{ order:0 },createdAt:'2026-10-30T00:00:00Z',updatedAt:'2026-10-30T00:00:00Z',links:[],tags:[],assets:[],...overrides })
test('catalog uses only published API records and has no sample fallback',() => {
 const empty = createCatalog([])
 assert.equal(empty.tools().length,0)
 assert.equal(empty.assets('sfm').length,0)
 assert.equal(createCatalog([resource({ status:'draft' })]).tools().length,0)
 const data = createCatalog([resource({ metadata:{ order:2 } }),resource({ id:'first',slug:'first',metadata:{ order:1 } })])
 assert.equal(data.tools()[0].slug,'first')
 assert.equal(data.tool('real-tool')?.article,'正文')
 assert.equal(data.tool('missing'),undefined)
})
test('media, links, attachments and category lookups preserve real API data',() => {
 const image = { id:'image',kind:'cover' as const,filename:'cover.png',storageType:'r2' as const,location:'key',mimeType:'image/png',size:10,metadata:{ width:400,height:800 },url:'/api/assets/image' }
 const catalog = createCatalog([resource({ assets:[image] }),resource({ id:'asset',type:'library',slug:'real-asset',metadata:{ category:'sfm',code:'hello' },assets:[image,{ ...image,id:'file',kind:'attachment',filename:'test.sfm',url:'/api/assets/file' }] })])
 assert.equal(catalog.tools()[0].media[0].src,'/api/assets/image')
 assert.equal(catalog.tools()[0].media[0].height,800)
 assert.equal(catalog.asset('sfm','real-asset')?.cover,'/api/assets/image')
 assert.equal(catalog.asset('sfm','real-asset')?.attachments?.[0].filename,'test.sfm')
 assert.equal(catalog.asset('missing','real-asset'),undefined)
 assert.equal(categories.length,5)
})
test('large scenes allocate separate rows rather than overlapping all entries',() => {
 const rows = Array.from({ length:20 },(_,i) => resource({ type:'library',id:String(i),slug:`asset-${i}`,metadata:{ category:'sfm',order:i } }))
 const catalog = createCatalog(rows)
 assert.equal(new Set(catalog.assets('sfm').map(item => `${item.position.x},${item.position.y}`)).size,20)
})
