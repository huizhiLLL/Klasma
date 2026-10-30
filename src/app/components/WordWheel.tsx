import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { collections } from '../collections'
import { nearestWheelPosition, opticalInkBounds, wheelPose, type WheelInk } from '../animations/wordWheel'
function WheelWord({ word,index,position,metrics }: { word:string; index:number; position:MotionValue<number>; metrics?:{ ink:WheelInk[]; baseline:number } }) {
 const y = useTransform(position,value => `${wheelPose(value,index,metrics?.ink).y}em`)
 const scale = useTransform(position,value => wheelPose(value,index).scale)
 const opacity = useTransform(position,value => wheelPose(value,index).opacity)
 return <motion.span className="wheel-word" style={{ y,scale,opacity,originX:0,originY:metrics ? `${metrics.baseline}em` : '50%',textIndent:`${metrics?.ink[index].left ?? 0}em` }}>{word}</motion.span>
}
export function WordWheel({ index,enabled }: { index:number; enabled:boolean }) {
 const position = useMotionValue(index)
 const wheelRef = useRef<HTMLSpanElement>(null)
 const [metrics,setMetrics] = useState<{ ink:WheelInk[]; baseline:number }>()
 useEffect(() => {
  let cancelled = false
  // 字体加载后按墨迹边缘校正；使用 em，让校正随字号及滚轮缩放一起变化。
  void document.fonts.ready.then(() => {
   if (cancelled || !wheelRef.current) return
   const font = getComputedStyle(wheelRef.current)
   const canvas = document.createElement('canvas')
   const context = canvas.getContext('2d',{ willReadFrequently:true })
   if (!context) return
   const fontSpec = `${font.fontWeight} 100px ${font.fontFamily}`
   context.font = fontSpec
   const measured = collections.map(item => context.measureText(item.word))
   const lineHeight = parseFloat(font.lineHeight) / parseFloat(font.fontSize)
   const baseline = (lineHeight + (measured[0].fontBoundingBoxAscent - measured[0].fontBoundingBoxDescent) / 100) / 2
   if (!Number.isFinite(baseline)) return
   const ink = measured.map((item,index) => {
    canvas.width = Math.ceil(item.width + 32)
    canvas.height = 200
    context.font = fontSpec
    context.fillText(collections[index].word,16,128)
    const pixels = context.getImageData(0,0,canvas.width,canvas.height).data
    const rows = Array.from({ length:canvas.height },(_,row) => {
     let mass = 0
     for (let x = 0; x < canvas.width; x++) mass += pixels[(row * canvas.width + x) * 4 + 3]
     return mass
    })
    const body = opticalInkBounds(rows,128,100)
    return { left:item.actualBoundingBoxLeft / 100,ascent:item.actualBoundingBoxAscent / 100,descent:item.actualBoundingBoxDescent / 100,opticalAscent:body?.ascent,opticalDescent:body?.descent }
   })
   setMetrics({ baseline,ink })
  })
  return () => { cancelled = true }
 },[])
 useEffect(() => {
  const control = animate(position,nearestWheelPosition(position.get(),index),{ duration:enabled ? .56 : 0,ease:[.22,1,.36,1] })
  return () => control.stop()
 },[index,enabled,position])
 return <><span className="sr-only"> {collections[index].word}</span><span ref={wheelRef} className="word-wheel" aria-hidden="true"><span className="wheel-measure">prefer</span>{collections.map((item,wordIndex) => <WheelWord key={item.key} word={item.word} index={wordIndex} position={position} metrics={metrics} />)}</span></>
}
