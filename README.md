# Klasma

Klasma 是一个个人精选资源库和作品展示站，首期包含 Tools、Projects、Library 三类内容。

## 本地开发

```powershell
npm install
npm run dev
```

前端默认由 Vite 提供。Worker API 使用 Wrangler：

```powershell
npm run cf:dev
```

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
