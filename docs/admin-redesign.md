# 后台 UI 改进方案（交付 Codex）

依据：`src/admin/AdminPage.tsx`、`src/admin/admin.css`、`src/app/styles/tokens.css` 与三张后台截图（软件列表、新建软件、新建工程资产）。
建议放入仓库 `docs/admin-redesign.md`。

> 截图为 1.5 倍屏，截图里的像素除以 1.5 才是 CSS 像素。

## 0. 先读、边界、禁区

**开始前读取**（AGENTS.md 要求 UI 工作先读）：`docs/design.md`、`.agents/skills/refactoring-ui/SKILL.md`、`docs/admin.md`。

**只改后台视觉与结构**，不改：

- API、数据模型、`src/shared/*`、`src/server/*`。
- `publicationErrors` 返回的提示文案。
- 公开前台样式与 `src/app/styles/tokens.css`。后台新增 token 只写在 `.admin-app` 作用域内。
- 不新增 npm 依赖，不换字体。

**必须保持的行为**（任何一条回归都算失败）：

- 30 天会话、登录与退出确认。
- 未保存离开保护：`installEditorGuard`、`leave()`、各处 `window.confirm` 文案。
- 新资源首次上传前自动存草稿；Slug 随名称自动生成。
- 主保存时一并提交 `assetEdits`；上传失败的“重试上传”。
- 发布条件由 `publicationErrors` 决定；`projects` 标签页仅在已有历史作品时出现。
- `<div hidden={!authenticated}>` 包裹、`fieldset disabled`、编辑器 `key` 重挂载。
- 现有 `aria-label`、`role`、`title` 语义。可以改成可见文字，但不能丢可访问名称。
- `scripts/verify-frontend.mjs` 会 SSR 渲染 `AdminPage` 并断言出现“正在检查登录状态”。渲染期不得访问 `window` / `document`，该文案不变。

**视觉禁区**（防止“设计感”失控）：

- 不加阴影（面板不要，仅保留既有 `--shadow-lift` 给弹窗）。
- 不加渐变，唯一例外是 §2 的顶部淡蓝底。
- 不用 emoji，不加插画和装饰动效，不新增 §2 之外的颜色。
- 不用 `!important`，现有的除 `[hidden]` 外全部清掉。
- 中文不加负字距。
- 文案克制：不写说教句、不写“请注意”式提示。

## 1. 诊断（按严重程度）

### P0：明显 bug，先修

| # | 现象（截图） | 根因（代码） | 修法 |
| --- | --- | --- | --- |
| 1 | 编辑页右上角“发布”几乎看不见 | `.admin-editor-bar .admin-icon-button{background:transparent;border-color:transparent}` 与 `.admin-app .admin-primary` 同权重且写在后面，主按钮底色被盖掉，白字落在白底上 | 发布按钮不再复用 `admin-icon-button` 类；见 §2 的按钮体系 |
| 2 | “名称”输入框比“简短说明”矮、顶部不齐，且紧贴下方“媒体与附件”卡片（间距约 0） | `.admin-field` 是 `display:grid`，被 `.admin-basic-grid` 的行高拉伸，输入框吃掉多余高度；`.admin-main-editor` 没有下边距 | 标题区改成纵向堆叠，见 §4.1 |
| 3 | 右侧“发布设置”左缘与“软件信息 / 标签 / 内容检查”不对齐，后三者缩进约 16px | 折叠区 `summary` 自带 `padding-inline:16px`，设置栏的其他分组没有 | 设置栏分组统一零横向内边距，见 §4.3 |
| 4 | 所有折叠区右侧都是“＋” | 折叠区只会展开，却用了 `plus` 图标，读起来像“新增” | 换 `chevron-down`，展开时旋转 180° |
| 5 | 设置栏吸附位置被顶栏盖住 | `.admin-editor-settings{position:sticky;top:var(--s2)}` 低于吸顶的 `.admin-editor-bar`（`top:0; z-index:10`）；也没有 `max-height`，侧栏过长时底部够不到 | `top` 改为顶栏高度加间距，并加 `max-height` 与 `overflow:auto` |
| 6 | 正文占位符显示成宋体 | `font-family:ui-monospace,monospace !important`，中文回退到系统衬线字体 | 正文改用 `--font-ui`；仅代码框使用等宽栈，见 §4.2 |
| 7 | 列表页两个标签都是白色方块 | 全局 `.admin-app button` 给所有按钮白底加边框，`.admin-tabs button` 只去了边框没去底色 | 标签页独立 `.admin-tab`，透明底，见 §3 |
| 8 | 主区左缘比顶栏分隔线内缩约 4px | `.admin-editor-content{padding-inline:4px}` | 删除 |

### P1：整体观感差的原因

1. **层级是平的。** 所有区块都是同款“卡片 + 边框 + 18px 粗标题”，没有主次。
2. **卡片发灰。** `--card-surface` 是 `rgb(252 253 254 / .64)`，叠在灰色 canvas 上变成脏灰。
3. **字重过多。** 字段标签 550 + 分组标题 650 + 28px 页面标题，到处都是粗体。
4. **按钮一律带边框。** 列表里的“编辑”、顶栏的“查看前台 / 退出”权重与主按钮接近。
5. **控件偏重。** 输入框 44px 高、深灰边框 `#7b8796`、8px 圆角，整页像一堆框。
6. **列表行无辨识信息。** 没有缩略图，状态只是蓝字，没有分类线索。
7. **“内容检查 · 3 项待处理”** 在新草稿上就报警，但这些只是发布前提，不是错误。
8. **预览用弹窗。** 写正文和看效果被来回打断。
9. **ⓘ 提示靠 `title`。** 触屏看不到，应改为页内说明。
10. **间距不成体系。** 12 / 16 / 24 混用，有的区块相贴，有的相隔很远。

## 2. 视觉体系

延续现有 Mica 式浅色：白 / 淡蓝、蓝色主操作、Manrope + MiSans。方向是**更轻、更静、层级清楚**。

### 2.1 后台 token（写在 `.admin-app` 内）

```css
.admin-app {
  --admin-wash: linear-gradient(180deg, #eef3fb 0, var(--canvas) 320px); /* 页面顶部淡蓝，唯一的渐变 */
  --admin-panel: var(--surface);          /* 面板用实色，不再用半透明 --card-surface */
  --admin-hairline: var(--border);
  --admin-field-border: #8a95a4;          /* 约 3:1，控件边界仍可辨识 */
  --admin-field-border-hover: #5f6b7a;
  --admin-radius-panel: 12px;
  --admin-control-h: 40px;                /* @media (pointer:coarse) 取 44px */
  --admin-bar-h: 56px;
  --admin-ok: #155c3b;    --admin-ok-soft: #eef9f2;
  --admin-warn: #8a5a00;  --admin-warn-soft: #fff6e0;
  --admin-danger: #ae302b;
  background: var(--admin-wash), var(--canvas);
}
```

`ok`、`warn`、`danger` 只用于状态点、检查项图标、提示条，不作大面积填充。

### 2.2 字号

| 角色 | 规格 |
| --- | --- |
| 列表页标题 `h1` | 24 / 1.3 / 600 |
| 编辑页顶栏标题 | 16 / 600 |
| 分组标题 `h2` | 15 / 1.4 / 600 |
| 字段标签 | 13 / 1.4 / 500，色 `--muted` |
| 正文与控件 | 14 / 1.5 |
| 元信息 | 12 / 1.4，色 `--muted`；日期用 `font-variant-numeric:tabular-nums` |

### 2.3 间距

只用既有 token `--s1…--s8`。

- 面板内边距 16。
- 面板内字段间距 12。
- 面板之间 16。
- 页面上下 32。
- 不再出现“相贴”或“临时 24px”。

### 2.4 按钮体系

取代 `.admin-primary` / `.admin-danger` / `.admin-icon-button` 三个互相打架的类：

| 类 | 用途 | 样式 |
| --- | --- | --- |
| `.admin-btn` | 次要（默认） | 1px `--admin-hairline`、`--surface` 底、高 `--admin-control-h` |
| `.admin-btn--primary` | 每屏最多一个主操作 | `--accent` 底，白字 |
| `.admin-btn--ghost` | 顶栏、行内、工具 | 透明底，无边框，hover 用 `--accent-soft` |
| `.admin-btn--danger` | 删除 | 透明底，文字 `--admin-danger` |
| `.admin-btn--icon` | 只有图标 | 正方形，需 `aria-label` |

规则：

- 基础按钮样式用 `:where(.admin-app) .admin-btn`（特异度压到最低），变体只用单类选择器。这样不会再出现层叠覆盖。
- 最近一次提交就是“修正后台折叠区样式层叠覆盖”，同类问题不要再制造。

### 2.5 表单控件

- 高 40px，触屏 44px。
- 边框 `--admin-field-border`，hover 加深到 `--admin-field-border-hover`，focus 沿用现有蓝边加 3px 淡蓝环。
- 标签 13px / 500 / `--muted`，不再加粗。
- `select`：`appearance:none` 加 Lucide chevron 作背景图。内联 data URI 即可：`m6 9 6 6 6-6`，stroke `#596575`，右内边距 36px。

## 3. 列表页

截图 1 的结构保留，处理层级和细节。

**顶栏**：

- 左侧 `Klasma / 内容管理` 不变。
- 右侧“查看前台”改为 `ghost` 加 `arrow-up-right` 图标，“退出”为 `ghost`，高 36px。
- 登录前仍只显示这一条栏。

**标签页**：

- 新增 `.admin-tab`：透明底、无边框、14px。选中为 `--ink` 色加 2px `--accent` 下划线；未选中为 `--muted`，hover 变 `--ink`。
- 标签带数量，例如 `软件 1`，数字用 `--muted`。
- 去掉当前的白色方块。

**页面标题行**：

- `h1` 24px，右侧“新建软件”为 `primary`，前置 `plus` 图标（替换现在的全角“＋”字符）。
- 删除“共 N 条内容”这一行，数量已在标签页上。

**工具条**：

- 搜索框带前置 `search` 图标：外包 `.admin-search`，`position:relative`，输入框 `padding-left:36px`。
- 搜索框与两个（资产页三个）`select` 同高 40px，同一行，间距 8px。

**列表行**：

网格 `40px | minmax(0,1fr) | auto | 72px | 20px`，整行可点击，行距 16px，hover 底色 `--accent-soft`。

- **缩略图** 40×40，圆角 8，`object-fit:cover`。
  - 优先取 `assets` 中 `kind==='icon'` 的图。
  - 其次 `cover`，再次 `screenshot`。
  - 都没有时，用名称首字、`--muted` 色、`--canvas` 底做占位。
- **名称** 15 / 600；下一行 `summary || slug`，12px / `--muted`，单行省略。资产在前面加分类名：`SFM · 摘要…`。
- **状态胶囊**：高 24px、圆角 999、12px / 500，前置 6px 圆点。
  - 已发布：`--accent-soft` 底、`--accent-hover` 字、实心点。
  - 草稿：`rgb(89 101 117 / .1)` 底、`--muted` 字、空心点。
- **更新日期**：同年显示 `M月D日`，跨年显示 `YYYY/M/D`，`tabular-nums`。
- **尾部** `chevron-right` 图标，替代“编辑”按钮。
  - 实现：名称做成 `<button>`，用 `::after{position:absolute;inset:0}` 撑满整行，保留键盘与读屏可达性。
  - 行容器 `position:relative`。

**空状态**：

- 没有任何内容：一句“还没有内容”加 `primary` 按钮“新建软件 / 工程资产”。
- 筛选无结果：“没有符合条件的内容。”加 `ghost` 按钮“清除筛选”。

**窄屏（≤760px）**：行改为 `40px | 1fr | 20px`，状态与日期并到第二行文字：`已发布 · 11月6日`。

## 4. 编辑页

两栏结构保留：主区加设置栏，设置栏宽度 `--admin-settings-width: 280px`。

### 4.0 顶栏

```
[←]  新建软件                     ● 未保存    [保存草稿] [发布]
```

- 高 `--admin-bar-h`，`position:sticky; top:0`。
- 底色 `color-mix(in srgb,var(--canvas) 86%,transparent)`，加 `backdrop-filter:blur(12px)`，下边框 hairline。
- 标题单行省略。
- 状态改为“圆点 + 文字”：
  - 处理中：accent 点
  - 未保存：warn 点
  - 已保存：ok 点
  - 新草稿：muted 空心点
- 草稿态：`保存草稿`（次要，`type=submit`）加 `发布`（primary）。
- 已发布态：只有一个 primary `保存`（`type=submit`），“取消发布”留在设置栏。
- **“存档”改名“保存草稿”**，因为“存档”听起来像归档。
- 按钮用可见文字，保留 `aria-label`，去掉与文字重复的 `title`。
- 窄屏：顶栏固定到底部（现有逻辑保留），左侧状态、右侧两按钮，底色用 `--surface`。

提示条（`notice`）：

- 位于顶栏下方，加前置图标：成功 `circle-check`，失败 `circle-alert`，配色用 ok / danger token。
- 可选：成功提示 4 秒后自动消失，失败提示保留。

### 4.1 标题区（不做卡片）

主区最上方两行纵向堆叠，不再两列并排：

1. **名称**：标签 13px；输入 24 / 600，高 52，只保留下边框的“安静”样式（`border:0; border-bottom:1px solid var(--admin-field-border); background:transparent; padding-inline:0`）。focus 时下边框变 accent（用 `box-shadow:inset 0 -1px 0 var(--accent)`，避免布局抖动）。
2. **简短说明**：同样安静样式，`rows=2`，最小高 56，14px。

标题区与下方面板间距 16。这一节同时解决 P0 的 #2。

### 4.2 主区面板

面板统一 `.admin-panel`：`--admin-panel` 实色底、1px hairline、圆角 12，无阴影。

**折叠面板** `Disclosure`（媒体与附件、链接与下载、设置栏分组共用）：

- `summary`：高 48，左右内边距 16，左 `h2`（15 / 600），右 meta 文字（12px，`--muted`）加 `chevron-down`（16px，展开时旋转 180°，过渡 `--motion-feedback`）。
- 展开时 `summary` 下加 hairline，不再给 `summary` 上底色。
- 子内容左右内边距 16。
- 删除 `.admin-app .admin-disclosure>*:not(summary){margin-inline}` 这类靠 margin 补位的写法，改为内容容器自带 padding。
- 保留“上传失败时默认展开”（`open={Boolean(retryFile)}`）。

**详细内容**：

- 标题行右侧换成**分段控件**：`[编辑 | 预览]`，文字按钮，`aria-pressed`，高 28。
  - 容器 `rgb(89 101 117 / .1)` 底、圆角 8、内边距 2。
  - 选中项 `--surface` 底。
  - 不再使用 pencil / eye 两个图标按钮（图标留在 sprite 和 `IconName` 里，不要删除）。
- **预览改为原位**：点“预览”后，用 `<Markdown>` 渲染区替换 textarea，最小高与 textarea 一致。`preview` 状态保留，但不再打开 `Dialog`。`Dialog` 仍用于删除确认。
- textarea：
  - `rows=12`，`min-height:280px`，`max-height:70dvh`，纵向可拖。
  - `font-family:var(--font-ui)`，14px，`line-height:1.7`。
  - 去掉标签“Markdown 正文”：改为视觉隐藏的 `.admin-sr-only`，保留给读屏。
- 工程资产的“工程附加字段”折叠：
  - 用 `Disclosure` 的子级样式（chevron、hairline 上边框）。
  - “代码 / 配置”框用等宽栈 `ui-monospace,'SF Mono',Menlo,Consolas,'MiSans',monospace`，13px，`line-height:1.6`，`tab-size:2`，`white-space:pre; overflow:auto`。

**媒体与附件**：

- 展开后顶部显示一行 12px 说明，替代 `ⓘ`：“上传、说明、排序和删除立即保存。图片支持 PNG、JPEG、WebP、GIF、AVIF，单个最多 25 MB。”
- 上传区：用途 / 说明 / `[选择文件]`。
  - 文件 `<input>` 视觉隐藏，外包 `<label class="admin-btn">`，前置 `upload` 图标。
  - 键盘焦点用 `:focus-within` 画焦点环。
  - 现有 `ref`、`onChange`、`accept` 逻辑原样保留。
  - 可选（P2）：做成虚线拖放区，`onDrop` 调同一个 `upload(file)`。
- “使用外部素材地址”折叠：沿用子折叠样式，chevron。
- 素材行：
  - 缩略图 72px、圆角 8、1px hairline、`--canvas` 底、`object-fit:contain`。
  - 文件名 14 / 500；元信息 12px。
  - 说明与顺序输入。
  - “保存设置”仅在该素材有 `draft` 时可用，否则 `disabled`。
  - “删除”改为 `trash-2` 图标按钮（`danger`，`aria-label="删除 ${filename}"`）。
- 折叠头 meta 显示“N 项”或“暂无”。

**链接与下载**：

- 行网格 `112px | 160px | minmax(0,1fr) | 40px`，末尾“移除”换成 `x` 图标按钮（`aria-label="移除链接 N"`）。
- “添加链接”为 `ghost` 加 `plus` 图标，左对齐。
- 空态 meta 为“暂无链接”。

### 4.3 设置栏

**不做卡片**，分组之间用 hairline 分隔，分组标题 13 / 600 / `--ink`。

- 外层 `position:sticky; top:calc(var(--admin-bar-h) + var(--s4)); max-height:calc(100dvh - var(--admin-bar-h) - var(--s8)); overflow:auto`。
- 分组零横向内边距，与“发布设置”左缘对齐。
- 顺序如下：

1. **发布设置**
   - 状态胶囊（与列表同款）。
   - Slug 输入。
   - 路径预览（12px、等宽、`--muted`）。
   - 顺序输入，下方 12px 提示“数字越小越靠前”，替代 `title`。
   - 已发布时：`↗ 前台`（`ghost` 加 `arrow-up-right`）与“取消发布”（`ghost`）。
2. **内容检查**，常驻、不折叠、不用折叠头。
   - 有待补充项：每项一行，前置 `circle-alert`（warn 色），文案沿用 `publicationErrors`。分组标题旁显示 12px 灰字“发布前需补充 N 项”，不再是“待处理”。
   - 全部满足：`circle-check`（ok 色）加“必要信息已齐全。”
   - 保留“还没有截图”的 12px 灰字提示。
3. **软件信息 / 资产信息**：默认展开，字段较少，不必折叠。meta 去掉“类型与兼容”。
4. **标签**：默认展开；已选标签用胶囊，带 `x` 移除。
5. **删除这条内容**：仅 `id` 存在时显示，置于最底，上方 hairline，`danger` 加 `trash-2`。

## 5. 图标

现有 sprite（`public/icons/lucide/sprite.svg`）仅有 `house arrow-left x arrow-up-right rotate-ccw pencil eye plus`。

需新增：`chevron-down`、`chevron-right`、`search`、`trash-2`、`circle-alert`、`circle-check`、`upload`。

做法：

1. 从 `public/icons/lucide/SOURCE.md` 中固定的 Lucide 提交 `be09619c1c1124ad09c19fc3e87ee3b939409bbd` 取官方 SVG，**不手绘**。
2. 按现有方式转成具名 `<symbol id="...">`，保留 viewBox 与描边属性。
3. 在 `SOURCE.md` 表格补每个图标的来源链接与原文件 SHA256。
4. 扩充 `src/app/components/Icon.tsx` 的 `IconName` 联合类型。

## 6. 响应式

- ≥1001px：两栏。
- ≤1000px：设置栏宽度 250px。
- ≤760px：单栏，顺序为标题区 → 面板 → 设置栏；底部固定操作栏保留，`.admin-shell` 底部留白保持 104px。
- 触屏（`pointer:coarse`）：控件与图标按钮最小 44×44。
- 列表窄屏行见 §3。

## 7. 代码组织

`AdminPage.tsx` 当前把大量 JSX 压成单行，改样式时极易出错。拆分只做**视图组件**，状态与请求逻辑原位保留，不改变 API 调用的顺序和时机。

新建 `src/admin/components/`：

| 文件 | 内容 |
| --- | --- |
| `Disclosure.tsx` | 折叠面板（title、meta、chevron、`defaultOpen` / `open`、children） |
| `StatusChip.tsx` | 状态胶囊 |
| `Segmented.tsx` | 编辑 / 预览分段控件 |
| `ResourceList.tsx` | 工具条与列表行 |
| `EditorBar.tsx` | 编辑页顶栏 |
| `AssetList.tsx` | 素材行（原 `AssetRow`） |
| `ReadinessCheck.tsx` | 内容检查 |

要求：

- `AdminPage` 仍从 `src/admin/AdminPage.tsx` 导出，签名不变，`App.tsx` 与 `verify-frontend` 无需改动。
- 新文件正常多行格式，遵守 `.oxlintrc.json`。
- 不顺手重排与本任务无关的代码。

## 8. 文档同步与验收

**文档**：

- `docs/admin.md` 末尾“后台工作台交互”：更新为原位预览、顶栏按钮命名、列表行结构。
- `AGENTS.md` 目录索引：新增 `src/admin/components/` 一行。
- `public/icons/lucide/SOURCE.md`：补新增图标。
- `docs/design.md`、`docs/mockups/theme.html` 的后台样张：**等用户确认视觉后再更新**，实施期间只把候选值记入 `docs/design-process.md`。

**自动检查**（全部通过）：

```
npm run typecheck && npm run lint && npm test && npm run verify:frontend && npm run build
```

`verify:api` 不涉及，可不跑。

**人工验收**（由用户做；AGENTS.md 规定不主动做浏览器截图，除非用户要求）：

1. 1500px 宽：列表页标签为透明底；行有缩略图、状态胶囊，整行可点。
2. 新建软件：“发布”清晰可见；名称与说明纵向对齐；各面板间距一致；设置栏各分组左缘对齐。
3. 滚动长内容：设置栏不被顶栏遮挡，自身可滚动。
4. 正文：中文为无衬线；编辑 / 预览原位切换；预览不弹窗。
5. 内容检查：新草稿为中性提示；补齐后显示“必要信息已齐全”。
6. 390px 宽：底部操作栏可用；列表行为两行；所有控件至少 44px。
7. 键盘：Tab 顺序合理，整行点击的列表项、文件选择、分段控件均有焦点环。
8. 回归：改名称后离开出现“未保存”确认；新资源首次上传自动存草稿；素材改说明后点主保存一并提交；取消发布、删除确认正常。

## 9. 实施顺序（建议一步一提交）

1. `fix: 后台层叠与 P0 问题`：§2.1 token、§2.4 按钮体系、§1 的 P0 全部、清除 `!important`。改完视觉即可见改善。
2. `feat: 后台图标与折叠面板`：§5 图标、`Disclosure`、设置栏重排与吸附。
3. `feat: 后台列表页`：§3。
4. `feat: 后台编辑页主区`：§4.0–§4.2、标题区、原位预览、媒体与链接面板。
5. `docs: 同步后台文档`：§8 文档部分。
