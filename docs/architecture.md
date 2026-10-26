# Klasma 技术架构

## 1. 架构目标

首版需要快速跑通“管理录入 → D1 保存 → API 查询 → 前台展示”的闭环，同时为后续的 UI/UX 打磨、共享元素转场和资源类型扩展保留空间。项目采用单仓库、单应用、前后端同域部署，避免过早拆分服务。

## 2. 技术栈

| 层级 | 选择 | 用途 |
| --- | --- | --- |
| 前端 | React + TypeScript | 公开前台、资源详情、管理后台 |
| 构建与本地开发 | Vite | 快速开发反馈与前端构建 |
| 路由 | TanStack Router | 类型安全的客户端路由 |
| 样式 | Tailwind CSS + 原生 CSS 变量 | 快速搭建基础样式，同时保留视觉自由度 |
| 基础交互组件 | Radix UI / shadcn/ui | 后台表单、Dialog、Select、上传等基础能力 |
| 常规动效 | Motion for React | 布局变化、卡片展开、页面内状态转场 |
| 复杂时间轴 | GSAP（按需） | 多元素协同和特殊转场，首版不强制引入 |
| 后端运行时 | Cloudflare Workers | API、鉴权边界和文件操作 |
| API 框架 | Hono | 路由、中间件和请求处理 |
| 数据库 | Cloudflare D1 + Drizzle ORM | 元数据、标签、关系和迁移 |
| 文件存储 | Cloudflare R2 | 蓝图、脚本附件、图片和其他二进制文件 |
| 后台鉴权 | Cloudflare Access | 保护 `/admin` 与管理 API |
| 外部分发 | GitHub Releases、OpenList、官方网站 | 保留已有文件分发渠道 |

React + Vite 首版按 SPA 实现。公开资源详情页的 SEO 和社交分享需求明确后，再评估 SSR 或服务端生成元信息，不为尚未验证的需求提前引入 Next.js 等复杂框架。

## 3. 部署形态

前端静态资源和 API 放在同一个 Cloudflare 项目中，通过 Workers Static Assets 与 Worker 路由统一部署。公开读取接口保持开放；管理页面和管理写入接口同时受到 Cloudflare Access 保护，并在 Worker 内再次校验身份信息。

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

## 4. 数据模型方向

使用通用资源表承载共享字段，再通过关联表和类型专属数据承载差异。

```text
resources
├── id
├── type             tools | projects | library
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

## 5. 前端边界

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

公开前台的首页卡片、列表、详情页和导航自行设计；后台优先复用成熟组件以降低维护成本。组件使用稳定的资源 ID，为将来的 Motion `layout` / `layoutId` 共享元素转场保留挂载和标识基础。

Motion 负责大多数交互动画，GSAP 只处理确实需要时间轴的场景，CSS 负责普通 hover、focus 和颜色过渡。不要让 Motion 与 GSAP 同时控制同一个元素的 `transform`。

## 6. 关键约束

- API 与存储逻辑不依赖具体前台视觉组件，便于之后重做 UI。
- 所有资源使用稳定 `slug` 或资源 ID，避免分享链接随布局调整失效。
- 外部链接和 R2 文件都通过统一的资源附件模型展示。
- 管理 API 不能只依赖前端隐藏页面，必须在 Worker 层校验身份。
- 初期不引入微服务、独立搜索服务或复杂事件系统。
