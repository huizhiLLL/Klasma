# 正式前台 mock 评审

## 运行

`npm install` 后运行 `npm run dev`，以终端输出的本地地址为准。公开页面完全使用本地示例，不需要启动 Worker。访问 `/admin` 时仍需 `npm run cf:dev` 与本地管理配置；后台内容不影响公开样例。

## 入口与覆盖

| 入口 | 重点 |
| --- | --- |
| `/` | 三张浅色收藏牌、个人身份、右上说明词、两条独立共享元素路径 |
| `/tools/mole` | 多媒体、长文预览与阅读全文、真实官网入口；画面和文章是自拟样例 |
| `/tools/folio` | 两张媒体、短文 |
| `/tools/relay` | 终端风格、多图、长文与代码 |
| `/tools/still` | 长标题、单媒体 |
| `/tools/unfinished` | 无媒体、短文 |
| `/projects/folio` | 素材选择、展开与重排 |
| `/projects/relay` | 参与式流程展示 |
| `/projects/little-board` | 点亮、外壳拆分、观察角度 |
| `/library` | 五类披萨、悬停或聚焦预览；触屏先预览再进入 |
| `/library/sfm` | 三个空间条目、代码与产线结构 |
| `/library/sfm/quiet-production` | 直达详情、流程顺序示意、复制与文件下载 |
| `/library/blueprints`、`/library/multiblocks` | 不同场景方位、无附件详情 |
| `/library/setups/quiet-defaults` | 短配置、复制和下载 |
| `/library/fragments` | 空分类 |
| `/tools/not-found`、`/projects/not-found`、`/library/not-found` | 选项不存在 |

集合页底部“查看其他状态”可切换 `?preview=empty`、`?preview=error`、`?preview=loading`，返回完整内容时删除参数。这些是确定性的评审状态，不伪造网络请求和等待时间。首页仍保持完整牌阵。

## 评审边界

- 所有作品均为虚构样例，所有媒体均为 DOM / CSS 自拟示意。Mole 使用真实官网链接，文章不是测评，也不引用作者实际观点。正式 logo、截图和个人作品等待后续替换。
- 字体为官方完整 unicode 分片，自托管、按需加载；不是原型固定字集缓存。`public/fonts/sources.json` 保存来源与 SHA-256，许可随字体保留。
- SFM 只演示人工编排的顺序，不执行代码；结构图是几何示意，不解析 NBT，也不保证对应实际有效多方块。下载文件均明确标注示例。
- 已提供响应式样式、原生 modal、Escape、焦点恢复、背景隔离、键盘和 reduced motion 降级。实际移动端重排、动效、阅读溢出、原生 dialog 与屏幕阅读器表现仍需浏览器评审。
- Blog / Weekly 未配置地址，显示为未开放文字，不生成假链接。

## 本轮验证（2026-10-29）

- 类型检查、lint、Node 逻辑测试与生产构建。
- `npm run verify:frontend`：38 次组件服务端渲染，检查完整样例与异常状态、History 去重 / 查询变更 / replace / 滚动保留、337 条字体清单哈希、图标与下载文件。
- 不运行浏览器自动化或截图；服务端渲染不作为视觉验收证据。
- 未推送、未部署、未进行远程数据库迁移或资源写入。

## 后续工程项

先评审页面，再接软件和工程资产真实 API，并逐一替换样例作品。Access 鉴权、真实 SFM 跟踪、NBT / 3D 解析不属于本轮实现。

依赖检查另发现已有 `drizzle-orm <0.45.2` 的高危公告（`npm audit --omit=dev` 为 1 项），不是 Motion 引入。本轮未改后端依赖或持久化结构；接真实后端前应独立升级并验证查询与迁移。
