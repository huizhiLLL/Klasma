# Klasma

Klasma 是一个个人精选资源库和作品展示站，首期包含 Tools、Projects、Library 三类内容。

## 项目文档

- [项目定位与需求](docs/project.md)
- [架构与技术边界](docs/architecture.md)
- [路线与决策](docs/roadmap.md)
- [UI/UX 设计约束](docs/design.md)
- [前台评审入口与覆盖](docs/frontend-preview.md)
- [正式前端实施准备](docs/frontend-implementation.md)：路由、内容边界、首批落地范围与验证方式。
- [设计过程与评审记录](docs/design-process.md)：追溯讨论、候选与历史方案时按需查阅。
- [布局与交互原型](docs/mockups/README.md)：独立运行，不连接 API，也不参与正式应用构建。

项目内的 [Refactoring UI skill](.agents/skills/refactoring-ui/SKILL.md) 用于约束排版、间距、层级等设计质量，适用解释见设计文档。

## 本地开发

```powershell
npm install
npm run dev
```

公开前台默认读取本地 mock 内容，不依赖 Worker；评审入口、示例与验证限制见 [前台评审](docs/frontend-preview.md)。`/admin` 继续使用真实管理 API，不会修改公开样例。

前端由 Vite 提供。管理页开发需要另外启动 Worker API：

```powershell
npm run cf:dev
```

验证命令：

```powershell
npm run typecheck
npm run lint
npm test
npm run verify:frontend
npm run build
```

`verify:frontend` 在 Node 中渲染组件并检查本地资源，不运行浏览器。

## Cloudflare 资源

- Worker：`klasma`
- D1：`klasma-db`
- R2：`klasma-assets`

首次初始化或更新 D1 schema：

```powershell
npx wrangler d1 migrations apply klasma-db --remote
```

构建和部署前端与 Worker：

```powershell
npm run cf:deploy
```

部署前请确认当前 Wrangler 登录到了目标 Cloudflare 账号。

## GitHub Actions 自动部署

推送到 `master` 会自动执行类型检查、构建、D1 迁移和 Worker 部署。仓库需要配置以下 Actions Secrets：

- `CLOUDFLARE_API_TOKEN`：用于部署的 Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`：`425afec50d33b391420f5a8652fcab50`

本机 Wrangler 的 OAuth 登录凭据不会复制到 GitHub Actions。
