import type { Tool } from './model.ts'

const imageRoot = '/content/tools/mole'

export const tools: readonly Tool[] = [
 {
  slug:'mole',
  name:'Mole',
  monogram:'M',
  tone:'gray',
  icon:`${imageRoot}/icon.png`,
  platform:'Windows / Macos',
  tagline:'空间清理、磁盘分析、软件管理、系统维护，实时状态，Mole 全搞定',
  article:'- test',
  media:['status-1980w.webp','clean-1980w.webp','uninstall-1980w.webp'].map(filename => ({
   id:filename,label:filename,caption:filename,src:`${imageRoot}/${filename}`,variant:'clean',width:1980,height:1334,
  })),
  links:[{ label:'Mole',url:'https://mole.fit/' }],
 },
]
