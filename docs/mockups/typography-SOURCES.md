# Klasma 字体对照：来源与边界

2026-10-29 同素材评审后，用户认可 A／A／D，当前首选为：中文界面 MiSans、英文界面 Manrope，中文长文 Noto Serif SC、英文长文 Source Serif 4。其余候选保留供参考；本页的字号、字重、色值、行高与字距用于同素材对照，不代表正式 Design Tokens，也不代表正式字体加载方案已确定。

## 对照方法

打开 `http://127.0.0.1:4174/typography.html`。

| 视图 | 变化项 | 保持一致 |
| --- | --- | --- |
| 英文界面 A / B / C | Manrope / Plus Jakarta Sans / Outfit | 中文 MiSans、素材、标题字重、字号、字距、布局与宽度 |
| 英文阅读 A / B / C | Source Serif 4 / Literata / Newsreader | 同一中文阅读字体、正文 400 字重、素材、行高与宽度 |
| 中文阅读 D / E | Noto Serif SC / 朱雀仿宋 | 英文 Source Serif 4、界面标题 MiSans、正文 400 字重与布局 |
| 组合效果 A / B / C | 三组英文界面与阅读组合 | 中文界面 MiSans，中文长文字体可统一切换 |

组合不绑定最终选择，可以选择 A 的界面字体与 B 的阅读字体。可隐藏字体名称，或统一切换 360 / 390px 样张宽度。按相同排版数值观察字形；后续选定方向后，再做各字体的光学校准。

字体对照素材来自 `typography-sample.json`，为本项目自拟文字。持续主题稿与完整布局原型共用缓存，准备脚本同时纳入 `theme.html` / `theme.js` 与 `index.html` / `mockup.js` 文案以覆盖新增字形。UI 中的蓝色只用于本页对照，不替代尚未确定的正式色值。中文阅读标题、图注和控件先固定 MiSans，以隔离正文的差别；英文阅读标题随英文阅读字体变化。这也是本轮比较方法，不是全部文章结构的最终字体约束。

## 当前排版起点

用户同意先以长文桌面 18px、手机 17px、中文行高约 1.8 推进；导航与按钮采用 14–16px 范围，样张先用 14px。界面说明正文先试 16px。阅读样张以自身容器宽度判断：不超过 400px 时用 17px，其他情况下用 18px，支持桌面上并排查看窄屏。这是评审阈值，不代表正式应用断点。

所有候选仍使用相同尺度；字号属于已同意的试排起点，标题、行宽、段间距、混排光学微调等仍待实际布局评审。

## 字体来源

| 字体 | 来源 | 本轮使用方式 |
| --- | --- | --- |
| MiSans | [小米官方字体站](https://hyperos.mi.com/font/en/download/) / [官方 Web 字体接口](https://font.sec.miui.com/font/css?family=MiSans:400,500,600,700:Chinese_Simplify,Latin&display=swap) | 原样缓存覆盖固定素材的官方 WOFF2 切片，不修改字体字形或名称 |
| Manrope | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/manrope) | Google Fonts 按固定素材提供的字体文件 |
| Plus Jakarta Sans | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/plusjakartasans) | 同上 |
| Outfit | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/outfit) | 同上 |
| Source Serif 4 | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/sourceserif4) | 同上 |
| Literata | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/literata) | 同上 |
| Newsreader | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/newsreader) | 同上 |
| Noto Serif SC | [Google Fonts 源码与许可](https://github.com/google/fonts/tree/main/ofl/notoserifsc) | 同上，中文正文候选 |
| 朱雀仿宋 | [作者仓库](https://github.com/TrionesType/zhuque) / [v0.212](https://github.com/TrionesType/zhuque/releases/tag/v0.212) | 使用发布包内未经修改的原始字体；该发布标记为 prerelease，不默认为正式字体选择 |

本原型界面使用的中文无衬线字体是 **MiSans**。它适用小米自己的字体许可，不与其余字体的 OFL 许可混同；官方页面提供完整协议。Google Fonts 各字体的 OFL 文本与朱雀的 LICENSE 随本地缓存保存。

## 本地准备与验证

在仓库根目录运行：

```powershell
python docs/mockups/prepare-fonts.py
```

脚本使用 Python 标准库下载官方字体接口及许可文本，通过现有 GitHub CLI `gh` 下载朱雀的指定发布包。需要网络和可用的 `gh`，不安装系统字体或增加 npm 依赖。

字体文件、发布包、生成的 `fonts.css` 和带 SHA-256 的 `sources.json` 保存在已忽略的 `docs/mockups/.font-cache/`。这些仅是本地评审缓存，不提交字体二进制，也不接入正式应用构建。

准备完毕后，页面字体来自本地；缺少缓存时显示加载失败提示，样张降为弱显示，不将替代字体当作加载成功。样张使用 `font-synthesis: none`，不通过浏览器伪造粗体。修改固定素材后应重新运行脚本，确保字集覆盖。

本轮已用字体文件的 cmap 检查固定素材的字形覆盖，并根据字体度量核对英文主标题宽度；脚本语法、lint、CSS 解析与 HTTP 访问另行验证。这些检查不等同于浏览器的视觉评审，最终按页面实际显示继续选字。
