import React from "react";
import { shade } from "./util.js";

export function Truck({ t = 0, moving = false, color = "#5E6650" }) {
  const shake = moving ? Math.sin(t * 1.3) * 1.5 : 0;
  const wheel = (x) => (<g transform={`translate(${x} -14) rotate(${moving ? t * 12 : 0})`}>
    <circle r="14" fill="#1c1c1c" /><circle r="6" fill="#555" /><rect x="-1" y="-12" width="2" height="24" fill="#333" /></g>);
  return (
    <g>
      <ellipse cx="0" cy="2" rx="80" ry="7" fill="#000" opacity=".3" />
      <g transform={`translate(0 ${shake})`}>
        <rect x="-80" y="-58" width="95" height="36" rx="3" fill={color} />
        <rect x="-80" y="-62" width="95" height="6" fill={shade(color, 0.8)} />
        <path d="M15 -22 L15 -62 L48 -62 L62 -40 L72 -38 L72 -22 Z" fill={shade(color, 1.1)} />
        <path d="M22 -56 L44 -56 L54 -40 L22 -40 Z" fill="#9fb3b8" opacity=".8" />
        <rect x="66" y="-34" width="8" height="5" fill="#f2d27a" />
      </g>
      {wheel(-55)}{wheel(48)}
    </g>
  );
}

export function MachineGun({ t = 0, firing = false, jammed = false, scale = 1 }) {
  const flash = firing && Math.floor(t / 2) % 2 === 0;
  return (
    <g transform={`scale(${scale})`}>
      <path d="M-30 0 L-10 -30 M10 0 L-10 -30 M-10 -30 L-14 0" stroke="#3a3a3a" strokeWidth="4" />
      <rect x="-40" y="-40" width="70" height="14" rx="3" fill="#2f3230" />
      <rect x="28" y="-36" width="46" height="6" fill="#1f2120" />
      <circle cx="-20" cy="-44" r="11" fill="#3b3e3b" />
      <rect x="-46" y="-36" width="10" height="20" rx="2" fill="#4a3a28" />
      {flash && <path d="M74 -33 L94 -42 L88 -33 L96 -24 Z" fill="#ffd36a" />}
      {jammed && <g opacity=".7">{[0, 1, 2].map((i) => <circle key={i} cx={20 + i * 6} cy={-50 - ((t * 0.6 + i * 9) % 30)} r={4 + i} fill="#9a9a9a" />)}</g>}
    </g>
  );
}

export function Fence({ w = 200, broken = false }) {
  const posts = [];
  for (let x = -w / 2, i = 0; x <= w / 2; x += 30, i++) {
    const tilt = broken && i % 2 ? (i % 4 ? 25 : -30) : 0;
    posts.push(<rect key={i} x={x} y="-40" width="5" height="40" fill="#6b5236" transform={`rotate(${tilt} ${x} 0)`} />);
  }
  return (<g>
    {!broken && <><rect x={-w / 2} y="-30" width={w} height="3" fill="#7a603f" /><rect x={-w / 2} y="-15" width={w} height="3" fill="#7a603f" /></>}
    {broken && <><rect x={-w / 2} y="-30" width={w * 0.4} height="3" fill="#7a603f" /><path d={`M${w * 0.1} -25 L${w * 0.35} -6`} stroke="#7a603f" strokeWidth="3" /></>}
    {posts}
  </g>);
}

export function House({ color = "#8b6b4a", lit = true }) {
  return (<g>
    <rect x="-40" y="-50" width="80" height="50" fill={color} />
    <path d="M-48 -50 L0 -84 L48 -50 Z" fill={shade(color, 0.6)} />
    <rect x="-28" y="-36" width="16" height="16" fill={lit ? "#f3c766" : "#2a2a33"} />
    <rect x="10" y="-30" width="14" height="30" fill={shade(color, 0.5)} />
  </g>);
}

export function Desk({ color = "#6a4a30" }) {
  return (<g>
    <rect x="-70" y="-50" width="140" height="10" fill={shade(color, 1.1)} />
    <rect x="-66" y="-40" width="40" height="40" fill={color} />
    <rect x="26" y="-40" width="40" height="40" fill={color} />
    <rect x="-40" y="-66" width="30" height="16" fill="#e8e2d0" />
    <rect x="20" y="-62" width="8" height="12" fill="#333" />
  </g>);
}

export function AmmoBox() {
  return (<g><rect x="-22" y="-20" width="44" height="20" fill="#4f5a3a" /><rect x="-22" y="-24" width="44" height="5" fill="#3e472d" /><rect x="-6" y="-14" width="12" height="6" fill="#c9b36a" /></g>);
}

export function Casings({ n = 30, spread = 120 }) {
  return (<g>{[...Array(n)].map((_, i) => {
    const x = Math.sin(i * 91.7) * spread / 2, y = Math.cos(i * 37.3) * 8;
    return <rect key={i} x={x} y={y} width="6" height="2.5" rx="1" fill="#c9a24a" transform={`rotate(${(i * 47) % 180} ${x} ${y})`} />;
  })}</g>);
}

export function Paper({ text = "" }) {
  return (<g><rect x="-30" y="-40" width="60" height="40" fill="#efe6cf" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x="-22" y={-32 + i * 8} width={36 - (i % 2) * 10} height="2.5" fill="#9a8f78" />)}</g>);
}

export function Trunk({ open = true }) {
  return (<g>
    <rect x="-40" y="-36" width="80" height="36" rx="3" fill="#6b4a2a" />
    <rect x="-40" y="-36" width="80" height="6" fill="#4e3420" />
    <rect x="-4" y="-30" width="8" height="10" fill="#c9a24a" />
    {open && <g><path d="M-40 -36 L-34 -70 L46 -70 L40 -36 Z" fill="#5a3c22" />
      <rect x="-20" y="-56" width="34" height="22" fill="#3f5a3f" /><ellipse cx="-3" cy="-46" rx="6" ry="8" fill="#c49a6c" /></g>}
  </g>);
}

export function Door({ open = false }) {
  return (<g>
    <rect x="-28" y="-110" width="56" height="110" fill="#2a1f18" />
    <g transform={open ? "translate(-28 0) scale(0.35 1) translate(28 0)" : ""}>
      <rect x="-26" y="-108" width="52" height="108" fill="#6b4a30" />
      <rect x="-20" y="-100" width="40" height="40" fill="#5e4028" /><rect x="-20" y="-52" width="40" height="44" fill="#5e4028" />
      <circle cx="18" cy="-54" r="3" fill="#c9a24a" />
    </g>
  </g>);
}

export function Frame({ empty = false }) {
  return (<g>
    <rect x="-26" y="-34" width="52" height="68" fill={empty ? "none" : "#6b4a22"} />
    {empty ? <g fill="#555">{[[-22, -30], [22, -30], [-22, 30], [22, 30]].map(([x, y], i) => <rect key={i} x={x - 2} y={y - 2} width="4" height="4" />)}</g>
      : <g><rect x="-21" y="-29" width="42" height="58" fill="#3f5a3f" /><ellipse cx="0" cy="-6" rx="10" ry="13" fill="#c49a6c" /><path d="M-14 29 Q0 8 14 29 Z" fill="#2f3a28" /></g>}
  </g>);
}

export function LawnChair({ t = 0, balloons = 30, flying = true }) {
  const sway = flying ? Math.sin(t * 0.08) * 4 : 0;
  const cols = ["#e8453c", "#f2b84b", "#4aa3df", "#7bc96f", "#c86fd1", "#f28b4b"];
  const items = [];
  for (let i = 0; i < balloons; i++) {
    const a = (i / balloons) * Math.PI * 2, r = 18 + (i % 4) * 9;
    const x = Math.cos(a * 3.1) * r * 1.4, y = -170 - Math.abs(Math.sin(a * 2.3)) * 70 - (i % 5) * 10;
    items.push(<g key={i}><line x1="0" y1="-60" x2={x} y2={y + 8} stroke="#ddd" strokeWidth=".5" opacity=".6" />
      <ellipse cx={x} cy={y} rx="9" ry="11" fill={cols[i % cols.length]} /></g>);
  }
  return (<g transform={`rotate(${sway})`}>{items}
    <path d="M-24 -20 L24 -20 L20 -6 L-20 -6 Z" fill="#2f8f6a" /><path d="M-24 -20 L-30 -60 L-18 -60 L-14 -20 Z" fill="#2f8f6a" />
    {[-22, 22].map((x, i) => <line key={i} x1={x} y1="-6" x2={x + (i ? 6 : -6)} y2="10" stroke="#bbb" strokeWidth="2" />)}
  </g>);
}

export function Briefcase() {
  return (<g><rect x="-22" y="-26" width="44" height="26" rx="3" fill="#3a2a1c" /><rect x="-8" y="-32" width="16" height="7" rx="2" fill="none" stroke="#3a2a1c" strokeWidth="3" />
    <rect x="-2" y="-18" width="4" height="5" fill="#c9a24a" /></g>);
}

export function Tank({ burst = false }) {
  return (<g>
    <rect x="-60" y="-150" width="120" height="150" fill="#7a7266" />
    {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="-60" y1={-150 + i * 30} x2="60" y2={-150 + i * 30} stroke="#5e584e" strokeWidth="2" />)}
    <ellipse cx="0" cy="-150" rx="60" ry="10" fill="#8a8274" />
    {burst && <path d="M-10 -150 L-25 -100 L-5 -60 L-20 0 L20 0 L8 -60 L28 -110 Z" fill="#2a1408" />}
  </g>);
}

export function Wave({ t = 0, color = "#3a1d0c", h = 140 }) {
  const pts = [];
  for (let x = -260; x <= 260; x += 20) pts.push(`${x} ${-h + Math.sin(x / 30 + t * 0.3) * 10}`);
  return (<g><path d={`M-260 40 L${pts.join(" L")} L260 40 Z`} fill={color} />
    <path d={`M-260 ${-h + 6} ${pts.map((p) => "L" + p).join(" ")}`} stroke="#6b3a1a" strokeWidth="4" fill="none" opacity=".7" /></g>);
}

export function Shelves({ empty = false }) {
  return (<g>
    <rect x="-70" y="-120" width="140" height="120" fill="#4a3624" />
    {[0, 1, 2].map((r) => <g key={r}><rect x="-66" y={-116 + r * 40} width="132" height="4" fill="#2e2016" />
      {!empty && [...Array(6)].map((_, i) => <rect key={i} x={-60 + i * 21} y={-108 + r * 40} width="16" height="28" rx="2" fill={["#c9b38a", "#b8a070", "#d8c8a0"][(i + r) % 3]} />)}</g>)}
  </g>);
}

export function Smoke({ t = 0, n = 6 }) {
  return (<g>{[...Array(n)].map((_, i) => {
    const k = ((t * 0.6 + i * 23) % 120) / 120;
    return <circle key={i} cx={Math.sin(i * 2.1 + k * 3) * 10} cy={-k * 120} r={6 + k * 22} fill="#cfcfcf" opacity={0.45 * (1 - k)} />;
  })}</g>);
}

export function Stage({ }) {
  return (<g><rect x="-80" y="-24" width="160" height="24" fill="#6b4a2a" /><rect x="-80" y="-28" width="160" height="5" fill="#8a643a" /></g>);
}

export function Letter() {
  return (<g><rect x="-12" y="-8" width="24" height="16" fill="#efe6cf" /><path d="M-12 -8 L0 2 L12 -8" stroke="#9a8f78" fill="none" /></g>);
}
