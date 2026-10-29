# 正式应用字体

MiSans / Manrope 为界面字体，Noto Serif SC / Source Serif 4 为长文。`fonts.css` 保留官方 unicode-range，浏览器按实际文字按需加载；不是按演示文案裁剪的固定字集。

`sources.json` 记录官方样式表、字体来源、许可和各文件 SHA-256；各许可正文位于本目录。准备脚本为 `scripts/prepare-app-fonts.py`，重新准备需要网络和 Python；正常构建直接使用已提交资源。

`npm run verify:frontend` 校验全部清单哈希。`docs/mockups/.font-cache/` 是独立原型的缓存，不用于正式应用。
