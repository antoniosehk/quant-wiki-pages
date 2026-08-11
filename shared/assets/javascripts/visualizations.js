const SVG_NS = "http://www.w3.org/2000/svg";

const titles = {
  "expectation-explorer": ["Expected value", "期望值"],
  "compounding-explorer": ["Compounding returns", "复利收益"],
  "distribution-shape": ["Distribution shape", "分布形状"],
  "convergence-explorer": ["Law of large numbers", "大数定律"],
  "sampling-distribution": ["Sampling distribution", "抽样分布"],
  "present-value-explorer": ["Present value", "现值"],
  "monte-carlo-convergence": ["Monte Carlo convergence", "蒙特卡洛收敛"],
  "random-paths": ["Brownian paths", "布朗运动路径"],
  "gbm-paths": ["Geometric Brownian motion", "几何布朗运动"],
  "drift-diffusion": ["Drift and diffusion", "漂移与扩散"],
  "path-transformation": ["Path transformation", "路径变换"],
  "correlation-cloud": ["Correlation", "相关性"],
  "regression-explorer": ["Linear regression", "线性回归"],
  "alpha-beta-explorer": ["Alpha and beta", "阿尔法与贝塔"],
  "regime-switcher": ["Regime change", "市场状态变化"],
  "rolling-statistics": ["Rolling statistics", "滚动统计"],
  "payoff-explorer": ["Option payoff", "期权收益"],
  "replication-explorer": ["Replication", "复制组合"],
  "risk-neutral-tree": ["Risk-neutral valuation", "风险中性估值"],
  "binomial-tree": ["Binomial tree", "二叉树"],
  "black-scholes-explorer": ["Black–Scholes", "布莱克－斯科尔斯"],
  "greeks-explorer": ["Option Greeks", "期权希腊字母"],
  "diversification-explorer": ["Diversification", "分散化"],
  "sharpe-explorer": ["Sharpe ratio", "夏普比率"],
  "drawdown-explorer": ["Drawdown", "回撤"],
  "efficient-frontier": ["Efficient frontier", "有效前沿"],
  "tail-risk-explorer": ["Tail risk", "尾部风险"],
  "edge-explorer": ["Trading edge", "交易优势"],
  "backtest-timeline": ["Backtest timeline", "回测时间轴"],
  "look-ahead-timeline": ["Look-ahead bias", "前视偏差"],
  "survivor-universe": ["Survivorship bias", "幸存者偏差"],
  "parameter-heatmap": ["Parameter overfitting", "参数过拟合"],
  "cost-erosion": ["Trading-cost erosion", "交易成本侵蚀"],
  "tradability-explorer": ["Profitable versus tradable", "盈利与可交易"],
};

const distributionIds = new Set(["expectation-explorer", "distribution-shape", "tail-risk-explorer"]);
const convergenceIds = new Set(["convergence-explorer", "monte-carlo-convergence"]);
const pathIds = new Set(["random-paths", "gbm-paths", "drift-diffusion", "path-transformation", "regime-switcher", "rolling-statistics"]);
const scatterIds = new Set(["correlation-cloud", "regression-explorer", "alpha-beta-explorer"]);
const optionIds = new Set(["payoff-explorer", "replication-explorer", "black-scholes-explorer", "greeks-explorer"]);
const treeIds = new Set(["risk-neutral-tree", "binomial-tree"]);
const frontierIds = new Set(["diversification-explorer", "efficient-frontier"]);
const timelineIds = new Set(["backtest-timeline", "look-ahead-timeline"]);

function node(name, attrs = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function localeIndex(locale) { return locale.startsWith("zh") ? 1 : 0; }

function formatPreset(value, control) {
  if (control.format === "percent") return `${value}%`;
  if (control.format === "bp") return `${value} bp`;
  return String(value);
}

function shell(root, id, locale, control) {
  root.replaceChildren();
  root.classList.add("quant-visual-ready");
  const heading = document.createElement("div");
  heading.className = "quant-visual-heading";
  const title = document.createElement("strong");
  title.textContent = (titles[id] || [id, id])[localeIndex(locale)];
  const value = document.createElement("output");
  value.setAttribute("aria-live", "polite");
  heading.append(title, value);
  const input = document.createElement("input");
  input.type = "range";
  input.min = control.min;
  input.max = control.max;
  input.step = control.step;
  input.value = control.value;
  input.setAttribute("aria-label", control.label[localeIndex(locale)]);
  const label = document.createElement("label");
  label.className = "quant-slider";
  label.append(document.createTextNode(control.label[localeIndex(locale)]), input);
  const presets = document.createElement("div");
  presets.className = "quant-example-presets";
  const low = Number(control.min), high = Number(control.max);
  const presetValues = control.presets || [low, low + (high-low)*.35, low + (high-low)*.65, high];
  presetValues.forEach((preset, index) => {
    const button = document.createElement("button");
    button.type = "button";
    const prefix = locale.startsWith("zh") ? `例 ${index + 1}` : `Example ${index + 1}`;
    button.textContent = `${prefix} · ${control.label[localeIndex(locale)]} = ${formatPreset(preset, control)}`;
    button.addEventListener("click", () => {
      input.value = String(Math.round(preset / Number(control.step)) * Number(control.step));
      input.dispatchEvent(new Event("input", {bubbles: true}));
    });
    presets.append(button);
  });
  const svg = node("svg", {viewBox: "0 0 640 320", role: "img", "aria-label": title.textContent});
  svg.append(node("rect", {x: 52, y: 20, width: 568, height: 250, class: "chart-frame"}));
  const prediction = document.createElement("fieldset");
  prediction.className = "quant-prediction";
  const legend = document.createElement("legend");
  legend.textContent = locale.startsWith("zh")
    ? `先预测：如果${control.label[1]}增加，主要结果会怎样？`
    : `Predict first: if ${control.label[0].toLowerCase()} increases, what happens to the main result?`;
  prediction.append(legend);
  const choices = locale.startsWith("zh") ? [["down", "下降"], ["same", "不变"], ["up", "上升"], ["mixed", "视情况而定"]]
    : [["down", "Decrease"], ["same", "No change"], ["up", "Increase"], ["mixed", "It depends"]];
  const feedback = document.createElement("p");
  feedback.className = "quant-prediction-feedback";
  choices.forEach(([choice, text]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => {
      const correct = choice === (control.direction || "mixed");
      root.classList.add("quant-prediction-made");
      result.inert = false;
      result.removeAttribute("aria-hidden");
      value.removeAttribute("aria-hidden");
      prediction.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      feedback.textContent = correct
        ? (locale.startsWith("zh") ? "预测正确。现在查看数值和图形。" : "Correct. Now inspect the numbers and chart.")
        : (locale.startsWith("zh") ? "先保留这个猜想，再用四个例子检查它。" : "Keep that hypothesis, then test it with the four examples.");
      root.dispatchEvent(new CustomEvent("quant:prediction", {bubbles: true, detail: {id, choice, correct}}));
    });
    prediction.append(button);
  });
  prediction.append(feedback);
  const result = document.createElement("div");
  result.className = "quant-result";
  result.inert = true;
  result.setAttribute("aria-hidden", "true");
  value.setAttribute("aria-hidden", "true");
  const explanation = document.createElement("dl");
  explanation.className = "quant-worked-example";
  result.append(label, svg, explanation);
  root.append(heading, prediction, presets, result);
  return {input, svg, value, explanation, locale, id};
}

function explain(ui, formula, substitution, meaning) {
  const labels = ui.locale.startsWith("zh")
    ? ["公式", "代入", "含义"] : ["Formula", "Substitution", "Meaning"];
  ui.explanation.replaceChildren();
  [formula, substitution, meaning].forEach((value, index) => {
    const term = document.createElement("dt"); term.textContent = labels[index];
    const detail = document.createElement("dd"); detail.textContent = value;
    ui.explanation.append(term, detail);
  });
}

function axes(svg, xLabel, yLabel) {
  const x = node("text", {x: 336, y: 306, class: "axis-title", "text-anchor": "middle"});
  x.textContent = xLabel;
  const y = node("text", {x: 16, y: 145, class: "axis-title", transform: "rotate(-90 16 145)", "text-anchor": "middle"});
  y.textContent = yLabel;
  svg.append(x, y);
}

function line(svg, points, className = "series-one") {
  const d = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  svg.append(node("path", {d, class: className}));
}

function renderCurve(root, id, locale) {
  const isPv = id === "present-value-explorer";
  const isReturns = id === "compounding-explorer";
  const ui = shell(root, id, locale, isPv
    ? {min: 0, max: 20, step: 1, value: 5, presets:[0,5,10,20], format:"percent", direction:"down", label:["Discount rate", "贴现率"]}
    : {min: -20, max: 30, step: 1, value: 10, presets:[-20,-5,10,30], format:"percent", direction:"up", label:["One-period return", "单期收益率"]});
  axes(ui.svg, locale.startsWith("zh") ? "输入" : "Input", locale.startsWith("zh") ? "结果" : "Result");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const raw = Number(ui.input.value);
    const p = raw / 100;
    const points = Array.from({length: 80}, (_, i) => {
      const x = i / 79;
      const curve = isPv ? 1 / Math.pow(1 + p, x * 10)
        : Math.min(1, Math.pow(Math.max(.01, 1 + p), x * 10) / 4);
      return [52 + x * 568, 270 - Math.max(0, Math.min(1, curve)) * 250];
    });
    const path = node("path", {d: points.map((v, i) => `${i ? "L" : "M"}${v[0]},${v[1]}`).join(" "), class: "series-one data-mark"});
    ui.svg.append(path);
    if (isPv) {
      const pv = 100 / Math.pow(1 + p, 5);
      ui.value.textContent = `PV = ${pv.toFixed(2)}`;
      explain(ui, "PV = FV / (1 + r)^n", `100 / (1 + ${p.toFixed(2)})^5 = ${pv.toFixed(2)}`,
        locale.startsWith("zh") ? "贴现率越高，五年后 100 元的今天价值越低。" : "A higher discount rate makes 100 received in five years worth less today.");
    } else {
      const simple = 2*p, compounded = Math.pow(1+p,2)-1, logReturn = 2*Math.log(Math.max(.01,1+p));
      ui.value.textContent = `2-period = ${(compounded*100).toFixed(1)}%`;
      explain(ui, "R₂ = (1 + r)² − 1; g₂ = 2 ln(1 + r)", `(1 + ${p.toFixed(2)})² − 1 = ${compounded.toFixed(4)}; 2r = ${simple.toFixed(4)}`,
        locale.startsWith("zh") ? `复利收益与简单相加相差 ${Math.abs((compounded-simple)*100).toFixed(1)} 个百分点；对数收益可以跨期相加。` : `Compounding differs from simply adding returns by ${Math.abs((compounded-simple)*100).toFixed(1)} percentage points; log returns add across time (${logReturn.toFixed(4)}).`);
    }
  };
  ui.input.addEventListener("input", draw); draw();
}

function renderDistribution(root, id, locale) {
  const ui = shell(root, id, locale, {min: 10, max: 90, step: 1, value: 50, presets:[10,30,60,90], format:"percent", direction:"up", label: [id === "expectation-explorer" ? "Probability of gain" : "Tail weight", id === "expectation-explorer" ? "获利概率" : "尾部权重"]});
  axes(ui.svg, locale.startsWith("zh") ? "结果" : "Outcome", locale.startsWith("zh") ? "概率密度" : "Density");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const q = Number(ui.input.value) / 100;
    if (id === "expectation-explorer") {
      const loss = node("rect", {x: 150, y: 270-(1-q)*220, width: 110, height: (1-q)*220, class: "bar-two data-mark"});
      const gain = node("rect", {x: 410, y: 270-q*220, width: 110, height: q*220, class: "bar-one data-mark"});
      const expected=q*2-(1-q); ui.svg.append(loss, gain); ui.value.textContent = `E[X] = ${expected.toFixed(2)}`;
      explain(ui,"E[X] = p·gain + (1−p)·loss",`${q.toFixed(2)}×2 + ${(1-q).toFixed(2)}×(−1) = ${expected.toFixed(2)}`,
        locale.startsWith("zh") ? (expected>0?"长期平均结果为正，但单次仍可能亏损。":"这个赔率与概率组合没有正期望。") : (expected>0?"The long-run average is positive, although one trial can still lose.":"This payoff/probability combination has no positive edge."));
    } else {
      const pts = Array.from({length: 100}, (_, i) => { const x=-4+i*8/99; const scale=.65+q*1.5; const y=Math.exp(-Math.pow(Math.abs(x)/scale, 1.2+2*(1-q))); return [52+i/99*568,270-y*220]; });
      ui.svg.append(node("path", {d:pts.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-one data-mark"}));
      const kurtosis=3+6*q*q; ui.value.textContent = id === "tail-risk-explorer" ? `VaR₉₅ ≈ ${(1.64*(1+q)).toFixed(2)}σ` : `kurtosis ≈ ${kurtosis.toFixed(2)}`;
      explain(ui, id === "tail-risk-explorer" ? "VaR₉₅ ≈ 1.64 σ × tail factor" : "excess kurtosis = E[(X−μ)⁴]/σ⁴ − 3",
        id === "tail-risk-explorer" ? `1.64 × ${(1+q).toFixed(2)}σ = ${(1.64*(1+q)).toFixed(2)}σ` : `3 + 6×${q.toFixed(2)}² = ${kurtosis.toFixed(2)}`,
        locale.startsWith("zh") ? "相同波动率不代表相同尾部损失；厚尾会增加极端结果。" : "Equal volatility need not mean equal tail loss; heavier tails increase extreme outcomes.");
    }
  };
  ui.input.addEventListener("input", draw); draw();
}

function renderSampling(root,locale){
  const ui=shell(root,"sampling-distribution",locale,{min:5,max:500,step:5,value:50,presets:[5,30,100,500],direction:"down",label:["Sample size","样本量"]});
  axes(ui.svg,locale.startsWith("zh")?"样本均值":"Sample mean",locale.startsWith("zh")?"密度":"Density");
  const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove());const n=Number(ui.input.value),se=1/Math.sqrt(n);const pts=Array.from({length:100},(_,i)=>{const x=-.7+i*1.4/99,y=Math.exp(-.5*Math.pow(x/se,2));return[52+i/99*568,270-y*220];});ui.svg.append(node("path",{d:pts.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-one data-mark"}));ui.value.textContent=`SE = ${se.toFixed(3)}`;explain(ui,"SE(x̄) = σ / √n",`1 / √${n} = ${se.toFixed(3)}`,locale.startsWith("zh")?"样本量增加会让样本均值的分布变窄，但不保证原始数据服从正态分布。":"Larger samples tighten the distribution of the sample mean; they do not make the raw data normal.");};ui.input.addEventListener("input",draw);draw();
}

function renderConvergence(root, id, locale) {
  const ui = shell(root, id, locale, {min: 10, max: 1000, step: 10, value: 100, presets:[10,100,500,1000], direction:"down", label:["Sample size", "样本量"]});
  axes(ui.svg, locale.startsWith("zh")?"样本数":"Samples", locale.startsWith("zh")?"估计值":"Estimate");
  const draw=()=>{ ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove()); const n=Number(ui.input.value); const pts=[]; for(let i=1;i<=80;i++){const m=1+(n/1000)*i*12; const y=.5+Math.sin(i*2.3)/Math.sqrt(m)*.35; pts.push([52+i/80*568,270-y*250]);} ui.svg.append(node("line",{x1:52,y1:145,x2:620,y2:145,class:"reference data-mark"}),node("path",{d:pts.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-one data-mark"})); const error=1/Math.sqrt(n);ui.value.textContent=`error scale ≈ ${error.toFixed(3)}`; explain(ui,id==="monte-carlo-convergence"?"Monte Carlo error ∝ 1/√n":"SE(x̄) = σ/√n",`1/√${n} = ${error.toFixed(3)}`,locale.startsWith("zh")?"样本增至四倍，典型误差约减半；收敛不是每一步都单调。":"Quadrupling samples roughly halves typical error; convergence need not be monotonic at every step.");};
  ui.input.addEventListener("input",draw); draw();
}

function renderScatter(root, id, locale) {
  const ui=shell(root,id,locale,{min:-90,max:90,step:5,value:50,presets:[-90,-30,30,90],direction:"mixed",label:[id==="alpha-beta-explorer"?"Market beta":"Correlation",id==="alpha-beta-explorer"?"市场贝塔":"相关系数"]});
  axes(ui.svg,"X","Y");
  const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove()); const rho=Number(ui.input.value)/100, rand=seeded(42); for(let i=0;i<36;i++){const x=(rand()+rand()+rand()-1.5)/1.5; const noise=(rand()+rand()+rand()-1.5)/1.5; const y=rho*x+Math.sqrt(Math.max(0,1-rho*rho))*noise+(id==="alpha-beta-explorer"?.15:0); const cx=336+x*230,cy=145-y*105; ui.svg.append(node("circle",{cx,cy,r:4,class:"point data-mark"}));} if(id!=="correlation-cloud") ui.svg.append(node("line",{x1:106,y1:145+rho*105,x2:566,y2:145-rho*105,class:"series-one data-mark"})); const formula=id==="alpha-beta-explorer"?"Rᵢ = α + βRₘ + ε":id==="regression-explorer"?"ŷ = a + bx":"ρ = Cov(X,Y)/(σₓσᵧ)";ui.value.textContent=id==="alpha-beta-explorer"?`β = ${rho.toFixed(2)}`:`${id==="regression-explorer"?"slope":"ρ"} = ${rho.toFixed(2)}`;explain(ui,formula,`${id==="alpha-beta-explorer"?"β":id==="regression-explorer"?"b":"ρ"} = ${rho.toFixed(2)}`,locale.startsWith("zh")?"符号决定共同移动方向；相关或回归关系本身不证明因果。":"The sign determines co-movement direction; correlation or regression alone does not establish causality.");};
  ui.input.addEventListener("input",draw); draw();
}

function renderTree(root,id,locale){
  const ui=shell(root,id,locale,{min:1,max:4,step:1,value:2,presets:[1,2,3,4],direction:"mixed",label:["Steps","步数"]});
  const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove()); const steps=Number(ui.input.value); const levels=[]; for(let s=0;s<=steps;s++){levels[s]=[]; for(let j=0;j<=s;j++){const x=90+s*(500/steps),y=145+(j-s/2)*(210/Math.max(steps,1)); levels[s].push([x,y]); if(s){[j-1,j].forEach(k=>{if(levels[s-1][k])ui.svg.append(node("line",{x1:levels[s-1][k][0],y1:levels[s-1][k][1],x2:x,y2:y,class:"tree-edge data-mark"}));});} ui.svg.append(node("circle",{cx:x,cy:y,r:8,class:"tree-node data-mark"}));}} const r=.05,u=1.2,d=.8,q=(Math.exp(r/steps)-d)/(u-d);ui.value.textContent=id==="risk-neutral-tree"?`q = ${q.toFixed(3)}`:`nodes = ${(steps+1)*(steps+2)/2}`;explain(ui,id==="risk-neutral-tree"?"q = (e^(rΔt) − d)/(u − d)":"V = e^(−rΔt)[qVᵤ + (1−q)V_d]",id==="risk-neutral-tree"?`(e^(${r}/${steps}) − ${d}) / (${u} − ${d}) = ${q.toFixed(3)}`:`N=${steps} gives ${(steps+1)*(steps+2)/2} displayed nodes`,locale.startsWith("zh")?"风险中性概率用于无套利定价，不是对真实上涨概率的预测。":"Risk-neutral probability is a no-arbitrage pricing device, not a forecast of the real up probability.");};
  ui.input.addEventListener("input",draw); draw();
}

function seeded(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
}

function renderPaths(root, id, locale) {
  const ui = shell(root, id, locale, {min: 0, max: 100, step: 1, value: 40, presets:[0,20,50,100], format:"percent", direction:"up", label: ["Volatility", "波动率"]});
  axes(ui.svg, locale.startsWith("zh") ? "时间" : "Time", locale.startsWith("zh") ? "路径值" : "Path value");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const vol = Number(ui.input.value) / 100;
    const count = ["random-paths","gbm-paths"].includes(id) ? 5 : 2;
    for (let s = 1; s <= count; s += 1) {
      const rand = seeded(100 + s); let y = .5;
      const pts = [[52, 145]];
      for (let i = 1; i < 80; i += 1) {
        const shock=(rand()+rand()+rand()+rand()-2)*vol*.08;
        if(id==="gbm-paths") y *= Math.exp(.003-.5*vol*vol/80+shock);
        else if(id==="drift-diffusion") y += .004+shock;
        else if(id==="path-transformation") y=Math.exp(Math.log(Math.max(.02,y))+shock-.5*vol*vol/80);
        else if(id==="regime-switcher") y += shock*(i<40?.35:1.8)+(i<40?.002:-.002);
        else y += shock;
        y = Math.max(.02, Math.min(.98, y));
        pts.push([52 + i / 79 * 568, 270 - y * 250]);
      }
      const path = node("path", {d: pts.map((v, i) => `${i ? "L" : "M"}${v[0]},${v[1]}`).join(" "), class: `series-${(s % 3) + 1} data-mark`});
      ui.svg.append(path);
      if(id==="rolling-statistics" && s===1){const rolling=pts.map((point,i)=>{const window=pts.slice(Math.max(0,i-9),i+1);return[point[0],window.reduce((total,p)=>total+p[1],0)/window.length];});ui.svg.append(node("path",{d:rolling.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-2 data-mark"}));}
    }
    const formula=id==="gbm-paths"?"dS = μSdt + σSdW":id==="drift-diffusion"?"dX = μdt + σdW":id==="path-transformation"?"df = f′dX + ½f″σ²dt":id==="regime-switcher"?"Xₜ ~ regime-dependent (μ,σ)":id==="rolling-statistics"?"σ̂ₜ = SD(Xₜ₋w…Xₜ)":"Wₜ₊Δ − Wₜ ~ N(0,Δ)";
    ui.value.textContent = `σ = ${Math.round(vol * 100)}%`;
    explain(ui,formula,`σ = ${vol.toFixed(2)}; one-step shock scale ∝ ${vol.toFixed(2)}√Δt`,locale.startsWith("zh")?"提高波动率会扩大路径分散度；单条模拟路径不是预测。":"Higher volatility widens path dispersion; a single simulated path is not a forecast.");
  };
  ui.input.addEventListener("input", draw); draw();
}

function normalCdf(x) {
  const t = 1 / (1 + .2316419 * Math.abs(x));
  const d = .3989423 * Math.exp(-x * x / 2);
  const p = 1 - d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x >= 0 ? p : 1 - p;
}

function blackScholes(s, k, t, r, sigma) {
  const d1 = (Math.log(s / k) + (r + sigma * sigma / 2) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);
  return s * normalCdf(d1) - k * Math.exp(-r * t) * normalCdf(d2);
}

function renderOption(root, id, locale) {
  const ui = shell(root, id, locale, {min: 60, max: 140, step: 1, value: 100, presets:[60,90,110,140], direction:"up", label: ["Spot price", "现货价格"]});
  axes(ui.svg, locale.startsWith("zh") ? "到期价格" : "Terminal price", locale.startsWith("zh") ? "价值" : "Value");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const spot = Number(ui.input.value), strike = 100;
    const pts = Array.from({length: 81}, (_, i) => {
      const terminal = 60 + i;
      const value=(id==="black-scholes-explorer"||id==="greeks-explorer")?blackScholes(terminal,strike,1,.05,.30):Math.max(terminal-strike,0);
      return [52 + i / 80 * 568, 270 - value / 45 * 220];
    });
    const path = node("path", {d: pts.map((v, i) => `${i ? "L" : "M"}${v[0]},${v[1]}`).join(" "), class: "series-one data-mark"});
    const markerValue=(id==="black-scholes-explorer"||id==="greeks-explorer")?blackScholes(spot,strike,1,.05,.30):Math.max(spot-strike,0);
    const marker = node("circle", {cx: 52 + (spot - 60) / 80 * 568, cy: 270 - markerValue / 45 * 220, r: 6, class: "point data-mark"});
    ui.svg.append(path, marker);
    const call=blackScholes(spot,strike,1,.05,.30), payoff=Math.max(spot-strike,0);
    if(id==="black-scholes-explorer") {ui.value.textContent=`C = ${call.toFixed(2)}`;explain(ui,"C = SN(d₁) − Ke^(−rT)N(d₂)",`BS(${spot}, 100, 1, 5%, 30%) = ${call.toFixed(2)}`,locale.startsWith("zh")?"模型价格依赖连续交易、常数波动率等假设。":"The model price relies on assumptions such as continuous trading and constant volatility.");}
    else if(id==="greeks-explorer"){const eps=.01,delta=(blackScholes(spot+eps,strike,1,.05,.30)-blackScholes(spot-eps,strike,1,.05,.30))/(2*eps);ui.value.textContent=`Δ = ${delta.toFixed(3)}`;explain(ui,"Δ = ∂C/∂S",`[C(${spot}+0.01)−C(${spot}−0.01)]/0.02 = ${delta.toFixed(3)}`,locale.startsWith("zh")?"Delta 是局部敏感度；价格大幅变化后需要重新计算。":"Delta is a local sensitivity and must be recalculated after large price moves.");}
    else if(id==="replication-explorer"){const up=Math.max(spot*1.2-strike,0),down=Math.max(spot*.8-strike,0),delta=(up-down)/(spot*.4);ui.value.textContent=`Δ = ${delta.toFixed(2)}`;explain(ui,"Δ = (Cᵤ − C_d)/(Sᵤ − S_d)",`(${up.toFixed(2)} − ${down.toFixed(2)}) / (${(spot*1.2).toFixed(2)} − ${(spot*.8).toFixed(2)}) = ${delta.toFixed(2)}`,locale.startsWith("zh")?"股票与现金组合在两个状态复制期权支付，由此得到无套利价格。":"Stock plus cash reproduces both option payoffs, pinning down a no-arbitrage value.");}
    else {ui.value.textContent=`payoff = ${payoff.toFixed(2)}`;explain(ui,"call payoff = max(S_T − K, 0)",`max(${spot} − 100, 0) = ${payoff.toFixed(2)}`,locale.startsWith("zh")?"买方损失最多为期权费；图中只画到期支付，未扣期权费。":"The buyer loses at most the premium; this chart shows terminal payoff before subtracting that premium.");}
  };
  ui.input.addEventListener("input", draw); draw();
}

function renderPortfolio(root, id, locale) {
  const ui = shell(root, id, locale, {min: 0, max: 100, step: 1, value: 50, presets:[0,25,60,100], format:"percent", direction:"mixed", label: ["Asset A weight", "资产 A 权重"]});
  axes(ui.svg, locale.startsWith("zh") ? "风险" : "Risk", locale.startsWith("zh") ? "预期收益" : "Expected return");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const w = Number(ui.input.value) / 100;
    const pts = Array.from({length: 101}, (_, i) => {
      const q = i / 100;
      const risk = Math.sqrt(q*q*.04 + (1-q)*(1-q)*.015 + 2*q*(1-q)*.3*Math.sqrt(.04*.015));
      const ret = q*.10 + (1-q)*.05;
      return [52 + risk / .22 * 568, 270 - (ret - .04) / .07 * 230];
    });
    const risk = Math.sqrt(w*w*.04 + (1-w)*(1-w)*.015 + 2*w*(1-w)*.3*Math.sqrt(.04*.015));
    const ret = w*.10 + (1-w)*.05;
    const path = node("path", {d: pts.map((v, i) => `${i ? "L" : "M"}${v[0]},${v[1]}`).join(" "), class: "series-one data-mark"});
    const marker = node("circle", {cx: 52 + risk / .22 * 568, cy: 270 - (ret - .04) / .07 * 230, r: 6, class: "point data-mark"});
    ui.svg.append(path, marker);
    ui.value.textContent = `${Math.round(w*100)}% · ${(risk*100).toFixed(1)}%`;
    explain(ui,"σₚ² = w²σₐ² + (1−w)²σᵦ² + 2w(1−w)ρσₐσᵦ",`w=${w.toFixed(2)}, ρ=0.30 → E[R]=${(ret*100).toFixed(1)}%, σ=${(risk*100).toFixed(1)}%`,locale.startsWith("zh")?"相关性低于 1 时，组合风险可能低于单个资产风险的加权平均。":"When correlation is below one, portfolio risk can be less than the weighted average of individual risks.");
  };
  ui.input.addEventListener("input", draw); draw();
}

function renderSharpe(root,locale){const ui=shell(root,"sharpe-explorer",locale,{min:1,max:20,step:1,value:8,presets:[1,5,12,20],format:"percent",direction:"up",label:["Excess return","超额收益"]}); const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove()); const ret=Number(ui.input.value),vol=12,sharpe=ret/vol; ui.svg.append(node("rect",{x:180,y:270-ret*10,width:100,height:ret*10,class:"bar-one data-mark"}),node("rect",{x:390,y:270-vol*10,width:100,height:vol*10,class:"bar-two data-mark"})); ui.value.textContent=`Sharpe = ${sharpe.toFixed(2)}`;explain(ui,"Sharpe = (Rₚ − R_f)/σₚ",`${ret}% / 12% = ${sharpe.toFixed(2)}`,locale.startsWith("zh")?"在波动率固定时，超额收益越高，夏普比率越高；它不会完整描述厚尾风险。":"With volatility fixed, higher excess return raises Sharpe; the ratio does not fully describe tail risk.");}; ui.input.addEventListener("input",draw);draw();}

function renderDrawdown(root,locale){const ui=shell(root,"drawdown-explorer",locale,{min:0,max:50,step:1,value:20,presets:[0,10,25,50],format:"percent",direction:"up",label:["Shock size","冲击幅度"]}); axes(ui.svg,locale.startsWith("zh")?"时间":"Time",locale.startsWith("zh")?"财富 / 回撤":"Wealth / drawdown"); const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove());const shock=Number(ui.input.value)/100;let peak=1,wealth=1;const eq=[],dd=[];for(let i=0;i<60;i++){wealth*=1.006;if(i===25)wealth*=1-shock;peak=Math.max(peak,wealth);eq.push([52+i/59*568,180-(wealth-.8)*180]);dd.push([52+i/59*568,270-((wealth/peak)-.6)*150]);}ui.svg.append(node("path",{d:eq.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-one data-mark"}),node("path",{d:dd.map((v,i)=>`${i?"L":"M"}${v[0]},${v[1]}`).join(" "),class:"series-2 data-mark"}));ui.value.textContent=`MDD ≈ ${(shock*100).toFixed(0)}%`;explain(ui,"drawdownₜ = 1 − Wₜ/max(W₀…Wₜ)",`shock=${(shock*100).toFixed(0)}% → MDD≈${(shock*100).toFixed(0)}%`,locale.startsWith("zh")?"回撤取决于路径和此前峰值，不等同于单期波动率。":"Drawdown depends on the path and prior peak; it is not the same as one-period volatility.");};ui.input.addEventListener("input",draw);draw();}

function renderHeatmap(root,locale){const ui=shell(root,"parameter-heatmap",locale,{min:0,max:9,step:1,value:4,presets:[0,3,6,9],direction:"mixed",label:["Chosen parameter","所选参数"]});const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove());const chosen=Number(ui.input.value);for(let r=0;r<6;r++)for(let c=0;c<10;c++){const score=Math.sin(c*1.7+r*2.2)*.5+.5;ui.svg.append(node("rect",{x:70+c*52,y:35+r*36,width:48,height:32,class:`heat-${Math.round(score*4)} data-mark`,opacity:c===chosen?1:.55}));}ui.value.textContent=locale.startsWith("zh")?"最佳样本内 ≠ 最佳样本外":"Best in-sample ≠ best out-of-sample";explain(ui,"selection bias grows with the number of trials",`selected parameter = ${chosen}; 10×6 = 60 tried combinations`,locale.startsWith("zh")?"尝试更多组合会提高偶然找到漂亮回测的概率；必须使用未参与选择的数据验证。":"Trying more combinations raises the chance of a lucky backtest; validate on data untouched by selection.");};ui.input.addEventListener("input",draw);draw();}

function renderTimeline(root,id,locale){const ui=shell(root,id,locale,{min:20,max:80,step:5,value:60,presets:[20,40,60,80],format:"percent",direction:"mixed",label:["Training cutoff","训练截止点"]});const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove());const cut=Number(ui.input.value);ui.svg.append(node("rect",{x:70,y:100,width:500*cut/100,height:70,class:"zone-train data-mark"}),node("rect",{x:70+500*cut/100,y:100,width:500*(1-cut/100),height:70,class:"zone-test data-mark"}));if(id==="look-ahead-timeline")ui.svg.append(node("path",{d:`M${70+500*(cut/100+.25*(1-cut/100))},210 L${70+500*(cut/100-.15)},170`,class:"leak-arrow data-mark"}));ui.value.textContent=`${cut}% train / ${100-cut}% test`;explain(ui,id==="look-ahead-timeline"?"feature time ≤ decision time":"estimate → freeze → test forward",`${cut}% training, ${100-cut}% untouched test`,locale.startsWith("zh")?(id==="look-ahead-timeline"?"箭头表示未来信息泄漏到过去；即使代码能运行，结果也无效。":"测试区必须在模型选择后保持未见，并按时间向前评估。"):(id==="look-ahead-timeline"?"The arrow shows future information leaking backward; runnable code can still produce invalid evidence.":"Keep the test window unseen until after model selection, then evaluate forward in time."));};ui.input.addEventListener("input",draw);draw();}

function renderSurvivors(root,locale){const ui=shell(root,"survivor-universe",locale,{min:0,max:10,step:1,value:4,presets:[0,2,5,10],direction:"up",label:["Failed assets removed","被移除的失败资产"]});const draw=()=>{ui.svg.querySelectorAll(".data-mark").forEach(x=>x.remove());const removed=Number(ui.input.value),trueMean=(20-removed*2)/20,biased=1;for(let i=0;i<20;i++){const dead=i<removed;ui.svg.append(node("circle",{cx:105+(i%5)*105,cy:65+Math.floor(i/5)*58,r:15,class:`${dead?"failed":"survivor"} data-mark`}));}ui.value.textContent=`bias = ${(biased-trueMean).toFixed(2)}`;explain(ui,"bias = survivor-only mean − full-universe mean",`1.00 − ${trueMean.toFixed(2)} = ${(biased-trueMean).toFixed(2)}`,locale.startsWith("zh")?"删除失败资产会系统性抬高历史表现；应使用当时可见的完整资产集合。":"Removing failed assets systematically inflates historical performance; use the full point-in-time universe.");};ui.input.addEventListener("input",draw);draw();}

function renderBacktest(root, id, locale) {
  const isEdge=id==="edge-explorer", isTradable=id==="tradability-explorer";
  const ui = shell(root, id, locale, {min: 0, max: 100, step: 1, value: 25, presets:[0,10,40,100], format:isEdge?"percent":"bp", direction:isEdge?"up":"down", label: [isEdge?"Win probability":isTradable?"Market impact":"Trading cost", isEdge?"胜率":isTradable?"市场冲击":"交易成本"]});
  axes(ui.svg, locale.startsWith("zh") ? "时间" : "Time", locale.startsWith("zh") ? "累计价值" : "Cumulative value");
  const draw = () => {
    ui.svg.querySelectorAll(".data-mark").forEach(x => x.remove());
    const raw=Number(ui.input.value), cost = raw / 10000;
    for (let c = 0; c < 2; c += 1) {
      let wealth = 1;
      const pts = [];
      for (let i = 0; i < 80; i += 1) {
        const gross=isEdge ? (raw/100-.5)*.012 : .004 + Math.sin(i*.55)*.006;
        wealth *= 1 + gross - (c ? cost*3 : 0);
        pts.push([52 + i/79*568, 270 - (wealth-.9)/.55*240]);
      }
      const path = node("path", {d: pts.map((v, i) => `${i ? "L" : "M"}${v[0]},${v[1]}`).join(" "), class: `series-${c+1} data-mark`});
      ui.svg.append(path);
    }
    if(isEdge){const edge=raw/100*1-(1-raw/100)*1;ui.value.textContent=`edge = ${edge.toFixed(2)}`;explain(ui,"edge = p·average win − (1−p)·average loss",`${(raw/100).toFixed(2)}×1 − ${(1-raw/100).toFixed(2)}×1 = ${edge.toFixed(2)}`,locale.startsWith("zh")?"胜率必须和盈亏幅度一起看；高胜率不自动代表正期望。":"Win rate must be paired with payoff size; a high win rate does not automatically imply positive expectancy.");}
    else {const gross=40,net=gross-raw*3;ui.value.textContent=`net ≈ ${net} bp`;explain(ui,"net return = gross return − turnover × cost",`${gross} bp − 3 × ${raw} bp = ${net} bp`,locale.startsWith("zh")?(isTradable?"毛收益为正仍可能因冲击、容量和换手而不可交易。":"交易频率越高，微小成本越容易侵蚀策略优势。"):(isTradable?"Positive gross return can still be untradable after impact, capacity limits, and turnover.":"At high turnover, small per-trade costs can erase the strategy edge."));}
  };
  ui.input.addEventListener("input", draw); draw();
}

export function renderVisualization(root, locale = document.documentElement.lang || "en") {
  const id = root.dataset.visualization;
  if (!id || !titles[id]) return;
  if (distributionIds.has(id)) renderDistribution(root,id,locale);
  else if (id === "sampling-distribution") renderSampling(root,locale);
  else if (convergenceIds.has(id)) renderConvergence(root,id,locale);
  else if (pathIds.has(id)) renderPaths(root, id, locale);
  else if (scatterIds.has(id)) renderScatter(root,id,locale);
  else if (treeIds.has(id)) renderTree(root,id,locale);
  else if (optionIds.has(id)) renderOption(root, id, locale);
  else if (frontierIds.has(id)) renderPortfolio(root,id,locale);
  else if (id === "sharpe-explorer") renderSharpe(root,locale);
  else if (id === "drawdown-explorer") renderDrawdown(root,locale);
  else if (id === "parameter-heatmap") renderHeatmap(root,locale);
  else if (timelineIds.has(id)) renderTimeline(root,id,locale);
  else if (id === "survivor-universe") renderSurvivors(root,locale);
  else if (["edge-explorer","cost-erosion","tradability-explorer"].includes(id)) renderBacktest(root,id,locale);
  else renderCurve(root, id, locale);
}

export const visualizationIds = Object.freeze(Object.keys(titles));
