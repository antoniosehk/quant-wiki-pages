import {renderVisualization} from "./visualizations.js";

const progressKey = "quant-wiki-progress:v1";
const localeKey = "quant-wiki-locale:v1";

function emptyProgress() {
  return {version: 1, completed: {}, predictions: {}, interactions: {}, capstone: {}};
}

function normalizeProgress(value) {
  const clean = emptyProgress();
  if (!value || typeof value !== "object" || Array.isArray(value)) return clean;
  ["completed", "predictions", "interactions", "capstone"].forEach(key => {
    if (value[key] && typeof value[key] === "object" && !Array.isArray(value[key])) clean[key] = value[key];
  });
  return clean;
}

function readProgress() {
  try { return normalizeProgress(JSON.parse(localStorage.getItem(progressKey))); }
  catch (_) { return emptyProgress(); }
}

function writeProgress(progress) {
  localStorage.setItem(progressKey, JSON.stringify(normalizeProgress(progress)));
}

function text(en, zh) { return document.documentElement.lang.startsWith("zh") ? zh : en; }

function mountLessonProgress(progress) {
  const lesson = document.querySelector(".quant-lesson");
  if (!lesson) return;
  const id = lesson.dataset.contentId;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quant-complete";
  const update = () => {
    const done = Boolean(progress.completed[id]);
    button.setAttribute("aria-pressed", String(done));
    button.textContent = done ? text("Completed ✓", "已完成 ✓") : text("Mark complete", "标记完成");
  };
  button.addEventListener("click", () => {
    if (progress.completed[id]) delete progress.completed[id];
    else progress.completed[id] = new Date().toISOString();
    writeProgress(progress); update();
  });
  update();
  document.body.append(button);
}

function mountLearningEvents(progress) {
  document.addEventListener("quant:prediction", event => {
    const {id, choice, correct} = event.detail || {};
    if (!id) return;
    progress.predictions[id] = {choice, correct: Boolean(correct), at: new Date().toISOString()};
    writeProgress(progress);
  });
  document.querySelectorAll(".quant-visual").forEach(root => root.addEventListener("input", event => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "range") return;
    progress.interactions[root.dataset.contentId || root.dataset.visualization] = {
      value: Number(event.target.value), at: new Date().toISOString(),
    };
    writeProgress(progress);
  }));
}

function download(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], {type}));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function mountProgressTools(progress) {
  const host = document.querySelector("article") || document.querySelector("main");
  if (!host) return;
  const panel = document.createElement("details"); panel.className = "quant-tools";
  const summary = document.createElement("summary"); summary.textContent = text("Your private learning data", "你的本地学习数据");
  const note = document.createElement("p"); note.textContent = text(
    "Progress stays in this browser. Export a JSON backup to move it to another device; nothing is uploaded.",
    "进度只保存在此浏览器。可导出 JSON 备份并移到另一台设备；本站不会上传这些数据。",
  );
  const actions = document.createElement("div"); actions.className = "quant-tools-actions";
  const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.textContent = text("Export progress", "导出进度");
  exportButton.addEventListener("click", () => download("quant-wiki-progress.json", JSON.stringify(readProgress(), null, 2), "application/json"));
  const importLabel = document.createElement("label"); importLabel.textContent = text("Import progress JSON", "导入进度 JSON");
  const file = document.createElement("input"); file.type = "file"; file.accept = "application/json,.json"; importLabel.append(file);
  const status = document.createElement("p"); status.setAttribute("aria-live", "polite");
  file.addEventListener("change", async () => {
    const selected = file.files && file.files[0];
    if (!selected) return;
    if (selected.size > 1_000_000) { status.textContent = text("File is too large.", "文件过大。"); return; }
    try {
      const parsed = JSON.parse(await selected.text());
      if (!parsed || parsed.version !== 1) throw new Error("version");
      writeProgress(normalizeProgress(parsed));
      status.textContent = text("Imported. Reloading…", "导入完成，正在刷新……");
      location.reload();
    } catch (_) { status.textContent = text("This is not a valid version 1 progress file.", "这不是有效的第 1 版进度文件。"); }
  });
  const reset = document.createElement("button"); reset.type = "button"; reset.textContent = text("Reset local progress", "清除本地进度");
  reset.addEventListener("click", () => {
    if (!confirm(text("Delete progress stored in this browser?", "删除此浏览器中的学习进度？"))) return;
    localStorage.removeItem(progressKey); location.reload();
  });
  actions.append(exportButton, importLabel, reset); panel.append(summary, note, actions, status);
  host.prepend(panel);
}

function mountCapstone(progress) {
  const form = document.querySelector(".quant-capstone");
  if (!form) return;
  const fields = [...form.querySelectorAll("textarea[data-capstone-field]")];
  fields.forEach(field => {
    field.value = String(progress.capstone[field.dataset.capstoneField] || "");
    field.addEventListener("input", () => {
      progress.capstone[field.dataset.capstoneField] = field.value.slice(0, 10000);
      writeProgress(progress);
    });
  });
  const exportButton = form.querySelector("[data-export-capstone]");
  if (exportButton) exportButton.addEventListener("click", () => {
    const body = fields.map(field => `## ${field.dataset.label}\n\n${field.value.trim() || "—"}`).join("\n\n");
    download("quant-wiki-capstone.md", `# Quant Wiki Capstone\n\n${body}\n`, "text/markdown");
  });
}

function rememberLanguage() {
  document.querySelectorAll("a[hreflang]").forEach(link => link.addEventListener("click", () => {
    const lang = link.getAttribute("hreflang");
    localStorage.setItem(localeKey, lang && lang.startsWith("zh") ? "zh" : "en");
  }));
}

function mount() {
  const progress = readProgress();
  document.querySelectorAll(".quant-visual").forEach(root => renderVisualization(root));
  mountLearningEvents(progress);
  mountLessonProgress(progress);
  mountProgressTools(progress);
  mountCapstone(progress);
  rememberLanguage();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once: true});
else mount();
