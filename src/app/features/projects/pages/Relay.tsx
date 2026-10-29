import { useState } from 'react'
const steps = [
 { title:'收集',detail:'把零散的文件带到同一个起点。',command:'relay collect ./fragments',result:'12 fragments collected' },
 { title:'整理',detail:'按内容建立关系，保留原来的文件。',command:'relay arrange --local',result:'4 groups, 12 connections' },
 { title:'连接',detail:'让工作区里的线索重新连起来。',command:'relay link ./workspace',result:'workspace linked' },
 { title:'留下',detail:'把这一次的结果保存下来。',command:'relay keep --snapshot',result:'snapshot ready' },
]
export default function Relay() {
 const [step,setStep] = useState(0)
 return <section className="relay-demo" aria-label="Relay 流程示例"><div className="relay-flow">{steps.map((item,index) => <button key={item.title} onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined}><span className="relay-node">{String(index + 1).padStart(2,'0')}</span><strong>{item.title}</strong><i aria-hidden="true" /></button>)}</div><div className="relay-result" aria-live="polite"><p className="eyebrow">STEP {step + 1} / 04</p><h3>{steps[step].detail}</h3><div className="relay-command"><code>{steps[step].command}</code><span>✓ {steps[step].result}</span></div><div className="relay-controls"><p className="muted">交互演示，不操作本地文件。</p><button className="action primary" onClick={() => setStep(current => (current + 1) % steps.length)}>{step === steps.length - 1 ? '再走一遍' : '下一步'}</button></div></div></section>
}
