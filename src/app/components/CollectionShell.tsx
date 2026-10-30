import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Collection } from '../routes'
import { collections } from '../collections'
import { Link } from './Link'
import { WordWheel } from './WordWheel'
import { Icon } from './Icon'
import { useMotionPolicy } from '../animations/useMotionPolicy'
export function CollectionShell({ collection, children }: { collection: Collection; children: ReactNode }) {
 const index = collections.findIndex(item => item.key === collection)
 const current = collections[index]
 const { shared, enabled, transition } = useMotionPolicy()
 return <motion.main className="page-wrap collection-page" layoutId={shared ? `collection-${collection}` : undefined} transition={transition}>
  <header className="collection-header"><div><motion.h1 className="collection-title" data-page-heading tabIndex={-1} lang="en" layoutId={shared ? `collection-title-${collection}` : undefined} transition={transition}><span>What I</span><WordWheel index={index} enabled={enabled} /></motion.h1><p className="collection-label">{current.name} / {current.description}</p></div>
  <nav className="collection-nav" aria-label="集合导航"><Link href="/" className="home-link pressable" aria-label="返回首页" title="返回首页"><Icon name="house" /></Link>{collections.map(item => <Link href={`/${item.key}`} key={item.key} className="pressable" aria-current={item.key === collection ? 'page' : undefined}>{item.key === collection && <motion.span className="nav-selection" layoutId="navigation-selection" transition={transition} />}<motion.span className="nav-word" layoutId={shared ? `navigation-${item.word}` : undefined} transition={transition}>{item.word[0].toUpperCase() + item.word.slice(1)}</motion.span></Link>)}</nav></header><div className="collection-body">{children}</div>
 </motion.main>
}
