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

const iconControls = document.querySelectorAll(".icon-control");
iconControls.forEach((control) => {
  for (const type of ["pointerenter", "focus"]) {
    control.addEventListener(type, () => delete control.dataset.tooltipSuppressed);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") iconControls.forEach((control) => { control.dataset.tooltipSuppressed = "true"; });
});

const dialog = document.querySelector("#reader");
for (const id of ["collection-card", "open-reader", "secondary-reader", "icon-reader"]) {
  document.getElementById(id).addEventListener("click", () => dialog.showModal());
}
document.querySelector("#close-reader").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

// 三词共享连续进度；中断时从当前帧继续。
const themeWheel = document.querySelector('#collection-word');
const themeWheelNames = ['prefer', 'make', 'keep'];
const themeWheelLabel = document.createElement('span');
themeWheelLabel.className = 'theme-wheel-semantic';
themeWheelLabel.textContent = 'prefer';
themeWheel.replaceChildren(themeWheelLabel);
const themeWheelItems = themeWheelNames.map((word) => {
  const item = document.createElement('span');
  item.className = 'theme-wheel-word';
  item.textContent = word;
  item.setAttribute('aria-hidden', 'true');
  themeWheel.append(item);
  return item;
});
let wheelPosition = 0;
let wheelFrame = 0;
function paintThemeWheel() {
  themeWheelItems.forEach((item, index) => {
    const angle = (index - wheelPosition) * Math.PI * 2 / 3;
    const face = (Math.cos(angle) + 1) / 2;
    item.style.transform = `translateY(${Math.sin(angle) * .8}em) scale(${Math.max(.18, Math.pow(face, 1.6))})`;
    item.style.opacity = Math.min(1, face * 2.4);
  });
}
function selectThemeWheel(word, instant) {
  cancelAnimationFrame(wheelFrame);
  themeWheelLabel.textContent = word;
  const index = themeWheelNames.indexOf(word);
  const target = index + Math.round((wheelPosition - index) / 3) * 3;
  if (instant || motionReduced()) { wheelPosition = target; paintThemeWheel(); return; }
  const from = wheelPosition;
  const start = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - start) / 560);
    wheelPosition = from + (target - from) * (1 - (1 - progress) ** 4);
    paintThemeWheel();
    if (progress < 1) wheelFrame = requestAnimationFrame(frame);
  }
  wheelFrame = requestAnimationFrame(frame);
}
paintThemeWheel();

const subtitles = { prefer: "软件 · 偏好与欣赏", make: "作品 · 创作与交互", keep: "工程资产 · 长期的沉淀" };
document.querySelectorAll("[data-collection]").forEach((button) => {
  button.addEventListener("click", (event) => {
    document.querySelectorAll("[data-collection]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    selectThemeWheel(button.dataset.collection, event.detail === 0);
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

const morphDemo = document.querySelector("#nav-morph-demo");
if (morphDemo) {
  const homeView = document.querySelector("#nav-morph-home");
  const collectionView = document.querySelector("#nav-morph-collection");
  const titleWord = document.querySelector("#nav-morph-title-word");
  const subtitle = document.querySelector("#nav-morph-subtitle");
  const status = document.querySelector("#nav-morph-status");
  const enterPrefer = document.querySelector("#nav-morph-enter-prefer");
  const morphNames = {
    prefer: { label: "Prefer", title: "prefer", subtitle: "软件 · 偏好与欣赏" },
    make: { label: "Make", title: "make", subtitle: "作品 · 创作与交互" },
    keep: { label: "Keep", title: "keep", subtitle: "工程资产 · 长期的沉淀" },
  };
  let activeMorphCollection = "prefer";
  let activeMorphTransition = null;

  function selectMorphCollection(name) {
    activeMorphCollection = name;
    const selected = morphNames[name];
    titleWord.textContent = selected.title;
    subtitle.textContent = selected.subtitle;
    collectionView.querySelectorAll("[data-morph-collection]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.morphCollection === name));
    });
  }

  function setMorphState(nextState) {
    const update = () => {
      const isHome = nextState === "home";
      morphDemo.dataset.state = nextState;
      homeView.hidden = !isHome;
      collectionView.hidden = isHome;
      enterPrefer.hidden = !isHome;
      status.textContent = isHome
        ? "首页状态：右上三个词是说明文字。点击任一收藏牌开始过渡。"
        : `集合状态：${morphNames[activeMorphCollection].label}。点击 Home 返回，可反向观察三个词。`;
    };
    if (!motionReduced() && typeof document.startViewTransition === "function") {
      activeMorphTransition?.skipTransition();
      const transition = document.startViewTransition(update);
      activeMorphTransition = transition;
      transition.finished.finally(() => {
        if (activeMorphTransition === transition) activeMorphTransition = null;
      }).catch(() => {});
    } else {
      update();
    }
  }

  document.querySelectorAll("[data-morph-enter]").forEach((button) => {
    button.addEventListener("click", () => {
      selectMorphCollection(button.dataset.morphEnter);
      setMorphState("collection");
    });
  });
  document.querySelectorAll("[data-morph-collection]").forEach((button) => {
    button.addEventListener("click", () => {
      selectMorphCollection(button.dataset.morphCollection);
      status.textContent = `集合状态：${morphNames[activeMorphCollection].label}。切换集合只改变选中项，不重播首页入场。`;
    });
  });
  document.querySelector("[data-morph-home]").addEventListener("click", () => setMorphState("home"));
  enterPrefer.addEventListener("click", () => {
    selectMorphCollection("prefer");
    setMorphState("collection");
  });
  selectMorphCollection(activeMorphCollection);
}

document.querySelectorAll('[data-theme-media]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('#theme-media-main').dataset.frame = button.dataset.themeMedia;
    document.querySelectorAll('[data-theme-media]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});
