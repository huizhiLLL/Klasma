import { useState } from 'react'
export function ContentImage({ src,alt,className }: { src:string;alt:string;className?:string }) {
 const [failed,setFailed] = useState(false)
 return failed ? <span className={`content-image-missing ${className || ''}`} role="img" aria-label={alt}>{alt} · 图片暂不可用</span> : <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}
