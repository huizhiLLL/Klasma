export type Media = { id:string; label:string; variant:'clean' | 'board' | 'terminal'; caption:string }
export type Tool = {
 slug:string; name:string; monogram:string; tone:string; platform:string; tagline:string; article:string;
 media:Media[]; links:Array<{ label:string; url:string }>
}
export type AssetCategory = { slug:string; name:string; english:string; description:string; direction:'sw' | 'se' | 'ne' | 'nw' | 'w' }
export type Asset = {
 slug:string; category:string; title:string; subtitle:string; kind:'code' | 'line' | 'tower';
 description:string; notes:string; tags:string[]; code?:string; steps?:string[];
 footprint:string; version:string; position:{ x:number; y:number; rotate:number }; attachment?:{ filename:string; href:string }
}
export type PreviewState = 'ready' | 'empty' | 'error' | 'loading'
export function previewState(search:string):PreviewState {
 const value = new URLSearchParams(search).get('preview')
 return value === 'empty' || value === 'error' || value === 'loading' ? value : 'ready'
}
