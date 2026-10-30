import test from 'node:test'
import assert from 'node:assert/strict'
import { nearestWheelPosition, wheelPose } from '../src/app/animations/wordWheel.ts'
test('wheel retargets from fractional progress along the nearest cycle without a full spin', () => {
 for (const current of [-3.2,-.4,0,.3,.8,1.7,4.2]) for (const selected of [0,1,2]) {
  const next = nearestWheelPosition(current,selected)
  assert.ok(Math.abs(next - current) <= 1.5)
  assert.equal(((next % 3) + 3) % 3,selected)
 }
})
test('the same three words continuously change position and scale with a single active face', () => {
 for (const selected of [0,1,2]) {
  assert.equal(wheelPose(selected,selected).scale,1)
  assert.equal(wheelPose(selected,selected).y,0)
  for (const index of [0,1,2]) {
   const before = wheelPose(selected - .00001,index), after = wheelPose(selected + .00001,index)
   assert.ok(Math.abs(before.y - after.y) < .0001)
   assert.ok(Math.abs(before.scale - after.scale) < .0001)
  }
 }
 assert.ok(wheelPose(.5,0).scale < 1 && wheelPose(.5,0).scale > .18)
})
