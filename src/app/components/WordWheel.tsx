import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { collections } from '../collections'
import { nearestWheelPosition, wheelPose } from '../animations/wordWheel'
function WheelWord({ word,index,position,bearing }: { word:string; index:number; position:MotionValue<number>; bearing:number }) {
 const y = useTransform(position,value => `${wheelPose(value,index).y}em`)
 const scale = useTransform(position,value => wheelPose(value,index).scale)
 const opacity = useTransform(position,value => wheelPose(value,index).opacity)
 return <motion.span className="wheel-word" style={{ y,scale,opacity,originX:0,textIndent:`${bearing}em` }}>{word}</motion.span>
}
export function WordWheel({ index,enabled }: { index:number; enabled:boolean }) {
 const position = useMotionValue(index)
 const wheelRef = useRef<HTMLSpanElement>(null)
 const [bearings,setBearings] = useState<number[]>([])
 useEffect(() => {
  let cancelled = false
  // 字体加载后按墨迹边缘校正；使用 em，让校正随字号及滚轮缩放一起变化。
  void document.fonts.ready.then(() => {
   if (cancelled || !wheelRef.current) return
   const font = getComputedStyle(wheelRef.current)
   const context = document.createElement('canvas').getContext('2d')
   if (!context) return
   context.font = `${font.fontWeight} 100px ${font.fontFamily}`
   setBearings(collections.map(item => context.measureText(item.word).actualBoundingBoxLeft / 100))
  })
  return () => { cancelled = true }
 },[])
 useEffect(() => {
  const control = animate(position,nearestWheelPosition(position.get(),index),{ duration:enabled ? .56 : 0,ease:[.22,1,.36,1] })
  return () => control.stop()
 },[index,enabled,position])
 return <><span className="sr-only"> {collections[index].word}</span><span ref={wheelRef} className="word-wheel" aria-hidden="true"><span className="wheel-measure">prefer</span>{collections.map((item,wordIndex) => <WheelWord key={item.key} word={item.word} index={wordIndex} position={position} bearing={bearings[wordIndex] ?? 0} />)}</span></>
}
