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
