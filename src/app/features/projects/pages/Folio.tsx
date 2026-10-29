import { useState } from 'react'
import { motion } from 'motion/react'
import { useMotionPolicy } from '../../../animations/useMotionPolicy'
const notes = [
 { name:'形状',caption:'从一个圆开始。',kind:'circle' },
 { name:'色彩',caption:'蓝与橙，刚好。',kind:'color' },
 { name:'留白',caption:'给想法留一个位置。',kind:'space' },
 { name:'片段',caption:'不必立刻连成一句话。',kind:'type' },
]
export default function Folio() {
 const [selected,setSelected] = useState<number | null>(null)
 const [shift,setShift] = useState(0)
 const { enabled } = useMotionPolicy()
 return <section className="folio-demo" aria-label="Folio 画板示例"><div className="folio-toolbar"><span>Untitled board / 04 pieces</span><button className="action" onClick={() => { setShift(current => (current + 1) % 4); setSelected(null) }}>换个排列</button></div><div className={`folio-board ${selected !== null ? 'has-selection' : ''}`}>{notes.map((note,index) => <motion.button layout={enabled} transition={{ duration:enabled ? .28 : 0 }} key={note.kind} onClick={() => setSelected(selected === index ? null : index)} aria-pressed={selected === index} aria-label={`${note.name}：${note.caption}`} className={`folio-piece piece-${note.kind} ${selected === index ? 'is-selected' : ''}`} style={{ order:(index + shift) % 4 }}><span className="folio-art" aria-hidden="true">{note.kind === 'type' ? 'a little\nroom.' : note.kind === 'space' ? '+' : ''}</span><span className="folio-label">{note.name}<small>{note.caption}</small></span></motion.button>)}</div><p className="demo-caption" role="status">{selected === null ? '点一张素材，靠近看一眼。' : notes[selected].caption + ' 再点一次收起。'}</p></section>
}
