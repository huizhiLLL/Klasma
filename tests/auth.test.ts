import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSession, validSession, SESSION_SECONDS } from '../src/server/auth.ts'
test('session expires exactly after 30 days and rejects tampering, rotation and missing secrets',async () => {
 const now = Date.UTC(2026,9,30)
 const token = await createSession('test-only-key',now)
 assert.equal(await validSession(token,'test-only-key',now),true)
 assert.equal(await validSession(token,'test-only-key',now + SESSION_SECONDS * 1000 - 1),true)
 assert.equal(await validSession(token,'test-only-key',now + SESSION_SECONDS * 1000),false)
 assert.equal(await validSession(token + '0','test-only-key',now),false)
 assert.equal(await validSession(token,'rotated-key',now),false)
 assert.equal(await validSession(token,undefined,now),false)
 assert.equal(await validSession('malformed','test-only-key',now),false)
})
