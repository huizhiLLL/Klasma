import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalog, categories, staticCatalog } from '../src/app/data/catalog.ts'
import type { LibraryEntry } from '../src/app/data/model.ts'

const entry:LibraryEntry = { slug:'real-asset',category:'sfm',title:'真实资产',subtitle:'摘要',kind:'code',description:'正文',notes:'',tags:[],code:'hello',footprint:'',version:'' }

test('build includes the published Mole record and no sample assets',() => {
 assert.deepEqual(staticCatalog.tools().map(tool => tool.slug),['mole'])
 const mole = staticCatalog.tool('mole')
 assert.equal(mole?.article,'- test')
 assert.equal(mole.links[0].url,'https://mole.fit/')
 assert.deepEqual(mole.media.map(image => image.id),['status-1980w.webp','clean-1980w.webp','uninstall-1980w.webp'])
 assert.equal(staticCatalog.tool('missing'),undefined)
 assert.equal(categories.length,5)
 for (const category of categories) assert.deepEqual(staticCatalog.assets(category.slug),[])
})

test('catalog keeps category lookups and source ordering',() => {
 const rows = Array.from({ length:20 },(_,i) => ({ ...entry,slug:`asset-${i}` }))
 const catalog = createCatalog([],rows)
 const assets = catalog.assets('sfm')
 assert.deepEqual(assets.map(asset => asset.slug),rows.map(row => row.slug))
 assert.equal(new Set(assets.map(item => `${item.position.x},${item.position.y}`)).size,20)
 assert.equal(catalog.asset('sfm','asset-0')?.code,'hello')
 assert.equal(catalog.asset('missing','asset-0'),undefined)
})
