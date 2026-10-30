import test from 'node:test'
import assert from 'node:assert/strict'
import { collectionPose } from '../src/app/animations/collectionTransition.ts'

const collections = ['tools','projects','library'] as const
test('all six collection directions use matching depth on entry and reverse exit', () => {
 for (const from of collections) for (const to of collections) {
  if (from === to) continue
  const entry = collectionPose(to,from,true,true)
  const reverseExit = collectionPose(to,from,false,true)
  assert.equal(entry.opacity,0)
  assert.equal(entry.scale,reverseExit.scale)
  if (from === 'library' || to === 'library') {
   assert.ok(entry.scale < 1)
   assert.equal(entry.y,reverseExit.y)
  } else {
   assert.equal(entry.scale,1)
   assert.equal(entry.y,-reverseExit.y)
  }
 }
})
test('keyboard and reduced motion reveal the destination without displacement or scale', () => {
 for (const from of collections) for (const to of collections) {
  assert.deepEqual(collectionPose(to,from,true,false),{ opacity:1,scale:1,y:0 })
  assert.deepEqual(collectionPose(from,to,false,false),{ opacity:0,scale:1,y:0 })
 }
})
