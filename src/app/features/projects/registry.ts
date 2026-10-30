import type { ComponentType } from 'react'
export type Project = {
 slug:string; name:string; logo:string; tone:string; order:number; description:string;
 links:Array<{ label:string; url:string; download?:boolean }>;
 load:()=>Promise<{ default:ComponentType }>
}
// Register real projects here; design samples are not public content.
export const projects:Project[] = []
