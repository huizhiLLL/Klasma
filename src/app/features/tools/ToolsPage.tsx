import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { catalog } from '../../data/catalog'
import { previewState, type Media, type Tool } from '../../data/model'
import { Link } from '../../components/Link'
import { StatePanel } from '../../components/StatePanel'
import { Dialog } from '../../components/Dialog'
import { Markdown } from '../../components/Markdown'
import { Monogram, SoftwareVisual } from '../../components/Visual'
import { Icon } from '../../components/Icon'
import { useMotionPolicy } from '../../animations/useMotionPolicy'
import { mediaColumnWidth, mediaThumbnailSize, usesPortraitMedia } from './mediaLayout'
import './tools.css'
function MediaThumbnail({ media,title,frame }: { media:Media; title:string; frame:number }) {
 const { scale,width,height } = mediaThumbnailSize(media)
 return <span className="media-thumb-art" aria-hidden="true" style={{ width,height }}><span className="media-thumb-source" style={{ width:media.width,height:media.height,transform:`scale(${scale})` }}><SoftwareVisual variant={media.variant} title={title} frame={frame} /></span></span>
}
function ToolStage({ tool }: { tool:Tool }) {
 const { enabled } = useMotionPolicy()
 const headingId = useId()
 const [mediaIndex, setMediaIndex] = useState(0)
 const [reader, setReader] = useState(false)
 const [overflow, setOverflow] = useState(false)
 const preview = useRef<HTMLDivElement>(null)
 const stage = useRef<HTMLDivElement>(null)
 const thumbnails = useRef<HTMLDivElement>(null)
 const [mediaWidth,setMediaWidth] = useState<number>()
 const portrait = usesPortraitMedia(tool.media)
 const sequenceRatio = Math.max(...tool.media.map(item => item.width / item.height),0) || 1.6
 const stepMedia = (direction:number) => setMediaIndex(current => (current + direction + tool.media.length) % tool.media.length)
 useEffect(() => {
  const node = stage.current!
  const measure = () => {
   if (window.matchMedia('(max-width:760px)').matches) { setMediaWidth(undefined); return }
   setMediaWidth(mediaColumnWidth(tool.media,node.clientWidth,node.clientHeight,thumbnails.current?.offsetHeight ?? 0,parseFloat(getComputedStyle(node).columnGap)))
  }
  const observer = new ResizeObserver(measure)
  observer.observe(node)
  if (thumbnails.current) observer.observe(thumbnails.current)
  measure()
  return () => observer.disconnect()
 },[tool.media])
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
 return <><div ref={stage} className="tool-stage" style={{ '--tool-media-width':mediaWidth === undefined ? undefined : `${mediaWidth}px` } as CSSProperties}><section className={`tool-media ${portrait ? 'tool-media-portrait' : ''} ${tool.media.length === 1 ? 'is-single' : ''}`} style={{ '--sequence-ratio':sequenceRatio,'--media-controls-width':tool.media.length > 1 ? '112px' : '0px' } as CSSProperties} aria-label={`${tool.name} 媒体`} onKeyDown={event => {
 if (!portrait || tool.media.length < 2 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
 event.preventDefault()
 if (event.key === 'Home') setMediaIndex(0)
 else if (event.key === 'End') setMediaIndex(tool.media.length - 1)
 else stepMedia(event.key === 'ArrowLeft' ? -1 : 1)
}}>{portrait && tool.media.length > 1 && <button className="tool-media-arrow" aria-label="上一张截图" title="上一张截图" onClick={() => stepMedia(-1)}><Icon name="arrow-left" /></button>}<div className="tool-screen">{media ? <AnimatePresence mode="sync" initial={false}><motion.div key={media.id} className="tool-media-frame" initial={enabled ? { opacity:0,x:20 } : false} animate={{ opacity:1,x:0 }} exit={{ opacity:0 }} transition={{ duration:enabled ? .28 : 0 }}><div className="tool-image-fit" style={{ '--media-ratio':media.width / media.height } as CSSProperties}><SoftwareVisual variant={media.variant} title={`${tool.name} · ${media.label}`} frame={mediaIndex} /></div></motion.div></AnimatePresence> : <div className="media-absent"><Monogram text={tool.monogram} tone={tool.tone} /><p>截图还在整理中</p></div>}</div>{portrait && tool.media.length > 1 && <><button className="tool-media-arrow is-next" aria-label="下一张截图" title="下一张截图" onClick={() => stepMedia(1)}><Icon name="arrow-left" /></button><span className="sr-only" role="status">第 {mediaIndex + 1} 张，共 {tool.media.length} 张：{media?.label}</span></>}{!portrait && tool.media.length > 1 && <div ref={thumbnails} className="media-thumbs" role="group" aria-label="媒体缩略图轮播" onKeyDown={event => {
 const key = event.key
 if (!['ArrowLeft','ArrowRight','Home','End'].includes(key)) return
 event.preventDefault()
 const next = key === 'Home' ? 0 : key === 'End' ? tool.media.length - 1 : (mediaIndex + (key === 'ArrowRight' ? 1 : -1) + tool.media.length) % tool.media.length
 setMediaIndex(next)
 event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
}}>{tool.media.map((item,index) => {
 const size = mediaThumbnailSize(item)
 return <button key={item.id} style={{ width:size.buttonWidth,height:size.buttonHeight }} onClick={() => setMediaIndex(index)} aria-pressed={index === mediaIndex} title={item.label} aria-label={item.label}><MediaThumbnail media={item} title={tool.name} frame={index} /></button>
})}</div>}</section><section className="tool-story" aria-labelledby={headingId}><p className="eyebrow">{tool.platform}</p><h2 id={headingId}>{tool.name}</h2><p className="tool-tagline">{tool.tagline}</p><div ref={preview} className={`tool-copy-preview ${overflow ? 'has-overflow' : ''}`}><Markdown text={tool.article} /></div><div className="tool-actions">{overflow && <button className="text-action" onClick={() => setReader(true)}>阅读全文 <Icon name="arrow-up-right" /></button>}{tool.links.map(link => <a className="text-action" key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<Icon name="arrow-up-right" /></a>)}</div></section></div>{reader && <Dialog title={tool.name} reader onDismiss={() => setReader(false)}><Markdown text={tool.article} /></Dialog>}</>
}
function ToolPanel({ children, origin, enabled }: { children:ReactNode; origin:string; enabled:boolean }) {
 const present = useIsPresent()
 return <motion.div className="tool-transition-panel" inert={!present} aria-hidden={!present || undefined} style={{ transformOrigin:origin,position:present ? 'relative' : 'absolute',top:0,left:0 }} initial={enabled ? { opacity:0,scale:.2,y:100 } : false} animate={{ opacity:1,scale:1,y:0 }} exit={enabled ? { opacity:0,scale:.15,y:130 } : { opacity:0 }} transition={{ duration:enabled ? .28 : 0,ease:[.22,1,.36,1] }}>{children}</motion.div>
}
export function ToolsPage({ slug, search }: { slug?:string; search:string }) {
 const all = catalog.tools()
 const tool = slug ? catalog.tool(slug) : all[0]
 const state = previewState(search)
 const { enabled } = useMotionPolicy()
 if (state !== 'ready') return <StatePanel state={state} back="/tools" />
 if (!tool) return <StatePanel state={slug ? 'missing' : 'empty'} back="/tools" noun="软件" />
 const index = all.indexOf(tool)
 const origin = `calc(50% + ${(index - (all.length - 1) / 2) * 68}px) calc(100% + 80px)`
 return <div className="tools-page"><div className="tool-transition-stage"><AnimatePresence mode="sync" initial={false}><ToolPanel key={tool.slug} origin={origin} enabled={enabled}><ToolStage tool={tool} /></ToolPanel></AnimatePresence></div><nav className="tool-dock" aria-label="软件选择">{all.map(item => <Link key={item.slug} href={`/tools/${item.slug}`} aria-label={item.name} title={item.name} aria-current={item.slug === tool.slug ? 'page' : undefined}><Monogram text={item.monogram} tone={item.tone} small /><span className="dock-tooltip">{item.name}</span><i aria-hidden="true" /></Link>)}</nav></div>
}
