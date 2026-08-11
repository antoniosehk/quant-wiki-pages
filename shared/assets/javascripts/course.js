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

function element(name, className, content) {
  const result = document.createElement(name);
  if (className) result.className = className;
  if (content) result.textContent = content;
  return result;
}

function mountGuidedActivity(progress) {
  const root = document.querySelector(".quant-guided-activity");
  if (!root) return;
  const zh = root.dataset.locale === "zh";
  const copy = zh ? {
    title: "一个具体案例：这个策略值得交易吗？",
    scenario: "过去 100 笔交易中：55 笔每笔平均赚 $12；45 笔每笔平均亏 $10；每笔完整交易成本为 $1.50。",
    question: "先不计算：按这些数字重复交易，扣除成本后，平均每笔会赚钱吗？",
    yes: "会赚钱", no: "不会赚钱",
    correct: "预测正确。", retry: "这个猜想很合理；现在用数字检查。",
    calculation: "逐步计算",
    gross: "毛期望 = 55% × $12 − 45% × $10 = $2.10/笔",
    net: "净期望 = $2.10 − $1.50 成本 = $0.60/笔",
    total: "100 笔的期望净收益 = 100 × $0.60 = $60",
    meaning: "结论：按给定数据，策略有正期望，但优势只有每笔 $0.60。",
    riskQuestion: "哪一个变化会直接把净期望变成负数？",
    risks: [
      ["cost", "每笔成本升至 $2.50"],
      ["order", "相同盈亏以不同顺序出现"],
      ["capital", "投入的起始资金增加一倍"],
    ],
    riskCorrect: "正确：$2.10 − $2.50 = −$0.40/笔，策略不再可交易。",
    riskOther: "这不会改变每笔期望值。真正的临界点是成本超过 $2.10/笔。",
    summary: "你的 Capstone 已自动完成",
  } : {
    title: "One concrete case: is this strategy worth trading?",
    scenario: "Across 100 past trades: 55 wins made $12 each on average; 45 losses lost $10 each; each round trip cost $1.50.",
    question: "Before calculating: if these numbers repeat, will the strategy make money per trade after costs?",
    yes: "Yes, profitable", no: "No, unprofitable",
    correct: "Correct prediction.", retry: "That is a reasonable hypothesis; now check it with the numbers.",
    calculation: "Worked calculation",
    gross: "Gross expectation = 55% × $12 − 45% × $10 = $2.10/trade",
    net: "Net expectation = $2.10 − $1.50 cost = $0.60/trade",
    total: "Expected net profit over 100 trades = 100 × $0.60 = $60",
    meaning: "Decision: the supplied data imply a positive edge, but the cushion is only $0.60 per trade.",
    riskQuestion: "Which single change would directly make net expectation negative?",
    risks: [
      ["cost", "Cost rises to $2.50 per trade"],
      ["order", "The same wins and losses arrive in a different order"],
      ["capital", "Starting capital doubles"],
    ],
    riskCorrect: "Correct: $2.10 − $2.50 = −$0.40/trade, so it is no longer tradable.",
    riskOther: "That does not change expectation per trade. The direct break-even point is cost above $2.10/trade.",
    summary: "Your Capstone is complete automatically",
  };
  const state = progress.capstone.guided && typeof progress.capstone.guided === "object"
    ? progress.capstone.guided : {prediction: "", risk: ""};
  progress.capstone.guided = state;
  root.replaceChildren();
  root.append(element("h2", "", copy.title), element("p", "quant-scenario", copy.scenario));

  const prediction = element("fieldset", "quant-guided-step");
  prediction.append(element("legend", "", `1 · ${copy.question}`));
  const predictionFeedback = element("p", "quant-step-feedback");
  const calculation = element("section", "quant-calculation");
  calculation.append(element("h3", "", `2 · ${copy.calculation}`));
  [copy.gross, copy.net, copy.total, copy.meaning].forEach(line => calculation.append(element("p", "", line)));
  const predictionButtons = [["yes", copy.yes], ["no", copy.no]].map(([value, label]) => {
    const button = element("button", "", label); button.type = "button";
    button.addEventListener("click", () => {
      state.prediction = value; writeProgress(progress); update();
    }); prediction.append(button); return button;
  });
  prediction.append(predictionFeedback);

  const risk = element("fieldset", "quant-guided-step");
  risk.append(element("legend", "", `3 · ${copy.riskQuestion}`));
  const riskFeedback = element("p", "quant-step-feedback");
  const riskButtons = copy.risks.map(([value, label]) => {
    const button = element("button", "", label); button.type = "button";
    button.addEventListener("click", () => { state.risk = value; writeProgress(progress); update(); });
    risk.append(button); return button;
  });
  risk.append(riskFeedback);

  const finish = element("section", "quant-guided-finish");
  finish.append(element("h3", "", copy.summary));
  const summary = element("p", ""); finish.append(summary);

  function update() {
    predictionButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(state.prediction === (index ? "no" : "yes"))));
    predictionFeedback.textContent = state.prediction ? (state.prediction === "yes" ? copy.correct : copy.retry) : "";
    calculation.hidden = !state.prediction;
    risk.hidden = !state.prediction;
    riskButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(state.risk === copy.risks[index][0])));
    riskFeedback.textContent = state.risk ? (state.risk === "cost" ? copy.riskCorrect : copy.riskOther) : "";
    finish.hidden = !state.risk;
    summary.textContent = `${copy.total} ${state.risk === "cost" ? copy.riskCorrect : copy.riskOther}`;
  }
  root.append(prediction, calculation, risk, finish); update();
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
  mountGuidedActivity(progress);
  rememberLanguage();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once: true});
else mount();
