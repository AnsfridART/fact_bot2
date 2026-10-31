// Сцена истории: фон + персонажи + предметы + камера + атмосфера (тон, зерно, пыль, виньетка).
import React from "react";
import { clamp, lerp, prog, easeOut, easeInOut } from "./util.js";
import { Person } from "./Person.jsx";
import { Emu, Crow } from "./Animals.jsx";
import { Truck, MachineGun, Fence, House, Desk, AmmoBox, Casings, Paper, Trunk, Door, Frame, LawnChair, Briefcase, Tank, Wave, Shelves, Smoke, Stage as Podium, Letter } from "./Props.jsx";
import { Background } from "./Backgrounds.jsx";

const PROPS = { truck: Truck, gun: MachineGun, fence: Fence, house: House, desk: Desk, ammo: AmmoBox, casings: Casings, paper: Paper, trunk: Trunk, door: Door, frame: Frame, chair: LawnChair, briefcase: Briefcase, tank: Tank, wave: Wave, shelves: Shelves, smoke: Smoke, podium: Podium, letter: Letter };

function actorPos(a, t) {
  const k = a.to ? easeInOut(clamp(t)) : 0;
  return { x: lerp(a.x ?? 135, a.to?.x ?? a.x ?? 135, k), y: lerp(a.y ?? 360, a.to?.y ?? a.y ?? 360, k) };
}

function Actor({ a, f, t, mouth, idx }) {
  const { x, y } = actorPos(a, t);
  const s = a.s ?? 1;
  const flip = a.flip ? -1 : 1;
  const common = { t: f, phase: idx * 1.7 + (a.phase || 0) };
  let body = null;
  if (a.kind === "crowd") {
    const n = a.count || 8, spread = a.spread || 220, items = [];
    for (let i = 0; i < n; i++) {
      const dx = ((i * 61) % 100) / 100 * spread - spread / 2, dy = ((i * 43) % 100) / 100 * (a.depth || 40);
      const lk = (a.looks || [{}])[i % (a.looks || [{}]).length];
      items.push({ dy, el: <g key={i} transform={`translate(${dx} ${dy}) scale(${0.6 + dy / (a.depth || 40) * 0.35})`}><Person t={f} phase={i * 1.9} look={lk} anim={a.anim || "idle"} /></g> });
    }
    body = <g>{items.sort((p, q) => p.dy - q.dy).map((p) => p.el)}</g>;
  } else if (a.kind === "person") body = <Person {...common} look={a.look} anim={a.anim} expr={a.expr} held={a.held} mouth={a.talk ? mouth : 0} />;
  else if (a.kind === "emu") body = <Emu {...common} anim={a.anim} angry={a.angry} />;
  else if (a.kind === "crow") body = <Crow {...common} anim={a.anim} color={a.color} />;
  else if (a.kind === "flock" || a.kind === "crows") {
    const n = a.count || 12, spread = a.spread || 220;
    const items = [];
    for (let i = 0; i < n; i++) {
      const dx = ((i * 73) % 100) / 100 * spread - spread / 2;
      const dy = ((i * 37) % 100) / 100 * (a.depth || 60);
      const sc = 0.55 + dy / (a.depth || 60) * 0.5;
      const El = a.kind === "flock" ? Emu : Crow;
      items.push({ dy, el: <g key={i} transform={`translate(${dx} ${dy}) scale(${sc})`}><El t={f} phase={i * 2.3} anim={a.anim || "walk"} color={a.color} /></g> });
    }
    body = <g>{items.sort((p, q) => p.dy - q.dy).map((p) => p.el)}</g>;
  } else if (PROPS[a.kind]) {
    const P = PROPS[a.kind];
    body = <P t={f} {...(a.props || {})} />;
  }
  return <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>{body}</g>;
}

function cameraFor(seg, f, actors) {
  const d = Math.max(1, seg.dur), t = f / d;
  const base = { in: [1.25, 1.4], out: [1.45, 1.25], left: [1.32, 1.32], right: [1.32, 1.32], shake: [1.3, 1.38], up: [1.32, 1.32] }[seg.cam || "in"] || [1.25, 1.4];
  let z = lerp(base[0], base[1], t), cx = 135, cy = seg.camY ?? 305;
  if (seg.cam === "left") cx = lerp(150, 120, t);
  if (seg.cam === "right") cx = lerp(120, 150, t);
  if (seg.cam === "up") cy = lerp(325, 285, t);
  let sx = 0, sy = 0;
  if (seg.cam === "shake") { sx = Math.sin(f * 1.7) * 1.6; sy = Math.cos(f * 2.3) * 1.6; }
  z += 0.06 * (1 - easeOut(prog(f, 0, 6)));
  // крупный план на второй половине длинной сцены
  const fi = seg.focus;
  if (fi !== undefined && fi !== null && d > 70 && f >= d / 2 && actors[fi]) {
    const h = Math.floor(d / 2), t2 = (f - h) / (d - h);
    const a = actors[fi], p = actorPos(a, t);
    const s = a.s ?? 1;
    const head = a.kind === "person" ? 140 : a.kind === "emu" ? 110 : 40;
    cx = p.x; cy = p.y - head * s;
    z = lerp(2.3, 2.45, t2) + 0.08 * (1 - easeOut(prog(f - h, 0, 6)));
  }
  return { z, cx: cx + sx, cy: cy + sy };
}

const TINTS = { warm: ["#ff9a40", 0.14], cold: ["#3a5cff", 0.14], night: ["#0a1430", 0.4], red: ["#ff2a1a", 0.16], dark: ["#000", 0.3] };

export function Stage({ seg, f, mouth }) {
  const actors = seg.actors || [];
  const t = f / Math.max(1, seg.dur);
  const cam = cameraFor(seg, f, actors);
  const order = actors.map((a, i) => ({ a, i })).sort((p, q) => (p.a.z ?? actorPos(p.a, t).y) - (q.a.z ?? actorPos(q.a, t).y));
  const tint = TINTS[seg.tint];
  const half = seg.focus !== undefined && seg.dur > 70 ? Math.floor(seg.dur / 2) : -99;
  const cutFlash = f >= half && half > 0 ? 1 - easeOut(prog(f, half, 3)) : 0;
  return (
    <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="vig" cx="50%" cy="48%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".75" /></radialGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed={f % 50} /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <g transform={`translate(135 240) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
        <Background name={seg.bg} t={f} />
        {order.map(({ a, i }) => <Actor key={i} a={a} f={f} t={t} mouth={mouth} idx={i} />)}
      </g>
      {[...Array(14)].map((_, i) => (
        <circle key={i} cx={(i * 61 + f * (0.15 + (i % 3) * 0.1)) % 270} cy={(i * 97 - f * 0.2 * ((i % 2) + 1) + 480) % 480} r={0.6 + (i % 3) * 0.4} fill="#fff" opacity=".18" />
      ))}
      {tint && <rect width="270" height="480" fill={tint[0]} opacity={tint[1]} style={{ mixBlendMode: "multiply" }} />}
      <rect width="270" height="480" filter="url(#grain)" opacity=".07" />
      <rect width="270" height="480" fill="url(#vig)" />
      <rect width="270" height="480" fill="#000" opacity={Math.max(seg.kind === "hook" ? 0 : 1 - easeOut(prog(f, 0, 4)), cutFlash) * 0.55} />
    </svg>
  );
}
