import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { catalog } from '../../data/catalog'
import { previewState, type Asset, type AssetCategory } from '../../data/model'
import { navigate } from '../../routing'
import { routePath } from '../../routes'
import { Link } from '../../components/Link'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { StatePanel } from '../../components/StatePanel'
import { StructureVisual } from '../../components/Visual'
import { useMotionPolicy } from '../../animations/useMotionPolicy'
import { point, sectorPath, sectors } from './geometry'
import './library.css'
function AssetVisual({ asset }: { asset:Asset }) {
 return asset.kind === 'code' ? <pre className="asset-code-art" aria-label="代码片段">{asset.code?.split('\n').slice(0,7).join('\n')}</pre> : <StructureVisual compact kind={asset.kind} />
}
function LibraryOverview() {
 const categories = catalog.categories()
 const [preview,setPreview] = useState<AssetCategory | null>(null)
 const { shared,transition } = useMotionPolicy()
 return <div className="library-overview"><div className="pizza-map"><svg viewBox="0 0 500 500" role="group" aria-label="工程资产分类">{categories.map((category,index) => {
  const [start,end] = sectors[index]
  const label = point((start + end) / 2,146)
  return <a key={category.slug} href={`/library/${category.slug}`} aria-label={`${category.name}，查看分类`} aria-current={preview?.slug === category.slug ? 'true' : undefined} onPointerEnter={() => setPreview(category)} onFocus={() => setPreview(category)} onClick={event => {
   if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
   event.preventDefault()
   setPreview(category)
   if (!matchMedia('(hover: none)').matches) navigate(`/library/${category.slug}`)
  }}><path d={sectorPath(start,end)} /><text x={label.x} y={label.y - 3} textAnchor="middle">{category.name}</text><text className="sector-count" x={label.x} y={label.y + 21} textAnchor="middle">{String(catalog.assets(category.slug).length).padStart(2,'0')}</text></a>
 })}<text x="250" y="247" textAnchor="middle" className="pizza-center">keep</text><text x="250" y="272" textAnchor="middle" className="sector-count">fragments</text></svg></div><aside className="category-preview-slot"><AnimatePresence mode="wait" initial={false}>{preview ? <motion.div key={preview.slug} className="category-preview" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:.14 }}><p className="eyebrow">{preview.english}</p><h2>{preview.name}</h2><Link href={`/library/${preview.slug}`} className="preview-link" aria-label={`进入${preview.name}场景`}><motion.div className="category-thumbnail" layoutId={shared ? `asset-scene-${preview.slug}` : undefined} transition={transition}>{catalog.assets(preview.slug)[0] ? <AssetVisual asset={catalog.assets(preview.slug)[0]} /> : <span className="empty-fragment">…</span>}</motion.div><span>进入场景 <Icon name="arrow-up-right" /></span></Link><p className="muted">{preview.description}</p></motion.div> : <div className="category-intro" key="intro"><p className="eyebrow">A place for what stays.</p><h2>沉淀在这里的<br />一些结构与思路。</h2><p className="muted">指向一块分类，先看一眼。<br />再走进去，慢慢展开。</p></div>}</AnimatePresence></aside></div>
}
function AssetDetail({ asset, onDismiss }: { asset:Asset; onDismiss:()=>void }) {
 const [step,setStep] = useState(0)
 const [notice,setNotice] = useState('')
 async function copy() {
  try { await navigator.clipboard.writeText(asset.code ?? ''); setNotice('代码已复制') }
  catch { setNotice('未能复制，请选中下方代码手动复制。') }
 }
 return <Dialog title={asset.title} onDismiss={onDismiss} returnFocus={`[data-asset="${asset.slug}"]`}><div className="asset-detail-visual"><AssetVisual asset={asset} /></div><div className="asset-facts"><span>{asset.footprint}</span><span>{asset.version}</span></div><p className="asset-description">{asset.description}</p><p className="asset-notes">{asset.notes}</p><div className="asset-tags">{asset.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{asset.steps && <section className="trace-demo" aria-label="流程顺序示意"><header><h3>流程顺序</h3><span className="eyebrow">示意，不执行实际代码</span></header><ol>{asset.steps.map((label,index) => <li key={label}><button aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}><span>{index + 1}</span>{label}</button></li>)}</ol><div className="trace-actions"><p role="status">{step + 1} / {asset.steps.length} · {asset.steps[step]}</p><button className="action" onClick={() => setStep(current => (current + 1) % asset.steps!.length)}>下一步</button></div></section>}{asset.code && <section className="code-section"><header><h3>代码与配置</h3><button className="text-action" onClick={() => void copy()}>复制代码</button></header><pre tabIndex={0}>{asset.code}</pre><p className="eyebrow" role="status">{notice}</p></section>}{asset.attachment && <a className="action primary" href={asset.attachment.href} download={asset.attachment.filename}>下载示例文件 <Icon name="arrow-up-right" /></a>}</Dialog>
}
function LibraryScene({ category, slug, search }: { category:AssetCategory; slug?:string; search:string }) {
 const assets = catalog.assets(category.slug)
 const selected = slug ? catalog.asset(category.slug,slug) : undefined
 const { shared,transition,enabled } = useMotionPolicy()
 const path = routePath({ kind:'library',category:category.slug,search })
 return <div className={`library-scene scene-${category.direction}`}><div className="scene-heading"><p className="eyebrow">{category.english}</p><h2>{category.name}</h2><p className="muted">{category.description}</p></div><motion.div className="scene-canvas" layoutId={shared ? `asset-scene-${category.slug}` : undefined} transition={transition}><span className="scene-axis" aria-hidden="true">x ───────── z</span>{assets.length === 0 ? <StatePanel state="empty" noun="工程资产" back="/library" /> : assets.map(asset => <motion.div key={asset.slug} className="scene-item" style={{ '--item-x':`${asset.position.x}%`, '--item-y':`${asset.position.y}%`, '--item-rotate':`${enabled ? asset.position.rotate : 0}deg` } as CSSProperties} initial={enabled ? { opacity:0,y:16 } : false} animate={{ opacity:1,y:0 }} transition={{ duration:enabled ? .28 : 0 }}><Link href={routePath({ kind:'library',category:category.slug,slug:asset.slug,search })} preserveScroll data-asset={asset.slug} className="scene-item-link" aria-label={`展开${asset.title}`}><div className="scene-item-art"><AssetVisual asset={asset} /></div><strong>{asset.title}</strong><span>{asset.subtitle}<Icon name="arrow-up-right" /></span></Link></motion.div>)}</motion.div><Link className="scene-return action" href="/library"><Icon name="arrow-left" />全局视图</Link>{slug && (selected ? <AssetDetail key={selected.slug} asset={selected} onDismiss={() => navigate(path,{ preserveScroll:true })} /> : <Dialog title="未找到这份资产" onDismiss={() => navigate(path,{ preserveScroll:true })}><StatePanel state="missing" back={path} /></Dialog>)}</div>
}
export function LibraryPage({ category:categorySlug, slug, search }: { category?:string; slug?:string; search:string }) {
 const state = previewState(search)
 const category = categorySlug ? catalog.category(categorySlug) : undefined
 if (state !== 'ready') return <StatePanel state={state} back="/library" />
 if (categorySlug && !category) return <StatePanel state="missing" back="/library" />
 return category ? <LibraryScene key={category.slug} category={category} slug={slug} search={search} /> : <LibraryOverview />
}
