// Режиссура 3D-кадров: имя шота → функция (t, D, p) → сцена для Renderer.draw.
// t — секунды от начала сцены, D — длительность сцены, p — параметры из сценария (cast, ring, flicker…).
import { Build, hex, lerp, lerp3, ease } from "./engine.js";
import { kitchen, person, phone, LOOKS } from "./kit.js";
import { LOCS, car, note } from "./locations.js";

const PI = Math.PI;
const shake = (t, a = 1) => [Math.sin(t * 1.7) * 0.012 * a + Math.sin(t * 4.1) * 0.004 * a, Math.sin(t * 2.3) * 0.01 * a, Math.cos(t * 1.3) * 0.008 * a];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const look = (p, role, def) => {
  const v = (p.cast || {})[role] || def;
  return typeof v === "string" ? LOOKS[v] || LOOKS[def] : v;
};
const MOM = (p) => look(p, "mom", "elder");
const SON = (p) => look(p, "son", "man");

// свет кухни: night — луна в окно + экран телефона; warm — абажур
function kLights(mode, t, phonePos, glow = 1, flicker = 0) {
  const fl = flicker ? (Math.sin(t * 31) > 0.6 || Math.sin(t * 7.7) > 0.93 ? 0.35 : 1) : 1;
  if (mode === "warm") return {
    lights: [{ p: [-0.2, 1.84, 0.1], c: [1.6, 1.15, 0.65].map((v) => v * fl), r: 6 }, { p: [-3, 2.4, -0.1], c: [0.25, 0.3, 0.45], r: 7 }],
    shadow: { at: [-0.2, 0, 0.1], fov: 2.3 }, sky: [0.06, 0.05, 0.045], gnd: [0.03, 0.022, 0.016], fog: [0.02, 0.016, 0.012], fogD: 0.03,
    post: { tint: [1.05, 0.98, 0.9], lift: [0.02, 0.015, 0.01] },
  };
  const L = [{ p: [-3.3, 2.75, -0.15], c: [1.8, 0.95, 0.4].map((v) => v * 1.7 * fl), r: 9, dir: [1, -0.5, 0.05], cone: 0.55 }]; // уличный натриевый фонарь в окно
  if (phonePos && glow > 0) L.push({ p: phonePos, c: hex("#7fa8ff").map((v) => v * glow * 0.55), r: 1.5 });
  L.push({ p: [0.4, 2.3, 1.6], c: [0.05, 0.05, 0.08], r: 5 });
  return { lights: L, shadow: { at: [0.2, 0.4, 0], fov: 1.2 }, sky: [0.03, 0.05, 0.07], gnd: [0.012, 0.012, 0.014], fog: [0.012, 0.02, 0.028], fogD: 0.03, post: { tint: [1.0, 1.0, 1.04], lift: [0.0, 0.018, 0.03] } };
}
const ringGlow = (t, on) => (on ? (Math.sin(t * 9) > 0 ? 1.5 : 0.9) : 1.0);
const SOUTH = [-0.2, 0.75], EAST = [0.65, 0.1];
const CHAIRS = [[SOUTH[0], SOUTH[1], 0], [EAST[0], EAST[1], PI / 2]];
const PH = [-0.05, 0.76, 0.05];

export const SHOTS = {
  // хук: телефон вибрирует на столе, камера медленно наезжает
  "kitchen/ring": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    phone(b, ...PH, { ring: true, t, glow: ringGlow(t, true) });
    const k = ease(t / Math.max(1, D));
    const cam = { eye: add3(lerp3([0.35, 1.15, 0.6], [0.12, 0.98, 0.3], k), shake(t, 0.6)), at: [-0.05, 0.76, 0.05], fov: 0.9 };
    return { items: b.items, cam, ...kLights("night", t, [-0.05, 0.86, 0.05], ringGlow(t, true)) };
  },
  // часы 23:00 → камера опускается на героиню у стола, она берёт трубку
  "kitchen/clock_pan": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23, clockM: Math.floor(t * 2) % 60 });
    const pick = t > D * 0.55;
    if (!pick) phone(b, ...PH, { ring: true, t, glow: ringGlow(t, true) });
    person(b, { look: MOM(p), pose: pick ? "sitphone" : "sit", x: SOUTH[0], z: SOUTH[1], ry: PI, t, headPitch: pick ? 0 : 0.35 });
    const k = ease((t - 0.3) / (D * 0.6));
    const cam = { eye: add3(lerp3([0.55, 1.75, 0.1], [0.95, 1.45, 1.55], k), shake(t, 0.5)), at: lerp3([0.6, 1.95, -2.1], [-0.25, 0.95, 0.45], k), fov: lerp(0.55, 1.0, k) };
    return { items: b.items, cam, ...kLights("night", t, pick ? [-0.1, 1.3, 0.75] : [-0.05, 0.86, 0.05], ringGlow(t, !pick)) };
  },
  // героиня вскакивает у окна, камера обходит её с плеча
  "kitchen/window_call": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    const ry = PI / 2 - 0.2, hx = -1.3, hz = -0.15;
    person(b, { look: MOM(p), pose: "phone", x: hx, z: hz, ry, t, headYaw: 0.1, headPitch: -0.05 });
    const a = lerp(-0.9, 0.5, ease(t / D)), r = 1.3;
    const cam = { eye: add3([hx + Math.sin(ry + a) * r, 1.55, hz + Math.cos(ry + a) * r], shake(t, 1.6)), at: [hx, 1.5, hz], fov: 0.85, roll: Math.sin(t * 1.1) * 0.03 };
    return { items: b.items, cam, ...kLights("night", t, [hx + 0.15, 1.6, hz], 0.6, p.flicker) };
  },
  // из-за плеча: она у окна спиной к нам, за стеклом ночь
  "kitchen/ots": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    person(b, { look: MOM(p), pose: "phone", x: -1.2, z: -0.1, ry: -PI / 2, t, headYaw: -0.1 });
    const k = ease(t / D);
    const cam = { eye: add3(lerp3([-0.25, 1.62, 0.35], [-0.5, 1.6, 0.2], k), shake(t, 0.8)), at: [-1.7, 1.45, -0.2], fov: 0.95 };
    return { items: b.items, cam, ...kLights("night", t, [-1.1, 1.6, -0.05], 0.6, p.flicker) };
  },
  // крупно лицо, наезд — она что-то понимает
  "kitchen/face": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    const eyes = t > D * 0.5 ? 0.55 : 1, ry = PI / 2 - 0.5, hx = -1.25, hz = -0.1;
    person(b, { look: MOM(p), pose: "phone", x: hx, z: hz, ry, t, eyes, headYaw: -0.2 });
    const k = ease(t / D), dir = [Math.sin(ry - 0.35), 0, Math.cos(ry - 0.35)], r = lerp(1.1, 0.55, k);
    const cam = { eye: add3([hx + dir[0] * r, 1.68, hz + dir[2] * r], shake(t, 0.5)), at: [hx, 1.66, hz], fov: 0.75 };
    const sc = { items: b.items, cam, ...kLights("night", t, [hx + 0.3, 1.7, hz + 0.25], 1.6) }; return sc;
  },
  // идёт через кухню, глядя в телефон
  "kitchen/walk_phone": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    const k = Math.min(1, t / D), x = lerp(-1.1, 0.6, k);
    person(b, { look: MOM(p), pose: "walk", x, z: -1.05, ry: PI / 2, t, phase: t * 6.5, headPitch: 0.3 });
    const cam = { eye: add3([x - 0.4, 1.45, 0.9], shake(t, 1)), at: [x + 0.15, 1.1, -1.05], fov: 0.95 };
    return { items: b.items, cam, ...kLights("night", t, [x + 0.2, 1.2, -0.85], 0.5) };
  },
  // сверху над столом, камера вращается — гудки
  "kitchen/top_spin": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    phone(b, ...PH, { ring: false, t, glow: 1.2 });
    person(b, { look: MOM(p), pose: "sit", x: SOUTH[0], z: SOUTH[1], ry: PI, t, headPitch: 0.5 });
    const a = 0.6 + t * 0.3, h = lerp(2.25, 1.95, ease(t / D));
    const cam = { eye: [-0.05 + Math.sin(a) * 0.6, h, 0.05 + Math.cos(a) * 0.6], at: [-0.05, 0.7, 0.05], fov: 1.0, roll: a };
    return { items: b.items, cam, ...kLights("night", t, [-0.05, 0.86, 0.05], 1.1) };
  },
  // облегчение: сидит на полу у шкафов, камера медленно опускается
  "kitchen/floor": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    person(b, { look: MOM(p), pose: "floor", x: 0.92, z: -0.7, ry: -PI / 2, t, headPitch: 0.2, headYaw: 0.2 });
    phone(b, 0.55, 0.01, -0.62, { t, glow: 1.0, ry: 1.0 });
    const k = ease(t / D);
    const cam = { eye: add3(lerp3([-0.6, 1.5, -1.0], [-0.1, 0.75, -0.85], k), shake(t, 0.4)), at: [0.9, 0.5, -0.65], fov: 0.9 };
    return { items: b.items, cam, ...kLights("night", t, [0.55, 0.12, -0.62], 0.9) };
  },
  // днём/вечером под абажуром: мать и сын договариваются о слове
  "kitchen/warm_talk": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 19, lampOn: true });
    person(b, { look: MOM(p), pose: "sit", x: SOUTH[0], z: SOUTH[1], ry: PI, t, headYaw: 0.5 });
    const talk = Math.sin(t * 2.5) > 0;
    person(b, { look: SON(p), pose: "sit", arms: talk ? "point" : null, x: EAST[0], z: EAST[1], ry: -PI / 2, t, headYaw: -0.2 });
    const a = lerp(-0.25, 0.25, ease(t / D));
    const cam = { eye: [-0.1 + Math.sin(a) * 2.0, 1.4, 0.1 + Math.cos(a) * 2.0], at: [0.15, 0.95, 0.2], fov: 0.9 };
    return { items: b.items, cam, ...kLights("warm", t) };
  },
  // снова ночь, звонок — она тянется к телефону
  "kitchen/ring_reach": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    phone(b, ...PH, { ring: true, t, glow: ringGlow(t, true) });
    const k = ease(t / D);
    person(b, { look: MOM(p), pose: t > D * 0.4 ? "reach" : "stand", x: -0.15, z: lerp(0.95, 0.68, k), ry: PI, t, headPitch: 0.45 });
    const cam = { eye: add3(lerp3([-1.0, 1.0, -0.4], [-0.75, 0.95, -0.2], k), shake(t, 0.7)), at: [-0.05, 0.85, 0.15], fov: 0.85 };
    return { items: b.items, cam, ...kLights("night", t, [-0.05, 0.86, 0.05], ringGlow(t, true)) };
  },
  // развязка: сын сидит рядом и молча смотрит на звонящий телефон
  "kitchen/reveal": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    phone(b, ...PH, { ring: true, t, glow: ringGlow(t, true) });
    person(b, { look: MOM(p), pose: "sit", x: SOUTH[0], z: SOUTH[1], ry: PI, t, headPitch: 0.4 });
    person(b, { look: SON(p), pose: "sit", x: EAST[0], z: EAST[1], ry: -PI / 2, t, headPitch: 0.45, headYaw: -0.25 });
    const k = ease(t / D);
    const cam = { eye: add3(lerp3([0.15, 1.05, 0.42], [-0.3, 1.32, -0.02], k), shake(t, 0.3)), at: lerp3([-0.05, 0.78, 0.05], [0.6, 1.25, 0.1], k), fov: lerp(0.8, 0.75, k) };
    return { items: b.items, cam, ...kLights("night", t, [-0.05, 0.86, 0.05], ringGlow(t, true)) };
  },
  // камера наблюдения в углу: она ходит туда-сюда (фон для карточек правил)
  "kitchen/cctv": (t, D, p) => {
    const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23 });
    const ph = (t * 0.45) % 2, k = ph < 1 ? ph : 2 - ph, x = lerp(-1.0, 0.5, ease(k));
    person(b, { look: MOM(p), pose: "walk", x, z: -0.95, ry: ph < 1 ? PI / 2 : -PI / 2, t, phase: t * 6.5 });
    phone(b, ...PH, { t, glow: 0.8 });
    const cam = { eye: [1.55, 2.45, 1.95], at: [-0.4, 0.6, -0.6], fov: 1.25 };
    return { items: b.items, cam, ...kLights("night", t, [-0.05, 0.86, 0.05], 0.8), post: { tint: [0.9, 1.05, 0.95], grain: 0.12, ca: 0.006 } };
  },
};

// снаружи: камера за окном, кто-то смотрит на кухню из темноты
SHOTS["kitchen/outside"] = (t, D, p) => {
  const b = new Build(); kitchen(b, { chairs: CHAIRS, clockH: 23, glass: false });
  phone(b, ...PH, { t, glow: 1.0 });
  const ph = (t * 0.3) % 2, k = ph < 1 ? ph : 2 - ph, z = lerp(-0.9, 0.6, ease(k));
  person(b, { look: MOM(p), pose: "walk", arms: "look_phone", x: -1.1, z, ry: ph < 1 ? 0 : PI, t, phase: t * 6.5, headPitch: 0.35 });
  // кусты и подоконник снаружи
  b.box(-1.95, 0.84, -0.1, 0.3, 0.05, 1.6, "#3a3f44");
  for (const [z0, h] of [[-1.3, 0.9], [0.9, 1.0], [-0.6, 0.5]]) b.sph(-2.5, h * 0.6, z0, h * 0.5, "#13201a", { seg: 7, ring: 5 });
  const kk = ease(t / D);
  const cam = { eye: add3(lerp3([-3.3, 1.4, 0.9], [-2.9, 1.5, 0.4], kk), shake(t, 0.7)), at: [-0.6, 1.2, -0.2], fov: 0.75 };
  const L = kLights("night", t, [-0.05, 0.86, 0.05], 1.0);
  L.lights.push({ p: [-0.2, 1.84, 0.1], c: [0.35, 0.3, 0.25], r: 4 });
  return { items: b.items, cam, ...L, fog: [0.004, 0.006, 0.01], fogD: 0.09 };
};

// ---------- универсальный режиссёр: локация + актёры + камера описываются в сценарии ----------
const V3 = (v) => (Array.isArray(v[0]) ? v : [v, v]);
const pathAt = (pts, k) => { // ломаная, k 0..1 по длине
  if (pts.length === 1) return pts[0];
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let r = k * tot; for (let i = 1; i < pts.length; i++) { if (r <= L[i - 1] || i === pts.length - 1) { const q = L[i - 1] ? Math.min(1, r / L[i - 1]) : 1; return [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q), Math.atan2(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])]; } r -= L[i - 1]; }
  return pts[pts.length - 1];
};
export function direct(w, t, D) {
  const b = new Build(); const u = Math.min(1, t / D);
  const key = (arr) => { let v = arr[0][1]; for (let i = 0; i < arr.length; i++) { const [f, x] = arr[i]; if (u >= f) { v = x; const nx = arr[i + 1]; if (nx && typeof x === "number") v = lerp(x, nx[1], ease((u - f) / Math.max(0.001, nx[0] - f))); } } return v; };
  const o = { ...(w.o || {}) }; for (const [k2, arr] of Object.entries(w.anim || {})) o[k2] = key(arr);
  const env = LOCS[w.loc](b, o, t, u) || {};
  for (const a of w.actors || []) {
    if ((a.show && (u < a.show[0] || u > a.show[1]))) continue;
    let x = 0, z = 0, ry = a.ry ?? 0, pose = a.pose || "stand", phase = 0;
    if (a.path) {
      const [f0, f1] = a.span || [0, 1], k = Math.max(0, Math.min(1, (u - f0) / Math.max(0.01, f1 - f0)));
      const q = pathAt(a.path, a.ease === false ? k : ease(k) * 0.3 + k * 0.7); x = q[0]; z = q[1];
      if (a.ry === undefined && q[2] !== undefined) ry = q[2];
      if (k > 0 && k < 1) { pose = a.run ? "run" : "walk"; phase = t * (a.run ? 10 : 6.5); }
    } else if (a.at) { x = a.at[0]; z = a.at[1]; }
    if (a.poses) for (const [f, ps] of a.poses) if (u >= f) pose = ps;
    let arms = a.arms || null; if (a.armsAt) for (const [f, ar] of a.armsAt) if (u >= f) arms = ar;
    const head = a.head || [0, 0];
    if (a.ryAt) ry = key(a.ryAt);
    let y = Array.isArray(a.y) ? (() => { const [f0, f1] = a.span || [0, 1]; return lerp(a.y[0], a.y[1], Math.max(0, Math.min(1, (u - f0) / Math.max(0.01, f1 - f0)))); })() : a.y || 0;
    if (a.drift) { z -= a.drift * t; } // для трассы: объект «едет» навстречу
    person(b, { look: typeof a.look === "string" ? LOOKS[a.look] || a.look : a.look, pose, x, z, y, ry, t, phase, arms,
      headYaw: head[0] + (a.lookAround ? Math.sin(t * 1.3) * 0.5 : 0), headPitch: head[1], eyes: a.eyes ?? 1, scale: a.scale || 1 });
  }
  const c0 = { eye: (() => { const cc = w.cam || {}; const E0 = V3(cc.eye || [0, 1.6, 3]); return lerp3(E0[0], E0[1], cc.linear ? u : ease(u)); })() };
  for (const pr0 of w.props || []) {
    if (pr0.show && (u < pr0.show[0] || u > pr0.show[1])) continue;
    const pr = { ...pr0 };
    if (pr.path) { const [f0, f1] = pr.span || [0, 1]; const q = pathAt(pr.path, ease(Math.max(0, Math.min(1, (u - f0) / Math.max(0.01, f1 - f0))))); pr.x = q[0]; pr.z = q[1]; if (q[2] !== undefined && pr.autoRy !== false) pr.ry = q[2]; }
    if (pr.drift) pr.z -= pr.drift * t;
    if (pr.type === "phone") phone(b, pr.x, pr.y, pr.z, { ring: pr.ring, t, glow: pr.ring ? (Math.sin(t * 9) > 0 ? 1.5 : 0.9) : 1, ry: pr.ry ?? 0.3 });
    if (pr.type === "note") note(b, pr.x, pr.y, pr.z, pr.ry || 0);
    if (pr.type === "car") car(b, pr.x, pr.z, pr);
    if (pr.type === "box") b.box(pr.x, pr.y || 0, pr.z, pr.w, pr.h, pr.d, pr.c || "#555555", pr);
    if (pr.type === "spikes") for (let i = 0; i < 9; i++) b.cyl(pr.x + (i % 3) * 0.5 - 0.5, 0, pr.z + Math.floor(i / 3) * 0.4, 0.05, 0.0, 0.09, "#b0b0b0", { seg: 4, mat: "metal" });
    if (pr.type === "blackout") b.box(c0.eye[0], c0.eye[1] - 1, c0.eye[2], 0.6, 2, 0.6, "#000000", { ns: true });
  }
  const c = w.cam || {}, k = c.linear ? u : ease(u);
  const E = V3(c.eye || [0, 1.6, 3]), A = V3(c.at || [0, 1, 0]), F = Array.isArray(c.fov) ? c.fov : [c.fov || 0.9, c.fov || 0.9];
  let eye = lerp3(E[0], E[1], k);
  if (c.follow !== undefined) { // камера едет вместе с актёром
    const a = w.actors[c.follow]; const q = a.path ? pathAt(a.path, Math.max(0, Math.min(1, (u - (a.span || [0, 1])[0]) / Math.max(0.01, (a.span || [0, 1])[1] - (a.span || [0, 1])[0])))) : a.at;
    eye = [eye[0] + q[0], eye[1], eye[2] + q[1]];
    const at0 = lerp3(A[0], A[1], k); var at = [at0[0] + q[0], at0[1], at0[2] + q[1]];
  }
  const cam = { eye: add3(eye, shake(t, c.shake ?? 0.6)), at: at || lerp3(A[0], A[1], k), fov: lerp(F[0], F[1], k), roll: (c.roll || 0) + (c.shake ?? 0.6) * Math.sin(t * 0.9) * 0.01 };
  const el = env.lights || [];  // главный свет (с тенью) первым, потом свет сцены, потом остальное окружение — в шейдере 4 источника
  const lights = [...el.slice(0, 1), ...(w.lights || []), ...el.slice(1)];
  return { ...env, items: b.items, cam, lights, post: { ...(env.post || {}), ...(w.post || {}) } };
}

export function buildShot(name, t, D, p = {}) {
  if (p && p.loc) { const sc = direct(p, t, D); sc.post = { time: t, ...(sc.post || {}) }; return sc; }
  const fn = SHOTS[name] || SHOTS["kitchen/ring"];
  const sc = fn(t, D, p);
  sc.post = { time: t, ...(sc.post || {}) };
  if (name.startsWith("kitchen/")) {
    sc.room = sc.room || [-1.7, 1.7, -2.1, 2.1, 0, 2.6];
    if (!sc.rays) sc.rays = sc.lights[0] && sc.lights[0].dir ? { p: [-5.5, 5.4, -0.6], k: 1.0 } : { p: [-0.2, 1.9, 0.1], k: 0.6 };
  }
  return sc;
}
