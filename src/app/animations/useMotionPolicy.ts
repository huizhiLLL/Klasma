import { useSyncExternalStore } from 'react'
import { useReducedMotion } from 'motion/react'
let keyboard = false
function subscribe(listener: () => void) {
 const update = (value: boolean) => { keyboard = value; document.documentElement.dataset.keyboard = String(value); listener() }
 const onKey = () => update(true)
 const onPointer = () => update(false)
 document.addEventListener('keydown', onKey)
 document.addEventListener('pointerdown', onPointer)
 return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer) }
}
function subscribeWide(listener: () => void) {
 const media = matchMedia('(min-width: 761px)')
 media.addEventListener('change', listener)
 return () => media.removeEventListener('change', listener)
}
export function useMotionPolicy() {
 const reduced = useReducedMotion()
 const keyboardInput = useSyncExternalStore(subscribe, () => keyboard, () => true)
 const wide = useSyncExternalStore(subscribeWide, () => matchMedia('(min-width: 761px)').matches, () => false)
 const enabled = !reduced && !keyboardInput
 return { enabled, shared: enabled && wide, transition: { duration: enabled ? .56 : 0, ease: [.22, 1, .36, 1] as [number, number, number, number] } }
}
