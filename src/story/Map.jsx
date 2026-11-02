// Анимированные карты: материк, маршрут с движущейся меткой, расползание по территории, булавки с подписями.
import React from "react";
import { clamp, lerp, prog, easeOut, easeInOut, backOut } from "./util.js";

// Упрощённые очертания (координаты кадра 270x480)
const LAND = {
  australia: [[40, 210], [70, 175], [105, 168], [120, 150], [140, 162], [150, 145], [175, 150], [185, 175], [205, 185], [225, 215],
    [238, 250], [232, 285], [215, 310], [190, 322], [170, 318], [150, 330], [125, 322], [110, 305], [85, 300], [55, 312], [35, 290], [30, 250]],
  europe: [[20, 260], [40, 225], [70, 215], [95, 190], [130, 175], [170, 170], [210, 160], [255, 170], [262, 230], [240, 260], [215, 275],
    [205, 300], [185, 315], [165, 300], [150, 320], [130, 300], [110, 290], [100, 330], [70, 340], [40, 320], [25, 295]],
  britain: [[62, 150], [75, 125], [82, 140], [88, 165], [84, 190], [70, 195], [60, 178]],
  usa: [[20, 200], [60, 180], [120, 178], [170, 170], [215, 175], [250, 190], [255, 220], [240, 250], [215, 262], [195, 300], [170, 285],
    [140, 300], [100, 292], [60, 280], [30, 255]],
};

function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const path = (pts) => "M" + pts.map((p) => p.join(" ")).join(" L") + " Z";

function along(route, t) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < route.length; i++) { const d = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); segs.push(d); total += d; }
  let need = total * t;
  for (let i = 0; i < segs.length; i++) {
    if (need <= segs[i]) { const k = need / segs[i]; return [lerp(route[i][0], route[i + 1][0], k), lerp(route[i][1], route[i + 1][1], k), total]; }
    need -= segs[i];
  }
  const last = route[route.length - 1];
  return [last[0], last[1], total];
}

export function MapScene({ seg, f, font }) {
  const m = seg.map || {};
  const region = m.region || "australia";
  const shapes = region === "europe" ? ["europe", "britain"] : [region];
  const t = clamp(f / Math.max(1, seg.dur));
  const z = 1.02 + 0.08 * easeInOut(t);
  const land = LAND[shapes[0]];
  // точки расползания: сетка внутри материка, вспыхивают по мере удаления от источника
  const dots = [];
  if (m.spread) {
    const [sx, sy] = m.spread.from, R = m.spread.r || 260, k = easeOut(prog(f, 8, seg.dur * 0.7));
    for (let x = 20; x < 260; x += 11) for (let y = 130; y < 350; y += 11) {
      const jx = x + ((x * 7 + y) % 5) - 2, jy = y + ((x + y * 3) % 5) - 2;
      if (!inside([jx, jy], land)) continue;
      const d = Math.hypot(jx - sx, jy - sy);
      if (d < R * k) dots.push(<circle key={`${x}-${y}`} cx={jx} cy={jy} r={2.6 * clamp((R * k - d) / 20 + 0.3)} fill={m.spread.color || "#e8e0d0"} stroke="#5a4a3a" strokeWidth=".6" />);
    }
  }
  let routeEl = null;
  if (m.route) {
    const rt = easeInOut(prog(f, 6, seg.dur * 0.75));
    const [mx, my, total] = along(m.route, rt);
    routeEl = (<g>
      <path d={"M" + m.route.map((p) => p.join(" ")).join(" L")} stroke="#ffd23f" strokeWidth="2.5" fill="none" strokeDasharray={`${total * rt} ${total}`} strokeLinecap="round" />
      <circle cx={mx} cy={my} r="6" fill="#e8302a" stroke="#fff" strokeWidth="2" />
      <circle cx={mx} cy={my} r={8 + (f % 20) * 0.6} fill="none" stroke="#e8302a" strokeWidth="1.5" opacity={1 - (f % 20) / 20} />
    </g>);
  }
  const fence = m.fence ? (() => { const ft = easeInOut(prog(f, 10, seg.dur * 0.6)); const [, , total] = along(m.fence, 1);
    return <path d={"M" + m.fence.map((p) => p.join(" ")).join(" L")} stroke="#f2b84b" strokeWidth="3" fill="none" strokeDasharray={`${total * ft} ${total}`} />; })() : null;
  return (
    <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="sea" cx="50%" cy="45%" r="75%"><stop offset="0" stopColor="#2a5a7a" /><stop offset="1" stopColor="#0e2232" /></radialGradient>
        <radialGradient id="mvig" cx="50%" cy="48%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".7" /></radialGradient>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 0 30" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth=".6" /></pattern>
      </defs>
      <rect width="270" height="480" fill="url(#sea)" />
      <rect width="270" height="480" fill="url(#grid)" />
      <g transform={`translate(135 245) scale(${z}) translate(-135 -245)`}>
        {shapes.map((sh) => <path key={sh} d={path(LAND[sh])} fill="#c9a86a" stroke="#f2e2b0" strokeWidth="1.5" />)}
        {shapes.map((sh) => <path key={sh + "s"} d={path(LAND[sh])} fill="#000" opacity=".12" transform="translate(3 4)" />)}
        {dots}
        {fence}
        {routeEl}
        {(m.pins || []).map((p, i) => {
          const pp = backOut(prog(f, 6 + i * 10, 8));
          if (pp <= 0) return null;
          return (<g key={i} transform={`translate(${p.x} ${p.y}) scale(${pp})`}>
            <path d="M0 0 C-7 -10 -7 -18 0 -20 C7 -18 7 -10 0 0 Z" fill="#e8302a" stroke="#fff" strokeWidth="1.2" />
            <circle cx="0" cy="-14" r="2.6" fill="#fff" />
            {p.label ? (() => { const lw = p.label.length * 6.2 + 12; const off = clamp(0, 8 - (p.x - lw / 2), 262 - (p.x + lw / 2)) || Math.min(0, 262 - (p.x + lw / 2)) || Math.max(0, 8 - (p.x - lw / 2));
              return <g transform={`translate(${off} 0)`}><rect x={-lw / 2} y="-40" width={lw} height="15" rx="4" fill="#0c0c10" opacity=".85" />
                <text x="0" y="-29" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily={font}>{p.label}</text></g>; })() : null}
          </g>);
        })}
      </g>
      <rect width="270" height="480" fill="url(#mvig)" />
    </svg>
  );
}
