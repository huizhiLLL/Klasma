import type { Asset, AssetCategory, Media, Tool } from './model.ts'
const media = (variant:Media['variant'], labels:string[]):Media[] => labels.map((label,i) => ({ id:`${variant}-${i}`, label, variant, caption:['留白、层级与一次清楚的操作。','细节藏在每天都会经过的地方。','把不必要的东西留在界面之外。'][i % 3] }))
const longArticle = `有些工具值得留下，并不是因为它做得特别多，而是因为它知道什么时候应该停下来。一个明确的起点，一次及时的反馈，以及在任务结束时让人安心的结果，这些细小的选择，会慢慢变成使用习惯。

### 从一个小动作开始

我更喜欢先完成一次最普通的操作，再去看设置。好的初次体验不需要解释所有能力，只要让我知道下一步在哪里，以及做完之后会发生什么。界面里有多少按钮，并不等于一个工具有多少价值。

### 减少犹豫的设计

重要操作保持清楚，次要信息安静地留在附近。尤其喜欢那些不必读完说明就能理解的细节：选中状态、可以撤销的修改，以及没有打断思路的提示。设计的精致感往往来自这些地方。

软件里的留白也不是越多越好。截图、标题和正文之间要有关系，操作之后的反馈要在正确的位置出现。一个小工具做到了这些，就会让人愿意多用一段时间。

### 使用之后留下什么

我会记录让我停下来想一想的部分，也保留不那么顺手的地方。偏好不是结论，它更像是一次带着个人视角的观察。过一段时间再回来看，也许会发现自己的习惯已经变了。

> 这里的内容是设计预览样文，不是软件测评，也不引用作者的实际观点。

### A little less, a little better

A useful tool gives an idea enough room to become something. The interesting part is often a small choice: a clear label, a quiet default, a result that arrives exactly where you expect it.

### 再看一眼细节

我想收藏的，正是这种可以被反复使用、也值得反复观察的选择。它们未必显眼，但在每一天里都很具体。`

export const tools:Tool[] = [
 { slug:'mole', name:'Mole', monogram:'m', tone:'blue', platform:'Windows · 设计样例', tagline:'把空间，留给真正想留下的东西。', article:longArticle, media:media('clean',['主界面','一次整理','空间概览']), links:[{ label:'软件官网', url:'https://mole.fit/zh/windows' }] },
 { slug:'folio', name:'Folio', monogram:'F', tone:'peach', platform:'Desktop · 虚构样例', tagline:'先把想法摆出来。', article:'一块安静的画板，把颜色、形状和零散的想法放在一起。\n\n不用给每张图片起一个准确的名字，位置本身就能表达关系。这个样例只留两段文字，让画面多说一点。', media:media('board',['灵感画板','材料与色彩']), links:[] },
 { slug:'relay', name:'Relay', monogram:'R', tone:'green', platform:'Command line · 虚构样例', tagline:'让重复的步骤，安静地完成。', article:longArticle.replace('有些工具值得留下','一个命令行工具值得留下')+'\n\n```sh\nrelay collect ./notes --local\nrelay link ./workspace\n```', media:media('terminal',['本地工作区','执行过程','整理结果']), links:[] },
 { slug:'still', name:'Still · 专注的另一种方式', monogram:'S', tone:'violet', platform:'Cross-platform · 虚构样例', tagline:'每次只留一个窗口。', article:'偶尔也想让工具消失。\n\n界面没有很大的主张，只把正在做的事情摆在眼前。这份样文很短，展示一张图与几句话也足够成立的内容。', media:media('clean',['专注视图']), links:[] },
 { slug:'unfinished', name:'未完成的收藏', monogram:'…', tone:'gray', platform:'随手记 · 无媒体样例', tagline:'有些偏好，先记下一个名字。', article:'还没整理好截图，也没有一篇完整的介绍。\n\n先留在这里，等下一次使用时再补上。这也是收藏的一种状态。', media:[], links:[] },
]
export const categories:AssetCategory[] = [
 { slug:'sfm', name:'SFM', english:'Logic & flow', description:'代码、执行顺序与空间里的产线。', direction:'sw' },
 { slug:'blueprints', name:'机械蓝图', english:'Motion & making', description:'从传动开始，把想法搭成一条线。', direction:'se' },
 { slug:'multiblocks', name:'多方块', english:'Structure & scale', description:'模块的排列，也是一种表达。', direction:'ne' },
 { slug:'setups', name:'配置', english:'Small adjustments', description:'那些让下一次开始更轻松的调整。', direction:'nw' },
 { slug:'fragments', name:'其他碎片', english:'Room for more', description:'给还没有归类的东西留一点位置。', direction:'w' },
]
const code = `NAME "A quiet production line"

EVERY 20 TICKS DO
    INPUT FROM "原料仓库"
    OUTPUT TO "加工机器"
END

EVERY 40 TICKS DO
    INPUT FROM "加工机器"
    OUTPUT TO "成品仓库"
END`
const sampleAttachment = { filename:'production-line-example.txt', href:'/samples/production-line-example.txt' }
export const assets:Asset[] = [
 { slug:'quiet-production', category:'sfm', title:'一条安静运转的产线', subtitle:'从原料到成品', kind:'line', description:'让输入、加工与收纳各自有一个明确的位置。先理解空间里的关系，再来看代码。', notes:'三段式生产结构。这里展示的是空间编排与阅读方式，示例代码仅供界面评审，不作为可直接导入的生产配置。', tags:['SFM','自动化','入门'], code, steps:['原料仓库','提取与分配','加工机器','成品仓库'], footprint:'9 × 5 × 4', version:'Minecraft 1.20.1 · 示例', position:{ x:5,y:12,rotate:-5 }, attachment:sampleAttachment },
 { slug:'material-routing', category:'sfm', title:'物料应该去哪里', subtitle:'分流与条件', kind:'code', description:'用一个清楚的判断，把物料送向不同的加工节点。', notes:'将复杂脚本分成较小的段落。先看输入，再看条件，最后检查输出。示例不执行真实 SFM 程序。', tags:['SFM','分流'], code:code.replace('20 TICKS','80 TICKS'), steps:['检查输入','判断库存','选择出口','回到等待'], footprint:'逻辑脚本', version:'示例 v0.2', position:{ x:58,y:28,rotate:4 }, attachment:sampleAttachment },
 { slug:'storage-loop', category:'sfm', title:'留一个缓冲区', subtitle:'循环与收纳', kind:'tower', description:'当速度不一致时，让缓冲区接住多出来的一点。', notes:'把缓存放在加工区旁边，而不是藏在远处。结构有了位置，异常也更容易被发现。', tags:['仓储','缓冲'], code, footprint:'5 × 5 × 7', version:'示例 v0.1', position:{ x:21,y:64,rotate:2 }, attachment:sampleAttachment },
 { slug:'assembly-corner', category:'blueprints', title:'转角处的装配线', subtitle:'传动的空间', kind:'line', description:'将装配线折成一个角，让入口和出口都朝向自己。', notes:'规划时先留出检修通道，再考虑压缩占地。这份展示使用几何结构示意，不包含可导入的 NBT 蓝图。', tags:['Create','装配'], footprint:'11 × 7 × 4', version:'Create · 示例', position:{ x:9,y:18,rotate:-4 } },
 { slug:'press-and-pack', category:'blueprints', title:'压制，然后装箱', subtitle:'一段紧凑的节奏', kind:'tower', description:'压制、等待和输出，在一个小范围内完成。', notes:'用高度换取水平空间。先观察传送关系，再决定操作区应放在哪一侧。', tags:['Create','紧凑'], footprint:'5 × 7 × 8', version:'Create · 示例', position:{ x:57,y:42,rotate:5 } },
 { slug:'mek-tower', category:'multiblocks', title:'把模块向上叠', subtitle:'Mekanism 的结构练习', kind:'tower', description:'把一组多方块的边界、输入口与维护位置分开看。', notes:'示例以空间关系为主，不表示某个模组版本的有效构造。真实材料表和版本要求在后续录入时确定。', tags:['Mekanism','多方块'], footprint:'7 × 7 × 13', version:'Mek · 示例', position:{ x:12,y:16,rotate:-3 } },
 { slug:'modular-floor', category:'multiblocks', title:'一个可以继续扩展的底层', subtitle:'排列的余量', kind:'line', description:'把重复单元排成能继续生长的结构。', notes:'这里先验证平面结构与详情展开。没有附件时，不出现不可用的下载按钮。', tags:['模块化','结构'], footprint:'15 × 9 × 4', version:'示例 v0.3', position:{ x:55,y:50,rotate:4 } },
 { slug:'quiet-defaults', category:'setups', title:'开局之前的几个设置', subtitle:'不再重复调整', kind:'code', description:'把每次都要做的小调整写下来。', notes:'短文本也可以成为一份工程资产。复制入口适合轻量配置，长篇背景并不是必需的。', tags:['配置','随手记'], code:'# Design preview only\nrender_distance = 12\nshow_progress = true\nkeep_workspace = true', footprint:'4 行配置', version:'示例配置', position:{ x:28,y:25,rotate:-2 }, attachment:{ filename:'workspace-example.txt', href:'/samples/workspace-example.txt' } },
]
