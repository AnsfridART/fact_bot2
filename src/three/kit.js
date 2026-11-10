// Набор для 3D-сцен: персонажи и локации. Единицы — метры, пол y=0, лицо персонажа смотрит в +z.
import { M, hex, ik } from "./engine.js";
import { person as personV2 } from "./people.js";

export const LOOKS = {
  man: { skin: "#d9a982", shirt: "#2f4a5a", pants: "#2a3446", shoes: "#111111", hair: "#2a1d14", hairStyle: "short", top: "jacket", outer: "#2a2a2c", beard: "stubble" },
  woman: { skin: "#e3b08d", shirt: "#7a3b3b", pants: "#2a2a33", shoes: "#1a1212", hair: "#4a2e1c", hairStyle: "long" },
  elder: { skin: "#d8a585", shirt: "#5b4e6e", pants: "#2c2a30", shoes: "#1a1616", hair: "#9a9a9a", hairStyle: "bun" },
  boy: { skin: "#e0ae8a", shirt: "#3d6b3a", pants: "#23303d", shoes: "#151515", hair: "#3a2414", hairStyle: "short", top: "hoodie", outer: "#3d6b3a" },
  stranger: { skin: "#b89478", shirt: "#141414", pants: "#101010", shoes: "#0a0a0a", hair: "#0d0d0d", hairStyle: "hood", top: "hoodie", outer: "#161616", beard: "stubble" },
};

// v26: персонажи вынесены в people.js (одежда, мимика, живое тело)
export function person(b, o) { return personV2(b, { ...o, LOOKS }); }

// детерминированный «случай» для расстановки окон и мусора
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// панельная девятиэтажка: x,z — центр низа, ry — поворот, окна светятся случайно
export function panelHouse(b, x, z, { ry = 0, w = 24, floors = 9, seed = 1, lit = 0.28, d = 12 } = {}) {
  const fh = 2.8;
  b.push(M.tr(x, 0, z), M.ry(ry));
  b.box(0, 0, 0, w, floors * fh, d, "#7d7f7a", { mat: "panel", ns: true });
  const n = Math.floor(w / 3);
  for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
    const r = rnd(seed * 1000 + f * 37 + i);
    const on = r < lit, warm = rnd(seed * 777 + f * 13 + i) > 0.25;
    const col = on ? (warm ? "#ffb35a" : "#9fc4ff") : "#0b0d10";
    b.box(-w / 2 + 1.5 + i * 3, f * fh + 0.9, d / 2 + 0.02, 1.3, 1.3, 0.04, col, { e: on ? (warm ? [0.9, 0.55, 0.22] : [0.35, 0.5, 0.8]).map((v) => v * (0.6 + 0.6 * r)) : null, ns: true });
    if ((i + f) % 4 === 1) b.box(-w / 2 + 1.5 + i * 3, f * fh + 0.5, d / 2 + 0.6, 2.2, 0.9, 1.1, "#8e8f88", { mat: "concrete", ns: true }); // балкон
  }
  b.pop();
}
// фонарь: столб и светящаяся голова
export function streetLamp(b, x, z, { h = 6, on = true, ry = 0 } = {}) {
  b.push(M.tr(x, 0, z), M.ry(ry));
  b.cyl(0, 0, 0, 0.09, 0.06, h, "#3a3d40", { seg: 6, mat: "metal" });
  b.box(0.6, h - 0.1, 0, 1.3, 0.08, 0.12, "#3a3d40");
  b.box(1.15, h - 0.22, 0, 0.45, 0.12, 0.28, "#2a2a2a", { e: on ? [3.2, 1.8, 0.7] : null, ns: true });
  b.pop();
}
export function tree(b, x, z, s = 1, seed = 1) {
  b.cyl(x, 0, z, 0.12 * s, 0.08 * s, 2.2 * s, "#2a2018", { seg: 6 });
  for (let i = 0; i < 3; i++) b.sph(x + (rnd(seed + i) - 0.5) * s, (2.4 + i * 0.6) * s, z + (rnd(seed + i + 9) - 0.5) * s, (1.1 - i * 0.2) * s, "#17241a", { seg: 7, ring: 5, ns: true });
}

// ---------- кухня ночью: 3.4 × 4.2 м, окно в левой стене ----------
export function kitchen(b, o = {}) {
  const W = 3.4, D = 4.2, Hh = 2.6, x0 = -W / 2, z0 = -D / 2;
  const wall = o.wall || "#7d8a74", floor = "#8a6a46", WP = { mat: "wallpaper", c2: o.wall2 || "#c4c9a8" };
  b.box(0, -0.05, 0, W, 0.05, D, floor, { mat: "parquet", c2: "#6a5236" });
  b.box(0, Hh, 0, W, 0.05, D, "#8a8c88", { mat: "concrete" });
  b.box(0, 0, z0 - 0.05, W, Hh, 0.1, wall, WP);           // задняя
  b.box(0, 0, -z0 + 0.05, W, Hh, 0.1, wall, WP);          // передняя (за камерой)
  b.box(-x0 + 0.05, 0, 0, 0.1, Hh, D, wall, WP);          // правая
  // левая стена с проёмом окна (z от -0.8 до 0.6, y от 0.9 до 2.2)
  const lw = x0 - 0.05;
  b.box(lw, 0, 0, 0.1, 0.9, D, wall, WP);
  b.box(lw, 2.2, 0, 0.1, Hh - 2.2, D, wall, WP);
  b.box(lw, 0.9, (z0 + -0.8) / 2, 0.1, 1.3, -0.8 - z0, wall, WP);
  b.box(lw, 0.9, (0.6 + -z0) / 2, 0.1, 1.3, -z0 - 0.6, wall, WP);
  // рама и стекло
  b.box(lw, 0.88, -0.1, 0.16, 0.04, 1.5, "#d9d6cf");
  // за окном — двор: дом напротив, фонарь, деревья
  if (!o.noOutside) {
    panelHouse(b, -17, -2, { ry: Math.PI / 2, seed: 3, lit: 0.35 });
    streetLamp(b, -5.5, -0.6, { h: 5.5, ry: 0 });
    tree(b, -8, 3.5, 1.2, 4); tree(b, -9, -4.5, 1.4, 8);
    b.box(-14, -0.05, 0, 24, 0.05, 40, "#2b2b2b", { mat: "asphalt", ns: true });
  }
  b.box(lw, 0.9, -0.1, 0.06, 1.3, 0.05, "#d9d6cf"); b.box(lw, 1.5, -0.1, 0.06, 0.04, 1.4, "#d9d6cf");
  // шторы
  b.box(x0 + 0.08, 0.85, -1.0, 0.06, 1.45, 0.4, "#7d6a4a"); b.box(x0 + 0.08, 0.85, 0.8, 0.06, 1.45, 0.4, "#7d6a4a");
  // пол-плинтус
  b.box(0, 0, z0 + 0.02, W, 0.08, 0.04, "#3b3530");
  // гарнитур справа
  b.box(-x0 - 0.33, 0, -0.6, 0.6, 0.86, 2.8, "#a89a7c", { mat: "wood" });
  b.box(-x0 - 0.33, 0.86, -0.6, 0.64, 0.04, 2.84, "#8f8a80", { mat: "concrete" });
  b.box(-x0 - 0.02, 0.9, -0.6, 0.02, 0.55, 2.8, "#c9d3d0", { mat: "tile" });
  b.box(-x0 - 0.2, 1.45, -0.6, 0.35, 0.7, 2.8, "#a89a7c", { mat: "wood" });
  for (let i = 0; i < 4; i++) b.box(-x0 - 0.64, 0.4, -1.75 + i * 0.7, 0.02, 0.03, 0.12, "#c9c9c9");
  // плита и чайник
  b.box(-x0 - 0.33, 0.9, 0.3, 0.55, 0.02, 0.55, "#1b1b1b");
  b.cyl(-x0 - 0.35, 0.92, 0.3, 0.1, 0.08, 0.2, "#a8a8a8", { seg: 10, mat: "metal" });
  b.box(-x0 - 0.62, 0.7, 0.3, 0.01, 0.03, 0.08, "#113311", { e: [0.1, 0.9, 0.3], ns: true }); // часы на плите
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
  b.box(tx, 0.72, tz, 1.2, 0.04, 0.8, "#b8a890", { mat: "carpet", c2: "#7a3030" });
  b.box(tx, 0.62, tz, 1.24, 0.12, 0.84, "#8a2e2e", { mat: "carpet", c2: "#c9b48a" });
  for (const [dx, dz] of [[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]]) b.box(tx + dx, 0, tz + dz, 0.05, 0.72, 0.05, "#5a4232", { mat: "wood" });
  // стулья
  for (const [cx, cz, r] of (o.chairs || [[tx, tz + 0.65, Math.PI], [tx + 0.85, tz, -Math.PI / 2]])) {
    b.push(M.tr(cx, 0, cz), M.ry(r));
    b.box(0, 0.44, 0, 0.42, 0.04, 0.42, "#7b5a40", { mat: "wood" });
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.box(dx, 0, dz, 0.035, 0.44, 0.035, "#5a4232");
    b.box(0, 0.48, 0.19, 0.42, 0.45, 0.035, "#7b5a40", { mat: "wood" });
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
