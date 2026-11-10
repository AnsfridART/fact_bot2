// Персонажи v26: одежда (куртки, худи, жилеты, форма, пальто), лицо с мимикой (брови, веки, моргание, зрачки, рот),
// живое тело (дыхание, перенос веса, дрожь от страха, вздрагивание, жесты во время речи, плавная смена поз рук).
// Скелет и высоты как в v25: таз 0.92, плечи 1.39, центр головы ~1.70, лицо смотрит в +z.
import { M, hex, ik, norm, sub } from "./engine.js";

const PI = Math.PI;
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return A.map((v, i) => v + (B[i] - v) * k); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const hash = (n) => { const x = Math.sin(n * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };

// мимика: веки (open 0..1), брови (подъём, наклон внутренних концов), рот (улыбка −1..1, открыт 0..1), прищур снизу
const EXPR = {
  neutral:    { open: 0.85, brow: 0,      tilt: 0,     smile: 0,    mouth: 0,    squint: 0 },
  calm:       { open: 0.8,  brow: 0,      tilt: 0,     smile: 0.15, mouth: 0,    squint: 0.1 },
  smile:      { open: 0.7,  brow: 0.004,  tilt: 0.05,  smile: 0.8,  mouth: 0.15, squint: 0.35 },
  relief:     { open: 0.55, brow: 0.006,  tilt: 0.25,  smile: 0.4,  mouth: 0.1,  squint: 0.2 },
  worried:    { open: 0.95, brow: 0.008,  tilt: 0.35,  smile: -0.35, mouth: 0.05, squint: 0 },
  fear:       { open: 1.25, brow: 0.014,  tilt: 0.45,  smile: -0.4, mouth: 0.45, squint: 0 },
  shock:      { open: 1.35, brow: 0.018,  tilt: 0.15,  smile: -0.1, mouth: 0.8,  squint: 0 },
  sad:        { open: 0.6,  brow: 0.006,  tilt: 0.45,  smile: -0.6, mouth: 0,    squint: 0.1 },
  angry:      { open: 0.75, brow: -0.008, tilt: -0.45, smile: -0.3, mouth: 0.1,  squint: 0.25 },
  suspicious: { open: 0.55, brow: -0.003, tilt: -0.2,  smile: -0.1, mouth: 0,    squint: 0.45, asym: 1 },
  determined: { open: 0.75, brow: -0.005, tilt: -0.3,  smile: -0.05, mouth: 0,   squint: 0.2 },
  sleepy:     { open: 0.35, brow: 0.002,  tilt: 0.1,   smile: 0,    mouth: 0.05, squint: 0.1 },
  creepy:     { open: 1.1,  brow: -0.004, tilt: -0.15, smile: 0.55, mouth: 0.05, squint: 0 },
};

// цели кистей для поз рук (в системе корпуса: плечи на y=0.47, лицо в +z)
function armTarget(ap, s, ctx) {
  const { walk, sit, floor, run, sw, amp, t, fear, talk } = ctx, right = s > 0;
  let T = [0.25 * s, 0.0, 0.05], pole = [0.3 * s, -0.2, -1];
  if (fear) { T = [0.2 * s, 0.12, 0.12]; pole = [0.6 * s, -0.6, -0.4]; }      // руки прижаты
  if (walk) T = run ? [0.27 * s, 0.22, -sw * 0.38 * s] : [0.28 * s, 0.05, -sw * 0.3 * s * amp];
  if (run) pole = [0.4 * s, -1, -0.6];
  if (sit) { T = floor ? [0.12 * s, 0.05, 0.35] : [0.17 * s, 0.2, 0.38]; pole = [0.6 * s, -1, 0]; }
  if (talk && !walk && !ap) { // жесты, пока говорит
    const g = Math.sin(t * 3.1 + (right ? 0 : 1.7)), g2 = Math.sin(t * 1.7 + (right ? 2 : 0));
    if (right || g2 > 0.2) { T = [(0.2 + 0.06 * g) * s, 0.2 + 0.08 * g2, 0.3 + 0.05 * g]; pole = [0.8 * s, -1, -0.2]; }
  }
  switch (ap) {
    case "phone": case "sitphone": if (right) { T = [0.12, 0.79, 0.07]; pole = [1, -1.2, -0.2]; } break;
    case "look_phone": T = [0.05 * s, 0.33, 0.33]; pole = [0.8 * s, -1, 0]; break;
    case "arms_up": T = [0.34 * s, 1.08, 0.1]; pole = [1 * s, 0, -0.5]; break;
    case "point": if (right) { T = [0.22, 0.52, 0.78]; pole = [1, -1, 0]; } break;
    case "reach": if (right) { T = [0.18, 0.2, 0.58]; pole = [1, -1, 0]; } break;
    case "cover": T = [0.04 * s, 0.7, 0.16]; pole = [1 * s, -1, 0]; break;
    case "wave": { const w = Math.sin(t * 7 + (right ? 0 : 1.5)) * 0.18; T = [(0.42 + w) * s, 0.98, 0.12]; pole = [1 * s, -0.3, -0.5]; break; }
    case "knock": if (right) { T = [0.16, 0.5, 0.5 + Math.max(0, Math.sin(t * 13)) * 0.09]; pole = [1, -1, 0]; } break;
    case "ear_door": T = [0.2 * s, 0.75, 0.32]; pole = [1 * s, -1, 0]; break;
    case "hold": T = [0.2 * s, 0.25, 0.32]; pole = [0.8 * s, -1, 0]; break;
    case "wheel": T = [0.17 * s, 0.38, 0.42]; pole = [0.8 * s, -1, 0]; break;
    case "hands_head": T = [0.1 * s, 0.82, 0.02]; pole = [1 * s, 0.2, -0.3]; break;          // за голову от ужаса
    case "mouth": if (right) { T = [0.03, 0.66, 0.2]; pole = [1, -1, 0]; } break;            // рука у рта
    case "crossed": T = [-0.1 * s, 0.24, 0.2]; pole = [1 * s, -0.6, 0]; break;               // руки скрещены
    case "pockets": T = [0.18 * s, -0.02, 0.06]; pole = [0.4 * s, -0.2, -1]; break;
    case "stop": if (right) { T = [0.15, 0.55, 0.55]; pole = [1, -1, 0]; } break;             // ладонь «стоп»
    case "shrug": T = [0.38 * s, 0.32, 0.22]; pole = [1 * s, -1, 0]; break;
    case "flashlight": if (right) { T = [0.18, 0.4, 0.55]; pole = [1, -1, 0]; } break;
  }
  return { T, pole };
}

// x,z,y — место; ry — разворот; pose — тело; arms — поза рук (arms2/armsK — плавный переход);
// expr — эмоция; talk — говорит; gaze — [x,y] куда смотрят зрачки; blinkSeed — чтобы моргали не синхронно;
// startle — 0..1 сила вздрагивания в этот момент; tremble — дрожь (страх)
export function person(b, o) {
  const { x = 0, z = 0, y = 0, ry = 0, look = "man", pose = "stand", phase = 0, t = 0, headYaw = 0, headPitch = 0, scale = 1,
    eyes = null, arms = null, arms2 = null, armsK = 0, expr = null, talk = false, gaze = [0, 0], blinkSeed = 0, startle = 0, tremble = null, LOOKS } = o;
  const L = typeof look === "string" ? LOOKS[look] : look;
  const F = L.female || L.hairStyle === "long" || L.hairStyle === "bun";
  const ex = { ...EXPR.neutral, ...(EXPR[expr || L.expr] || {}) };
  const walk = pose === "walk" || pose === "run", run = pose === "run", floor = pose === "floor", sit = pose === "sit" || pose === "sitphone" || floor;
  const fear = ["fear", "shock", "worried"].includes(expr) && !walk;
  const tr = tremble ?? (expr === "fear" || expr === "shock" ? 1 : 0);
  const amp = run ? 1.5 : 1;
  const sw = walk ? Math.sin(phase) : 0;
  const breathRate = fear || run ? 4.2 : 2.0, breath = Math.sin(t * breathRate) * (fear || run ? 0.016 : 0.008);
  const jit = (k) => (tr ? (Math.sin(t * 47 + k * 3.1) * 0.6 + Math.sin(t * 29 + k)) * 0.004 * tr : 0);
  // перенос веса и покачивание, когда стоит
  const idle = !walk && !sit;
  const sway = idle ? Math.sin(t * 0.8 + blinkSeed) * 0.018 : 0;
  const hipY = floor ? 0.1 : sit ? 0.5 : 0.92 + (walk ? Math.abs(Math.cos(phase)) * 0.035 * amp : breath * 0.5) - (fear && idle ? 0.03 : 0);
  // одежда
  const top = L.top || "tshirt", OUT = L.outer || L.shirt, IN = L.shirt;
  const longTop = ["jacket", "coat", "uniform", "hoodie"].includes(top);
  const sleeve = longTop || top === "sweater" || top === "shirt" || top === "vest_ls" ? OUT : null;
  const armCol = top === "vest" ? IN : (sleeve || IN);

  b.push(M.tr(x + sway * 0.5, y, z), M.ry(ry), M.sc(scale));
  // ---------- ноги ----------
  for (const s of [-1, 1]) {
    const swing = floor ? -1.35 - (s > 0 ? 0.25 : 0) : sit ? -1.5 : sw * 0.45 * s * amp + (idle ? (s > 0 ? -0.04 : 0.03) : 0);
    const ph = phase + (s > 0 ? 0 : PI);
    let knee = floor ? (s > 0 ? 1.6 : 0.35) : sit ? 1.5 : walk ? Math.max(0, -Math.cos(ph)) * 0.75 * amp + (run ? 0.3 : 0) : 0.03 + (fear && idle ? 0.12 : 0);
    if (sit && fear) knee += Math.max(0, Math.sin(t * 14 + s)) * 0.06;              // нога нервно дёргается
    b.push(M.tr(0.1 * s + (F ? -0.008 * s : 0), hipY, 0), M.rx(swing), M.rz(idle ? sway * s * 0.6 : 0));
    b.cyl(0, -0.45, 0, 0.07, 0.088, 0.47, L.pants, { seg: 8, mat: "fabric" });
    if (top === "coat") b.cyl(0, -0.42, 0, 0.1, 0.11, 0.42, OUT, { seg: 8, mat: "fabric" });    // полы пальто
    b.push(M.tr(0, -0.44, 0), M.rx(knee));
    b.cyl(0, -0.44, 0, 0.056, 0.07, 0.45, L.pants, { seg: 8, mat: "fabric" });
    b.cyl(0, -0.44, 0, 0.062, 0.062, 0.04, mix(L.pants, "#000000", 0.25), { seg: 8 });             // манжета
    b.box(0, -0.5, 0.04, 0.12, 0.065, 0.24, L.shoes, { mat: "metal" });
    b.box(0, -0.505, 0.045, 0.125, 0.018, 0.25, L.sole || "#d8d4ca");                             // подошва
    b.sph(0, -0.47, 0.15, 0.055, L.shoes, { seg: 7, ring: 4, sy: 0.6 });                           // носок
    b.pop().pop();
  }
  // ---------- корпус ----------
  const lean = (walk ? 0.07 * amp : 0) + (run ? 0.22 : 0) + (floor ? -0.25 : sit ? -0.05 : 0) + (fear && idle ? 0.08 : 0) - startle * 0.25;
  const twist = walk ? -sw * 0.12 : 0;
  b.push(M.tr(0, hipY, 0), M.rx(lean), M.ry(twist), M.rz(-sway * 0.8 + jit(1)));
  const shW = F ? 0.19 : 0.215;
  // таз, ремень
  b.cyl(0, -0.06, 0, F ? 0.185 : 0.17, 0.175, 0.16, L.pants, { seg: 10, sz: 0.7, mat: "fabric" });
  if (!longTop) { b.cyl(0, 0.08, 0, 0.18, 0.18, 0.03, L.belt || "#1a1410", { seg: 10, sz: 0.66 }); b.box(0, 0.08, 0.118, 0.04, 0.03, 0.01, "#b8a060", { mat: "metal" }); }
  // торс: внутренняя одежда
  b.cyl(0, 0.08, 0, 0.18, shW + breath, 0.42, IN, { seg: 10, sz: 0.62, mat: "fabric" });
  b.sph(0, 0.5, 0, shW, IN, { seg: 10, ring: 6, sy: 0.45, sz: 0.62, mat: "fabric" });
  if (F) b.sph(0, 0.33, 0.07, 0.11, IN, { seg: 8, ring: 5, sx: 1.4, sy: 0.6, sz: 0.55, mat: "fabric" });
  // верхняя одежда
  const shell = (c, r = 0.016, h0 = 0.0, h1 = 0.5) => {
    b.cyl(0, h0, 0, 0.19 + r, shW + r + breath, h1 - h0, c, { seg: 10, sz: 0.64, mat: "fabric" });
    b.sph(0, 0.5, 0, shW + r, c, { seg: 10, ring: 6, sy: 0.47, sz: 0.64, mat: "fabric" });
  };
  if (top === "jacket" || top === "uniform" || top === "coat") {
    shell(OUT, 0.018, top === "coat" ? -0.12 : -0.04, 0.5);
    b.box(0, 0.0, 0.135, 0.075, 0.47, 0.012, IN, { mat: "fabric" });                       // распахнутая молния — видна рубашка
    for (const s of [-1, 1]) {
      b.box(0.04 * s, 0.0, 0.14, 0.008, 0.47, 0.012, mix(OUT, "#000000", 0.4));             // края молнии
      b.box(0.11 * s, 0.04, 0.128, 0.07, 0.07, 0.012, mix(OUT, "#000000", 0.2), { mat: "fabric" }); // карманы
      b.push(M.tr(0.075 * s, 0.53, 0.09), M.rz(-0.5 * s), M.rx(-0.3)); b.box(0, -0.06, 0, 0.06, 0.12, 0.02, OUT, { mat: "fabric" }); b.pop(); // воротник
    }
    if (top === "uniform") { b.box(-0.1, 0.33, 0.135, 0.035, 0.045, 0.01, "#d8b84a", { mat: "metal" }); for (const s of [-1, 1]) b.box(0.17 * s, 0.53, 0, 0.09, 0.012, 0.07, "#c9a840"); }
  } else if (top === "hoodie") {
    shell(OUT, 0.014, -0.04, 0.5);
    b.box(0, 0.02, 0.13, 0.19, 0.12, 0.014, mix(OUT, "#000000", 0.18), { mat: "fabric" });   // карман-кенгуру
    for (const s of [-1, 1]) b.box(0.035 * s, 0.36, 0.14, 0.008, 0.12, 0.008, "#d8d8d8");    // шнурки
    if (L.hairStyle !== "hood") b.sph(0, 0.55, -0.1, 0.15, OUT, { seg: 9, ring: 5, sy: 0.45, sz: 0.7, mat: "fabric" }); // капюшон за спиной
  } else if (top === "vest") {
    shell(OUT, 0.02, 0.0, 0.48);
    b.box(0, 0.05, 0.14, 0.05, 0.43, 0.012, IN, { mat: "fabric" });
    for (const yy of [0.12, 0.3]) b.cyl(0, yy, 0, 0.215, 0.24, 0.035, "#e8e8e0", { seg: 10, sz: 0.66, e: [0.25, 0.25, 0.25] }); // светоотражающие полосы
  } else if (top === "shirt") {
    for (let i = 0; i < 4; i++) b.box(0, 0.08 + i * 0.1, 0.122, 0.012, 0.012, 0.008, "#e8e4da");   // пуговицы
    for (const s of [-1, 1]) { b.push(M.tr(0.05 * s, 0.53, 0.1), M.rz(-0.7 * s)); b.box(0, -0.04, 0, 0.05, 0.07, 0.015, IN); b.pop(); }
  } else if (top === "sweater") {
    b.cyl(0, 0.5, 0, 0.075, 0.07, 0.06, IN, { seg: 9 });                                       // ворот
    b.cyl(0, 0.08, 0, 0.183, 0.183, 0.04, mix(IN, "#000000", 0.2), { seg: 10, sz: 0.63 });   // резинка
  } else {
    b.cyl(0, 0.5, 0, 0.07, 0.065, 0.03, mix(IN, "#000000", 0.25), { seg: 9 });               // горловина футболки
  }
  if (L.bag) { b.push(M.rz(0.6)); b.box(0, -0.1, 0, 0.03, 0.7, 0.03, "#2a2018"); b.pop(); b.box(0.22, -0.05, 0.05, 0.08, 0.18, 0.22, "#3a2a20", { mat: "fabric" }); }

  // ---------- голова ----------
  const tw = (Math.sin(t * 0.7 + blinkSeed) * 0.05 + Math.sin(t * 1.9 + blinkSeed * 2) * 0.02) * (walk ? 0.4 : 1);
  const nod = talk ? Math.sin(t * 5.3) * 0.04 + Math.max(0, Math.sin(t * 2.1)) * 0.03 : 0;
  const dart = fear ? (Math.sin(t * 1.3) > 0.6 ? 0.25 : Math.sin(t * 1.3) < -0.7 ? -0.2 : 0) : 0;
  const hy = headYaw + tw + dart + jit(2) * 3, hp = headPitch + nod + (walk ? Math.abs(Math.cos(phase)) * 0.03 : 0) - startle * 0.3 + jit(3) * 2;
  b.push(M.tr(0, 0.58, 0), M.ry(hy), M.rx(hp));
  const SK = L.skin, SKD = mix(SK, "#4a2a1a", 0.25);
  b.cyl(0, -0.03, 0, F ? 0.05 : 0.058, F ? 0.048 : 0.055, 0.12, SK, { seg: 8 });
  b.sph(0, 0.2, 0, 0.145, SK, { seg: 14, ring: 10, sy: 1.08 });
  b.sph(0, 0.105, 0.045, F ? 0.097 : 0.104, SK, { seg: 10, ring: 6, sy: 0.75, sz: 0.95 });             // челюсть
  b.sph(0, 0.075, 0.11, F ? 0.034 : 0.04, SK, { seg: 8, ring: 5, sy: 0.8 });                           // подбородок
  for (const s of [-1, 1]) b.sph(0.075 * s, 0.155, 0.1, 0.035, mix(SK, "#c86a5a", F ? 0.18 : 0.08), { seg: 7, ring: 5, sz: 0.6 }); // щёки
  // нос
  b.push(M.tr(0, 0.21, 0.135), M.rx(-0.25)); b.box(0, -0.035, 0, 0.022, 0.045, 0.025, SK); b.pop();
  b.sph(0, 0.172, 0.15, 0.019, SK, { seg: 7, ring: 5 });
  for (const s of [-1, 1]) b.sph(0.013 * s, 0.168, 0.143, 0.009, SKD, { seg: 5, ring: 3 });
  // глаза
  const blinkPh = (t * 0.31 + hash(blinkSeed + 1)) % 1, blink = blinkPh < 0.035 ? 1 - Math.abs(blinkPh / 0.0175 - 1) : 0;
  let open = clamp((eyes ?? 1) * ex.open * (1 - blink) - startle * -0.4, 0, 1.4);
  const EY = 0.228, IRIS = L.eyeColor || "#4a3020";
  for (const s of [-1, 1]) {
    const ex0 = 0.052 * s, asym = ex.asym && s > 0 ? 0.6 : 1, op = open * asym;
    b.sph(ex0, EY, 0.123, 0.025, SKD, { seg: 8, ring: 5, sx: 1.25, sy: 0.9, sz: 0.4 });            // глазница
    b.sph(ex0, EY, 0.125, 0.022, "#f2eee6", { seg: 9, ring: 6, sx: 1.2, sy: Math.max(0.12, Math.min(1.2, op)), sz: 0.45, ns: true });
    if (op > 0.15) {
      const gx = gaze[0] * 0.008 + (fear ? Math.sin(t * 2.3) * 0.004 : 0), gy = gaze[1] * 0.006;
      b.sph(ex0 + gx, EY + gy, 0.133, 0.0135, IRIS, { seg: 8, ring: 5, sz: 0.4, sy: Math.min(1, op), ns: true });
      b.sph(ex0 + gx, EY + gy, 0.137, fear || expr === "shock" ? 0.005 : 0.0075, "#050505", { seg: 6, ring: 4, sz: 0.4, ns: true });
      b.box(ex0 + gx + 0.005, EY + gy + 0.006, 0.14, 0.004, 0.004, 0.002, "#ffffff", { e: [0.6, 0.6, 0.6], ns: true }); // блик
    }
    // верхнее веко: опускается при закрытии
    const top0 = EY + 0.024 * Math.min(1, op) - 0.024 * (1 - Math.min(1, op)) * 0.95;
    const lidH = EY + 0.036 - top0;
    if (lidH > 0.002) b.box(ex0, top0, 0.139, 0.058, lidH, 0.006, SK, { ns: true });
    b.box(ex0, top0 - 0.002, 0.141, 0.052, 0.003, 0.004, mix(SK, "#1a0e08", 0.7), { ns: true });  // линия ресниц
    // нижнее веко (прищур)
    const sq = ex.squint * (s > 0 && ex.asym ? 1.4 : 1);
    if (sq > 0.05) b.box(ex0, EY - 0.032, 0.139, 0.054, 0.016 + sq * 0.014, 0.006, SK, { ns: true });
    // бровь
    const bh = EY + 0.034 + ex.brow + (ex.asym && s < 0 ? 0.008 : 0) + startle * 0.012;
    b.push(M.tr(ex0, bh, 0.138), M.rz(-s * ex.tilt)); b.box(0, 0, 0, 0.052, 0.011, 0.012, L.brow || mix(L.hair, "#000000", 0.2), { ns: true }); b.pop();
    // уши
    b.sph(0.143 * s, 0.2, 0, 0.032, SK, { seg: 7, ring: 5, sx: 0.45 });
    b.sph(0.149 * s, 0.2, 0.004, 0.016, SKD, { seg: 5, ring: 3, sx: 0.3 });
  }
  if (L.glasses) { for (const s of [-1, 1]) { const gx = 0.052 * s, G = "#151515", GO = { mat: "metal", ns: true };
      b.box(gx, EY + 0.019, 0.152, 0.054, 0.005, 0.004, G, GO); b.box(gx, EY - 0.021, 0.152, 0.054, 0.004, 0.004, G, GO);
      b.box(gx - 0.026, EY - 0.001, 0.152, 0.004, 0.04, 0.004, G, GO); b.box(gx + 0.026, EY - 0.001, 0.152, 0.004, 0.04, 0.004, G, GO);
      b.box(0.12 * s, EY + 0.01, 0.07, 0.004, 0.005, 0.15, G, GO); }
    b.box(0, EY + 0.008, 0.154, 0.024, 0.004, 0.004, "#151515", { ns: true }); }
  // рот
  const talkO = talk ? Math.max(0, Math.sin(t * 11) * 0.6 + Math.sin(t * 17.3) * 0.4) * 0.55 : 0;
  const mo = clamp(ex.mouth + talkO + startle * 0.5), MY = 0.128, LIP = L.lip || mix(SK, "#a03838", F ? 0.45 : 0.25);
  if (mo > 0.04) b.sph(0, MY - mo * 0.006, 0.134, 0.021, "#2a0c0c", { seg: 8, ring: 5, sx: 1.15 - mo * 0.25, sy: 0.25 + mo * 0.9, sz: 0.35, ns: true });
  b.box(0, MY + 0.004 + mo * 0.01, 0.139, 0.042 - mo * 0.008, 0.007, 0.008, LIP, { ns: true });
  b.box(0, MY - 0.006 - mo * 0.022, 0.138, 0.036 - mo * 0.006, 0.008, 0.008, LIP, { ns: true });
  for (const s of [-1, 1]) { b.push(M.tr(0.024 * s, MY + ex.smile * 0.007, 0.137), M.rz(s * ex.smile * 0.6)); b.box(0, 0, 0, 0.012, 0.006, 0.006, LIP, { ns: true }); b.pop(); }
  // щетина, борода, усы
  const BC = L.beardColor || L.hair;
  if (L.beard === "stubble" || L.beard === "full") {
    const st = L.beard === "full" ? BC : mix(SK, BC, 0.4);
    b.sph(0, 0.1, 0.05, 0.116, st, { seg: 10, ring: 6, sy: 0.72, sz: 0.97, mat: L.beard === "full" ? "hair" : "plain" });
    b.sph(0, 0.072, 0.112, 0.043, st, { seg: 8, ring: 5, sy: 0.8 });
    if (mo > 0.04) b.sph(0, MY - mo * 0.006, 0.142, 0.02, "#2a0c0c", { seg: 8, ring: 5, sx: 1.1, sy: 0.25 + mo * 0.9, sz: 0.3, ns: true });
    b.box(0, MY + 0.004 + mo * 0.01, 0.146, 0.04, 0.007, 0.006, LIP, { ns: true });
  }
  if (L.mustache || L.beard === "full") b.box(0, 0.148, 0.146, 0.06, 0.014, 0.012, BC, { mat: "hair" });
  if (L.age === "old") for (let i = 0; i < 3; i++) b.box(0, 0.285 + i * 0.012, 0.126 - i * 0.004, 0.07 - i * 0.012, 0.003, 0.004, SKD, { ns: true });
  // волосы и головные уборы
  const H = L.hair, hs = L.hairStyle;
  if (hs === "hood") {
    b.sph(0, 0.235, -0.055, 0.172, OUT, { seg: 12, ring: 8, sy: 1.08, mat: "fabric" });
    b.sph(0, 0.3, 0.06, 0.12, OUT, { seg: 10, ring: 6, sy: 0.42, sz: 0.55, mat: "fabric" });           // край капюшона — тень на лоб
    for (const s of [-1, 1]) b.sph(0.14 * s, 0.14, 0.02, 0.06, OUT, { seg: 7, ring: 5, sx: 0.5, sy: 1.6, mat: "fabric" }); // бока капюшона у щёк
  } else if (hs === "bald") {
    b.sph(0, 0.215, -0.01, 0.147, mix(SK, H, 0.15), { seg: 12, ring: 8, sy: 1.06 });
  } else if (hs === "buzz") {
    b.sph(0, 0.23, -0.015, 0.149, mix(SK, H, 0.6), { seg: 12, ring: 8, sy: 0.95, mat: "hair" });
  } else {
    b.sph(0, 0.255, -0.02, 0.152, H, { seg: 12, ring: 8, sy: 0.85, mat: "hair" });
    b.sph(0, 0.2, -0.05, 0.145, H, { seg: 12, ring: 8, sz: 0.8, mat: "hair" });
    if (hs === "short" || hs === "side") b.sph(hs === "side" ? 0.03 : 0.01, 0.305, 0.075, 0.1, H, { seg: 10, ring: 6, sx: 1.25, sy: 0.38, sz: 0.62, mat: "hair" }); // чёлка
    if (hs === "long") { b.box(0, -0.12, -0.08, 0.3, 0.38, 0.12, H, { mat: "hair" }); for (const s of [-1, 1]) b.box(0.125 * s, 0.02, 0.04, 0.05, 0.32, 0.1, H, { mat: "hair" }); b.sph(-0.02, 0.3, 0.08, 0.1, H, { seg: 10, ring: 6, sx: 1.3, sy: 0.4, sz: 0.6, mat: "hair" }); }
    if (hs === "bun") b.sph(0, 0.35, -0.12, 0.065, H, { mat: "hair" });
  }
  if (L.cap === "police") { b.cyl(0, 0.31, -0.01, 0.152, 0.17, 0.08, OUT, { seg: 12 }); b.box(0, 0.31, 0.15, 0.16, 0.012, 0.08, "#0a0a0a", { rx: 0.25 }); b.box(0, 0.35, 0.162, 0.03, 0.03, 0.01, "#d8b84a", { mat: "metal" }); }
  if (L.cap === "beanie") b.sph(0, 0.27, -0.01, 0.155, L.capColor || "#2a2a2a", { seg: 12, ring: 7, sy: 0.8, mat: "fabric" });
  if (L.cap === "baseball") { b.sph(0, 0.27, -0.01, 0.153, L.capColor || "#1a1a1a", { seg: 12, ring: 7, sy: 0.65, mat: "fabric" }); b.box(0, 0.29, 0.17, 0.15, 0.01, 0.1, L.capColor || "#1a1a1a"); }
  b.pop();

  // ---------- руки (ИК, плавный переход между позами) ----------
  const ctx = { walk, sit, floor, run, sw, amp, t, fear, talk };
  for (const s of [-1, 1]) {
    const S = [shW * 1.09 * s, 0.47 + breath * 0.8 + (fear && idle ? 0.025 : 0) + startle * 0.04, 0];
    let { T, pole } = armTarget(arms || (["phone", "sitphone", "look_phone", "arms_up"].includes(pose) ? pose : null), s, ctx);
    if (arms2 && armsK > 0) {
      const B2 = armTarget(arms2, s, ctx), k = armsK * armsK * (3 - 2 * armsK);
      T = T.map((v, i) => v + (B2.T[i] - v) * k); pole = pole.map((v, i) => v + (B2.pole[i] - v) * k);
    }
    if (startle > 0) T = T.map((v, i) => v + [0.06 * s, 0.25, 0.12][i] * startle);
    T = [T[0] + jit(4 + s) * 2, T[1] + jit(6 + s) * 2, T[2]];
    const { E, H: W } = ik(S, T, 0.3, 0.3, pole);
    b.sph(S[0], S[1], S[2], 0.07, armCol, { seg: 8, ring: 5, mat: "fabric" });
    b.seg(S, E, 0.064, 0.054, armCol, { mat: "fabric", seg: 8 });
    b.sph(E[0], E[1], E[2], 0.052, armCol, { seg: 7, ring: 4 });
    const fore = sleeve ? armCol : top === "vest" ? IN : SK;
    const cuff = [E[0] + (W[0] - E[0]) * 0.85, E[1] + (W[1] - E[1]) * 0.85, E[2] + (W[2] - E[2]) * 0.85];
    b.seg(E, cuff, 0.052, 0.044, top === "tshirt" ? SK : fore, { mat: top === "tshirt" ? "plain" : "fabric", seg: 8 });
    b.seg(cuff, W, 0.042, 0.038, sleeve ? mix(armCol, "#000000", 0.2) : SK, { seg: 8 });
    // кисть: ладонь «варежкой» + большой палец
    const d = norm(sub(W, E)), Pm = [W[0] + d[0] * 0.075, W[1] + d[1] * 0.075, W[2] + d[2] * 0.075];
    b.seg(W, Pm, 0.036, 0.03, SK, { seg: 7 });
    b.sph(Pm[0], Pm[1], Pm[2], 0.03, SK, { seg: 6, ring: 4 });
    b.sph(W[0] + d[0] * 0.03 + 0.022 * s * -1, W[1] + d[1] * 0.03, W[2] + d[2] * 0.03 + 0.02, 0.016, SK, { seg: 5, ring: 3 });
    if (L.watch && s < 0) b.seg(cuff, [cuff[0] + d[0] * 0.02, cuff[1] + d[1] * 0.02, cuff[2] + d[2] * 0.02], 0.046, 0.046, "#202020", { mat: "metal" });
    const ap = armsK > 0.5 && arms2 ? arms2 : arms || pose;
    const ph = ap === "phone" || ap === "sitphone";
    if ((ph && s > 0) || (ap === "look_phone" && s > 0)) b.box(W[0] - (ph ? 0.03 : 0.05), W[1] - 0.04, W[2] + 0.03, ph ? 0.015 : 0.09, ph ? 0.15 : 0.012, ph ? 0.08 : 0.16, "#0d0d0d", { e: ap === "look_phone" ? "#3a5a8a" : null });
    if (ap === "flashlight" && s > 0) b.cyl(Pm[0], Pm[1], Pm[2], 0.022, 0.026, 0.14, "#202020", { rx: PI / 2, seg: 8, mat: "metal" });
  }
  b.pop();
  b.pop();
}
