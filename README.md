# Klasma

Klasma 是一个个人精选资源库和作品展示站，包含 Tools、Projects、Library 三类内容。

## 项目文档

- [项目定位与需求](docs/project.md)
- [架构与技术边界](docs/architecture.md)
- [路线与决策](docs/roadmap.md)
- [UI/UX 设计约束](docs/design.md)
- [前台入口与验证](docs/frontend-preview.md)
- [正式前端实施记录](docs/frontend-implementation.md)
- [设计过程与评审记录](docs/design-process.md)
- [独立布局与交互原型](docs/mockups/README.md)

## 本地开发

```powershell
npm ci
npm run dev
```

开发入口由 Vite 提供。用 `npm run build` 构建，再用 `npm run preview` 预览 `dist`。

## 录入内容

- 软件维护在 `src/app/data/tools.ts`，工程资产维护在 `src/app/data/library.ts`，按数组顺序展示。正文支持 Markdown，更新时可以先整理 Markdown 和原始素材，再把内容编排进对应文件。
- 图片和小附件放在 `public/content/`，按集合和 slug 分目录，例如 `public/content/tools/mole/`。页面使用 `/content/tools/mole/icon.png` 这样的路径。大附件可继续使用可信的外部分发链接。
- 作品通过 `src/app/features/projects/registry.ts` 登记，并在同目录下的 `pages/` 中维护专属展示。
- 提交的内容会随构建发布。草稿留在本地，已分享的 slug 应保持稳定。

## 验证

```powershell
npm run typecheck
npm run lint
npm test
npm run verify:frontend
npm run build
```

`verify:frontend` 在 Node 中渲染组件并检查资源。路由、渲染和浏览器验证的覆盖边界见 [前台验证](docs/frontend-preview.md)。

## 发布

推送 `master` 后，GitHub Actions 执行上述检查并用 Wrangler 把 `dist` 发布到 Cloudflare Workers Static Assets。站点项目为 `klasma`，正式域名为 `klasma.huizhi.ink`。GitHub Actions 使用 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。

已登录目标 Cloudflare 账号时，也可通过 `npm run cf:deploy` 手动构建并发布。部署前可用 `npx wrangler deploy --dry-run` 检查配置和资源目录。

需要回滚时，在 Cloudflare 的 `klasma` 部署历史选择上一版。首次静态迁移前的源码为 `53264af`，对应部署版本为 `d3db2a1f-d5c2-4e37-8741-3fed83f9c6d1`。旧 D1 / R2 资源保留供历史版本回滚。若回滚后需要继续从 Git 发布旧版，同步还原对应源码与工作流。
