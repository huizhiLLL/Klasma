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
