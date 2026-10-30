import assert from 'node:assert/strict'
import test from 'node:test'
import { point, sectors, sectorPath, returnDirection } from '../src/app/features/library/geometry.ts'
import { categories } from '../src/app/data/fixtures.ts'
test('category sectors cover the full circle exactly once and match their scene direction', () => {
 const ordered = [...sectors].sort((a,b) => a[0] - b[0])
 assert.equal(ordered[0][0],0)
 assert.equal(ordered.at(-1)![1],360)
 ordered.slice(1).forEach((sector,index) => assert.equal(sector[0],ordered[index][1]))
 categories.forEach((category,index) => {
  const [start,end] = sectors[index]
  const center = point((start + end) / 2,100)
  if (category.direction.includes('w')) assert.ok(center.x < 250)
  if (category.direction.includes('e')) assert.ok(center.x > 250)
  if (category.direction.includes('n')) assert.ok(center.y < 250)
  if (category.direction.includes('s')) assert.ok(center.y > 250)
  assert.ok(!sectorPath(start,end).includes('NaN'))
 })
})

test('scene return direction reverses the entry sector across the global center', () => {
 assert.equal(returnDirection('ne'),'sw')
 assert.equal(returnDirection('nw'),'se')
 assert.equal(returnDirection('se'),'nw')
 assert.equal(returnDirection('sw'),'ne')
 assert.equal(returnDirection('w'),'e')
})
