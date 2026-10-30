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
const themeWheelMeasure = document.createElement('span');
themeWheelMeasure.className = 'theme-wheel-measure';
themeWheelMeasure.textContent = 'prefer';
themeWheelMeasure.setAttribute('aria-hidden', 'true');
themeWheel.replaceChildren(themeWheelLabel, themeWheelMeasure);
const themeWheelItems = themeWheelNames.map((word) => {
  const item = document.createElement('span');
  item.className = 'theme-wheel-word';
  item.textContent = word;
  item.setAttribute('aria-hidden', 'true');
  themeWheel.append(item);
  return item;
});
let themeWheelInk = [];
let wheelPosition = 0;
let wheelFrame = 0;
function paintThemeWheel() {
  themeWheelItems.forEach((item, index) => {
    const angle = (index - wheelPosition) * Math.PI * 2 / 3;
    const face = (Math.cos(angle) + 1) / 2;
    const scale = .28 + .72 * Math.pow(face, 1.6);
    let y = Math.sin(angle) * .88;
    if (themeWheelInk.length === 3) {
      const weights = themeWheelInk.map((_, i) => Math.max(0, Math.cos((i - wheelPosition) * Math.PI * 2 / 3)) ** 2);
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      const center = themeWheelInk.reduce((sum, ink, i) => sum + weights[i] * (ink.descent - ink.ascent) / 2, 0) / total;
      const halfHeight = themeWheelInk.reduce((sum, ink, i) => sum + weights[i] * (ink.descent + ink.ascent) / 2, 0) / total;
      const ink = themeWheelInk[index];
      y = center - scale * (ink.descent - ink.ascent) / 2 + Math.sin(angle) / Math.sin(Math.PI * 2 / 3) * (halfHeight + .36 + scale * (ink.descent + ink.ascent) / 2);
    }
    item.style.transform = `translateY(${y}em) scale(${scale})`;
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
void document.fonts.ready.then(() => {
  const font = getComputedStyle(themeWheel);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  const fontSpec = `${font.fontWeight} 100px ${font.fontFamily}`;
  context.font = fontSpec;
  const measured = themeWheelNames.map(word => context.measureText(word));
  const lineHeight = parseFloat(font.lineHeight) / parseFloat(font.fontSize);
  const baseline = (lineHeight + (measured[0].fontBoundingBoxAscent - measured[0].fontBoundingBoxDescent) / 100) / 2;
  if (!Number.isFinite(baseline)) return;
  themeWheelInk = measured.map((ink, index) => {
    canvas.width = Math.ceil(ink.width + 32);
    canvas.height = 200;
    context.font = fontSpec;
    context.fillText(themeWheelNames[index], 16, 128);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const rows = Array.from({ length: canvas.height }, (_, row) => {
      let mass = 0;
      for (let x = 0; x < canvas.width; x++) mass += pixels[(row * canvas.width + x) * 4 + 3];
      return mass;
    });
    const total = rows.reduce((sum, value) => sum + value, 0);
    if (!total) return { ascent: ink.actualBoundingBoxAscent / 100, descent: ink.actualBoundingBoxDescent / 100 };
    let accumulated = 0, top = -1, bottom = rows.length - 1;
    for (let row = 0; row < rows.length; row++) {
      accumulated += rows[row];
      if (top < 0 && accumulated >= total * .05) top = row;
      if (accumulated >= total * .95) { bottom = row; break; }
    }
    return { ascent: (128 - top) / 100, descent: (bottom + 1 - 128) / 100 };
  });
  themeWheelItems.forEach((item, index) => {
    item.style.textIndent = `${measured[index].actualBoundingBoxLeft / 100}em`;
    item.style.transformOrigin = `left ${baseline}em`;
  });
  paintThemeWheel();
});

document.querySelectorAll("[data-collection]").forEach((button) => {
  button.addEventListener("click", (event) => {
    document.querySelectorAll("[data-collection]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    selectThemeWheel(button.dataset.collection, event.detail === 0);
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
  const status = document.querySelector("#nav-morph-status");
  const enterPrefer = document.querySelector("#nav-morph-enter-prefer");
  const morphNames = {
    prefer: { label: "Prefer", title: "prefer" },
    make: { label: "Make", title: "make" },
    keep: { label: "Keep", title: "keep" },
  };
  let activeMorphCollection = "prefer";
  let activeMorphTransition = null;

  function selectMorphCollection(name) {
    activeMorphCollection = name;
    const selected = morphNames[name];
    titleWord.textContent = selected.title;
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

const themeOrbit = document.querySelector('.theme-library-orbit');
const themeOrbitPreview = themeOrbit.querySelector('.theme-library-preview');
themeOrbit.querySelectorAll('[data-theme-sector]').forEach((sector) => {
  const preview = () => {
    themeOrbitPreview.hidden = false;
    themeOrbitPreview.dataset.direction = sector.dataset.themeSector;
    themeOrbitPreview.querySelector('strong').textContent = sector.dataset.name;
    themeOrbit.querySelectorAll('[data-theme-sector]').forEach((item) => item.dataset.active = String(item === sector));
  };
  sector.addEventListener('pointerenter', preview);
  sector.addEventListener('focus', preview);
  sector.addEventListener('click', preview);
  sector.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); preview(); } });
});

const themeReturnDirections = { ne:'sw', nw:'se', se:'nw', sw:'ne', w:'e' };
const themeDirectionNames = { ne:'右上', nw:'左上', se:'右下', sw:'左下', w:'左侧', e:'右侧' };
document.querySelectorAll('[data-return-from]').forEach((button) => {
  button.addEventListener('click', () => {
    const to = themeReturnDirections[button.dataset.returnFrom];
    const scene = document.querySelector('.theme-return-scene');
    scene.dataset.returnTo = to;
    scene.querySelector('.theme-return-entry').textContent = `${themeDirectionNames[button.dataset.returnFrom]}进入 → ${themeDirectionNames[to]}返回`;
    document.querySelectorAll('[data-return-from]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});
document.querySelector('.theme-return-arc').addEventListener('click', () => document.querySelector('.theme-library-orbit').scrollIntoView({ block:'center', behavior:motionReduced() ? 'instant' : 'smooth' }));

const themeAssetSource = document.querySelector('#theme-asset-source');
const themeAssetDialog = document.querySelector('#theme-asset-detail');
let themeAssetRevision = 0;
let themeAssetTransition = null;
function changeThemeAsset(open) {
  const revision = ++themeAssetRevision;
  themeAssetTransition?.skipTransition();
  themeAssetSource.removeAttribute('data-shared');
  const update = () => {
    if (revision !== themeAssetRevision) return;
    if (open) { themeAssetSource.removeAttribute('data-shared'); if (!themeAssetDialog.open) themeAssetDialog.showModal(); }
    else { themeAssetDialog.close(); themeAssetSource.dataset.shared = 'true'; }
  };
  const finish = () => {
    if (revision !== themeAssetRevision) return;
    themeAssetSource.removeAttribute('data-shared');
    delete document.documentElement.dataset.themeAssetTransition;
    if (!open) themeAssetSource.focus({ preventScroll:true });
    themeAssetTransition = null;
  };
  if (motionReduced() || typeof document.startViewTransition !== 'function') { update(); finish(); return; }
  document.documentElement.dataset.themeAssetTransition = 'true';
  if (open) themeAssetSource.dataset.shared = 'true';
  themeAssetTransition = document.startViewTransition(update);
  void themeAssetTransition.finished.finally(finish).catch(() => {});
}
themeAssetSource.addEventListener('click', () => changeThemeAsset(true));
document.querySelector('#theme-asset-close').addEventListener('click', () => changeThemeAsset(false));
themeAssetDialog.addEventListener('cancel', (event) => { event.preventDefault(); changeThemeAsset(false); });

// 同一组截图采用稳定列宽，竖屏释放更多空间给介绍。
const themeToolWorkspace = document.querySelector('.theme-tool-workspace');
const themeToolBody = themeToolWorkspace.querySelector('.theme-tool-body');
const themeMediaStrip = themeToolWorkspace.querySelector('.theme-media-strip');
function fitThemeMediaColumn() {
  const portrait = themeToolWorkspace.dataset.format === 'portrait';
  const ratio = portrait ? .5 : 1.6;
  const imageHeight = Math.max(0, themeToolBody.clientHeight - (portrait ? 0 : themeMediaStrip.offsetHeight + 16));
  const width = Math.max(0, Math.min(imageHeight * ratio + (portrait ? 112 : 0), themeToolBody.clientWidth - 24 - 180));
  themeToolBody.style.setProperty('--theme-media-width', `${width}px`);
}
new ResizeObserver(fitThemeMediaColumn).observe(themeToolBody);
document.querySelectorAll('[data-theme-format]').forEach(button => {
  button.addEventListener('click', () => {
    themeToolWorkspace.dataset.format = button.dataset.themeFormat;
    const portrait = button.dataset.themeFormat === 'portrait';
    themeMediaStrip.hidden = portrait;
    document.querySelectorAll('[data-theme-step]').forEach(arrow => { arrow.hidden = !portrait; });
    document.querySelectorAll('[data-theme-format]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    fitThemeMediaColumn();
  });
});

document.querySelectorAll('[data-theme-step]').forEach(button => {
  button.addEventListener('click', () => {
    const main = document.querySelector('#theme-media-main');
    const next = (Number(main.dataset.frame) + Number(button.dataset.themeStep) + 3) % 3;
    document.querySelector(`[data-theme-media="${next}"]`).click();
  });
});

// 独立样张用 Web Animations 表达底板的前后几何；正式 React 使用 Motion layoutId。
const collectionDemo = document.querySelector('#theme-collection-transition');
const collectionSurface = collectionDemo.querySelector('.theme-collection-surface');
const collectionContent = collectionDemo.querySelector('.theme-collection-content');
const collectionMarks = collectionDemo.querySelector('.theme-collection-marks');
let collectionSelection = 'prefer';
let collectionAnimations = [];
document.querySelectorAll('[data-theme-collection]').forEach(button => {
  button.addEventListener('click', event => {
    const next = button.dataset.themeCollection;
    if (next === collectionSelection) return;
    const previous = collectionSelection;
    const before = collectionSurface.getBoundingClientRect();
    const contentOpacity = getComputedStyle(collectionContent).opacity;
    collectionAnimations.forEach(animation => animation.cancel());
    collectionAnimations = [];
    collectionDemo.dataset.collection = next;
    collectionContent.textContent = { prefer:'A small detail, well made.',make:'A little room for making.',keep:'Fragments worth keeping.' }[next];
    collectionMarks.textContent = next === 'prefer' ? 'M · R · P' : 'F\nR\nB';
    collectionSelection = next;
    document.querySelectorAll('[data-theme-collection]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const reduced = motionReduced() || event.detail === 0;
    if (reduced) return;
    const spatial = previous === 'keep' || next === 'keep';
    const timing = { duration:560,easing:'cubic-bezier(.22,1,.36,1)' };
    collectionAnimations.push(collectionContent.animate([
      { opacity:0,transform:`translateY(${next === 'keep' ? 16 : 8}px) scale(${spatial ? .94 : 1})` },
      { opacity:1,transform:'translateY(0) scale(1)' },
    ],timing));
    if (!spatial) {
      const after = collectionSurface.getBoundingClientRect();
      collectionAnimations.push(collectionSurface.animate([
        { transformOrigin:'top left',transform:`translate(${before.left - after.left}px,${before.top - after.top}px) scale(${before.width / after.width},${before.height / after.height})` },
        { transformOrigin:'top left',transform:'translate(0,0) scale(1,1)' },
      ],timing));
    } else {
      collectionAnimations.push(collectionSurface.animate([
        { opacity:previous === 'keep' ? 0 : contentOpacity,transform:'scale(.94)' },
        { opacity:next === 'keep' ? 0 : 1,transform:'scale(1)' },
      ],timing));
    }
    collectionAnimations.push(collectionMarks.animate([{ opacity:0 },{ opacity:1 }],{ duration:140,delay:80 }));
  });
});
