# Klasma 技术架构

## 构建与部署

Klasma 是 React / TypeScript 单页应用，由 Vite 构建为 `dist`。页面使用原生 CSS、原生 `dialog`、History API 和 Motion for React。Markdown 由 Marked 解析、DOMPurify 净化。

`wrangler.jsonc` 将 `dist` 发布到 Cloudflare Workers Static Assets，沿用 `klasma` 项目和 `klasma.huizhi.ink`。`single-page-application` 回退让集合与详情 URL 能直接访问和刷新，再由客户端解析分类和 slug。GitHub Actions 在 `master` 上完成检查、构建和发布。

## 内容来源

| 集合 | 数据来源 | 顺序与媒体 |
| --- | --- | --- |
| Tools | `src/app/data/tools.ts` | 数组顺序决定 Dock 顺序，每项维护图标、截图尺寸与顺序、正文和链接 |
| Library | `src/app/data/library.ts`、`categories.ts` | 分类固定，内容按数组顺序进入分类场景，每项可包含正文、代码、图片、链接及附件 |
| Projects | `src/app/features/projects/registry.ts` | 注册表决定顺序，专属 React 展示组件按作品延迟加载 |

`src/app/data/catalog.ts` 在前端同步构建目录和分类场景位置。样例数据供测试使用。正式站点的图片和小附件随 `public/content/` 一起构建，大附件可使用外部分发链接。分享 URL 依赖稳定的 slug。确认可以公开的素材后再提交到仓库。

## 前端边界

- `src/App.tsx` 负责应用壳与路由分发，`src/app/routes.ts` 与 `routing.ts` 负责 URL 和 History 导航。
- `src/app/components/` 提供共享导航、对话框、Markdown 和状态组件，`src/app/features/` 管理各集合的展示与交互。
- 收藏牌、集合标题和导航的共享元素标识由视觉对象和页面身份决定。作品外壳与专属展示组件分开，方便作品各自演进。
- 视觉和可用性约束见 [设计规范](design.md)，实际入口与检查覆盖见 [前台验证](frontend-preview.md)。

## 静态迁移

旧后台、API、数据库迁移及部署绑定已从仓库移除。线上公开数据迁入 Mole 条目及四个原始图片。旧 D1 / R2 资源在 Cloudflare 保留供回滚，操作说明见 [项目入口](../README.md#发布)。
