const sample = await fetch("typography-sample.json").then((response) => {
  if (!response.ok) throw new Error("样张素材读取失败");
  return response.json();
});
const pairs = [
  { letter: "A", ui: "Manrope", reading: "Source Serif 4", note: "先观察标题轮廓与字面密度" },
  { letter: "B", ui: "Plus Jakarta Sans", reading: "Literata", note: "先观察字形细节与中英文衔接" },
  { letter: "C", ui: "Outfit", reading: "Newsreader", note: "先观察圆形、转角与阅读节奏" },
];
const chinesePairs = [
  { letter: "D", ui: "Manrope", reading: "Source Serif 4", chinese: "Noto Serif SC", note: "宋体候选" },
  { letter: "E", ui: "Manrope", reading: "Source Serif 4", chinese: "Zhuque Fangsong", note: "朱雀仿宋 v0.212，测试版本候选" },
];
const specimens = document.querySelector("#specimens");
let mode = "ui";
let blind = false;
let chinese = "Noto Serif SC";
const loaded = new Map();
const familyNames = ["MiSans", "Manrope", "Plus Jakarta Sans", "Outfit", "Source Serif 4", "Literata", "Newsreader", "Noto Serif SC", "Zhuque Fangsong"];
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function uiSample() {
  return `<div class="sample ui-sample"><div class="sample-brand"><strong>${sample.brand}</strong><span>${sample.identity}</span></div><div class="sample-nav" aria-hidden="true">${sample.nav.map((word, i) => `<span class="${i ? "" : "selected"}">${word}</span>`).join("")}</div><h3 class="sample-title" lang="en">${sample.title}</h3><p class="sample-subtitle">${sample.subtitle}</p><p class="sample-summary">${sample.intro}</p><div class="sample-media" aria-hidden="true"><div class="sample-window"><div class="sample-sidebar"></div><div class="sample-lines"><i></i><i></i><i></i></div></div></div><p class="sample-meta">${sample.meta}</p><span class="sample-action">${sample.button} →</span><p class="sample-glyphs" lang="en">${sample.glyphs}</p><p class="sample-mixed">${sample.mixed}</p><p class="sample-mixed">${sample.punctuation}</p></div>`;
}

function readingSample() {
  return `<div class="sample reading-sample"><p class="reading-eyebrow">${sample.meta}</p><h3>${sample.readingTitle}</h3><p class="reading-english-title" lang="en">${sample.readingEnglishTitle}</p><div class="reading-copy"><p class="reading-lead">${sample.lead}</p>${sample.paragraphs.map((text) => `<p>${text}</p>`).join("")}<p lang="en">${sample.english}</p><p>${sample.mixed}</p><p>${sample.punctuation}</p></div><p class="sample-caption">${sample.caption}</p></div>`;
}

function requiredFamilies(pair) {
  return mode === "ui" ? ["MiSans", pair.ui] : mode === "chinese" ? ["MiSans", pair.reading, pair.chinese] : ["MiSans", pair.ui, pair.reading, chinese];
}

function render() {
  const choices = mode === "chinese" ? chinesePairs : pairs;
  specimens.dataset.count = choices.length;
  specimens.style.setProperty("--sample-count", choices.length);
  document.querySelector("#reading-font-control").hidden = mode === "ui" || mode === "chinese";
  document.querySelector("#title-weight").disabled = mode === "reading" || mode === "chinese";
  specimens.innerHTML = choices.map((pair) => {
    const cn = pair.chinese || chinese;
    const ready = requiredFamilies(pair).every((name) => loaded.get(name));
    const name = mode === "ui" ? pair.ui : mode === "reading" ? pair.reading : mode === "chinese" ? (cn === "Zhuque Fangsong" ? "朱雀仿宋" : cn) : `${pair.ui} + ${pair.reading}`;
    const detail = mode === "ui" ? "中文界面 MiSans · 界面正文 16px / 1.85" : mode === "chinese" ? `英文固定 Source Serif 4 · 正文 18px，窄屏 17px / 1.8` : `中文长文 ${cn === "Zhuque Fangsong" ? "朱雀仿宋" : cn} · 正文 18px，窄屏 17px / 1.8`;
    return `<section class="specimen ${ready ? "" : "pending"}" style="--ui-en:'${pair.ui}';--reading-en:'${pair.reading}';--reading-cn:'${cn}'"><header class="specimen-heading"><span class="specimen-letter">${pair.letter}</span><div><h2>${blind ? `候选 ${pair.letter}` : escape(name)}</h2><p>${blind ? "同一份素材、相同排版数值" : escape(detail)}<br>${ready ? (blind ? "字体已加载" : escape(pair.note)) : "等待字体，暂不作比较"}</p></div></header>${mode === "ui" ? uiSample() : mode === "pair" ? uiSample() + readingSample() : readingSample()}</section>`;
  }).join("");
  document.querySelector("#comparison-note").textContent = {
    ui: "只变化英文界面字体；中文固定 MiSans。三组均使用相同标题字重、字距与宽度。",
    reading: "只变化英文阅读字体；中文长文保持同一字体与字重。看英文段落，也看英文嵌入中文时的衔接。",
    chinese: "只变化中文长文字体；英文固定 Source Serif 4，中文界面标题固定 MiSans。两组均使用真实 400 字重，不合成粗体。",
    pair: "查看三组界面与阅读组合。中文界面固定 MiSans，中文长文字体可统一切换；英文界面与阅读字体也可跨组搭配，不必成套选择。",
  }[mode];
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
  });
});
document.querySelector("#title-weight").addEventListener("change", (event) => document.documentElement.style.setProperty("--display-weight", event.target.value));
document.querySelector("#sample-size").addEventListener("change", (event) => { specimens.dataset.size = event.target.value; });
document.querySelector("#chinese-reading").addEventListener("change", (event) => {
  chinese = event.target.value === "zhuque" ? "Zhuque Fangsong" : "Noto Serif SC";
  render();
});
document.querySelector("#blind-mode").addEventListener("click", (event) => {
  blind = !blind;
  event.currentTarget.setAttribute("aria-pressed", String(blind));
  event.currentTarget.textContent = blind ? "显示字体名称" : "隐藏字体名称";
  render();
});
render();
const probes = {
  MiSans: [400, 500, 600, 700],
  Manrope: [400, 500, 600, 700],
  "Plus Jakarta Sans": [400, 500, 600, 700],
  Outfit: [400, 500, 600, 700],
  "Source Serif 4": [400, 600],
  Literata: [400, 600],
  Newsreader: [400, 600],
  "Noto Serif SC": [400],
  "Zhuque Fangsong": [400],
};
await Promise.all(familyNames.map(async (name) => {
  try {
    const result = await Promise.all(probes[name].map((weight) => document.fonts.load(`${weight} 20px "${name}"`, JSON.stringify(sample))));
    loaded.set(name, result.every((faces) => faces.length > 0 && faces.every((face) => face.status === "loaded")));
  } catch {
    loaded.set(name, false);
  }
  const count = [...loaded.values()].filter(Boolean).length;
  document.querySelector("#font-status").textContent = `${count} / ${familyNames.length} 种字体已加载`;
  render();
}));
const failed = familyNames.filter((name) => !loaded.get(name));
document.querySelector("#font-warning").hidden = failed.length === 0;
if (failed.length) document.querySelector("#font-warning").textContent = `字体未加载：${failed.join("、")}。请先运行 prepare-fonts.py 并刷新页面，暂不根据替代字体作选择。`;
