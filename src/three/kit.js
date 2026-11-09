// Набор для 3D-сцен: персонажи и локации. Единицы — метры, пол y=0, лицо персонажа смотрит в +z.
import { M, hex, ik } from "./engine.js";

export const LOOKS = {
  man: { skin: "#d9a982", shirt: "#2f4a5a", pants: "#1f2630", shoes: "#111111", hair: "#2a1d14", hairStyle: "short" },
  woman: { skin: "#e3b08d", shirt: "#7a3b3b", pants: "#2a2a33", shoes: "#1a1212", hair: "#4a2e1c", hairStyle: "long" },
  elder: { skin: "#d8a585", shirt: "#5b4e6e", pants: "#2c2a30", shoes: "#1a1616", hair: "#9a9a9a", hairStyle: "bun" },
  boy: { skin: "#e0ae8a", shirt: "#3d6b3a", pants: "#23303d", shoes: "#151515", hair: "#3a2414", hairStyle: "short" },
  stranger: { skin: "#b89478", shirt: "#141414", pants: "#101010", shoes: "#0a0a0a", hair: "#0d0d0d", hairStyle: "hood" },
};

// pose: stand | walk | sit | phone | sitphone | arms_up | look_phone ; phase — фаза шага (радианы)
export function person(b, { x = 0, z = 0, y = 0, ry = 0, look = "man", pose = "stand", phase = 0, t = 0, headYaw = 0, headPitch = 0, scale = 1, eyes = 1, arms = null }) {
  const L = typeof look === "string" ? LOOKS[look] : look;
  const walk = pose === "walk" || pose === "run", floor = pose === "floor", sit = pose === "sit" || pose === "sitphone" || floor;
  const amp = pose === "run" ? 1.5 : 1;
  const sw = walk ? Math.sin(phase) : 0, breath = Math.sin(t * 2.2) * 0.008;
  const hipY = floor ? 0.1 : sit ? 0.5 : 0.92 + (walk ? Math.abs(Math.cos(phase)) * 0.035 * amp : breath);
  b.push(M.tr(x, y, z), M.ry(ry), M.sc(scale));
  // ноги
  for (const s of [-1, 1]) {
    const swing = floor ? -1.35 - (s > 0 ? 0.25 : 0) : sit ? -1.5 : sw * 0.45 * s * amp;
    const ph = phase + (s > 0 ? 0 : Math.PI);
    const knee = floor ? (s > 0 ? 1.6 : 0.35) : sit ? 1.5 : walk ? Math.max(0, -Math.cos(ph)) * 0.75 * amp : 0.02;
    b.push(M.tr(0.1 * s, hipY, 0), M.rx(swing));
    b.cyl(0, -0.45, 0, 0.07, 0.085, 0.47, L.pants, { seg: 7 });
    b.push(M.tr(0, -0.44, 0), M.rx(knee));
    b.cyl(0, -0.44, 0, 0.055, 0.068, 0.45, L.pants, { seg: 7 });
    b.box(0, -0.5, 0.045, 0.12, 0.07, 0.25, L.shoes);
    b.pop().pop();
  }
  // корпус
  b.push(M.tr(0, hipY, 0), M.rx(walk ? 0.07 * amp : floor ? -0.25 : sit ? -0.05 : 0));
  b.cyl(0, -0.06, 0, 0.17, 0.18, 0.16, L.pants, { seg: 9, sz: 0.7 });
  b.cyl(0, 0.08, 0, 0.18, 0.215 + breath, 0.42, L.shirt, { seg: 9, sz: 0.62 });
  b.sph(0, 0.5, 0, 0.215, L.shirt, { seg: 9, ring: 6, sy: 0.45, sz: 0.62 });
  if (L.hairStyle === "hood") b.sph(0, 0.53, -0.07, 0.17, L.shirt, { sy: 0.6 });
  // голова (крупная, как в нашем 2D-стиле)
  b.push(M.tr(0, 0.58, 0), M.ry(headYaw), M.rx(headPitch));
  b.cyl(0, 0, 0, 0.055, 0.055, 0.1, L.skin, { seg: 7 });
  b.sph(0, 0.2, 0, 0.145, L.skin, { seg: 12, ring: 8, sy: 1.08 });
  b.sph(0, 0.19, 0.142, 0.022, L.skin, { seg: 6, ring: 4 });               // нос
  for (const s of [-1, 1]) {
    b.sph(0.052 * s, 0.225, 0.122, 0.022 * Math.max(0.15, eyes), "#f2efe8", { seg: 8, ring: 5, sz: 0.5, sy: Math.max(0.15, eyes), ns: true });
    b.sph(0.052 * s, 0.225, 0.131, 0.012, "#120c0a", { seg: 6, ring: 4, sz: 0.5, sy: Math.max(0.15, eyes), ns: true });
    b.box(0.052 * s, 0.258, 0.128, 0.045, 0.01, 0.012, L.hair, { ns: true });
    b.sph(0.142 * s, 0.2, 0, 0.03, L.skin, { seg: 6, ring: 4, sx: 0.5 });   // уши
  }
  b.box(0, 0.13, 0.135, 0.045, 0.008, 0.01, "#7a3d34", { ns: true });
  const H = L.hair;
  if (L.hairStyle === "hood") { b.sph(0, 0.23, -0.015, 0.175, L.shirt, { seg: 12, ring: 8, sy: 1.08 }); }
  else {
    b.sph(0, 0.255, -0.02, 0.152, H, { seg: 12, ring: 8, sy: 0.85 });
    b.sph(0, 0.2, -0.05, 0.145, H, { seg: 12, ring: 8, sz: 0.8 });
    if (L.hairStyle === "long") b.box(0, -0.12, -0.08, 0.3, 0.38, 0.12, H);
    if (L.hairStyle === "bun") b.sph(0, 0.35, -0.12, 0.065, H);
  }
  b.pop();
  // руки — по цели кисти (инверсная кинематика)
  const ap = arms || pose;
  for (const s of [-1, 1]) {
    const right = s > 0; const S = [0.235 * s, 0.47, 0];
    let T = [0.26 * s, 0.0, 0.04], pole = [0.3 * s, -0.2, -1];
    if (walk) T = [0.29 * s, 0.05, -sw * 0.3 * s * amp];
    if (sit) { T = floor ? [0.12 * s, 0.05, 0.35] : [0.17 * s, 0.2, 0.38]; pole = [0.6 * s, -1, 0]; }
    const ph = ap === "phone" || ap === "sitphone";
    if (ph && right) { T = [0.12, 0.79, 0.07]; pole = [1, -1.2, -0.2]; }
    if (ap === "look_phone") { T = [0.05 * s, 0.33, 0.33]; pole = [0.8 * s, -1, 0]; }
    if (ap === "arms_up") { T = [0.34 * s, 1.08, 0.1]; pole = [1 * s, 0, -0.5]; }
    if (ap === "point" && right) { T = [0.22, 0.52, 0.78]; pole = [1, -1, 0]; }
    if (ap === "reach" && right) { T = [0.18, 0.2, 0.58]; pole = [1, -1, 0]; }
    if (ap === "cover" ) { T = [0.04 * s, 0.7, 0.16]; pole = [1 * s, -1, 0]; }
    const { E, H } = ik(S, T, 0.3, 0.3, pole);
    b.sph(S[0], S[1], S[2], 0.068, L.shirt, { seg: 7, ring: 5 });
    b.seg(S, E, 0.062, 0.052, L.shirt); b.sph(E[0], E[1], E[2], 0.05, L.shirt, { seg: 6, ring: 4 });
    b.seg(E, H, 0.05, 0.042, L.shirt); b.sph(H[0], H[1], H[2], 0.05, L.skin, { seg: 7, ring: 5 });
    if ((ph && right) || (ap === "look_phone" && right)) b.box(H[0] - (ph ? 0.03 : 0.05), H[1] - 0.06, H[2] + 0.02, ph ? 0.015 : 0.09, ph ? 0.15 : 0.012, ph ? 0.08 : 0.16, "#0d0d0d", { e: ap === "look_phone" ? "#3a5a8a" : null });
  }
  b.pop();
  b.pop();
}

// ---------- кухня ночью: 3.4 × 4.2 м, окно в левой стене ----------
export function kitchen(b, o = {}) {
  const W = 3.4, D = 4.2, Hh = 2.6, x0 = -W / 2, z0 = -D / 2;
  const wall = o.wall || "#5d6b63", floor = "#4a3c32";
  b.box(0, -0.05, 0, W, 0.05, D, floor);
  b.box(0, Hh, 0, W, 0.05, D, "#55585a");
  b.box(0, 0, z0 - 0.05, W, Hh, 0.1, wall);           // задняя
  b.box(0, 0, -z0 + 0.05, W, Hh, 0.1, wall);          // передняя (за камерой)
  b.box(-x0 + 0.05, 0, 0, 0.1, Hh, D, wall);          // правая
  // левая стена с проёмом окна (z от -0.8 до 0.6, y от 0.9 до 2.2)
  const lw = x0 - 0.05;
  b.box(lw, 0, 0, 0.1, 0.9, D, wall);
  b.box(lw, 2.2, 0, 0.1, Hh - 2.2, D, wall);
  b.box(lw, 0.9, (z0 + -0.8) / 2, 0.1, 1.3, -0.8 - z0, wall);
  b.box(lw, 0.9, (0.6 + -z0) / 2, 0.1, 1.3, -z0 - 0.6, wall);
  // рама и стекло
  b.box(lw, 0.88, -0.1, 0.16, 0.04, 1.5, "#d9d6cf");
  if (o.glass !== false) b.box(lw, 0.9, -0.1, 0.02, 1.3, 1.4, "#0b1420", { e: "#0e1a2e", ns: true });
  b.box(lw, 0.9, -0.1, 0.06, 1.3, 0.05, "#d9d6cf"); b.box(lw, 1.5, -0.1, 0.06, 0.04, 1.4, "#d9d6cf");
  // шторы
  b.box(x0 + 0.08, 0.85, -1.0, 0.06, 1.45, 0.4, "#7d6a4a"); b.box(x0 + 0.08, 0.85, 0.8, 0.06, 1.45, 0.4, "#7d6a4a");
  // пол-плинтус
  b.box(0, 0, z0 + 0.02, W, 0.08, 0.04, "#3b3530");
  // гарнитур справа
  b.box(-x0 - 0.33, 0, -0.6, 0.6, 0.86, 2.8, "#3e5a52");
  b.box(-x0 - 0.33, 0.86, -0.6, 0.64, 0.04, 2.84, "#b9b2a6");
  b.box(-x0 - 0.2, 1.45, -0.6, 0.35, 0.7, 2.8, "#3e5a52");
  for (let i = 0; i < 4; i++) b.box(-x0 - 0.64, 0.4, -1.75 + i * 0.7, 0.02, 0.03, 0.12, "#c9c9c9");
  // плита и чайник
  b.box(-x0 - 0.33, 0.9, 0.3, 0.55, 0.02, 0.55, "#1b1b1b");
  b.cyl(-x0 - 0.35, 0.92, 0.3, 0.1, 0.08, 0.2, "#a8a8a8", { seg: 10 });
  // холодильник у задней стены
  b.box(-0.6, 0, z0 + 0.35, 0.7, 1.85, 0.65, "#d6dad9");
  b.box(-0.6, 1.2, z0 + 0.68, 0.68, 0.01, 0.01, "#9aa");
  b.box(-0.35, 0.9, z0 + 0.69, 0.03, 0.25, 0.03, "#999999");
  // часы
  b.push(M.tr(0.6, 1.95, z0 + 0.01), M.rx(Math.PI / 2));
  b.cyl(0, 0, 0, 0.17, 0.17, 0.03, "#e4e0d6", { seg: 16, e: "#1c2230" });
  b.pop();
  const hr = o.clockH ?? 11, mn = o.clockM ?? 0;
  b.push(M.tr(0.6, 1.95, z0 + 0.05), M.rz(-((hr % 12) / 12) * Math.PI * 2 - (mn / 720) * Math.PI * 2)); b.box(0, 0, 0, 0.012, 0.09, 0.01, "#111111", { ns: true }); b.pop();
  b.push(M.tr(0.6, 1.95, z0 + 0.055), M.rz(-(mn / 60) * Math.PI * 2)); b.box(0, 0, 0, 0.008, 0.14, 0.01, "#111111", { ns: true }); b.pop();
  // стол
  const tx = -0.2, tz = 0.1;
  b.box(tx, 0.72, tz, 1.2, 0.04, 0.8, "#8f8577");
  b.box(tx, 0.62, tz, 1.24, 0.12, 0.84, "#a33b3b");
  for (const [dx, dz] of [[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]]) b.box(tx + dx, 0, tz + dz, 0.05, 0.72, 0.05, "#5a4232");
  // стулья
  for (const [cx, cz, r] of (o.chairs || [[tx, tz + 0.65, Math.PI], [tx + 0.85, tz, -Math.PI / 2]])) {
    b.push(M.tr(cx, 0, cz), M.ry(r));
    b.box(0, 0.44, 0, 0.42, 0.04, 0.42, "#6b4e38");
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.box(dx, 0, dz, 0.035, 0.44, 0.035, "#5a4232");
    b.box(0, 0.48, 0.19, 0.42, 0.45, 0.035, "#6b4e38");
    b.pop();
  }
  // кружка, сахарница
  b.cyl(tx - 0.3, 0.76, tz - 0.1, 0.045, 0.045, 0.1, "#e8e4da", { seg: 10 });
  b.cyl(tx - 0.45, 0.76, tz - 0.25, 0.07, 0.06, 0.09, "#4f7fa0", { seg: 10 });
  // лампа-абажур (выключена)
  b.cyl(tx, 2.1, tz, 0.005, 0.005, 0.5, "#222222");
  b.cyl(tx, 1.95, tz, 0.28, 0.08, 0.17, o.lampOn ? "#ffd27a" : "#8a6a3a", { seg: 12, e: o.lampOn ? "#ffbe55" : null, ns: true });
  return { table: [tx, 0.76, tz] };
}

// телефон на столе: экран светится, при звонке вибрирует
export function phone(b, x, y, z, { ring = false, t = 0, ry = 0.3, glow = 1 } = {}) {
  const j = ring ? Math.sin(t * 60) * 0.004 : 0;
  b.push(M.tr(x + j, y, z), M.ry(ry + (ring ? Math.sin(t * 47) * 0.03 : 0)));
  b.box(0, 0, 0, 0.08, 0.012, 0.16, "#0c0c0c");
  b.box(0, 0.012, 0, 0.072, 0.002, 0.15, "#cfe0ff", { e: hex("#7fa8ff").map((v) => v * glow), ns: true });
  if (ring) b.box(0, 0.0145, 0.045, 0.018, 0.002, 0.018, "#2fd36b", { e: "#2fd36b", ns: true });
  b.pop();
}
