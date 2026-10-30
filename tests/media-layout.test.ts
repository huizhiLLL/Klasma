import test from 'node:test'
import assert from 'node:assert/strict'
import { tools } from '../src/app/data/fixtures.ts'
import { mediaColumnWidth } from '../src/app/features/tools/mediaLayout.ts'

test('portrait sequences use the widest fitted image and release remaining width to prose', () => {
 const portrait = tools.find(tool => tool.slug === 'pocket')!.media
 const landscape = tools.find(tool => tool.slug === 'mole')!.media
 const narrow = mediaColumnWidth(portrait,1000,600,66,48)!
 assert.equal(narrow,(600 - 66 - 16) * .5)
 assert.ok(narrow < mediaColumnWidth(landscape,1000,600,66,48)!)
 assert.equal(narrow,mediaColumnWidth([...portrait].reverse(),1000,600,66,48))
 assert.ok(narrow > mediaColumnWidth([portrait[0]],1000,600,66,48)!)
})

test('media fitting preserves a readable story column and handles absent media', () => {
 const media = tools[0].media
 assert.equal(mediaColumnWidth(media,700,900,66,24),700 - 24 - 280)
 assert.equal(mediaColumnWidth(media,1000,20,66,48),0)
 assert.equal(mediaColumnWidth([],1000,600,0,48),undefined)
 for (const tool of tools) for (const item of tool.media) assert.ok(item.width > 0 && item.height > 0)
})
