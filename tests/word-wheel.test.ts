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

test('visible ink gaps stay equal with descenders and every settled word keeps its baseline', () => {
 const ink = [{ left:-.05,ascent:.76,descent:.21 },{ left:-.06,ascent:.76,descent:0 },{ left:-.05,ascent:.76,descent:.21 }]
 for (const selected of [0,1,2]) {
  assert.ok(Math.abs(wheelPose(selected,selected,ink).y) < 1e-10)
  const above = (selected + 2) % 3, below = (selected + 1) % 3
  const upper = wheelPose(selected,above,ink), lower = wheelPose(selected,below,ink)
  const topGap = -ink[selected].ascent - (upper.y + upper.scale * ink[above].descent)
  const bottomGap = lower.y - lower.scale * ink[below].ascent - ink[selected].descent
  assert.ok(topGap > 0)
  assert.ok(Math.abs(topGap - bottomGap) < 1e-10)
 }
 for (let position = -3; position <= 3; position += .05) for (const index of [0,1,2]) {
  assert.ok(Math.abs(wheelPose(position - 1e-6,index,ink).y - wheelPose(position + 1e-6,index,ink).y) < .0001)
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
