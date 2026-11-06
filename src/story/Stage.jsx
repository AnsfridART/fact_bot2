// Сцена истории: фон + персонажи + предметы + камера + атмосфера (тон, зерно, пыль, виньетка).
import React from "react";
import { clamp, lerp, prog, easeOut, easeInOut, backOut as backOutLocal } from "./util.js";
import { Person } from "./Person.jsx";
import { Emu, Crow, Cat, Rabbit, Leopard } from "./Animals.jsx";
import { Truck, MachineGun, Fence, House, Desk, AmmoBox, Casings, Paper, Trunk, Door, Frame, LawnChair, Briefcase, Tank, Wave, Shelves, Smoke, Stage as Podium, Letter, Lightning, Stones, Wheelbarrow, Palace, Desks, Fence2, Rocket, Computer, Aquarium, Coffin, Parachute, Bars } from "./Props.jsx";
import { Background } from "./Backgrounds.jsx";
import { NoirBackground, NOIR_BGS } from "./NoirBG.jsx";

const PROPS = { truck: Truck, gun: MachineGun, fence: Fence, house: House, desk: Desk, ammo: AmmoBox, casings: Casings, paper: Paper, trunk: Trunk, door: Door, frame: Frame, chair: LawnChair, briefcase: Briefcase, tank: Tank, wave: Wave, shelves: Shelves, smoke: Smoke, podium: Podium, letter: Letter, lightning: Lightning, stones: Stones, wheelbarrow: Wheelbarrow, palace: Palace, desks: Desks, fence2: Fence2, rocket: Rocket, computer: Computer, aquarium: Aquarium, coffin: Coffin, parachute: Parachute, bars: Bars };

// Источник света для каждого места: координаты, цвет, сила
const LIGHTS = {
  field_dusk: [190, 250, "#ffb070", 1], outback: [220, 150, "#ffe0a0", 0.4], office: [195, 205, "#cfe0ff", 0.6],
  night_field: [60, 110, "#c8d8ff", 0.6], museum: [135, 90, "#ffd090", 0.8], room: [200, 190, "#9ab0ff", 0.6],
  campus: [230, 150, "#f0f0ff", 0.3], old_street: [220, 120, "#ffe0b0", 0.8], paris: [200, 300, "#ffb070", 1],
  jungle: [180, 120, "#e0ffb0", 0.8], sky: [220, 80, "#fff8e0", 0.35], war: [100, 200, "#e0d8c0", 0.5],
  beach_night: [200, 100, "#c8d8ff", 0.6], winter_city: [150, 120, "#d0e0ff", 0.5], harbor: [200, 150, "#fff0d0", 0.3],
  town: [60, 150, "#ffd0a0", 0.35], space: [230, 60, "#fff6e0", 0.7], station: [200, 260, "#cfe8ff", 0.4], mission_control: [135, 160, "#3ac8ff", 0.5],
  hacker_room: [120, 185, "#3aff7a", 0.6], server_room: [135, 200, "#3aa8ff", 0.5], casino: [135, 60, "#ffd23f", 0.5], prison: [215, 170, "#e8f0ff", 0.6],
  cabin: [135, 170, "#fff0d0", 0.4], vault: [135, 100, "#fff0d0", 0.4], cemetery: [200, 110, "#c8d8ff", 0.6], classroom: [210, 170, "#fff2d0", 0.5], london: [60, 140, "#e8d8a0", 0.5], forest: [200, 100, "#e8f0d0", 0.6],
};
const PARTICLES = { space: "none", station: "none", cemetery: "fireflies", london: "dust", forest: "dust", winter_city: "snow", town: "embers", night_field: "fireflies", beach_night: "none", sky: "none" };
const FOREGROUND = {
  paris: "post", old_street: "post", harbor: "post", jungle: "leaves", campus: "trunk",
  field_dusk: "grass", outback: "grass", war: "wire", town: "post", museum: "column", office: "plant", room: "curtain",
  london: "post", forest: "trunk", classroom: "plant", hacker_room: "curtain", casino: "column", prison: "column", vault: "column", cemetery: "grass",
};

function LightLayer({ name, f }) {
  const L = LIGHTS[name];
  if (!L) return null;
  const [x, y, c, k] = L;
  const flick = 1 + Math.sin(f / 17) * 0.04;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <circle cx={x} cy={y} r={110 * flick} fill={c} opacity={0.05 * k} />
      <circle cx={x} cy={y} r={55 * flick} fill={c} opacity={0.09 * k} />
      <circle cx={x} cy={y} r={22} fill={c} opacity={0.16 * k} />
      {[-70, -20, 40].map((dx, i) => (
        <polygon key={i} points={`${x},${y} ${x + dx - 14},${y + 420} ${x + dx + 10},${y + 420}`} fill={c}
          opacity={(0.035 + 0.015 * Math.sin(f / 23 + i)) * k} />
      ))}
    </g>
  );
}

function Particles({ name, f }) {
  const type = PARTICLES[name] || "dust";
  if (type === "none") return null;
  const items = [];
  for (let i = 0; i < 22; i++) {
    const seed = i * 97.13;
    let x, y, r, c, o;
    if (type === "snow") {
      x = (seed + f * (0.3 + (i % 3) * 0.15) + Math.sin(f / 20 + i) * 8) % 290 - 10; y = (i * 53 + f * (1 + (i % 4) * 0.3)) % 500 - 10;
      r = 0.8 + (i % 3) * 0.6; c = "#ffffff"; o = 0.75;
    } else if (type === "embers") {
      x = (seed + Math.sin(f / 15 + i) * 10) % 270; y = 480 - ((i * 61 + f * (0.8 + (i % 3) * 0.4)) % 500);
      r = 0.7 + (i % 3) * 0.5; c = i % 2 ? "#ffb050" : "#ff7a30"; o = 0.8;
    } else if (type === "fireflies") {
      x = (seed + Math.sin(f / 30 + i) * 20) % 270; y = 250 + ((i * 37) % 200) + Math.cos(f / 25 + i) * 10;
      r = 1.2; c = "#fff2a0"; o = 0.4 + 0.4 * Math.abs(Math.sin(f / 12 + i));
    } else {
      x = (seed + f * 0.12 * ((i % 3) + 1)) % 270; y = (i * 97 - f * 0.2 * ((i % 2) + 1) + 480) % 480;
      r = 0.5 + (i % 3) * 0.4; c = "#fff3d8"; o = 0.22;
    }
    items.push(<circle key={i} cx={x} cy={y} r={r} fill={c} opacity={o} />);
  }
  return <g>{items}</g>;
}

function Foreground({ name, f }) {
  const t = FOREGROUND[name];
  const dark = "#0d0a12";
  if (t === "post") return (<g opacity=".9"><rect x="-6" y="40" width="16" height="460" fill={dark} />
    <rect x="-14" y="120" width="34" height="10" fill={dark} /><circle cx="3" cy="112" r="10" fill="#ffcf80" opacity=".5" /><circle cx="3" cy="112" r="4" fill="#ffe6b0" /></g>);
  if (t === "trunk") return <g opacity=".9"><rect x="244" y="0" width="40" height="500" fill={dark} /><circle cx="250" cy="20" r="50" fill={dark} /></g>;
  if (t === "leaves") return (<g fill={dark} opacity=".85">{[0, 1, 2, 3].map((i) => (
    <ellipse key={i} cx={i < 2 ? -10 + i * 20 : 260 + (i - 2) * 15} cy={30 + i * 40 + Math.sin(f / 30 + i) * 3} rx="40" ry="14" transform={`rotate(${i < 2 ? 30 : -30})`} />))}</g>);
  if (t === "grass") return (<g fill={dark} opacity=".85">{[...Array(14)].map((_, i) => (
    <path key={i} d={`M${i * 21 - 5} 480 q${4 + Math.sin(f / 20 + i) * 3} -${30 + (i % 3) * 14} ${8} -${40 + (i % 4) * 10} q2 30 8 40 Z`} />))}</g>);
  if (t === "wire") return <g stroke={dark} strokeWidth="2.5" fill="none" opacity=".85"><path d="M-10 440 Q60 420 130 450 T280 430" /><path d="M-10 460 Q80 445 150 470 T280 452" />
    {[20, 70, 120, 170, 220].map((x) => <path key={x} d={`M${x} ${438 + (x % 40) / 4} l6 -6 m-6 0 l6 6`} />)}</g>;
  if (t === "column") return <g fill={dark} opacity=".9"><rect x="236" y="0" width="44" height="500" /><rect x="228" y="60" width="60" height="12" /></g>;
  if (t === "plant") return <g fill={dark} opacity=".9"><rect x="234" y="420" width="30" height="60" />{[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={240 + i * 6} cy={400 - i * 14} rx="22" ry="8" transform={`rotate(${-40 + i * 20} ${240 + i * 6} ${400 - i * 14})`} />)}</g>;
  if (t === "curtain") return <g fill={dark} opacity=".85"><path d={`M-10 0 L40 0 Q${30 + Math.sin(f / 40) * 4} 240 50 480 L-10 480 Z`} /></g>;
  return null;
}

// Живые детали фона: птицы, облака, дым из труб
const AMBIENT = {
  field_dusk: ["birds", "clouds"], outback: ["birds", "clouds"], harbor: ["birds", "smoke"], campus: ["birds", "clouds"],
  sky: ["birds"], old_street: ["smoke", "birds"], town: ["smoke"], paris: ["birds", "clouds"], war: ["smoke"],
  winter_city: ["smoke"], jungle: ["birds"], london: ["smoke"], forest: ["birds", "clouds"],
};
const CHIMNEYS = { harbor: [[-60, 200], [250, 205]], old_street: [[-20, 105], [150, 115], [240, 110]], town: [[-120, 222], [190, 228]],
  war: [[40, 300], [210, 290]], winter_city: [[-40, 150], [190, 150]], london: [[-90, 150], [60, 160], [230, 140]] };

function Ambient({ name, f }) {
  const kinds = AMBIENT[name] || [];
  return (
    <g>
      {kinds.includes("clouds") && [0, 1, 2].map((i) => (
        <g key={"c" + i} transform={`translate(${((i * 160 + f * (0.12 + i * 0.05)) % 640) - 200} ${70 + i * 45})`} fill="#fff" opacity={0.12 + i * 0.03}>
          <ellipse cx="0" cy="0" rx="46" ry="12" /><ellipse cx="22" cy="-8" rx="26" ry="12" /><ellipse cx="-20" cy="-5" rx="20" ry="9" />
        </g>))}
      {kinds.includes("birds") && [0, 1, 2, 3].map((i) => {
        const x = ((f * (0.9 + i * 0.15) + i * 140) % 560) - 150, y = 120 + i * 18 + Math.sin(f / 9 + i) * 6;
        const w = Math.sin(f / 3 + i * 2) * 3;
        return <path key={"b" + i} d={`M${x - 6} ${y - w} Q${x - 3} ${y - 3} ${x} ${y} Q${x + 3} ${y - 3} ${x + 6} ${y - w}`} stroke="#1a1418" strokeWidth="1.4" fill="none" opacity=".7" />;
      })}
      {kinds.includes("smoke") && (CHIMNEYS[name] || []).map(([cx, cy], j) => [0, 1, 2, 3].map((i) => {
        const k = ((f * 0.5 + i * 25 + j * 11) % 100) / 100;
        return <circle key={`s${j}${i}`} cx={cx + k * 20 + Math.sin(k * 5 + j) * 4} cy={cy - k * 70} r={4 + k * 14} fill="#d8d4cc" opacity={0.35 * (1 - k)} />;
      }))}
    </g>
  );
}

function Bubble({ a, f, dur, font, pos, cam }) {
  if (!a.say) return null;
  const at = Math.floor(dur * (a.sayAt ?? 0.12)), len = Math.floor(dur * (a.sayFor ?? 0.6));
  if (f < at || f > at + len) return null;
  const p = backOutLocal(prog(f, at, 7)) * (1 - easeOut(prog(f, at + len - 5, 5)));
  const s = a.s ?? 1;
  const w = Math.max(48, a.say.length * 7.8 + 22), h = 28;
  const side = pos.x > 150 ? -1 : 1;
  // облачко не должно вылезать за край кадра
  const half = 135 / (cam?.z || 1) - 6, cx = cam?.cx ?? 135;
  const fit = Math.min(1, (2 * half - 4) / w);
  const bx = clamp(pos.x + side * 14, cx - half + (w * fit) / 2, cx + half - (w * fit) / 2), by = pos.y - 205 * s;
  return (
    <g transform={`translate(${bx} ${by}) scale(${p * fit})`}>
      <path d={`M${-w / 2} ${-h} h${w} v${h} h${-w / 2 + 10} l${-side * 8} 10 l${-2} -10 h${-w / 2 + 2} Z`} fill="#fff" stroke="#1a1410" strokeWidth="1.6" strokeLinejoin="round"
        transform={side < 0 ? "scale(-1 1)" : ""} />
      <text x="0" y="-9" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#1a1410" fontFamily={font}>{a.say}</text>
    </g>
  );
}

// ---------- погода и источники света ночью ----------
function Weather({ kind, f }) {
  if (kind === "rain") return (<g stroke="#b8cce8" strokeWidth=".9" opacity=".6">
    {[...Array(70)].map((_, i) => { const x = (i * 41 + f * 2.5) % 320 - 25, y = (i * 67 + f * 14) % 520 - 20;
      return <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 14} />; })}</g>);
  if (kind === "wind") return (<g>
    {[...Array(12)].map((_, i) => { const x = (i * 83 + f * 6) % 340 - 40, y = 80 + (i * 37) % 320;
      return <path key={i} d={`M${x} ${y} q18 -4 36 0`} stroke="#fff" strokeWidth="1.2" fill="none" opacity=".35" />; })}
    {[...Array(6)].map((_, i) => { const x = (i * 97 + f * 4.5) % 320 - 25, y = 120 + (i * 53) % 260 + Math.sin(f / 6 + i) * 10;
      return <ellipse key={"l" + i} cx={x} cy={y} rx="4" ry="2" fill={i % 2 ? "#b8862a" : "#8a6a2a"} transform={`rotate(${f * 8 + i * 40} ${x} ${y})`} />; })}
  </g>);
  return null;
}

function NightLights({ lights, f, id }) {
  if (!lights || !lights.length) return null;
  return (
    <g>
      <defs>
        <radialGradient id={id + "g"}><stop offset="0" stopColor="#000" /><stop offset=".55" stopColor="#000" stopOpacity=".6" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <mask id={id}><rect x="-300" y="-300" width="900" height="1100" fill="#fff" />
          {lights.map((l, i) => <circle key={i} cx={l.x} cy={l.y} r={(l.r || 70) * (1 + Math.sin(f / 3 + i) * 0.03)} fill={`url(#${id}g)`} />)}</mask>
      </defs>
      <rect x="-300" y="-300" width="900" height="1100" fill="#02040e" opacity=".72" mask={`url(#${id})`} />
      {lights.map((l, i) => (<g key={i} style={{ mixBlendMode: "screen" }}>
        <circle cx={l.x} cy={l.y} r={(l.r || 70) * 0.6} fill={l.color || "#ffb050"} opacity={0.18 + Math.sin(f / 2.5 + i) * 0.03} />
        <circle cx={l.x} cy={l.y} r="4" fill="#fff4c0" />
      </g>))}
    </g>
  );
}

// силуэт «через плечо» на переднем плане
function OverShoulder() {
  return (<g fill="#08060c" opacity=".92">
    <ellipse cx="40" cy="330" rx="52" ry="60" /><path d="M-40 480 Q-30 380 40 385 Q110 380 130 480 Z" />
  </g>);
}

function actorPos(a, t) {
  const k = a.to ? easeInOut(clamp(t)) : 0;
  return { x: lerp(a.x ?? 135, a.to?.x ?? a.x ?? 135, k), y: lerp(a.y ?? 360, a.to?.y ?? a.y ?? 360, k) };
}

function Actor({ a, f, t, mouth, idx, light, gaze, zeroG, closeUp, tagC = "#3dffa8", tagT = "#06090d" }) {
  const p0 = actorPos(a, t);
  const x = p0.x + (zeroG ? Math.sin(f / 37 + idx) * 3 : 0), y = p0.y + (zeroG ? Math.sin(f / 23 + idx) * 5 : 0);
  const living = ["person", "emu", "crow", "cat", "rabbit", "leopard"].includes(a.kind);
  const pop = living ? 0.9 + 0.1 * backOutLocal(prog(f, idx * 2, 9)) : 1;
  const s = (a.s ?? 1) * pop;
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
  } else if (a.kind === "person") body = <Person {...common} look={a.look} anim={a.anim} expr={a.expr} held={a.held} mouth={a.talk ? mouth : 0}
    light={a.flip ? -light : light} gaze={a.flip ? -gaze : gaze} />;
  else if (a.kind === "emu") body = <Emu {...common} anim={a.anim} angry={a.angry} />;
  else if (a.kind === "crow") body = <Crow {...common} anim={a.anim} color={a.color} />;
  else if (a.kind === "cat") body = <Cat {...common} anim={a.anim} color={a.color} />;
  else if (a.kind === "leopard") body = <Leopard {...common} anim={a.anim} wrong={a.wrong} shadow={a.shadow} wrongAt={a.wrongAt} />;
  else if (a.kind === "rabbit") body = <Rabbit {...common} anim={a.anim} color={a.color} />;
  else if (a.kind === "flock" || a.kind === "crows" || a.kind === "rabbits") {
    const n = a.count || 12, spread = a.spread || 220;
    const items = [];
    for (let i = 0; i < n; i++) {
      const dx = ((i * 73) % 100) / 100 * spread - spread / 2;
      const dy = ((i * 37) % 100) / 100 * (a.depth || 60);
      const sc = 0.55 + dy / (a.depth || 60) * 0.5;
      const El = a.kind === "flock" ? Emu : a.kind === "rabbits" ? Rabbit : Crow;
      items.push({ dy, el: <g key={i} transform={`translate(${dx} ${dy}) scale(${sc})`}><El t={f} phase={i * 2.3} anim={a.anim || "walk"} color={a.color} /></g> });
    }
    body = <g>{items.sort((p, q) => p.dy - q.dy).map((p) => p.el)}</g>;
  } else if (PROPS[a.kind]) {
    const P = PROPS[a.kind];
    body = <P t={f} {...(a.props || {})} />;
  }
  const spin = zeroG ? Math.sin(f / 41 + idx) * 6 : 0;
  // v15: метка «ТЫ» над главным героем
  const you = a.you && !closeUp ? (
    <g transform={`translate(0 ${-212 + Math.sin(f / 6) * 3}) scale(${flip} 1)`} opacity={clamp(prog(f, 4, 6))}>
      <rect x="-20" y="-15" width="40" height="22" rx="5" fill={tagC} /><path d="M-6 7 L0 14 L6 7 Z" fill={tagC} />
      <text x="0" y="2" textAnchor="middle" fontSize="14" fontWeight="900" fill={tagT} fontFamily="Montserrat, DejaVu Sans, sans-serif">ТЫ</text>
    </g>) : null;
  return <g transform={`translate(${x} ${y}) rotate(${spin}) scale(${s * flip} ${s})`}>{body}{you}</g>;
}

export const NOIR_SHOT = 42;

function cameraFor(seg, f, actors) {
  const d = Math.max(1, seg.dur), t = f / d;
  const base = { in: [1.25, 1.4], out: [1.45, 1.25], left: [1.32, 1.32], right: [1.32, 1.32], shake: [1.3, 1.38], up: [1.32, 1.32] }[seg.cam || "in"] || [1.25, 1.4];
  let z = lerp(base[0], base[1], t), cx = 135, cy = seg.camY ?? 305;
  if (seg.cam === "left") cx = lerp(150, 120, t);
  if (seg.cam === "right") cx = lerp(120, 150, t);
  if (seg.cam === "up") cy = lerp(325, 285, t);
  let sx = 0, sy = 0;
  if (seg.cam === "shake") { sx = Math.sin(f * 1.7) * 1.6; sy = Math.cos(f * 2.3) * 1.6; }
  if (seg.kind !== "hook") z += 0.06 * (1 - easeOut(prog(f, 0, 6)));  // резкий наезд на первом кадре сцены
  // v14: хук открывается сверхкрупным планом лица и резко отъезжает на общий план к ~0.6 с
  if (seg.kind === "hook" && seg.open !== "wide") {
    const hi = seg.hookFocus ?? actors.findIndex((a) => a.kind === "person" || a.kind === "emu" || a.kind === "cat" || a.kind === "crow" || a.kind === "rabbit" || a.kind === "leopard");
    const a = actors[hi];
    if (a) {
      const p = actorPos(a, 0), s = a.s ?? 1;
      const head = a.kind === "person" ? 140 : a.kind === "leopard" ? (a.anim === "lie" ? 40 : 88) : a.kind === "emu" ? 110 : 40;
      if (seg.style === "noir") {
        // v17: в нуаре лицо держим ~1.3 с (пока висит лента), потом только до среднего плана — не на общий
        const k = easeInOut(prog(f, 40, 12));
        z = lerp(2.4, 1.75, k); cx = lerp(p.x, lerp(135, p.x, 0.6), k); cy = lerp(p.y - head * s + 6, p.y - 100 * s, k);
        return { z: z + 0.04 * Math.sin(f / 20), cx: cx + sx, cy: cy + sy };
      }
      const k = easeInOut(prog(f, 4, 14));            // 4 кадра держим лицо, затем отъезд
      z = lerp(2.4, z, k); cx = lerp(p.x, cx, k); cy = lerp(p.y - head * s + 6, cy, k);
    }
  }
  // v15 «нуар»: внутри сцены смена плана каждые ~1.4 с — общий → лицо → средний
  if (seg.style === "noir" && d > 50) {
    const SH = NOIR_SHOT, k = Math.floor(f / SH), fk = f - k * SH;
    const ai = seg.shotOn ?? actors.findIndex((a) => a.kind === "person" || a.kind === "leopard");
    const a = actors[ai];
    if (a && k > 0) {
      const p = actorPos(a, t), s = a.s ?? 1;
      const hd = a.kind === "leopard" ? (a.anim === "lie" ? 40 : 88) : 140;
      if (k % 3 === 1) { cx = p.x; cy = p.y - hd * s + 8; z = 2.25 + 0.12 * (fk / SH); }
      else if (k % 3 === 2) { cx = lerp(135, p.x, 0.6); cy = p.y - 100 * s; z = 1.65 + 0.1 * (fk / SH); }
      z += 0.1 * (1 - easeOut(prog(fk, 0, 5)));
    }
    return { z, cx: cx + sx, cy: cy + sy };
  }
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

export function Stage({ seg, f, mouth, transition = "flash", font = "DejaVu Sans" }) {
  const actors = seg.actors || [];
  const t = f / Math.max(1, seg.dur);
  const cam = cameraFor(seg, f, actors);
  // тряска, когда выскакивает красная плашка
  if (seg.alert) {
    const k = clamp(1 - (f - 9) / 8) * (f >= 9 ? 1 : 0);
    cam.cx += Math.sin(f * 2.7) * 2.2 * k;
    cam.cy += Math.cos(f * 3.1) * 2.2 * k;
  }
  const order = actors.map((a, i) => ({ a, i })).sort((p, q) => (p.a.z ?? actorPos(p.a, t).y) - (q.a.z ?? actorPos(q.a, t).y));
  const tint = TINTS[seg.tint];
  const half = seg.focus !== undefined && seg.dur > 70 ? Math.floor(seg.dur / 2) : -99;
  const cutFlash = f >= half && half > 0 ? 1 - easeOut(prog(f, half, 3)) : 0;
  const L = LIGHTS[seg.bg];
  const people = actors.map((a, i) => ({ a, i, p: actorPos(a, t) })).filter((o) => o.a.kind === "person");
  const lightFor = (a) => (L ? (L[0] < actorPos(a, t).x ? -1 : 1) : -1);
  const gazeFor = (a, i) => {
    const me = actorPos(a, t);
    const others = people.filter((o) => o.i !== i);
    if (!others.length) return 0;
    const near = others.reduce((b, o) => (Math.abs(o.p.x - me.x) < Math.abs(b.p.x - me.x) ? o : b));
    return near.p.x > me.x ? 1 : -1;
  };
  const zb = 1 + (cam.z - 1) * 0.55, cxb = 135 + (cam.cx - 135) * 0.5;      // дальний план медленнее
  const closeUp = cam.z > 1.9;
  const dutch = seg.angle === "dutch" ? (seg.start % 2 ? 7 : -7) : 0;
  // снизу — герои выше и массивнее; сверху — меньше и «придавлены»
  const ground = 400;
  const angleT = seg.angle === "low" ? `translate(0 ${ground}) scale(1.06 1.16) translate(0 ${-ground})`
    : seg.angle === "high" ? `translate(0 ${ground}) scale(0.9 0.8) translate(0 ${-ground})` : "";
  const hookBoost = seg.kind === "hook" ? 1 - easeOut(prog(f, 45, 20)) : 0;  // хук контрастнее обычных сцен, к 2-й секунде выравнивается
  const enter = transition === "flash" ? 1 - easeOut(prog(f, 0, 4)) : transition === "dip" ? 1 - easeOut(prog(f, 0, 7)) : 0;
  return (
    <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0,
      filter: seg.kind === "hook" ? `saturate(${1 + 0.4 * hookBoost}) contrast(${1 + 0.22 * hookBoost})` : undefined }}>
      <defs>
        <radialGradient id="vig" cx="50%" cy="48%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".75" /></radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".6" stopColor="#fff" stopOpacity=".06" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id="dof"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed={f % 50} /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <g transform={`translate(135 240) scale(${zb}) translate(${-cxb} ${-cam.cy})`} filter={closeUp ? "url(#dof)" : undefined}>
        {seg.pal && NOIR_BGS.includes(seg.bg) ? <NoirBackground name={seg.bg} t={f} P={seg.pal} /> : <Background name={seg.bg} t={f} />}
        <Ambient name={seg.bg} f={f} />
      </g>
      <rect width="270" height="480" fill="url(#haze)" opacity=".6" />
      <g transform={`rotate(${dutch} 135 240) translate(135 240) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
        <LightLayer name={seg.bg} f={f} />
        <g transform={angleT}>
          {order.map(({ a, i }) => <Actor key={i} a={a} f={f} t={t} mouth={mouth} idx={i} light={lightFor(a)} gaze={a.kind === "person" ? gazeFor(a, i) : 0}
            zeroG={seg.bg === "space" && a.kind === "person"} closeUp={cam.z > 1.6} tagC={seg.pal?.tag} tagT={seg.pal?.tagText} />)}
        </g>
        <NightLights lights={seg.lights} f={f} id={`nl${seg.start}`} />
        <g transform={angleT}>
          {actors.map((a, i) => <Bubble key={i} a={a} f={f} dur={seg.dur} font={font} pos={actorPos(a, t)} cam={cam} />)}
        </g>
      </g>
      <Weather kind={seg.weather} f={f} />
      {seg.angle === "ots" ? <OverShoulder /> : null}
      <g transform={`translate(${-(cam.cx - 135) * 0.8} 0)`}>
        <Foreground name={seg.bg} f={f} />
      </g>
      <Particles name={seg.bg} f={f} />
      {tint && <rect width="270" height="480" fill={tint[0]} opacity={tint[1]} style={{ mixBlendMode: "multiply" }} />}
      <rect width="270" height="480" filter="url(#grain)" opacity=".07" />
      <rect width="270" height="480" fill="url(#vig)" />
      <rect width="270" height="480" fill="#000" opacity={Math.max(seg.kind === "hook" ? 0 : enter * (transition === "dip" ? 1 : 0.55), cutFlash * 0.55)} />
    </svg>
  );
}
