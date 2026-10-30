import test from 'node:test'
import assert from 'node:assert/strict'
import { transitionAsset } from '../src/app/animations/assetTransition.ts'
function environment(supported = true) {
 const previous = Object.getOwnPropertyDescriptor(globalThis,'document')
 const pending:Array<{ update:()=>unknown; finish:()=>void; finished:Promise<void> }> = []
 const source = { dataset:{} as Record<string,string>, removeAttribute(name:string) { if (name === 'data-shared-asset') delete this.dataset.sharedAsset } }
 let skipped = 0
 const root = { dataset:{} as Record<string,string> }
 const document = { documentElement:root, startViewTransition:supported ? (update:()=>unknown) => {
  let finish!:()=>void
  const finished = new Promise<void>(resolve => { finish = resolve })
  pending.push({ update,finish,finished })
  return { finished,skipTransition() { skipped++; finish() } }
 } : undefined }
 Object.defineProperty(globalThis,'document',{ value:document,configurable:true })
 return { source:source as unknown as HTMLElement,root,pending,skips:() => skipped,restore() {
  if (previous) Object.defineProperty(globalThis,'document',previous)
  else Reflect.deleteProperty(globalThis,'document')
 } }
}
test('opening and closing name source and target in different snapshot phases', async () => {
 const env = environment()
 try {
  let open = false
  transitionAsset(env.source,() => { open = true },true,true)
  assert.equal(env.source.dataset.sharedAsset,'true')
  assert.equal(open,false)
  env.pending[0].update()
  assert.equal(open,true)
  assert.equal(env.source.dataset.sharedAsset,undefined)
  env.pending[0].finish()
  await env.pending[0].finished
  assert.equal(env.root.dataset.assetDetailTransition,undefined)
  transitionAsset(env.source,() => { open = false },true,false)
  assert.equal(env.source.dataset.sharedAsset,undefined)
  env.pending[1].update()
  assert.equal(open,false)
  assert.equal(env.source.dataset.sharedAsset,'true')
  env.pending[1].finish()
  await env.pending[1].finished
  assert.equal(env.source.dataset.sharedAsset,undefined)
 } finally { env.restore() }
})
test('a newer action invalidates pending updates and cleans snapshot markers', async () => {
 const env = environment()
 try {
  let selected = ''
  transitionAsset(env.source,() => { selected = 'old' },true,true)
  transitionAsset(env.source,() => { selected = 'latest' },true,true)
  env.pending[0].update()
  env.pending[1].update()
  assert.equal(selected,'latest')
  assert.equal(env.skips(),1)
  env.pending[1].finish()
  await env.pending[1].finished
  assert.equal(env.root.dataset.assetDetailTransition,undefined)
 } finally { env.restore() }
})
test('unsupported and disabled motion perform the route update without snapshots', () => {
 for (const supported of [true,false]) {
  const env = environment(supported)
  try {
   let updates = 0
   transitionAsset(env.source,() => { updates++ },false,true)
   if (!supported) transitionAsset(env.source,() => { updates++ },true,true)
   assert.equal(updates,supported ? 1 : 2)
   assert.equal(env.pending.length,0)
   assert.equal(env.root.dataset.assetDetailTransition,undefined)
  } finally { env.restore() }
 }
})
