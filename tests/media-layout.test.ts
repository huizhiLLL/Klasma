import test from 'node:test'
import assert from 'node:assert/strict'
import { tools } from '../src/app/data/fixtures.ts'
import { mediaColumnWidth, mediaThumbnailSize, usesPortraitMedia } from '../src/app/features/tools/mediaLayout.ts'

test('portrait sequences use the widest fitted image and release remaining width to prose', () => {
 const portrait = tools.find(tool => tool.slug === 'pocket')!.media
 const landscape = tools.find(tool => tool.slug === 'mole')!.media
 const narrow = mediaColumnWidth(portrait,1000,600,66,48)!
 assert.equal(narrow,600 * .5 + 112)
 assert.ok(narrow < mediaColumnWidth(landscape,1000,600,66,48)!)
 assert.equal(narrow,mediaColumnWidth([...portrait].reverse(),1000,600,66,48))
 assert.ok(narrow > mediaColumnWidth([portrait[0]],1000,600,66,48)!)
})

test('only all-portrait sequences use side controls, with full height and no strip reservation', () => {
 const portrait = tools.find(tool => tool.slug === 'pocket')!.media
 const landscape = tools.find(tool => tool.slug === 'mole')!.media
 assert.equal(usesPortraitMedia(portrait),true)
 assert.equal(usesPortraitMedia([]),false)
 assert.equal(usesPortraitMedia([...portrait,landscape[0]]),false)
 assert.equal(mediaColumnWidth(portrait,1000,600,0,48),mediaColumnWidth(portrait,1000,600,100,48))
 assert.equal(mediaColumnWidth([portrait[1]],1000,600,0,48),300)
})

test('thumbnail frames follow image proportions while retaining usable pointer targets', () => {
 for (const tool of tools) for (const media of tool.media) {
  const size = mediaThumbnailSize(media)
  assert.ok(Math.abs(size.width / size.height - media.width / media.height) < 1e-10)
  assert.ok(size.buttonWidth >= 44 && size.buttonHeight >= 44)
  assert.ok(size.buttonWidth >= size.width + 8 && size.buttonHeight >= size.height + 8)
 }
 const portrait = mediaThumbnailSize(tools.find(tool => tool.slug === 'pocket')!.media[0])
 const landscape = mediaThumbnailSize(tools[0].media[0])
 assert.ok(portrait.buttonWidth < landscape.buttonWidth)
})

test('media fitting preserves a readable story column and handles absent media', () => {
 const media = tools[0].media
 assert.equal(mediaColumnWidth(media,700,900,66,24),700 - 24 - 280)
 assert.equal(mediaColumnWidth(media,1000,20,66,48),0)
 assert.equal(mediaColumnWidth([],1000,600,0,48),undefined)
 for (const tool of tools) for (const item of tool.media) assert.ok(item.width > 0 && item.height > 0)
})
