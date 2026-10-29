import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRoute, routePath } from '../src/app/routes.ts'
test('new paths carry selection and query state without compatibility redirects', () => {
 assert.deepEqual(parseRoute('/library/sfm/controller?preview=empty'),{ kind:'library',category:'sfm',slug:'controller',search:'?preview=empty' })
 assert.equal(parseRoute('/resource/old-project').kind,'missing')
 assert.equal(parseRoute('/?type=tools').kind,'home')
 assert.equal(parseRoute('/projects/pocket/').kind,'projects')
 assert.equal(parseRoute('/tools?preview=error').search,'?preview=error')
})
test('unknown, malformed and extra paths never become a homepage', () => {
 for (const path of ['/unknown','/admin/other','/tools/a/b','/library/a/b/c','/tools/%E0%A4','/tools/a%2Fb','/tools//']) assert.equal(parseRoute(path).kind,'missing',path)
})
test('valid selected routes have a stable shareable path', () => {
 for (const path of ['/tools/mole','/projects/folio','/library/sfm','/library/sfm/quiet-production','/admin','/']) assert.equal(routePath(parseRoute(path)),path)
})
