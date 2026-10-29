import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalPath, parseRoute } from '../src/app/routes.ts'

test('legacy collection URLs canonicalize without discarding review parameters', () => {
  assert.equal(canonicalPath('/?type=tools&preview=empty'), '/tools?preview=empty')
  assert.equal(parseRoute('/?type=projects').kind, 'projects')
  assert.equal(parseRoute('/?type=invalid').kind, 'missing')
})
test('collection selections and compatibility routes survive a direct URL', () => {
  assert.deepEqual(parseRoute('/library/sfm/controller?preview=empty'), { kind: 'library', category: 'sfm', slug: 'controller', search: '?preview=empty' })
  assert.deepEqual(parseRoute('/resource/old-project'), { kind: 'resource', slug: 'old-project', search: '' })
  assert.equal(parseRoute('/projects/pocket/').kind, 'projects')
  assert.equal(parseRoute('/tools?preview=error').search, '?preview=error')
})
test('unknown, malformed and extra path segments never become a homepage', () => {
  for (const path of ['/unknown', '/admin/other', '/tools/a/b', '/library/a/b/c', '/tools/%E0%A4', '/tools/a%2Fb', '/tools//']) assert.equal(parseRoute(path).kind, 'missing', path)
})
