import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
export function Markdown({ text }: { text:string }) {
 const html = useMemo(() => DOMPurify.isSupported ? DOMPurify.sanitize(marked.parse(text, { async:false }), { USE_PROFILES:{ html:true } }) : null, [text])
 return html === null ? <div className="reading-copy">{text}</div> : <div className="reading-copy" dangerouslySetInnerHTML={{ __html:html }} />
}
