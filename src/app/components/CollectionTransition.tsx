import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import type { Collection } from '../routes'
import { useMotionPolicy } from '../animations/useMotionPolicy'
import { collectionPose } from '../animations/collectionTransition'
import { CollectionPresence } from '../animations/collectionPresence'
import '../styles/collection-transition.css'

type Journey = { from:Collection; to:Collection; enabled:boolean }
function CollectionPanel({ collection, journey, children }: { collection:Collection; journey:Journey; children:ReactNode }) {
 const present = useIsPresent()
 const { transition } = useMotionPolicy()
 return <CollectionPresence value={present}><motion.div className="collection-panel" data-present={present} inert={!present} aria-hidden={!present || undefined}
  initial="enter" animate="settled" exit="leave" custom={journey}
  variants={{ enter:(next:Journey) => collectionPose(collection,next.from,true,next.enabled),settled:{ opacity:1,scale:1,y:0 },leave:(next:Journey) => collectionPose(collection,next.to,false,next.enabled) }}
  transition={transition}>{children}</motion.div></CollectionPresence>
}
export function CollectionTransition({ collection, children }: { collection:Collection; children:ReactNode }) {
 const { enabled } = useMotionPolicy()
 const [journey,setJourney] = useState({ from:collection,to:collection })
 if (journey.to !== collection) setJourney({ from:journey.to,to:collection })
 const current = { ...journey,enabled }
 return <AnimatePresence initial={false} mode="sync" custom={current}><CollectionPanel key={collection} collection={collection} journey={current}>{children}</CollectionPanel></AnimatePresence>
}

// 仅共用底板，软件和作品的图标分别进退，不将不同实体互相变形。
export function CollectionSelector({ className, label, children }: { className:string; label:string; children:ReactNode }) {
 const { shared, enabled, transition } = useMotionPolicy()
 return <nav className={`${className} collection-selector`} aria-label={label}>
  <motion.span aria-hidden="true" className="collection-selector-surface" layoutId={shared ? 'collection-selector-surface' : undefined} transition={transition} />
  <motion.div className="collection-selector-items" initial={enabled ? { opacity:0 } : false} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:enabled ? .14 : 0,delay:enabled ? .08 : 0 }}>{children}</motion.div>
 </nav>
}
