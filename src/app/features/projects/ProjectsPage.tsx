import { Component, createElement, lazy, Suspense, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { projects } from './registry'
import { previewState } from '../../data/model'
import { Link } from '../../components/Link'
import { Icon } from '../../components/Icon'
import { Monogram } from '../../components/Visual'
import { StatePanel } from '../../components/StatePanel'
import { useMotionPolicy } from '../../animations/useMotionPolicy'
import './projects.css'
const components = new Map(projects.map(project => [project.slug,createElement(lazy(project.load))]))
class ProjectBoundary extends Component<{ children:ReactNode },{ failed:boolean }> {
 state = { failed:false }
 static getDerivedStateFromError() { return { failed:true } }
 render() { return this.state.failed ? <section className="state-panel" role="alert"><h2>作品暂时没有打开</h2><p>刷新页面再试一次，或切换到另一件作品。</p><button className="action" onClick={() => window.location.reload()}>刷新页面</button></section> : this.props.children }
}
function ProjectPanel({ children,enabled }: { children:ReactNode; enabled:boolean }) {
 const present = useIsPresent()
 return <motion.div className="project-panel" inert={!present} aria-hidden={!present || undefined} initial={enabled ? { y:60,opacity:0 } : false} animate={{ y:0,opacity:1 }} exit={enabled ? { y:-60,opacity:0 } : { opacity:0 }} transition={{ duration:enabled ? .28 : 0,ease:[.22,1,.36,1] }}>{children}</motion.div>
}
export function ProjectsPage({ slug,search }: { slug?:string; search:string }) {
 const all = [...projects].sort((a,b) => a.order - b.order)
 const current = slug ? all.find(item => item.slug === slug) : all[0]
 const state = previewState(search)
 const { enabled } = useMotionPolicy()
 if (state !== 'ready') return <StatePanel state={state} back="/projects" />
 if (!current) return <StatePanel state={slug ? 'missing' : 'empty'} noun="作品" back="/projects" />
 const content = components.get(current.slug)!
 return <div className="projects-page"><div className="project-stage"><AnimatePresence initial={false} mode="popLayout"><ProjectPanel key={current.slug} enabled={enabled}><header className="project-intro"><div><p className="eyebrow">交互展示 · 虚构作品样例</p><h2>{current.name}</h2><p className="muted">{current.description}</p></div><div className="project-links">{current.links.map(link => <a key={link.url} href={link.url} className="action" download={link.download}>{link.label}<Icon name="arrow-up-right" /></a>)}</div></header><ProjectBoundary><Suspense fallback={<StatePanel state="loading" back="/projects" />}>{content}</Suspense></ProjectBoundary></ProjectPanel></AnimatePresence></div><nav className="project-rail" aria-label="作品选择">{all.map(item => <Link key={item.slug} href={`/projects/${item.slug}`} aria-label={item.name} title={item.name} aria-current={item.slug === current.slug ? 'page' : undefined}><Monogram text={item.logo} tone={item.tone} small /><span>{item.name}</span></Link>)}</nav></div>
}
