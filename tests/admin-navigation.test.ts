import assert from 'node:assert/strict'
import { test } from 'node:test'
import { installEditorGuard } from '../src/admin/navigationGuard.ts'
test('cancelled browser back restores editor URL and prevents router notification',() => {
 const listeners = new Map<string,EventListener>()
 const location = { href:'https://klasma.local/admin/' }
 const target = { location,history:{ pushState(_state:unknown,_title:string,href:string) { location.href = href } },addEventListener(name:string,handler:EventListener) { listeners.set(name,handler) },removeEventListener(name:string) { listeners.delete(name) } } as unknown as Window
 let allow = false,stopped = false
 const dispose = installEditorGuard(target,() => allow)
 location.href = 'https://klasma.local/'
 listeners.get('popstate')!({ stopImmediatePropagation() { stopped = true } } as unknown as Event)
 assert.equal(location.href,'https://klasma.local/admin/')
 assert.equal(stopped,true)
 allow = true;stopped = false;location.href = 'https://klasma.local/'
 listeners.get('popstate')!({ stopImmediatePropagation() { stopped = true } } as unknown as Event)
 assert.equal(location.href,'https://klasma.local/')
 assert.equal(stopped,false)
 dispose();assert.equal(listeners.size,0)
})
