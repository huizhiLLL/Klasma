import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { projects } from '../src/app/features/projects/registry.ts'
import { parseRoute } from '../src/app/routes.ts'
test('static project samples have unique identities, stable routes and real local downloads', () => {
 assert.ok(projects.length >= 3)
 assert.equal(new Set(projects.map(item => item.slug)).size,projects.length)
 assert.equal(new Set(projects.map(item => item.order)).size,projects.length)
 projects.forEach(project => {
  assert.deepEqual(parseRoute(`/projects/${project.slug}`),{ kind:'projects',slug:project.slug,search:'' })
  assert.equal(typeof project.load,'function')
  project.links.forEach(link => {
   if (link.download) assert.ok(existsSync(`public${link.url}`),link.url)
  })
 })
})
