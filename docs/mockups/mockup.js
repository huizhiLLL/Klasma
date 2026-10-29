const app = document.querySelector("#app");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const previewParams = new URLSearchParams(location.search);
document.body.classList.toggle("embedded", previewParams.has("embed"));
const categories = ["SFM", "蓝图", "多方块", "配置", "其他"];
const software = ["Mole", "软件 B", "工具 C", "工具 D", "软件 E"];
let currentSoftware = 0;
let currentProject = 0;
let currentCategory = 0;
let currentMedia = 0;
let activeAnimations = [];
let transition;
let lastInput = "pointer";
let previewObserver;
let navigationVersion = 0;
document.addEventListener("keydown", () => {
  lastInput = "keyboard";
});
document.addEventListener("pointerdown", () => {
  lastInput = "pointer";
});
const motionAllowed = () => !reduceMotion.matches && lastInput !== "keyboard";
const structure = () =>
  `<div class="structure" aria-hidden="true">${"<i></i>".repeat(12)}</div>`;
const miniScene = () =>
  `<div class="mini-scene"><div class="mini-object">${structure()}</div><div class="mini-object"><div class="mini-code">EVERY 20 TICKS<br>INPUT → OUTPUT</div></div><div class="mini-object">${structure()}</div></div>`;
const appWindow = (name = "界面占位", variant = 0) =>
  `<div class="mini-window"><div class="window-bar"><i></i><i></i><i></i><span>${name}</span></div><div class="window-body"><div class="window-sidebar"><b></b><b></b><b></b></div><div class="window-content"><div class="line short"></div><div class="line ${variant ? "accent" : ""}"></div><div class="line short"></div><div class="window-cells">${"<i></i>".repeat(variant === 2 ? 6 : 4)}</div></div></div></div>`;
const collectionRoutes = ["software", "projects", "library"];
const collectionIndex = (route) => collectionRoutes.indexOf(route === "scene" ? "library" : route);
const heading = (title, label = "") => {
  const index = collectionIndex(currentRoute());
  return `<header class="page-heading"><div><h1 lang="en" class="collection-heading" style="view-transition-name:collection-title"><span>What I </span><span class="word-wheel"><span class="wheel-ghost" aria-hidden="true">${["keep", "prefer", "make"][index]}</span><span class="wheel-word">${["prefer", "make", "keep"][index]}</span><span class="wheel-ghost" aria-hidden="true">${["make", "keep", "prefer"][index]}</span></span></h1>${label ? `<p class="page-label">${label}</p>` : ""}</div><nav class="collection-nav" aria-label="集合导航"><a href="#home" class="home-link" aria-label="返回首页" title="返回首页">⌂</a>${collectionRoutes.map((route, i) => `<a href="#${route}" ${index === i ? 'aria-current="page"' : ""}>${index === i ? '<span class="nav-selection" aria-hidden="true"></span>' : ""}<span>${["Prefer", "Make", "Keep"][i]}</span></a>`).join("")}</nav></header>`;
};

function home() {
  const wall = `<div class="logo-wall">${["M", "⌘", "P", "K", "↗", "C", "◈", "F", "M", "⌥", "S", "↔"].map((x) => `<span class="logo-tile">${x}</span>`).join("")}</div>`;
  const cards = [
    {
      cn: "软件",
      en: "What I prefer",
      route: "software",
      art: wall,
      meta: "Preferences",
    },
    {
      cn: "作品",
      en: "What I make",
      route: "projects",
      art: appWindow("Project") + appWindow("Interface"),
      meta: "Creations",
    },
    {
      cn: "工程资产",
      en: "What I keep",
      route: "library",
      art: `<div class="code-background">EVERY 20 TICKS DO\n  INPUT FROM source\n  OUTPUT TO machine\nEND\n\nSTRUCTURE / BLUEPRINT</div>${structure()}`,
      meta: "Fragments",
    },
  ];
  return `<main id="main" class="frame home-frame"><div class="home-top"><div class="creator"><div class="avatar" aria-label="头像占位">枝</div><div><p class="creator-name">会枝 <span>/ huizhiLLL</span></p><p>拾起值得留下的碎片</p></div></div><nav class="personal-links" aria-label="个人站点"><a href="https://github.com/huizhiLLL" target="_blank" rel="noreferrer">GitHub ↗</a><button data-notice="Blog 链接待补充">Blog ↗</button><button data-notice="Weekly 链接待补充">Weekly ↗</button></nav></div><div class="site-intro"><h1>Klasma <span>/ κλάσμα</span></h1><p>源自希腊语，意为「碎片」。<br>这里收藏着我欣赏的软件、亲手做的作品，以及值得保留和复用的工程资产。</p></div><div class="deck">${cards.map((c, i) => `<button class="tarot" data-route="${c.route}" aria-label="${c.cn}，${c.en}"><div class="card-meta"><span>0${i + 1}</span><span>${c.meta}</span></div><div class="card-art">${c.art}</div><div class="card-fade"></div><div class="card-copy"><span>${c.cn}</span><h2 lang="en">${c.en.replace(" I ", " I<br>")}</h2><div class="card-arrow"><span>进入</span><span>↗</span></div></div></button>`).join("")}</div><div class="home-foot"><span>选择一张牌</span><span>What I prefer · make · keep</span></div></main>`;
}

function softwareArticle() {
  return `<p>一些值得停下来细看的地方。</p><h3>我喜欢的细节</h3><p>这里放一小段个人观察，与截图互相补充。留白、交互和表达，都可以成为欣赏一个软件的理由。</p>${currentSoftware === 1 ? "" : `<h3>背后的选择</h3>${Array.from({length: 5}, (_, i) => `<p>片段 ${i + 1} / 记录作者的思考，也留下自己的理解。一个工具值得被分享，往往来自那些细小却持续影响使用感受的选择。这里用较长的示例文字观察阅读节奏与展开过程。</p>`).join("")}`}<p class="source">示例文案 · 非软件测评</p>`;
}

function softwareContent() {
  const name = software[currentSoftware];
  return `<div class="media-column"><div class="media-screen">${appWindow(`${name} · 界面占位 ${currentMedia + 1}`, currentMedia)}</div><div class="thumbnails" aria-label="截图选择">${["主界面", "细节", "另一视角"].map((t, i) => `<button class="thumbnail ${i === currentMedia ? "selected" : ""}" data-media="${i}" aria-pressed="${i === currentMedia}">0${i + 1} / ${t}</button>`).join("")}</div></div><section class="article" aria-label="${name} 的分享内容"><span class="eyebrow">${currentSoftware ? "Software" : "Windows · tw93"}</span><h2>${name}</h2><div class="article-preview"><div class="article-copy">${softwareArticle()}</div></div><div class="article-actions"><button class="pill-button" data-read-more hidden>阅读全文 ↗</button><button class="text-button" data-notice="官网链接待补充">官网 ↗</button></div></section>`;
}

function softwarePage() {
  return `<main id="main" class="frame software-frame" style="view-transition-name:collection">${heading("What I prefer", "软件 / 欣赏与分享")}<section class="software-layout" id="software-content">${softwareContent()}</section><div class="dock-wrap"><nav class="dock" aria-label="软件切换">${software.map((name, i) => `<button class="app-icon" data-software="${i}" aria-label="${name}" aria-pressed="${currentSoftware === i}">${["M", "B", "C", "D", "E"][i]}<span class="tip">${name}</span></button>`).join("")}</nav></div><dialog class="modal reader" aria-labelledby="reader-title"><div class="modal-head"><h2 id="reader-title"></h2><button data-close-reader aria-label="关闭阅读全文">×</button></div><article class="reader-body"></article></dialog></main>`;
}

function projectContent() {
  const names = ["软件作品", "硬件尝试", "小工具"];
  const visuals = [
    appWindow("作品界面占位"),
    '<div class="hardware-board" aria-hidden="true"></div>',
    structure(),
  ];
  return `<section class="project-panel"><div class="project-meta"><div><h2>${names[currentProject]} <span class="muted">/ 0${currentProject + 1}</span></h2><p>${["一个可以操作的展示过程", "为未来的实物作品保留空间", "根据特点安排自己的展示方式"][currentProject]}</p></div><button class="pill-button" data-notice="这里保留作品的下载、体验或仓库链接">下载 ↗</button></div><div class="project-art">${visuals[currentProject]}</div><div class="project-controls"><button class="pill-button" id="demo-toggle" aria-pressed="false">${["展开界面", "切换视角", "观察结构"][currentProject]} ↗</button><details><summary>关于这件作品 ＋</summary><p>这里容纳更多背景与介绍。主要空间留给作品本身和交互展示。</p></details></div></section>`;
}

function projectsPage() {
  return `<main id="main" class="frame projects-frame" style="view-transition-name:collection">${heading("What I make", "作品 / 每一件都有自己的展示方式")}<div class="project-layout"><div class="project-viewport" id="project-content">${projectContent()}</div><nav class="project-rail" aria-label="作品切换">${["软件作品", "硬件尝试", "小工具"].map((name, i) => `<button class="app-icon" data-project="${i}" aria-label="${name}" aria-pressed="${currentProject === i}">${["01", "02", "03"][i]}<span class="tip">${name}</span></button>`).join("")}</nav></div></main>`;
}

function pizza() {
  const sectors = categories
    .map((name, i) => {
      const a = ((-126 + i * 72) * Math.PI) / 180;
      const b = a + (72 * Math.PI) / 180;
      const middle = (a + b) / 2;
      const x = 300 + 262 * Math.cos(a),
        y = 300 + 262 * Math.sin(a);
      const x2 = 300 + 262 * Math.cos(b),
        y2 = 300 + 262 * Math.sin(b);
      return `<a class="slice-link" href="#scene" data-category="${i}" aria-label="预览并进入${name}"><path class="slice" d="M300 300 L${x} ${y} A262 262 0 0 1 ${x2} ${y2}Z"/><text x="${300 + 172 * Math.cos(middle)}" y="${307 + 172 * Math.sin(middle)}" text-anchor="middle">${name}</text></a>`;
    })
    .join("");
  return `<svg class="pizza" viewBox="0 0 600 600" aria-label="工程资产分类">${sectors}<circle class="pizza-center" cx="300" cy="300" r="56"/><text class="pizza-center-label" x="300" y="305">Keep</text></svg>`;
}

function libraryPage() {
  return `<main id="main" class="frame library-frame" style="view-transition-name:collection">${heading("What I keep", "工程资产 / 蓝图、结构与代码")}<div class="pizza-stage">${pizza()}<button class="preview-bubble" aria-label="进入分类场景" hidden><div class="preview-art">${miniScene()}</div><div class="preview-caption"><span id="preview-name">SFM</span><span>进入 ↗</span></div></button></div><p class="library-hint"><span class="pointer-hint">悬停看缩略图，点击进入场景</span><span class="touch-hint">点选分类预览，再点缩略图进入</span></p></main>`;
}

function scenePage() {
  const cat = categories[currentCategory];
  const titles =
    currentCategory === 0
      ? ["产线结构", "控制流程", "空间布局"]
      : ["结构片段", "运行示意", "蓝图片段"];
  return `<main id="main" class="frame scene-frame" data-quadrant="${currentCategory}">${heading("What I keep", `工程资产 / ${cat}`)}<div class="scene-canvas" style="view-transition-name:asset-scene">${titles.map((name, i) => `<button class="asset-item" data-asset="${i}" aria-label="打开${name}详情"><div class="asset-image">${i === 1 ? '<div class="mini-code">EVERY 20 TICKS DO<br> INPUT → MACHINE<br> OUTPUT → STORAGE<br>END</div>' : structure()}</div><div class="asset-caption">${name}<span>0${i + 1} ↗</span></div></button>`).join("")}</div><button class="return-arc" data-route="library" aria-label="返回全局分类"><strong>↙</strong><span>返回全局</span></button><dialog class="modal" aria-labelledby="detail-title"><div class="modal-head"><h2 id="detail-title">资产详情</h2><button data-close-modal aria-label="关闭详情">×</button></div><div class="modal-placeholder">${structure()}</div><p>按资产类型单独设计，此处仅确认遮罩与返回关系。</p></dialog></main>`;
}

const views = {
  home,
  software: softwarePage,
  projects: projectsPage,
  library: libraryPage,
  scene: scenePage,
};
function currentRoute() {
  return location.hash.slice(1) || "home";
}
function render() {
  previewObserver?.disconnect();
  const route = currentRoute();
  if (route === "scene" && Number.isInteger(history.state?.category)) currentCategory = history.state.category;
  app.innerHTML = (views[route] || home)();
  document
    .querySelectorAll(".review-bar nav a")
    .forEach((a) => a.classList.toggle("active", a.hash === `#${route}`));
  document.title = `Klasma · ${{ home: "首页", software: "软件", projects: "作品", library: "全局", scene: "场景" }[route] || "首页"}`;
  bind();
  observePreview();
}
function updateHash(route) {
  history.pushState({ category: currentCategory }, "", `#${route}`);
  render();
  document.querySelector("#main h1")?.setAttribute("tabindex", "-1");
  document.querySelector("#main h1")?.focus({ preventScroll: true });
}
async function navigate(route, source) {
  const version = ++navigationVersion;
  transition?.skipTransition();
  await transition?.updateCallbackDone.catch(() => {});
  if (version !== navigationVersion) return;
  if (route === currentRoute()) return;
  const oldIndex = collectionIndex(currentRoute());
  const newIndex = collectionIndex(route);
  document.documentElement.style.setProperty("--wheel-direction", newIndex >= oldIndex ? 1 : -1);
  activeAnimations.forEach((a) => a.cancel());
  activeAnimations = [];
  document.querySelectorAll(".animation-ghost").forEach((el) => el.remove());
  if (source?.classList.contains("tarot")) {
    source.style.viewTransitionName = "collection";
    source.querySelector("h2").style.viewTransitionName = "collection-title";
  }
  if (route === "scene" && currentRoute() === "library") {
    document.querySelector(".preview-art").style.viewTransitionName =
      "asset-scene";
  }
  if (route === "library" && currentRoute() === "scene") {
    // 返回时重建原来的缩略图位置，保持场景身份连续。
    const change = () => {
      if (version !== navigationVersion) return;
      updateHash(route);
      showPreview(currentCategory);
      document.querySelector(".preview-art").style.viewTransitionName =
        "asset-scene";
    };
    if (document.startViewTransition && motionAllowed())
      transition = document.startViewTransition(change);
    else change();
    return;
  }
  const change = () => {
    if (version === navigationVersion) updateHash(route);
  };
  if (document.startViewTransition && motionAllowed())
    transition = document.startViewTransition(change);
  else change();
}

function runAnimation(el, frames, duration = 550) {
  if (!motionAllowed()) return;
  const animation = el.animate(frames, {
    duration,
    easing: "cubic-bezier(.2,.8,.2,1)",
  });
  activeAnimations.push(animation);
  animation.finished
    .catch(() => {})
    .finally(() => {
      activeAnimations = activeAnimations.filter((a) => a !== animation);
    });
  return animation;
}
function changeSoftware(index) {
  if (index === currentSoftware) return;
  activeAnimations.forEach((a) => a.cancel());
  document.querySelectorAll(".animation-ghost").forEach((el) => el.remove());
  const panel = document.querySelector("#software-content");
  const rect = panel.getBoundingClientRect();
  const oldIcon = document
    .querySelector(`[data-software="${currentSoftware}"]`)
    .getBoundingClientRect();
  const newIcon = document
    .querySelector(`[data-software="${index}"]`)
    .getBoundingClientRect();
  const origin = (r) =>
    `translate(${r.x + r.width / 2 - rect.x - rect.width / 2}px,${r.y + r.height / 2 - rect.y - rect.height / 2}px) scale(.09)`;
  if (motionAllowed()) {
    const ghost = panel.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    ghost.classList.add("animation-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    Object.assign(ghost.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      flex: "none",
    });
    document.body.append(ghost);
    const anim = runAnimation(
      ghost,
      [
        { transform: "none", opacity: 1 },
        { transform: origin(oldIcon), opacity: 0 },
      ],
      450,
    );
    anim.finished.catch(() => {}).finally(() => ghost.remove());
  }
  currentSoftware = index;
  currentMedia = 0;
  panel.innerHTML = softwareContent();
  observePreview();
  document
    .querySelectorAll("[data-software]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", Number(b.dataset.software) === index),
    );
  runAnimation(
    panel,
    [
      { transform: origin(newIcon), opacity: 0 },
      { transform: "none", opacity: 1 },
    ],
    650,
  );
  document.querySelector("#announcement").textContent =
    `已切换至 ${software[index]}`;
}

function changeProject(index) {
  if (index === currentProject) return;
  activeAnimations.forEach((a) => a.cancel());
  const holder = document.querySelector("#project-content");
  const old = holder.lastElementChild;
  [...holder.children].filter((el) => el !== old).forEach((el) => el.remove());
  const direction = index > currentProject ? 1 : -1;
  currentProject = index;
  old.style.position = "absolute";
  old.style.inset = "0";
  old.setAttribute("aria-hidden", "true");
  old.inert = true;
  holder.insertAdjacentHTML("beforeend", projectContent());
  const fresh = holder.lastElementChild;
  const anim = runAnimation(old, [
    { transform: "none", opacity: 1 },
    { transform: `translateY(${-direction * 100}%)`, opacity: 0 },
  ]);
  if (anim) anim.finished.catch(() => {}).finally(() => old.remove());
  else old.remove();
  runAnimation(fresh, [
    { transform: `translateY(${direction * 100}%)`, opacity: 0.3 },
    { transform: "none", opacity: 1 },
  ]);
  document
    .querySelectorAll("[data-project]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", Number(b.dataset.project) === index),
    );
  document.querySelector("#announcement").textContent =
    `已切换至作品 ${index + 1}`;
}

function showPreview(index) {
  currentCategory = index;
  const bubble = document.querySelector(".preview-bubble");
  if (!bubble) return;
  bubble.hidden = false;
  bubble.classList.add("visible");
  bubble.setAttribute("aria-label", `进入${categories[index]}场景`);
  document.querySelector("#preview-name").textContent = categories[index];
  document
    .querySelectorAll("[data-category]")
    .forEach((el) =>
      el.classList.toggle("previewing", Number(el.dataset.category) === index),
    );
  // 预览与分类在同一操作区域内，跨过空隙时仍可点击气泡。
}

function observePreview() {
  previewObserver?.disconnect();
  const preview = document.querySelector(".article-preview");
  if (!preview) return;
  const update = () => {
    const overflowing = preview.scrollHeight > preview.clientHeight + 1;
    document.querySelector("[data-read-more]").hidden = !overflowing;
    preview.classList.toggle("overflowing", overflowing);
    // 预览只展示可见片段，完整语义由阅读层提供。
    preview.inert = overflowing;
    preview.setAttribute("aria-hidden", String(overflowing));
  };
  previewObserver = new ResizeObserver(update);
  previewObserver.observe(preview);
  previewObserver.observe(preview.firstElementChild);
  update();
}

function openReader() {
  const reader = document.querySelector(".reader");
  reader.querySelector("#reader-title").textContent = software[currentSoftware];
  reader.querySelector(".reader-body").innerHTML = softwareArticle();
  reader.showModal();
  reader.scrollTop = 0;
  runAnimation(reader, [{ opacity: 0, transform: "translateY(18px) scale(.97)" }, { opacity: 1, transform: "none" }], 300);
}

function notice(message) {
  document.querySelector(".notice")?.remove();
  const el = document.createElement("div");
  el.className = "notice";
  el.role = "status";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 2300);
}
function bind() {
  document.querySelectorAll("[data-category]").forEach((el) => {
    el.addEventListener("pointerenter", () =>
      showPreview(Number(el.dataset.category)),
    );
    el.addEventListener("focus", () =>
      showPreview(Number(el.dataset.category)),
    );
  });
  document
    .querySelector(".preview-bubble")
    ?.addEventListener("click", () => navigate("scene"));
  const modal = document.querySelector(".modal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-read-more]")) {
    openReader();
    return;
  }
  if (e.target.closest("[data-close-reader]")) {
    document.querySelector(".reader").close();
    return;
  }
  const routeButton = e.target.closest("[data-route]");
  if (routeButton) {
    navigate(routeButton.dataset.route, routeButton);
    return;
  }
  const link = e.target.closest('a[href^="#"]');
  if (link && link.hash !== "#main") {
    e.preventDefault();
    if (link.dataset.category !== undefined) {
      currentCategory = Number(link.dataset.category);
      if (matchMedia("(hover: none), (max-width: 700px)").matches) {
        showPreview(currentCategory);
        return;
      }
    }
    navigate(link.getAttribute("href").slice(1), link);
    return;
  }
  const sw = e.target.closest("[data-software]");
  if (sw) {
    changeSoftware(Number(sw.dataset.software));
    return;
  }
  const media = e.target.closest("[data-media]");
  if (media) {
    currentMedia = Number(media.dataset.media);
    document.querySelector(".media-screen").innerHTML = appWindow(
      `${software[currentSoftware]} · 界面占位 ${currentMedia + 1}`,
      currentMedia,
    );
    document.querySelectorAll("[data-media]").forEach((b) => {
      b.classList.toggle("selected", Number(b.dataset.media) === currentMedia);
      b.setAttribute("aria-pressed", Number(b.dataset.media) === currentMedia);
    });
    return;
  }
  const project = e.target.closest("[data-project]");
  if (project) {
    changeProject(Number(project.dataset.project));
    return;
  }
  const demo = e.target.closest("#demo-toggle");
  if (demo) {
    const active = document
      .querySelector(".project-art")
      .classList.toggle("activated");
    demo.setAttribute("aria-pressed", active);
    return;
  }
  const asset = e.target.closest("[data-asset]");
  if (asset) {
    const modal = document.querySelector(".modal");
    modal.querySelector("#detail-title").textContent =
      asset.querySelector(".asset-caption").firstChild.textContent;
    modal.showModal();
    return;
  }
  if (e.target.closest("[data-close-modal]")) {
    document.querySelector(".modal").close();
    return;
  }
  const toast = e.target.closest("[data-notice]");
  if (toast) notice(toast.dataset.notice);
});
function renderHistory() {
  navigationVersion++;
  transition?.skipTransition();
  activeAnimations.forEach((a) => a.cancel());
  document.querySelectorAll(".animation-ghost").forEach((el) => el.remove());
  render();
}
window.addEventListener("popstate", renderHistory);
window.addEventListener("hashchange", renderHistory);
render();
if (previewParams.get("panel") === "reader" && currentRoute() === "software") openReader();
if (previewParams.get("panel") === "asset" && currentRoute() === "scene") document.querySelector(".modal").showModal();
