const samples = [
  ["home", "01 首页", "home", "", "身份与链接、空间说明、三张竖牌错位排列；窄屏不播放说明词长距离飞行。"],
  ["software", "02 软件展台", "software", "", "固定截图与文案预览，底部 Dock 切换软件。"],
  ["reader", "03 全文阅读", "software", "reader", "全屏阅读层，关闭后保留软件和截图选择。"],
  ["projects", "04 作品", "projects", "", "底部选择作品，主舞台纵向换场。"],
  ["library", "05 工程资产分类", "library", "", "点分类预览，再点缩略图进入场景。"],
  ["scene", "06 分类场景", "scene", "", "保留空间分布与返回分类的入口。"],
  ["asset", "07 资产详情", "scene", "asset", "详情容器先以遮罩表达，内部布局按类型后续设计。"],
];
document.querySelector("#preview-grid").innerHTML = samples.map(([id, title, route, panel, note]) => `<section class="preview-item" data-view="${id}"><h2>${title}</h2><iframe title="${title}手机原型" src="index.html?embed=1${panel ? `&panel=${panel}` : ""}#${route}"></iframe><p>${note}</p></section>`).join("");
document.querySelector("#viewport-size").addEventListener("change", (event) => {
  const [width, height] = event.target.value.split(",");
  document.documentElement.style.setProperty("--preview-width", `${width}px`);
  document.documentElement.style.setProperty("--preview-height", `${height}px`);
});
document.querySelector("#view-filter").addEventListener("change", (event) => {
  document.querySelectorAll("[data-view]").forEach((item) => {
    item.hidden = event.target.value !== "all" && event.target.value !== item.dataset.view;
  });
});
