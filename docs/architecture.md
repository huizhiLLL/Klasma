# Klasma 技术架构

## 1. 架构目标

已有的“管理录入 → D1 保存 → API 查询 → 前台展示”闭环继续服务软件与工程资产。根据三个集合的实际展示需求，首版采用**混合内容来源**：软件（Tools）与工程资产（Library）由 D1 / R2 + 后台管理；个人作品（Projects）由前端静态注册表、专属 React 组件与构建资源承载。项目继续采用单仓库、单应用、前后端同域部署，避免过早拆分服务。**数据存储方式不决定公开展示模板，三集合共享导航和视觉语言，但不强行共享 CMS。**

## 2. 技术栈

| 层级 | 选择 | 用途 |
| --- | --- | --- |
| 前端 | React + TypeScript | 公开前台、作品定制组件、资源详情、管理后台 |
| 构建与本地开发 | Vite | 快速开发反馈与前端构建 |
| 路由 | 当前使用 History / URL；TanStack Router 为候选 | 后续按页面组织需求决定是否引入 |
| 样式 | 当前为原生 CSS；Tailwind CSS 为候选 | 以设计约束与有限 token 组织样式 |
| 基础交互组件 | 当前为原生控件；Radix UI / shadcn/ui 为候选 | 后台表单、Dialog、Select、上传等基础能力 |
| 常规动效 | Motion for React（待引入与验证） | 布局变化、卡片展开、页面内状态转场 |
| 复杂时间轴 | GSAP（按需） | 多元素协同和特殊转场，首版不强制引入 |
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

**建议的 Projects 实现（具体目录与路由库待实现时确定）：**
- 维护一个类型化作品注册表，存储稳定 `slug`、名称、Logo / 封面、排序以及必要的官网、下载、仓库链接；这些少量信息可以直接保存在前端。
- 每件作品对应独立 React 页面或可延迟加载的组件（如 `features/projects/pages/<Project>/`）。项目内部可按需使用独立样式、媒体与交互技术，不增加通用 CMS 的配置字段来复刻定制体验。
- 作品区的**外层 Logo 切换器、页面容器、上下换场、全局胶囊及 Design Tokens**共用；各作品内容与演示方式独立。下载 / 体验 / GitHub 入口按作品需要呈现。
- 所有作品保留稳定的公开 URL（例如 `/projects/:slug`），支持直接打开、刷新、浏览器前进后退与回到原集合。具体 URL 规划须兼顾既有 `/resource/:slug` 路径的兼容。

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

### 4.2 渐进收缩后端范围

当前实际的 `src/server/db/schema.ts`、Hono API 和 `src/App.tsx` 仍支持 `projects` 资源类型。这是**已有实现，不代表新设计仍需要作品 CMS**。改造时：

1. 先让公开作品区读取静态作品注册表，后台表单停止新增作品类型；不让同一作品同时由静态注册表和 D1 驱动，以免出现两个事实来源。
2. 核查线上是否已有项目资源、外部链接和附件；如有，先制定迁移 / 重定向方案，**不要直接删除 D1 数据或 R2 对象**。
3. 旧 schema、API 及迁移在兼容性未验证前保持可用，是否彻底移除 `projects` 枚举、API 支持与历史数据，放到稳定上线后再决定。避免只为“干净”而制造有风险的数据库迁移。
4. 对项目专属动态能力（例如以后需要实时数据的演示）按需建立**作品专用 API**，不反向要求所有作品接入通用 CMS。

## 5. 前端边界

下方是后续拆分方向，不代表当前已经存在的目录。当前公开页面与后台主要位于 `src/App.tsx`，API 位于 `src/server/index.ts`。独立设计原型位于 `docs/mockups/`，使用原生 HTML、CSS、JavaScript，不接 API、不参与 Vite 正式应用构建；原型技术选择不自动转为正式架构决策。

```text
src/
├── app/
│   ├── routes/          页面路由
│   ├── components/      公共展示组件
│   ├── features/        资源、搜索、筛选等功能
│   ├── animations/      动效与转场协调
│   └── styles/          全局样式与设计变量
├── admin/               管理界面
├── server/
│   ├── index.ts         Worker 入口
│   ├── routes/          Hono API
│   ├── db/              D1、Drizzle 与迁移
│   ├── storage/         R2 操作
│   └── middleware/      身份验证和通用中间件
└── shared/              前后端共享类型
```

公开前台的首页卡片、集合页、资源详情与导航自行设计；后台优先复用成熟组件以降低维护成本。动态资源使用稳定 ID / slug，静态作品也使用稳定 slug；共享元素标识由视觉对象和页面身份决定，不强迫所有展示项来自 D1。作品外壳与具体作品的组件职责分开，避免作品的独立样式或动画影响全局导航。

Motion 负责大多数交互动画，GSAP 只处理确实需要时间轴的场景，CSS 负责普通 hover、focus 和颜色过渡。不要让 Motion 与 GSAP 同时控制同一个元素的 `transform`。

## 6. 关键约束

- API 与存储逻辑不依赖具体前台视觉组件，便于之后重做 UI。
- 作品页静态内容可随代码部署；软件和工程资产可通过后台独立更新。区分「部署时构建」与「运行时读取」，不要用一个通用录入模型覆盖所有内容。
- 所有资源使用稳定 `slug` 或资源 ID，避免分享链接随布局调整失效。
- 外部链接和 R2 文件都通过统一的资源附件模型展示。
- 管理 API 不能只依赖前端隐藏页面，必须在 Worker 层校验身份。
- 初期不引入微服务、独立搜索服务或复杂事件系统。
