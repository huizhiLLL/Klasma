import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catalog } from '../src/app/data/catalog.ts'
import { previewState } from '../src/app/data/model.ts'

test('every asset belongs to a category and slug lookups never cross categories', () => {
 const slugs = new Set<string>()
 for (const category of catalog.categories()) {
  for (const asset of catalog.assets(category.slug)) {
   assert.ok(!slugs.has(asset.slug)); slugs.add(asset.slug)
   assert.equal(catalog.asset(category.slug,asset.slug),asset)
   assert.equal(catalog.asset('missing',asset.slug),undefined)
   assert.ok(asset.position.x >= 0 && asset.position.x <= 65)
   assert.ok(asset.position.y >= 0 && asset.position.y <= 70)
  }
 }
 assert.ok(slugs.size >= 8)
})
test('preview fixtures cover long and short prose, absent and multiple media, and empty categories', () => {
 const tools = catalog.tools()
 assert.ok(tools.some(item => item.article.length > 600))
 assert.ok(tools.some(item => item.article.length < 180))
 assert.ok(tools.some(item => item.media.length === 0))
 assert.ok(tools.some(item => item.media.length >= 3))
 assert.ok(catalog.categories().some(item => catalog.assets(item.slug).length === 0))
 assert.equal(catalog.tool('unknown'),undefined)
})
test('only explicit preview states override complete content', () => {
 for (const state of ['empty','error','loading']) assert.equal(previewState(`?preview=${state}`),state)
 assert.equal(previewState('?preview=anything'),'ready')
})
