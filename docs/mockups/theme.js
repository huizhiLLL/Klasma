const sample = await fetch("typography-sample.json").then((response) => {
  if (!response.ok) throw new Error("阅读素材读取失败");
  return response.json();
}).catch(() => null);

function addParagraphs(target, paragraphs) {
  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    target.append(paragraph);
  });
}
if (sample) {
  addParagraphs(document.querySelector("#reading-copy"), [sample.lead]);
  addParagraphs(document.querySelector("#full-copy"), [sample.lead, ...sample.paragraphs, sample.english]);
} else {
  document.querySelector("#reading-copy").textContent = "阅读素材加载失败，请刷新页面。";
  document.querySelector("#full-copy").textContent = "阅读素材加载失败，请刷新页面。";
}

const dialog = document.querySelector("#reader");
for (const id of ["collection-card", "open-reader", "secondary-reader"]) {
  document.getElementById(id).addEventListener("click", () => dialog.showModal());
}
document.querySelector("#close-reader").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

const subtitles = { prefer: "软件 · 偏好与欣赏", make: "作品 · 创作与交互", keep: "工程资产 · 长期的沉淀" };
document.querySelectorAll("[data-collection]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-collection]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelector("#collection-word").textContent = button.dataset.collection;
    document.querySelector("#collection-subtitle").textContent = subtitles[button.dataset.collection];
  });
});
document.querySelector("#state-button").addEventListener("click", () => {
  document.querySelector("#state-feedback").textContent = "已收到点击，可以继续查看悬停和聚焦状态。";
});

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const reduceMotion = document.querySelector("#reduce-motion");
const activeMotions = new Map();
const motionNames = { feedback: "短促反馈", switch: "连贯切换", spatial: "空间展开" };
const motionFrames = {
  feedback: [{ transform: "scale(1)" }, { transform: "scale(.96)", offset: .4 }, { transform: "none" }],
  switch: [{ transform: "translateY(24px)", opacity: .25 }, { transform: "none", opacity: 1 }],
  spatial: [{ transform: "translateY(24px) rotate(-8deg) scale(.9)" }, { transform: "translateY(-5px) rotate(1deg) scale(1.02)", offset: .75 }, { transform: "none" }],
};
function motionReduced() { return motionPreference.matches || reduceMotion.checked; }
function stopMotions() {
  for (const animation of activeMotions.values()) animation.cancel();
  activeMotions.clear();
  document.querySelector("#motion-status").textContent = motionReduced()
    ? "减少动态：直接显示操作结果，保留相同信息。"
    : "点击重播查看节奏；时长与曲线为候选。";
}
reduceMotion.addEventListener("change", stopMotions);
motionPreference.addEventListener("change", stopMotions);
document.querySelectorAll("[data-motion]").forEach((button) => {
  button.addEventListener("click", () => {
    const kind = button.dataset.motion;
    const piece = document.getElementById(`motion-${kind}`);
    const previous = activeMotions.get(kind);
    const currentStyle = getComputedStyle(piece);
    const current = { transform: currentStyle.transform, opacity: currentStyle.opacity };
    previous?.cancel();
    activeMotions.delete(kind);
    piece.dataset.played = String(piece.dataset.played !== "true");
    const reduced = motionReduced() || typeof piece.animate !== "function";
    document.querySelector("#motion-status").textContent = `${motionNames[kind]}：${reduced ? "已直接切换状态" : "已触发演示，可再次点击接续"}。`;
    if (reduced) return;
    const frames = motionFrames[kind].map((frame) => ({ ...frame }));
    if (previous) frames[0] = current;
    const styles = getComputedStyle(document.documentElement);
    const animation = piece.animate(frames, {
      duration: parseFloat(styles.getPropertyValue(`--motion-${kind}`)),
      easing: styles.getPropertyValue("--ease-settle").trim(),
    });
    activeMotions.set(kind, animation);
    animation.onfinish = () => {
      if (activeMotions.get(kind) === animation) activeMotions.delete(kind);
    };
  });
});
stopMotions();

const probes = [
  ["MiSans", 400, "软件作品工程资产"], ["MiSans", 600, "软件"],
  ["Manrope", 400, "Klasma"], ["Manrope", 700, "What I prefer"],
  ["Noto Serif SC", 400, sample?.lead || "一款工具的性格"], ["Source Serif 4", 400, "A good tool"],
];
const results = await Promise.all(probes.map(async ([family, weight, text]) => {
  try {
    const faces = await document.fonts.load(`${weight} 18px "${family}"`, text);
    return faces.length > 0 && faces.every((face) => face.status === "loaded");
  } catch { return false; }
}));
document.querySelector("#font-status").textContent = results.every(Boolean)
  ? "首选字体已加载 · MiSans / Manrope / Noto Serif SC / Source Serif 4"
  : "部分首选字体未加载，当前可能使用替代字体。请运行 prepare-fonts.py 后刷新。";
