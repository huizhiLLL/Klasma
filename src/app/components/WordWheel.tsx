import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { collections } from '../collections'
import { nearestWheelPosition, wheelPose } from '../animations/wordWheel'
function WheelWord({ word,index,position }: { word:string; index:number; position:MotionValue<number> }) {
 const y = useTransform(position,value => `${wheelPose(value,index).y}em`)
 const scale = useTransform(position,value => wheelPose(value,index).scale)
 const opacity = useTransform(position,value => wheelPose(value,index).opacity)
 return <motion.span className="wheel-word" style={{ y,scale,opacity }}>{word}</motion.span>
}
export function WordWheel({ index,enabled }: { index:number; enabled:boolean }) {
 const position = useMotionValue(index)
 useEffect(() => {
  const control = animate(position,nearestWheelPosition(position.get(),index),{ duration:enabled ? .56 : 0,ease:[.22,1,.36,1] })
  return () => control.stop()
 },[index,enabled,position])
 return <><span className="sr-only"> {collections[index].word}</span><span className="word-wheel" aria-hidden="true"><span className="wheel-measure">prefer</span>{collections.map((item,wordIndex) => <WheelWord key={item.key} word={item.word} index={wordIndex} position={position} />)}</span></>
}
