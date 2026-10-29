import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { catalog } from '../../data/catalog'
import { previewState, type Tool } from '../../data/model'
import { Link } from '../../components/Link'
import { StatePanel } from '../../components/StatePanel'
import { Dialog } from '../../components/Dialog'
import { Markdown } from '../../components/Markdown'
import { Monogram, SoftwareVisual } from '../../components/Visual'
import { Icon } from '../../components/Icon'
import { useMotionPolicy } from '../../animations/useMotionPolicy'
import './tools.css'
function ToolStage({ tool }: { tool:Tool }) {
 const [mediaIndex, setMediaIndex] = useState(0)
 const [reader, setReader] = useState(false)
 const [overflow, setOverflow] = useState(false)
 const preview = useRef<HTMLDivElement>(null)
 useEffect(() => {
  const node = preview.current!
  let alive = true
  const measure = () => { if (alive) setOverflow(node.scrollHeight > node.clientHeight + 2) }
  const observer = new ResizeObserver(measure)
  observer.observe(node)
  if (node.firstElementChild) observer.observe(node.firstElementChild)
  void document.fonts.ready.then(measure)
  measure()
  return () => { alive = false; observer.disconnect() }
 }, [tool.article])
 const media = tool.media[mediaIndex]
 return <><div className="tool-stage"><section className="tool-media" aria-label={`${tool.name} 媒体`}><div className="tool-screen">{media ? <SoftwareVisual variant={media.variant} title={`${tool.name} · ${media.label}`} frame={mediaIndex} /> : <div className="media-absent"><Monogram text={tool.monogram} tone={tool.tone} /><p>截图还在整理中</p></div>}</div><div className="media-toolbar"><span className="eyebrow">{media?.caption ?? '先留下一份偏好。'}</span>{tool.media.length > 1 && <div className="media-thumbs" aria-label="选择画面">{tool.media.map((item,index) => <button key={item.id} onClick={() => setMediaIndex(index)} aria-pressed={index === mediaIndex} title={item.label} aria-label={`${index + 1} · ${item.label}`}><span>{String(index + 1).padStart(2,'0')}</span></button>)}</div>}</div></section><section className="tool-story" aria-labelledby="tool-name"><p className="eyebrow">{tool.platform}</p><h2 id="tool-name">{tool.name}</h2><p className="tool-tagline">{tool.tagline}</p><div ref={preview} className={`tool-copy-preview ${overflow ? 'has-overflow' : ''}`}><Markdown text={tool.article} /></div><div className="tool-actions">{overflow && <button className="text-action" onClick={() => setReader(true)}>阅读全文 <Icon name="arrow-up-right" /></button>}{tool.links.map(link => <a className="text-action" key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<Icon name="arrow-up-right" /></a>)}</div></section></div>{reader && <Dialog title={tool.name} reader onDismiss={() => setReader(false)}><Markdown text={tool.article} /></Dialog>}</>
}
export function ToolsPage({ slug, search }: { slug?:string; search:string }) {
 const all = catalog.tools()
 const tool = slug ? catalog.tool(slug) : all[0]
 const state = previewState(search)
 const { enabled } = useMotionPolicy()
 if (state !== 'ready') return <StatePanel state={state} back="/tools" />
 if (!tool) return <StatePanel state={slug ? 'missing' : 'empty'} back="/tools" noun="软件" />
 const index = all.indexOf(tool)
 const origin = `${(index + .5) / all.length * 100}% 100%`
 return <div className="tools-page"><div className="tool-transition-stage"><AnimatePresence mode="popLayout" initial={false}><motion.div key={tool.slug} className="tool-transition-panel" style={{ transformOrigin:origin }} initial={enabled ? { opacity:0,scale:.2,y:100 } : false} animate={{ opacity:1,scale:1,y:0 }} exit={enabled ? { opacity:0,scale:.15,y:130,pointerEvents:'none' } : { opacity:0,pointerEvents:'none' }} transition={{ duration:enabled ? .28 : 0, ease:[.22,1,.36,1] }}><ToolStage tool={tool} /></motion.div></AnimatePresence></div><nav className="tool-dock" aria-label="软件选择">{all.map(item => <Link key={item.slug} href={`/tools/${item.slug}`} aria-label={item.name} title={item.name} aria-current={item.slug === tool.slug ? 'page' : undefined}><Monogram text={item.monogram} tone={item.tone} small /><span className="dock-tooltip">{item.name}</span><i aria-hidden="true" /></Link>)}</nav></div>
}
