import test from 'node:test'
import assert from 'node:assert/strict'
import { nearestWheelPosition, opticalInkBounds, wheelPose } from '../src/app/animations/wordWheel.ts'
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

test('optical bounds follow dense letter bodies rather than sparse ascender and descender tails', () => {
 const rows = Array.from({ length:100 },(_,row) => row >= 30 && row < 70 ? 100 : row >= 10 && row < 90 ? 1 : 0)
 const bounds = opticalInkBounds(rows,80,100)!
 assert.ok(bounds.ascent < .6 && bounds.ascent > .4)
 assert.ok(bounds.descent < 0)
 assert.equal(opticalInkBounds([0,0,0],2,100),undefined)
})

test('all selected words share optical gaps without moving their baselines or overlapping full ink', () => {
 const ink = [
  { left:0,ascent:.76,descent:.21,opticalAscent:.56,opticalDescent:.01 },
  { left:0,ascent:.75,descent:0,opticalAscent:.56,opticalDescent:-.03 },
  { left:0,ascent:.75,descent:.21,opticalAscent:.56,opticalDescent:.01 },
 ]
 const gaps:number[] = []
 for (const selected of [0,1,2]) {
  assert.ok(Math.abs(wheelPose(selected,selected,ink).y) < 1e-10)
  const above = (selected + 2) % 3, below = (selected + 1) % 3
  const upper = wheelPose(selected,above,ink), lower = wheelPose(selected,below,ink)
  gaps.push(-ink[selected].opticalAscent - upper.y - upper.scale * ink[above].opticalDescent)
  gaps.push(lower.y - lower.scale * ink[below].opticalAscent - ink[selected].opticalDescent)
  assert.ok(upper.y + upper.scale * ink[above].descent < -ink[selected].ascent)
  assert.ok(lower.y - lower.scale * ink[below].ascent > ink[selected].descent)
 }
 assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1e-10)
 for (let position = -1; position <= 3; position += .05) for (const index of [0,1,2]) {
  assert.ok(Math.abs(wheelPose(position - 1e-6,index,ink).y - wheelPose(position + 1e-6,index,ink).y) < .0001)
 }
})
