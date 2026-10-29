import type { ComponentType } from 'react'
export type Project = {
 slug:string; name:string; logo:string; tone:string; order:number; description:string;
 links:Array<{ label:string; url:string; download?:boolean }>;
 load:()=>Promise<{ default:ComponentType }>
}
export const projects:Project[] = [
 { slug:'folio',name:'Folio',logo:'F',tone:'peach',order:0,description:'把零散的想法，摆成自己的关系。',links:[{ label:'下载示例',url:'/samples/folio-example.json',download:true }],load:() => import('./pages/Folio') },
 { slug:'relay',name:'Relay',logo:'R',tone:'green',order:1,description:'看一个小任务，经过哪些步骤。',links:[{ label:'下载示例',url:'/samples/relay-example.txt',download:true }],load:() => import('./pages/Relay') },
 { slug:'little-board',name:'Little Board',logo:'B',tone:'blue',order:2,description:'一块小小的板子，也有自己的空间。',links:[],load:() => import('./pages/LittleBoard') },
]
