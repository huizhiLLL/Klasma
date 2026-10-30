# Klasma 项目协作约束

开发沟通、分析、计划和变更说明默认使用中文；代码和项目文档沿用仓库规范。任务背景、架构和路线分别见 `docs/project.md`、`docs/architecture.md`、`docs/roadmap.md`。

## 目录索引与按需读取

以下为当前实际目录；调整职责或增删主要目录时同步此索引。不要将架构文档中的规划目录当作已经实现的结构。

| 路径 | 用途与读取时机 |
| --- | --- |
| `README.md` | 项目入口、文档导航、本地开发与部署使用方式 |
| `AGENTS.md` | 协作约束与目录索引 |
| `docs/project.md` | 产品定位、功能需求与当前状态；理解任务背景时读取 |
| `docs/architecture.md` | 技术栈、架构边界、数据与部署约束；技术实现前按需读取 |
| `docs/roadmap.md` | 阶段计划、进展与工程决策；推进阶段任务时读取 |
| `docs/frontend-implementation.md` | 正式前端实施边界、当前路由、文件职责与验收；开始前台落地时读取 |
| `docs/frontend-preview.md` | 正式前台 mock 评审入口、覆盖矩阵与验证边界 |
| `docs/design.md` | 仅记录已确认的设计点与约束；UI 工作默认依据 |
| `docs/design-process.md` | 设计时间线、参考、候选、未决问题和历史方案；仅追溯或继续相关讨论时读取，不默认载入全文 |
| `docs/design-assets/` | 用户设计草图：软件 Dock、作品切换、工程资产全局与分类场景；对应布局评审时查看 |
| `docs/mockups/` | 独立设计原型与主题稿，具体入口见下表；不接入正式应用构建 |
| `.agents/skills/refactoring-ui/` | `SKILL.md` 为设计质量约束，`SOURCE.md` / `LICENSE` 为来源与许可 |
| `src/main.tsx`、`src/App.tsx` | React 入口与路由分发 |
| `src/app/routes.ts`、`src/app/routing.ts` | 新 URL 解析、导航与 History 订阅；不兼容旧路由 |
| `src/app/components/` | 集合外壳、链接、原生 Dialog、Markdown、状态反馈与示意素材 |
| `src/app/pages/HomePage.tsx` | 个人身份与三张收藏牌首页 |
| `src/app/styles/`、`src/app/animations/` | 公开前台 token、布局、示意素材样式与动效降级；`wordWheel.ts` 为连续滚轮，`assetTransition.ts` 为跨原生 dialog 的共享快照 |
| `src/admin/AdminPage.tsx` | 管理后台；新建软件 / 工程资产，保留历史作品编辑 |
| `src/shared/resource.ts` | 现有动态资源类型与兼容边界 |
| `src/app/data/` | 公开前台内容模型、mock fixtures、catalog 数据边界与预览状态 |
| `public/samples/` | 明确标记为示例的文本下载附件，不写入 D1 / R2 |
| `src/app/features/tools/` | 固定媒体、文案预览、全文阅读层与 Dock |
| `src/app/features/library/` | 披萨分类、预览、空间场景、详情与分类几何 |
| `src/app/features/projects/` | 静态注册表、作品切换外壳与独立延迟加载的 `pages/` |
| `public/fonts/`、`public/icons/lucide/` | 正式字体分片、图标与来源许可 |
| `scripts/` | 正式字体准备与无浏览器前台渲染验证 |
| `tests/` | 路由、内容、分类几何、作品下载、滚轮与快照生命周期的 Node 逻辑测试 |
| `src/index.css` | 应用中性重置与全局基础 |
| `src/assets/`、`public/` | 应用导入素材与静态公共资源 |
| `src/server/index.ts`、`src/server/types.ts` | Hono Worker API 入口、环境绑定与服务端类型 |
| `src/server/db/client.ts`、`src/server/db/schema.ts` | D1 / Drizzle 数据库客户端与表结构 |
| `drizzle/migrations/` | SQL 迁移；持久化结构变更前检查 |
| `package.json`、`package-lock.json` | npm 脚本、依赖声明与锁定 |
| `index.html`、`vite.config.ts` | 正式前端 HTML 入口与构建配置 |
| `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json` | TypeScript 项目、前端与工具配置 |
| `.oxlintrc.json` | 静态检查配置 |
| `drizzle.config.ts`、`wrangler.jsonc` | 数据库迁移工具、Worker / D1 / R2 / 静态资源配置 |
| `.github/workflows/deploy.yml` | GitHub 推送后的检查与 Cloudflare 部署流程 |
| `.gitignore` | 本地产物与缓存的版本控制边界 |

### 独立设计产物

| 路径 | 用途 |
| --- | --- |
| `docs/mockups/README.md` | 原型运行方式、交互范围与验证限制 |
| `docs/mockups/index.html`、`styles.css`、`mockup.js` | 五个主视图与详情容器的布局交互原型 |
| `docs/mockups/mobile.html`、`mobile.css`、`mobile.js` | 同一响应式原型的多尺寸手机评审入口 |
| `docs/mockups/theme.html`、`theme.css`、`theme.js` | 随已确认设计持续更新的主题稿；展示字体、色彩、圆角、间距与反馈 |
| `docs/mockups/typography.html`、`typography.css`、`typography.js` | 同素材字体对照样张 |
| `docs/mockups/icons/lucide/` | 主题稿使用的固定来源图标子集；`sprite.svg` 为图标，`SOURCE.md` / `LICENSE` 为来源与许可 |
| `docs/mockups/typography-sample.json` | 自拟排版素材，由字体样张与主题稿共用 |
| `docs/mockups/typography-SOURCES.md`、`prepare-fonts.py` | 字体来源、许可与本地缓存准备方式 |

表中同组文件均位于该行给出的目录。`node_modules/`、`dist/`、`.wrangler/`、`docs/mockups/.font-cache/` 为本地依赖、构建或缓存；`.playwright-cli/`、`output/` 为本地产物目录。默认不读取这些目录来理解项目，也不将其内容提交；`.git/` 由 Git 管理。

## UI/UX 工作

- 进行界面设计讨论、排版、样式、组件、UI 文案或视觉评审前，读取 `docs/design.md` 和项目内 `.agents/skills/refactoring-ui/SKILL.md`，将该 skill 作为设计质量约束。
- `docs/design.md` 只维护已确认设计与约束；详细过程、候选值和未决问题写入 `docs/design-process.md`。每次确认设计点，同步更新有效规范与独立的 `docs/mockups/theme.html` 主题稿及其样式，不能把样张全部参数视作已确认。
- 用户已确认进入正式前端实施阶段：依据 `docs/design.md` 与 `docs/architecture.md` 将已认可方案落地到真实 React 页面；`docs/mockups/` 继续独立保留，不直接接入其脚本或样式。具体 token 试值与响应式细节在实施中验证，不能视作全部定稿。
- 保留已经确认的方向：前台浅色单主题，现代收藏牌式首页，三张牌整体对称、摆放灵动，选牌后通过共享元素过渡展开为集合页。
- Skill 中的模板、配色、布局和数值示例不是项目的最终设计。通用建议与用户已确认的设计冲突时，优先遵守用户意图和 `docs/design.md` 中的决策，并说明具体取舍。
- 间距、字号、行高、圆角、颜色、层级和动效应使用有明确角色的有限 token；先讨论并记录用途与状态，再在实现阶段映射到样式。
- 不将中文标题机械套用拉丁文字的负字距和行高，不为弱化次级信息而牺牲可读性与对比度。
- 浏览器自动化和截图验证仅在用户主动要求时使用，完成后清理临时文件。
- 原型源码保存在 `docs/mockups/`，用户提供的设计草图保存在 `docs/design-assets/`；浏览器日志、快照与截图验证输出保存在已忽略的 `.playwright-cli/` 和 `output/playwright/`，不提交到仓库。
