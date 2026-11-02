// Крупные планы предметов («вставки»): на весь кадр, с размытым фоном и своим светом.
import React from "react";
import { clamp, lerp, prog, easeOut } from "./util.js";

const BGS = {
  warm: ["#3a2418", "#7a4a2a"], cold: ["#141c2c", "#3a4a64"], dark: ["#0e0c12", "#2a2430"],
  green: ["#14201a", "#2e4a34"], red: ["#2a0e0c", "#6a2018"], paper: ["#2a2420", "#5a4a3a"],
};

function Bokeh({ f, tone }) {
  const cols = { warm: "#ffc890", cold: "#a8c8ff", dark: "#ffd8a0", green: "#d8ffb0", red: "#ff9a70", paper: "#ffe0b0" };
  const c = cols[tone] || "#fff";
  return (<g>{[...Array(9)].map((_, i) => (
    <circle key={i} cx={(i * 67 + f * 0.15) % 300 - 15} cy={60 + (i * 53) % 360} r={10 + (i % 4) * 7} fill={c} opacity={0.06 + (i % 3) * 0.03} />
  ))}</g>);
}

const ITEMS = {
  money: ({ f }) => (<g>
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${135 + (i - 1.5) * 6} ${300 - i * 10 - Math.max(0, 14 - f) * 3 * i}) rotate(${-8 + i * 5})`}>
        <rect x="-70" y="-34" width="140" height="68" rx="4" fill={i % 2 ? "#7aa06a" : "#8ab47a"} />
        <rect x="-62" y="-26" width="124" height="52" rx="3" fill="none" stroke="#4a6a40" strokeWidth="2" />
        <circle cx="0" cy="0" r="16" fill="#6a8f5a" /><text x="0" y="6" textAnchor="middle" fontSize="18" fontWeight="900" fill="#e8f0d8">₣</text>
      </g>))}
    <g transform={`translate(${200 - Math.min(f, 20) * 1.5} 360)`}><ellipse cx="0" cy="0" rx="34" ry="22" fill="#e2b48e" /><rect x="-40" y="10" width="40" height="60" rx="10" fill="#2a2a34" /></g>
  </g>),
  document: ({ f }) => (<g transform={`rotate(${-3 + Math.sin(f / 30)})`}>
    <rect x="45" y="120" width="180" height="240" rx="3" fill="#efe6cf" />
    {[...Array(9)].map((_, i) => <rect key={i} x="62" y={150 + i * 20} width={i % 3 ? 140 : 100} height="5" fill="#9a8f78" />)}
    <g transform={`translate(175 320) scale(${f < 10 ? 1.6 - f * 0.06 : 1}) rotate(-14)`} opacity={f < 6 ? 0 : 1}>
      <circle r="30" fill="none" stroke="#b02a2a" strokeWidth="5" /><circle r="22" fill="none" stroke="#b02a2a" strokeWidth="2" />
      <text y="6" textAnchor="middle" fontSize="13" fontWeight="900" fill="#b02a2a">ОФИЦ.</text></g>
  </g>),
  gun: ({ f }) => (<g>
    <rect x="-20" y="250" width="230" height="34" rx="6" fill="#2a2d2a" /><rect x="190" y="256" width="110" height="20" fill="#1c1e1c" />
    <rect x="30" y="232" width="60" height="20" fill="#3a3d3a" /><circle cx="60" cy="230" r="22" fill="#343834" />
    {[0, 1, 2, 3].map((i) => { const k = ((f * 0.8 + i * 14) % 60) / 60;
      return <circle key={i} cx={262 + Math.sin(k * 6 + i) * 8} cy={256 - k * 160} r={8 + k * 34} fill="#bdbdbd" opacity={0.5 * (1 - k)} />; })}
  </g>),
  eye: ({ f }) => { const blink = f % 70 > 64; return (<g>
    <ellipse cx="135" cy="250" rx="110" ry={blink ? 6 : 70} fill="#f2ead8" />
    {!blink && <><circle cx={135 + Math.sin(f / 20) * 10} cy="250" r="48" fill="#3a2a18" /><circle cx={135 + Math.sin(f / 20) * 10} cy="250" r="26" fill="#0c0806" />
      <circle cx={150 + Math.sin(f / 20) * 10} cy="232" r="10" fill="#fff" opacity=".85" /></>}
    <path d="M25 250 Q135 150 245 250" stroke="#1a1410" strokeWidth="8" fill="none" />
  </g>); },
  clock: ({ f }) => (<g>
    <circle cx="135" cy="250" r="105" fill="#e8dcc0" stroke="#5a4a30" strokeWidth="10" />
    {[...Array(12)].map((_, i) => <rect key={i} x="132" y="155" width="6" height="16" fill="#3a2a18" transform={`rotate(${i * 30} 135 250)`} />)}
    <rect x="132" y="185" width="6" height="68" rx="3" fill="#2a1a10" transform={`rotate(${f * 0.5} 135 250)`} />
    <rect x="133.5" y="165" width="3" height="88" rx="1.5" fill="#b02a2a" transform={`rotate(${Math.floor(f / 6) * 6} 135 250)`} />
    <circle cx="135" cy="250" r="7" fill="#2a1a10" />
  </g>),
  painting: ({ f }) => (<g transform={`translate(0 ${Math.sin(f / 25) * 3})`}>
    <rect x="55" y="110" width="160" height="220" fill="#6b4a22" /><rect x="68" y="123" width="134" height="194" fill="#3f5a3f" />
    <ellipse cx="135" cy="200" rx="30" ry="38" fill="#c49a6c" /><path d="M85 317 Q135 240 185 317 Z" fill="#2f3a28" />
    <path d="M105 190 Q135 150 165 190" stroke="#2a1a10" strokeWidth="14" fill="none" />
    <path d="M120 222 Q135 230 150 222" stroke="#6a3a2a" strokeWidth="2" fill="none" />
  </g>),
  rope: ({ f }) => { const snap = f > 18; return (<g>
    <path d={`M135 0 L135 ${snap ? 210 - Math.min(40, (f - 18) * 6) : 240}`} stroke="#b89a6a" strokeWidth="10" />
    {snap ? <path d={`M135 ${290 + (f - 18) * 8} L135 480`} stroke="#b89a6a" strokeWidth="10" /> : <path d="M135 240 L135 480" stroke="#b89a6a" strokeWidth="10" />}
    {!snap && <path d="M128 236 L142 244 M128 244 L142 236" stroke="#5a4a2a" strokeWidth="3" />}
    {snap && f < 26 && <circle cx="135" cy="250" r={(f - 18) * 6} fill="none" stroke="#fff" strokeWidth="3" opacity={1 - (f - 18) / 8} />}
  </g>); },
  fire: ({ f }) => (<g>
    <path d="M-10 330 L280 330 L280 480 L-10 480 Z" fill="#1a120c" />
    {[...Array(7)].map((_, i) => { const h = 70 + Math.sin(f / 4 + i * 1.7) * 25 + (i % 3) * 20;
      return <path key={i} d={`M${20 + i * 38} 340 Q${10 + i * 38} ${340 - h * 0.6} ${30 + i * 38} ${340 - h} Q${50 + i * 38} ${340 - h * 0.5} ${40 + i * 38} 340 Z`} fill={i % 2 ? "#ff7a20" : "#ffb020"} opacity=".9" />; })}
    <path d="M30 330 L60 300 L90 335 L140 290 L180 332" stroke="#3a2a1a" strokeWidth="6" fill="none" />
  </g>),
  seeds: ({ f }) => (<g>
    <path d="M60 380 Q50 220 90 180 L180 180 Q220 220 210 380 Z" fill="#b89a6a" /><path d="M85 182 Q135 160 185 182" stroke="#8a6a3a" strokeWidth="6" fill="none" />
    {[...Array(40)].map((_, i) => <ellipse key={i} cx={95 + (i * 37) % 80} cy={200 + Math.floor(i / 8) * 8 - Math.max(0, 20 - f) * (i % 3)} rx="4" ry="2.4" fill="#e8d8a0" transform={`rotate(${i * 40} ${95 + (i * 37) % 80} ${200 + Math.floor(i / 8) * 8})`} />)}
    <text x="135" y="300" textAnchor="middle" fontSize="20" fontWeight="900" fill="#5a3a1a">РИС</text>
  </g>),
  letter: ({ f }) => (<g>
    <rect x="45" y="170" width="180" height="120" rx="4" fill="#efe6cf" />
    <path d={`M45 170 L135 ${f < 12 ? 240 : 240 - (f - 12) * 8} L225 170`} fill="#ddd0b0" stroke="#9a8f78" strokeWidth="2" />
    <circle cx="135" cy="242" r="12" fill="#a02a2a" />
  </g>),
};

const MORE = {
  screen: ({ f }) => (<g>
    <rect x="25" y="140" width="220" height="160" rx="8" fill="#0a1014" stroke="#3a4450" strokeWidth="6" />
    {[...Array(10)].map((_, i) => <rect key={i} x="40" y={155 + i * 14} width={30 + ((i * 37 + Math.floor(f / 2)) % 150)} height="6" fill="#3aff7a" opacity={i === Math.floor(f / 3) % 10 ? 1 : 0.6} />)}
    <rect x={40 + (f * 7) % 170} y="290" width="8" height="3" fill="#3aff7a" opacity={Math.floor(f / 6) % 2} />
  </g>),
  phone: ({ f }) => (<g transform={`rotate(${Math.sin(f * 1.4) * (f < 20 ? 4 : 0)} 135 260)`}>
    <rect x="70" y="220" width="130" height="80" rx="16" fill="#2a2a2e" /><circle cx="135" cy="262" r="26" fill="#d8d0c0" />
    {[...Array(10)].map((_, i) => <circle key={i} cx={135 + Math.cos(i * 0.6 - 1) * 17} cy={262 + Math.sin(i * 0.6 - 1) * 17} r="3.2" fill="#2a2a2e" />)}
    <path d="M60 210 Q135 160 210 210 L200 225 Q135 185 70 225 Z" fill="#1a1a1e" />
  </g>),
  lemon: ({ f }) => (<g>
    <ellipse cx="135" cy="250" rx="70" ry="52" fill="#f2d23a" /><ellipse cx="200" cy="250" rx="10" ry="7" fill="#e8c02a" />
    <ellipse cx="115" cy="232" rx="16" ry="8" fill="#fff6a0" opacity=".6" />
    {f > 10 && [0, 1, 2, 3].map((i) => <circle key={i} cx={135 + Math.cos(i * 1.6) * (f - 10) * 3} cy={250 + Math.sin(i * 1.6) * (f - 10) * 3} r="3" fill="#fff6a0" opacity={Math.max(0, 1 - (f - 10) / 20)} />)}
  </g>),
  diamond: ({ f }) => (<g transform={`translate(135 250) rotate(${f * 0.6}) translate(-135 -250)`}>
    <path d="M85 230 L110 200 L160 200 L185 230 L135 310 Z" fill="#cfe8ff" stroke="#fff" strokeWidth="2" />
    <path d="M85 230 L185 230 M110 200 L120 230 L135 310 L150 230 L160 200 M120 230 L135 200 L150 230" stroke="#8ab8e8" strokeWidth="1.5" fill="none" />
    <path d="M150 205 l6 -10 l2 10 l10 2 l-10 2 l-2 10 l-2 -10 l-10 -2 Z" fill="#fff" opacity={0.5 + 0.5 * Math.sin(f / 3)} />
  </g>),
  sandwich: ({ f }) => (<g>
    <path d="M60 280 Q135 230 210 280 L210 300 L60 300 Z" fill="#d8a860" /><rect x="58" y="300" width="154" height="10" fill="#c84a3a" />
    <rect x="58" y="310" width="154" height="8" fill="#7ac84a" /><path d="M60 318 L210 318 L210 330 Q135 345 60 330 Z" fill="#d8a860" />
    <circle cx="200" cy="285" r="22" fill={BGS.dark[0]} />
  </g>),
  heartmail: ({ f }) => (<g transform={`translate(0 ${Math.sin(f / 8) * 4})`}>
    <rect x="55" y="190" width="160" height="110" rx="6" fill="#efe6cf" /><path d="M55 190 L135 250 L215 190" fill="none" stroke="#9a8f78" strokeWidth="3" />
    <path d="M135 300 C95 270 95 235 120 235 C130 235 135 245 135 250 C135 245 140 235 150 235 C175 235 175 270 135 300 Z" fill="#e8302a" transform="translate(0 -20)" />
    <text x="135" y="330" textAnchor="middle" fontSize="16" fontWeight="900" fill="#e8302a">I LOVE YOU</text>
  </g>),
  tape: ({ f }) => (<g transform={`rotate(${f * 2} 135 250)`}>
    <circle cx="135" cy="250" r="60" fill="#a8a8a8" /><circle cx="135" cy="250" r="30" fill={BGS.dark[0]} />
    <path d={`M190 270 L${250 + f} ${300 + f * 0.5} L${245 + f} ${312 + f * 0.5} L186 282 Z`} fill="#b8b8b8" />
  </g>),
  ruler: ({ f }) => (<g>
    <rect x="30" y="200" width="210" height="34" fill="#f2d23a" />{[...Array(22)].map((_, i) => <rect key={i} x={34 + i * 9.5} y="200" width="1.5" height={i % 5 ? 10 : 18} fill="#3a2a1a" />)}
    <text x="135" y="226" textAnchor="middle" fontSize="13" fontWeight="900" fill="#3a2a1a">МЕТРЫ</text>
    <rect x="30" y="250" width="210" height="34" fill="#c8a07a" />{[...Array(16)].map((_, i) => <rect key={i} x={34 + i * 13} y="250" width="1.5" height={i % 4 ? 10 : 18} fill="#3a2a1a" />)}
    <text x="135" y="276" textAnchor="middle" fontSize="13" fontWeight="900" fill="#3a2a1a">ФУТЫ</text>
    {f > 12 && <text x="135" y="330" textAnchor="middle" fontSize="40" fontWeight="900" fill="#e8302a" opacity={Math.min(1, (f - 12) / 6)}>≠</text>}
  </g>),
};
Object.assign(ITEMS, MORE);

export function Insert({ name, f, tone = "dark" }) {
  const Item = ITEMS[name];
  const [a, b] = BGS[tone] || BGS.dark;
  const z = 1.08 + 0.1 * easeOut(clamp(f / 60)) + 0.1 * (1 - easeOut(prog(f, 0, 6)));
  return (
    <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="ibg" cx="50%" cy="45%" r="75%"><stop offset="0" stopColor={b} /><stop offset="1" stopColor={a} /></radialGradient>
        <radialGradient id="ivig" cx="50%" cy="48%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".7" /></radialGradient>
      </defs>
      <rect width="270" height="480" fill="url(#ibg)" />
      <Bokeh f={f} tone={tone} />
      <g transform={`translate(135 250) scale(${z}) translate(-135 -250)`}>{Item ? <Item f={f} /> : null}</g>
      <rect width="270" height="480" fill="url(#ivig)" />
    </svg>
  );
}

export const INSERT_NAMES = Object.keys(ITEMS);
