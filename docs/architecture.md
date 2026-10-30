# Klasma 技术架构

## 1. 架构目标

已有的“管理录入 → D1 保存 → API 查询 → 前台展示”闭环继续服务软件与工程资产。根据三个集合的实际展示需求，首版采用**混合内容来源**：软件（Tools）与工程资产（Library）由 D1 / R2 + 后台管理；个人作品（Projects）由前端静态注册表、专属 React 组件与构建资源承载。项目继续采用单仓库、单应用、前后端同域部署，避免过早拆分服务。**数据存储方式不决定公开展示模板，三集合共享导航和视觉语言，但不强行共享 CMS。**

本轮公开前台为 mock 评审模式：Tools / Library 通过本地 catalog 读取，Projects 使用静态样例。下文 D1 / R2 是真实内容接入后的目标来源；后台现有 API 保持独立可用。用户确认无需旧数据与旧路由兼容，本轮不进行远程清理。

## 2. 技术栈

| 层级 | 选择 | 用途 |
| --- | --- | --- |
| 前端 | React + TypeScript | 公开前台、作品定制组件、资源详情、管理后台 |
| 构建与本地开发 | Vite | 快速开发反馈与前端构建 |
| 路由 | History / URL + useSyncExternalStore | 选中项、查询参数与浏览器历史同步 |
| 样式 | 原生 CSS + 有限语义 token | 公开浅色主题与独立后台作用域 |
| 基础交互组件 | 原生控件与 dialog | 表单、模态背景隔离、Escape 与焦点恢复 |
| 常规动效 | Motion for React | 布局变化、卡片展开、页面内状态转场 |
| 复杂时间轴 | 暂不引入 | 现有转场由 Motion 与 CSS 负责 |
| 后端运行时 | Cloudflare Workers | API、鉴权边界和文件操作 |
| API 框架 | Hono | 路由、中间件和请求处理 |
| 数据库 | Cloudflare D1 + Drizzle ORM | 软件与工程资产元数据、标签、关系和迁移 |
| 文件存储 | Cloudflare R2 | 蓝图、脚本附件、图片和其他二进制文件 |
| 后台鉴权 | 当前支持 ADMIN_KEY；Cloudflare Access 为目标 | 保护 `/admin` 与管理 API，Access 尚待配置和完整验证 |
| 外部分发 | GitHub Releases、OpenList、官方网站 | 保留已有文件分发渠道 |

React + Vite 首版按 SPA 实现。公开资源详情页的 SEO 和社交分享需求明确后，再评估 SSR 或服务端生成元信息，不为尚未验证的需求提前引入 Next.js 等复杂框架。

## 3. 部署形态

前端静态资源和 API 放在同一个 Cloudflare 项目中，通过 Workers Static Assets 与 Worker 路由统一部署。公开读取接口保持开放，当前管理界面支持密钥输入，Worker 支持 `ADMIN_KEY` 校验；密钥仅由环境 Secret 提供，不写入仓库。Cloudflare Access 仍为目标方案，需落实配置与可信身份验证，不能将请求中身份头的存在直接视为已验证身份。以下示意图描述 Access 落地后的目标边界。

```text
Browser
  ├─ public pages ───────────────┐
  └─ /admin ── Cloudflare Access ─┤
                                  ↓
                         Cloudflare Worker + Hono
                           ├─ public API
                           ├─ admin API
                           ├─ D1 metadata
                           └─ R2 assets
                                  ↓
                    GitHub Releases / OpenList / external sites
```

## 4. 按内容类型确定数据来源

| 公开集合 | 首版内容来源 | 管理方式 | 展示自由度 |
| --- | --- | --- | --- |
| Tools / What I prefer | D1 元数据 + R2 或外部媒体 | 后台 GUI 录入、编辑、发布 | 统一 Dock 展台框架，内容可差异化编排 |
| Projects / What I make | 前端静态注册表 + 项目专属 React 组件及静态资源 | 通过代码、Git 与部署维护，不要求后台录入 | 共同作品切换外壳，内部充分定制 |
| Library / What I keep | D1 元数据 + R2 或外部资源 | 后台 GUI 录入、编辑、发布 | 场景与运镜逻辑在前端，资源内容从 API 获取 |

**已确认的边界：** 作品数量较少、内部体验高度异构，不开发通用作品内容编辑器；软件与工程资产具有较高的重复字段和后续录入需求，继续使用轻量后端。

**当前 Projects 实现：**
- 维护一个类型化作品注册表，存储稳定 `slug`、名称、Logo / 封面、排序以及必要的官网、下载、仓库链接；这些少量信息可以直接保存在前端。
- 每件作品对应独立 React 页面或可延迟加载的组件（`src/app/features/projects/pages/`）。项目内部可按需使用独立样式、媒体与交互技术，不增加通用 CMS 的配置字段来复刻定制体验。
- 作品区的**外层 Logo 切换器、页面容器、上下换场、全局胶囊及 Design Tokens**共用；各作品内容与演示方式独立。下载 / 体验 / GitHub 入口按作品需要呈现。
- 所有作品保留稳定的公开 URL（例如 `/projects/:slug`），支持直接打开、刷新、浏览器前进后退与回到原集合。旧 `/resource/:slug` 与 `?type=` 导航已移除，不提供兼容重定向。

### 4.1 动态内容模型

软件与工程资产继续使用现有的通用资源表和关联表，并依需要补充类型字段；展示不因此被统一成列表或固定详情模板。

```text
resources
├── id
├── type             tools | projects | library  # 当前 schema；后续新录入以 tools / library 为主
├── slug
├── title
├── summary
├── content
├── cover_asset_id
├── metadata         JSON，类型专属字段
├── status           draft | published
├── featured
├── created_at
└── updated_at

tags
resource_tags

resource_links
├── resource_id
├── kind             website | github | download | article | other
└── url

resource_assets
├── resource_id
├── filename
├── storage_type     r2 | external
├── location
├── mime_type
└── metadata         JSON
```

类型专属信息先放入 `metadata`，等筛选和查询需求稳定后，再将高频字段提升为正式列或独立关系表。小型文本内容（例如 SFM 代码或 Mermaid 源码）可以直接保存以便搜索、编辑和复制；较大的二进制文件放到 R2 或继续使用外部渠道。

### 4.2 后端范围

当前数据库 schema 和 API 仍支持 `projects` 资源枚举；公开作品区只读静态注册表，后台新建只提供软件与工程资产。用户已明确早期开发不需要兼容旧数据 / URL，不为动态作品构建迁移或公开回读层。本轮不修改 schema、不删除远程记录和对象；后续确需调整持久化结构时独立审查。

作品专属动态能力按实际需求建立专用 API，不反向要求所有作品接入通用 CMS。

## 5. 前端边界

当前已经实现的前端职责如下，完整索引见 `AGENTS.md`。独立原型保留在 `docs/mockups/`，不参与正式构建。

```text
src/
├── App.tsx                  路由分发与应用级 MotionConfig
├── app/
│   ├── routes.ts            路径解析与稳定 URL
│   ├── routing.ts           History 导航与订阅
│   ├── pages/HomePage.tsx   身份与收藏牌
│   ├── components/          集合导航、原生 Dialog、Markdown、反馈与示意图
│   ├── data/                内容模型、完整 mock 与 catalog 读取边界
│   ├── features/tools/      媒体、预览、阅读层与 Dock
│   ├── features/library/    分类几何、空间场景、URL 详情与顺序示意
│   ├── features/projects/   静态注册表、切换外壳和 pages/ 专属组件
│   ├── animations/          动效与输入方式降级
│   └── styles/              token、公开布局、示意素材
├── admin/                   现有 API 管理页与独立样式
├── server/                  Hono 入口与 db/
└── shared/resource.ts       现有 API 资源类型
```

`public/fonts/` 存正式完整 unicode 字体分片与许可，`public/icons/lucide/` 存统一图标，`public/samples/` 提供真实可下载的示例文本。`scripts/prepare-app-fonts.py` 从官方来源准备字体；不依赖原型字体缓存。作品内部模块独立延迟加载，后台单独分包。

公开路由、mock 边界、实现顺序见 `frontend-implementation.md`；覆盖矩阵与验证限制见 `frontend-preview.md`。服务端渲染检查不代表浏览器视觉、焦点、滚动与动效已验收。

公开前台的首页卡片、集合页、资源详情与导航自行设计；后台优先复用成熟组件以降低维护成本。动态资源使用稳定 ID / slug，静态作品也使用稳定 slug；共享元素标识由视觉对象和页面身份决定，不强迫所有展示项来自 D1。作品外壳与具体作品的组件职责分开，避免作品的独立样式或动画影响全局导航。

Motion 负责页面共享元素与内容进出；资产条目到原生 dialog 的标题、媒体使用 View Transition 分时快照与 flushSync，避免跨顶层的投影裁剪，快速改选使旧回调失效。不支持原生快照时静态导航。CSS 负责普通 hover、focus 和颜色过渡。键盘输入与 reduced motion 关闭大位移动效，小屏不播放长距离共享元素；退场内容立即 inert，避免快速选择产生多套可操作控件。原生 dialog 提供背景隔离，组件负责 Escape 关闭与焦点恢复。

## 6. 关键约束

- API 与存储逻辑不依赖具体前台视觉组件，便于之后重做 UI。
- 作品页静态内容可随代码部署；软件和工程资产可通过后台独立更新。区分「部署时构建」与「运行时读取」，不要用一个通用录入模型覆盖所有内容。
- 所有资源使用稳定 `slug` 或资源 ID，避免分享链接随布局调整失效。
- 外部链接和 R2 文件都通过统一的资源附件模型展示。
- 管理 API 不能只依赖前端隐藏页面，必须在 Worker 层校验身份。
- 初期不引入微服务、独立搜索服务或复杂事件系统。
