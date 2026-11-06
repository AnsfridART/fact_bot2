// v16: детализированные фоны для стиля «нуар». Цвета берутся из палитры атмосферы (P = THEMES[x].bg),
// поэтому одна и та же комната выглядит по-разному в «неоне», «розыске», «досье» и т. д.
// Координаты как у остальных фонов: мир 270x480, линия пола ~ y=360.
import React from "react";
import { mix } from "./Themes.js";

const R = (seed) => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };

function Skyline({ P, t, y0 = 120, layers = 2, id }) {
  const out = [];
  for (let L = 0; L < layers; L++) {
    const shade = mix(P.sky, P.wall2, 0.35 + L * 0.3);
    for (let i = 0; i < 9; i++) {
      const w = 26 + R(i * 7 + L * 3) * 30, x = -40 + i * 40 + L * 17, h = 80 + R(i * 3 + L) * 120 - L * 30;
      out.push(<rect key={`b${L}${i}`} x={x} y={y0 + 140 - h + L * 40} width={w} height={h + 200} fill={shade} />);
      if (L === layers - 1) for (let k = 0; k < 10; k++) {
        const on = R(i * 31 + k * 7) > 0.62;
        if (!on) continue;
        out.push(<rect key={`w${i}${k}`} x={x + 4 + (k % 3) * (w / 3.4)} y={y0 + 150 - h + Math.floor(k / 3) * 14 + L * 40} width="4" height="6"
          fill={P.window} opacity={0.55 + 0.35 * Math.sin(t / (30 + k) + i)} />);
      }
    }
  }
  return <g>{out}</g>;
}

function Books({ x, y, n = 9, P }) {
  const cols = [P.furn2, mix(P.neon, P.furn, 0.6), mix(P.neon2, P.furn, 0.6), mix(P.wall2, "#000000", 0.2)];
  return (<g>{[...Array(n)].map((_, i) => { const h = 13 + (i * 5) % 7; return <rect key={i} x={x + i * 7} y={y - h} width="6" height={h} fill={cols[i % 4]} />; })}</g>);
}

function Lamp({ x, y, P, t, cone = 130 }) {
  const fl = 1 + Math.sin(t / 13) * 0.03;
  return (<g>
    <polygon points={`${x - 8},${y} ${x + 8},${y} ${x + 60},${y + cone} ${x - 60},${y + cone}`} fill={P.light} opacity={0.07 * fl} />
    <path d={`M${x - 10} ${y} L${x - 6} ${y - 10} L${x + 6} ${y - 10} L${x + 10} ${y} Z`} fill={P.furn2} />
    <circle cx={x} cy={y + 1} r="3" fill={P.light} opacity=".9" />
  </g>);
}

// ---------- 1. Комната ночью ----------
function Room({ P, t }) {
  return (<g>
    <defs>
      <linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.wall, "#000000", 0.35)} /><stop offset="1" stopColor={P.wall2} /></linearGradient>
    </defs>
    <rect x="-200" y="-200" width="670" height="880" fill="url(#rw)" />
    {/* окно с городом и жалюзи */}
    <g transform="translate(158 100)">
      <rect x="-6" y="-6" width="112" height="168" fill={mix(P.wall, "#000000", 0.5)} />
      <svg x="0" y="0" width="100" height="156" viewBox="0 0 100 156" overflow="hidden">
        <rect width="100" height="156" fill={P.sky} />
        <g transform="translate(-60 -40) scale(.7)"><Skyline P={P} t={t} y0={60} layers={2} /></g>
      </svg>
      {[...Array(13)].map((_, i) => <rect key={i} x="0" y={i * 12} width="100" height="4.5" fill={mix(P.wall2, P.light, 0.25)} opacity=".85" />)}
      <rect x="47" y="0" width="5" height="156" fill={mix(P.wall, "#000000", 0.5)} />
      <rect x="-10" y="156" width="120" height="6" fill={P.furn2} />
    </g>
    {/* тени от жалюзи на стене и полу */}
    <g opacity=".07">{[...Array(7)].map((_, i) => <polygon key={i} points={`${160},${110 + i * 22} ${160},${118 + i * 22} ${-40},${250 + i * 34} ${-40},${238 + i * 34}`} fill={P.light} />)}</g>
    {/* полка, книги, растение, постер, часы */}
    <rect x="-30" y="190" width="120" height="4" fill={P.wood} />
    <Books x={-26} y={190} n={10} P={P} />
    <g transform="translate(70 190)"><rect x="-6" y="-12" width="12" height="12" fill={P.furn2} /><ellipse cx="-4" cy="-18" rx="6" ry="9" fill={mix(P.neon2, "#2a4a2a", 0.7)} /><ellipse cx="5" cy="-20" rx="5" ry="10" fill={mix(P.neon2, "#2a4a2a", 0.6)} /></g>
    <g transform="translate(-22 110)"><rect width="50" height="64" fill={P.furn} /><rect x="4" y="4" width="42" height="56" fill={mix(P.wall2, P.neon, 0.25)} /><circle cx="25" cy="28" r="12" fill={P.neon} opacity=".8" /><rect x="10" y="48" width="30" height="4" fill={P.furn2} /></g>
    <g transform="translate(118 98)"><circle r="11" fill={P.furn2} /><circle r="9" fill={mix(P.wall, "#ffffff", 0.08)} /><line x1="0" y1="0" x2={Math.sin(t / 60) * 6} y2={-Math.cos(t / 60) * 6} stroke={P.furn} strokeWidth="1.6" /><line x1="0" y1="0" x2="4" y2="2" stroke={P.furn} strokeWidth="1.2" /></g>
    {/* стол с монитором и лампой */}
    <rect x="-60" y="318" width="150" height="7" fill={P.wood} />
    <rect x="-55" y="325" width="6" height="40" fill={mix(P.wood, "#000000", 0.3)} /><rect x="80" y="325" width="6" height="40" fill={mix(P.wood, "#000000", 0.3)} />
    <g transform="translate(20 268)">
      <rect x="-30" y="0" width="60" height="38" rx="3" fill="#05070a" stroke={P.furn2} strokeWidth="2" />
      <rect x="-26" y="4" width="52" height="30" fill={P.screen} opacity={0.18 + 0.04 * Math.sin(t / 7)} />
      {[0, 1, 2, 3].map((r) => <rect key={r} x="-22" y={8 + r * 6} width={10 + ((r * 13 + Math.floor(t / 6)) % 26)} height="2.5" fill={P.screen} opacity=".7" />)}
      <rect x="-4" y="38" width="8" height="10" fill={P.furn2} /><rect x="-14" y="48" width="28" height="3" fill={P.furn2} />
      <ellipse cx="0" cy="52" rx="70" ry="10" fill={P.screen} opacity=".06" />
    </g>
    <rect x="-20" y="313" width="34" height="5" rx="1" fill={P.furn2} />
    <g transform="translate(62 306)"><rect x="-4" y="-2" width="9" height="12" rx="2" fill={mix(P.neon2, P.furn, 0.5)} /><path d="M5 1 q5 2 0 6" stroke={mix(P.neon2, P.furn, 0.5)} strokeWidth="1.5" fill="none" /></g>
    <Lamp x={-40} y={262} P={P} t={t} cone={56} />
    <path d="M-40 262 L-46 300 L-40 318" stroke={P.furn2} strokeWidth="2" fill="none" />
    {/* диван справа и пол */}
    <g transform="translate(180 300)"><rect width="140" height="44" rx="10" fill={P.furn} /><rect x="-6" y="24" width="152" height="36" rx="9" fill={P.furn2} /><rect x="10" y="-12" width="44" height="30" rx="8" fill={mix(P.furn2, P.neon, 0.15)} /></g>
    <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill={P.floor} />
    {[...Array(9)].map((_, i) => <line key={i} x1={-200 + i * 80} y1="360" x2={-260 + i * 95} y2="480" stroke={mix(P.floor, "#ffffff", 0.05)} strokeWidth="1" />)}
    <ellipse cx="135" cy="400" rx="110" ry="22" fill={mix(P.floor, P.neon, 0.12)} />
    <ellipse cx="135" cy="400" rx="96" ry="17" fill="none" stroke={mix(P.floor, P.neon, 0.25)} strokeWidth="1.5" />
    <path d="M60 338 q20 30 70 40 t60 30" stroke="#000" strokeWidth="1.5" fill="none" opacity=".5" />
  </g>);
}

// ---------- 2. Ночная улица ----------
function Street({ P, t }) {
  const blink = Math.floor(t / 9) % 7 ? 1 : 0.35;
  return (<g>
    <defs><linearGradient id="ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.sky, "#000000", 0.4)} /><stop offset="1" stopColor={mix(P.sky, P.neon, 0.12)} /></linearGradient></defs>
    <rect x="-200" y="-200" width="670" height="880" fill="url(#ss)" />
    <Skyline P={P} t={t} y0={20} layers={2} />
    {/* ближние дома с пожарными лестницами */}
    {[[-120, 70, 120], [10, 100, 90], [170, 60, 130]].map(([x, y, w], i) => <g key={i}>
      <rect x={x} y={y} width={w} height={320} fill={mix(P.wall, "#000000", 0.25 + i * 0.05)} />
      {[...Array(15)].map((_, k) => <rect key={k} x={x + 10 + (k % 3) * (w / 3.2)} y={y + 14 + Math.floor(k / 3) * 34} width="16" height="20"
        fill={R(i * 9 + k) > 0.55 ? P.window : mix(P.wall, "#000000", 0.4)} opacity={R(i * 9 + k) > 0.55 ? 0.75 : 1} />)}
      {i !== 1 && [...Array(4)].map((_, k) => <g key={"f" + k} stroke={mix(P.furn2, "#000000", 0.2)} strokeWidth="1.5" fill="none">
        <rect x={x + w / 2 - 22} y={y + 40 + k * 60} width="44" height="3" fill={mix(P.furn2, "#000000", 0.2)} />
        <line x1={x + w / 2 - 18} y1={y + 43 + k * 60} x2={x + w / 2 + 18} y2={y + 100 + k * 60} /></g>)}
    </g>)}
    {/* неоновые вывески */}
    <g transform="translate(-30 170)" opacity={blink}><rect width="74" height="24" rx="5" fill="none" stroke={P.neon} strokeWidth="3" /><rect x="8" y="9" width="58" height="6" rx="2" fill={P.neon} />
      <rect x="-20" y="-16" width="114" height="56" fill={P.neon} opacity=".08" /></g>
    <g transform="translate(196 200)"><rect width="16" height="70" rx="4" fill="none" stroke={P.neon2} strokeWidth="2.5" />{[0, 1, 2, 3].map((k) => <rect key={k} x="4" y={8 + k * 15} width="8" height="9" fill={P.neon2} opacity=".85" />)}
      <rect x="-14" y="-10" width="44" height="90" fill={P.neon2} opacity=".07" /></g>
    {/* фонарь */}
    <g transform="translate(110 150)"><rect x="-2" y="0" width="4" height="210" fill={P.furn2} /><path d="M0 0 q0 -12 16 -12 h8" stroke={P.furn2} strokeWidth="4" fill="none" /><ellipse cx="26" cy="-10" rx="7" ry="3" fill={P.light} />
      <polygon points="20,-8 32,-8 90,210 -40,210" fill={P.light} opacity=".08" /></g>
    {/* тротуар, дорога, отражения */}
    <rect x="-200" y="352" width="670" height="10" fill={mix(P.floor, "#ffffff", 0.08)} />
    <path d="M-200 362 L470 362 L470 680 L-200 680 Z" fill={P.floor} />
    {[...Array(14)].map((_, i) => { const x = -170 + i * 34, c = [P.window, P.neon, P.neon2, P.light][i % 4];
      return <rect key={i} x={x} y={366 + (i % 3) * 6} width="3" height={30 + (i % 4) * 12} fill={c} opacity={0.12 + 0.06 * Math.sin(t / 8 + i)} />; })}
    {/* припаркованная машина */}
    <g transform="translate(-150 330)"><path d="M0 30 L6 12 Q12 2 30 2 L70 2 Q84 2 92 14 L104 18 Q112 20 112 30 Z" fill={mix(P.furn, "#000000", 0.2)} />
      <rect x="30" y="6" width="22" height="10" fill={mix(P.window, P.sky, 0.6)} opacity=".6" /><circle cx="24" cy="32" r="8" fill="#05070a" /><circle cx="90" cy="32" r="8" fill="#05070a" />
      <rect x="0" y="20" width="5" height="4" fill="#ff2a2a" /><rect x="-30" y="14" width="34" height="16" fill="#ff2a2a" opacity=".1" /></g>
    {/* пар из люка */}
    {[0, 1, 2].map((i) => { const k = ((t * 0.6 + i * 33) % 100) / 100; return <circle key={i} cx={230 + Math.sin(k * 6 + i) * 6} cy={370 - k * 80} r={6 + k * 16} fill="#cfd8e0" opacity={0.12 * (1 - k)} />; })}
  </g>);
}

// ---------- 3. Комната для допросов ----------
function Interrogation({ P, t }) {
  const sway = Math.sin(t / 25) * 2;
  return (<g>
    <rect x="-200" y="-200" width="670" height="880" fill={P.wall} />
    {[...Array(9)].map((_, i) => <rect key={i} x={-200 + i * 80} y="-200" width="2" height="560" fill={mix(P.wall, "#000000", 0.3)} />)}
    {[...Array(6)].map((_, i) => <rect key={"h" + i} x="-200" y={20 + i * 60} width="670" height="1.5" fill={mix(P.wall, "#000000", 0.25)} />)}
    {/* зеркальное стекло */}
    <g transform="translate(150 150)"><rect x="-6" y="-6" width="142" height="132" fill={P.furn2} /><rect width="130" height="120" fill={mix(P.sky, "#000000", 0.4)} />
      <polygon points="10,0 40,0 0,60 0,30" fill="#ffffff" opacity=".05" /><polygon points="60,0 75,0 20,120 5,120" fill="#ffffff" opacity=".04" />
      <ellipse cx="45" cy="95" rx="18" ry="22" fill="#000" opacity=".35" /></g>
    {/* дверь */}
    <g transform="translate(-110 180)"><rect width="70" height="180" fill={P.furn} /><rect x="6" y="6" width="58" height="168" fill="none" stroke={P.furn2} strokeWidth="2" /><rect x="22" y="30" width="26" height="34" fill={mix(P.sky, P.light, 0.15)} /><circle cx="58" cy="100" r="3" fill={P.light} /></g>
    {/* камера с красным огоньком */}
    <g transform="translate(232 40)"><rect x="-16" y="-6" width="28" height="12" rx="3" fill={P.furn2} /><circle cx="-14" cy="0" r="4" fill="#05070a" /><circle cx="8" cy="-2" r="1.8" fill="#ff2a2a" opacity={Math.floor(t / 15) % 2 ? 1 : 0.2} /></g>
    {/* часы */}
    <g transform="translate(20 80)"><circle r="12" fill={P.furn2} /><circle r="10" fill={mix(P.wall, "#ffffff", 0.15)} /><line x1="0" y1="0" x2="0" y2="-7" stroke="#111" strokeWidth="1.5" /><line x1="0" y1="0" x2={Math.sin(t / 20) * 8} y2={-Math.cos(t / 20) * 8} stroke="#c00" strokeWidth="1" /></g>
    {/* стол, стулья, лампа на проводе */}
    <line x1={135 + sway} y1="-200" x2={135 + sway} y2="200" stroke="#111" strokeWidth="1.5" />
    <g transform={`translate(${135 + sway} 200)`}><path d="M-16 0 L16 0 L8 -10 L-8 -10 Z" fill={P.furn2} /><ellipse cx="0" cy="1" rx="10" ry="2.5" fill={P.light} />
      <polygon points="-14,2 14,2 110,170 -110,170" fill={P.light} opacity=".09" /></g>
    <rect x="40" y="326" width="190" height="8" fill={mix(P.furn2, "#ffffff", 0.05)} />
    <rect x="50" y="334" width="6" height="30" fill={P.furn} /><rect x="214" y="334" width="6" height="30" fill={P.furn} />
    <g transform="translate(110 318)"><rect width="36" height="6" fill={mix(P.wall, "#ffffff", 0.5)} opacity=".8" /><rect x="40" y="1" width="18" height="5" fill={P.furn} /></g>
    <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill={P.floor} />
    <ellipse cx="135" cy="372" rx="120" ry="14" fill={P.light} opacity=".06" />
  </g>);
}

// ---------- 4. Ночной офис ----------
function Office({ P, t }) {
  return (<g>
    <rect x="-200" y="-200" width="670" height="880" fill={mix(P.wall, "#000000", 0.2)} />
    {/* стеклянная стена с городом */}
    <svg x="-200" y="20" width="670" height="230" viewBox="0 0 670 230"><rect width="670" height="230" fill={P.sky} />
      <g transform="translate(150 -10)"><Skyline P={P} t={t} y0={0} layers={2} /></g></svg>
    {[...Array(10)].map((_, i) => <rect key={i} x={-200 + i * 70} y="20" width="4" height="230" fill={mix(P.wall, "#000000", 0.4)} />)}
    <rect x="-200" y="18" width="670" height="5" fill={mix(P.wall, "#000000", 0.4)} />
    {/* потолочные светильники в перспективе */}
    {[...Array(5)].map((_, i) => <rect key={"l" + i} x={-120 + i * 90} y={-10 + (i % 2) * 2} width="60" height="5" rx="2" fill={P.light} opacity=".55" />)}
    {/* ряды столов с мониторами */}
    {[0, 1].map((row) => [...Array(6)].map((_, i) => { const x = -170 + i * 90 + row * 40, y = 250 + row * 50, s = 1 - row * 0.15;
      return <g key={`${row}${i}`} transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x="0" y="40" width="80" height="6" fill={P.wood} /><rect x="22" y="8" width="36" height="24" rx="2" fill="#05070a" stroke={P.furn2} strokeWidth="1.5" />
        <rect x="25" y="11" width="30" height="18" fill={P.screen} opacity={R(i + row * 7) > 0.4 ? 0.3 : 0.06} /><rect x="38" y="32" width="4" height="8" fill={P.furn2} />
        <rect x="70" y="0" width="3" height="46" fill={mix(P.wall, "#ffffff", 0.06)} opacity=".6" />
      </g>; }))}
    {/* растение и кулер */}
    <g transform="translate(232 290)"><rect x="-10" y="40" width="20" height="30" fill={P.furn2} />{[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={-8 + i * 4} cy={34 - i * 7} rx="12" ry="5" fill={mix(P.neon2, "#1e3a20", 0.75)} transform={`rotate(${-40 + i * 20} ${-8 + i * 4} ${34 - i * 7})`} />)}</g>
    <g transform="translate(-130 296)"><rect x="-10" y="24" width="22" height="44" rx="3" fill={P.furn2} /><rect x="-7" y="-4" width="16" height="28" rx="6" fill={mix(P.screen, "#88aacc", 0.5)} opacity=".6" /></g>
    <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill={P.floor} />
    {[...Array(8)].map((_, i) => <line key={i} x1={-200 + i * 90} y1="360" x2={-300 + i * 110} y2="480" stroke={mix(P.floor, "#ffffff", 0.05)} />)}
  </g>);
}

// ---------- 5. Улица с полицейской машиной ----------
function PoliceStreet({ P, t }) {
  const ph = Math.floor(t / 5) % 2;
  return (<g>
    <Street P={P} t={t} />
    <g transform="translate(150 316)">
      <path d="M0 44 L8 22 Q16 8 40 8 L96 8 Q114 8 124 24 L140 28 Q150 30 150 44 Z" fill={mix(P.furn, "#ffffff", 0.08)} />
      <rect x="0" y="32" width="150" height="8" fill={mix(P.wall, "#ffffff", 0.75)} opacity=".85" />
      <rect x="40" y="13" width="28" height="13" fill={mix(P.window, P.sky, 0.7)} opacity=".6" /><rect x="74" y="13" width="30" height="13" fill={mix(P.window, P.sky, 0.7)} opacity=".6" />
      <rect x="54" y="0" width="20" height="7" rx="2" fill={ph ? "#ff2a3a" : "#4a1010"} /><rect x="76" y="0" width="20" height="7" rx="2" fill={ph ? "#10204a" : "#2a7bff"} />
      <circle cx="32" cy="46" r="11" fill="#05070a" /><circle cx="122" cy="46" r="11" fill="#05070a" />
    </g>
    <rect x="-200" y="-200" width="670" height="880" fill={ph ? "#ff2a3a" : "#2a7bff"} opacity=".07" />
  </g>);
}

// ---------- v18: прихожая с входной дверью (глазок, замок, полоска света под дверью) ----------
function Hallway({ P, t, feet = false }) {
  const under = 0.75 + 0.25 * Math.sin(t / 9);
  return (<g>
    <rect x="-200" y="-200" width="670" height="880" fill={mix(P.wall, "#000000", 0.35)} />
    {/* обои-полосы */}
    {[...Array(12)].map((_, i) => <rect key={i} x={-200 + i * 56} y="-200" width="22" height="560" fill={mix(P.wall2, "#000000", 0.25)} opacity=".5" />)}
    {/* дверь */}
    <g transform="translate(70 70)">
      <rect x="-8" y="-8" width="146" height="298" fill={mix(P.furn, "#000000", 0.4)} />
      <rect width="130" height="290" fill={mix(P.furn2, "#000000", 0.15)} />
      <rect x="12" y="14" width="106" height="120" fill="none" stroke={mix(P.furn, "#000000", 0.3)} strokeWidth="3" />
      <rect x="12" y="150" width="106" height="124" fill="none" stroke={mix(P.furn, "#000000", 0.3)} strokeWidth="3" />
      <circle cx="65" cy="78" r="5" fill="#0a0a0a" /><circle cx="65" cy="78" r="2.4" fill={P.light} opacity={0.5 + 0.4 * Math.sin(t / 15)} />
      <rect x="104" y="140" width="16" height="30" rx="3" fill={mix(P.light, "#888888", 0.5)} /><rect x="100" y="150" width="24" height="5" rx="2" fill={mix(P.light, "#bbbbbb", 0.4)} />
      <rect x="106" y="182" width="12" height="12" rx="2" fill="#111" />
    </g>
    {/* свет из подъезда под дверью и тени ног */}
    <rect x="68" y="355" width="134" height="7" fill="#fff4d0" opacity={0.9 * under} />
    <polygon points="68,362 202,362 250,440 20,440" fill="#fff4d0" opacity={0.16 * under} />
    {feet ? <g fill="#000"><rect x="98" y="354" width="26" height="9" /><rect x="140" y="354" width="26" height="9" />
      <polygon points="98,362 124,362 112,440 70,440" opacity=".7" /><polygon points="140,362 166,362 190,440 150,440" opacity=".7" /></g> : null}
    {/* вешалка, куртка, тумба, обувь */}
    <rect x="-90" y="120" width="120" height="6" fill={P.wood} />
    <path d="M-70 126 q-8 60 6 120 h40 q10 -60 -2 -120 z" fill={mix(P.furn, "#000000", 0.2)} />
    <rect x="220" y="280" width="90" height="80" fill={P.furn} /><rect x="226" y="290" width="78" height="4" fill={P.furn2} />
    <g transform="translate(240 266)"><rect width="22" height="14" rx="3" fill="#0d0d0d" /><rect x="3" y="3" width="16" height="8" fill={P.screen} opacity={0.5 + 0.4 * Math.sin(t / 5)} /></g>
    <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill={P.floor} />
    <ellipse cx="0" cy="372" rx="40" ry="6" fill="#000" opacity=".5" /><ellipse cx="-50" cy="374" rx="34" ry="6" fill="#000" opacity=".5" />
  </g>);
}

// ---------- v18: тёмная лестница подъезда с моргающей лампой ----------
function Stairwell({ P, t }) {
  const lamp = (Math.floor(t / 4) * 7919) % 11 < 2 ? 0.15 : 1;
  return (<g>
    <rect x="-200" y="-200" width="670" height="880" fill={mix(P.wall, "#000000", 0.45)} />
    <rect x="-200" y="200" width="670" height="160" fill={mix(P.wall2, "#000000", 0.4)} />
    <rect x="-200" y="196" width="670" height="6" fill={mix(P.wall2, "#000000", 0.6)} />
    {/* пролёт ступеней вверх */}
    {[...Array(9)].map((_, i) => <g key={i}><rect x={-40 + i * 26} y={360 - i * 22} width="200" height="22" fill={mix(P.floor, "#ffffff", 0.12 + i * 0.01)} /><rect x={-40 + i * 26} y={360 - i * 22} width="200" height="3" fill={mix(P.floor, "#ffffff", 0.12)} /></g>)}
    {/* перила */}
    <path d="M-40 300 L200 102" stroke={mix(P.furn2, "#000000", 0.2)} strokeWidth="5" />
    {[...Array(9)].map((_, i) => <line key={i} x1={-30 + i * 26} y1={292 - i * 21.5} x2={-30 + i * 26} y2={350 - i * 22} stroke={mix(P.furn2, "#000000", 0.2)} strokeWidth="2.5" />)}
    {/* окно подъезда и лампа */}
    <rect x="190" y="40" width="60" height="80" fill={mix(P.sky, P.window, 0.15)} /><line x1="220" y1="40" x2="220" y2="120" stroke={mix(P.wall, "#000", .5)} strokeWidth="3" />
    <g transform="translate(40 30)"><rect x="-14" y="-4" width="28" height="8" fill={P.furn2} /><ellipse cx="0" cy="6" rx="10" ry="5" fill="#fff4d0" opacity={lamp} />
      <circle cx="0" cy="6" r="40" fill="#fff4d0" opacity={0.12 * lamp} />
      <polygon points="-9,8 9,8 140,330 -140,330" fill="#fff4d0" opacity={0.22 * lamp} /></g>
    <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill={mix(P.floor, "#000000", 0.3)} />
    {/* силуэт на верхней площадке */}
    <g opacity={0.55 + 0.2 * Math.sin(t / 30)} transform="translate(214 92)"><ellipse cx="0" cy="-30" rx="9" ry="11" fill="#000" /><path d="M-14 -18 Q0 -24 14 -18 L16 20 L-16 20 Z" fill="#000" /></g>
  </g>);
}

// ---------- v18: салон машины ночью в метель ----------
function CarSnow({ P, t, lights = false }) {
  const flakes = [...Array(110)].map((_, i) => {
    const sp = 1.4 + R(i) * 1.8, x = (R(i * 3) * 330 + t * (0.8 + R(i * 7)) * 1.6) % 330 - 30, y = (R(i * 5) * 260 + t * sp) % 260 + 20;
    return <circle key={i} cx={x} cy={y} r={1 + R(i * 11) * 2.2} fill="#fff" opacity={0.6 + R(i * 13) * 0.4} />;
  });
  const wiper = Math.sin(t / 14) * 50;
  return (<g>
    <rect x="-200" y="-200" width="670" height="880" fill="#050608" />
    {/* лобовое стекло: тьма, метель, свет фар в снегу */}
    <svg x="-30" y="20" width="330" height="250" viewBox="-30 20 330 250" overflow="hidden">
      <defs><linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.sky, "#1a2a3a", 0.5)} /><stop offset=".55" stopColor={mix(P.sky, "#4a6a86", 0.55)} /><stop offset="1" stopColor="#9fb8cc" /></linearGradient>
        <radialGradient id="hl" cx=".5" cy="1" r=".8"><stop offset="0" stopColor="#fff6dc" stopOpacity=".55" /><stop offset="1" stopColor="#fff6dc" stopOpacity="0" /></radialGradient></defs>
      <rect x="-30" y="20" width="330" height="250" fill="url(#cs)" />
      <path d="M-30 200 Q135 175 300 200 L300 270 L-30 270 Z" fill="#cfdbe6" opacity=".7" />
      <rect x="-30" y="20" width="330" height="250" fill="url(#hl)" />
      {lights ? <g opacity={0.5 + 0.4 * Math.sin(t / 7)}><circle cx="120" cy="140" r="4" fill="#ffd27a" /><circle cx="150" cy="140" r="4" fill="#ffd27a" /><circle cx="135" cy="140" r="30" fill="#ffd27a" opacity=".12" /><rect x="128" y="128" width="14" height="4" fill="#ff8a1f" opacity={(t >> 3) % 2 ? 1 : 0.2} /></g> : null}
      {flakes}
      {/* снег налипает снизу стекла */}
      <path d={`M-30 270 L-30 ${236 - Math.min(40, t / 30)} Q60 ${222 - Math.min(40, t / 30)} 140 ${240 - Math.min(40, t / 30)} T300 ${230 - Math.min(40, t / 30)} L300 270 Z`} fill="#e9eef3" opacity=".9" />
      <rect x="-30" y="20" width="330" height="250" fill="#cfd8e0" opacity=".06" />
    </svg>
    {/* стойки и рама */}
    <path d="M-200 -200 H470 V680 H-200 Z M-30 20 L300 20 L330 280 L-60 280 Z" fillRule="evenodd" fill="#0b0d10" />
    {/* дворник */}
    <g transform={`rotate(${-20 + wiper * 0.3} 40 262)`}><rect x="40" y="259" width="150" height="5" rx="2" fill="#16191d" /></g>
    {/* приборная панель */}
    <path d="M-200 300 Q135 250 470 300 L470 680 L-200 680 Z" fill="#101317" />
    <g transform="translate(70 312)">
      <circle r="34" fill="#07090b" stroke="#1d2127" strokeWidth="3" /><circle r="26" fill="none" stroke={P.neon} strokeWidth="1.5" opacity=".7" />
      <line x1="0" y1="0" x2={-18} y2={10} stroke={P.neon2} strokeWidth="2" />
      <rect x="54" y="-18" width="44" height="22" rx="3" fill="#07090b" /><text x="76" y="-2" textAnchor="middle" fontSize="11" fill={P.neon2} fontFamily="DejaVu Sans Mono">-40°</text>
      <rect x="54" y="10" width="44" height="10" rx="2" fill="#07090b" /><rect x="56" y="12" width={6 + 4 * Math.abs(Math.sin(t / 40))} height="6" fill="#ff3b3b" />
    </g>
    {/* руль */}
    <g transform="translate(70 420)"><circle r="78" fill="none" stroke="#14171b" strokeWidth="16" /><rect x="-60" y="-8" width="120" height="16" fill="#14171b" /><circle r="16" fill="#14171b" /></g>
    {/* пар дыхания */}
    {[0, 1].map((i) => { const k = ((t * 0.5 + i * 50) % 100) / 100; return <circle key={i} cx={200 + k * 30} cy={330 - k * 60} r={6 + k * 16} fill="#dfe6ec" opacity={0.12 * (1 - k)} />; })}
  </g>);
}


// ---------- v19: бэкрумс — бесконечные жёлтые залы, лампы-панели, колонны, мокрый ковёр ----------
function Backrooms({ P, t, exit = false, sign = null }) {  // v22: sign — надпись маркером на двери вместо «ВЫХОД»
  const Zf = exit ? 3.2 : 10, W = 330, CY = -230, FY = 160;
  const pr = (X, Y, Z) => [135 + X / Z, 255 + Y / Z];
  const pts = (a) => a.map((q) => q.join(",")).join(" ");
  const wall = P.wall, wall2 = mix(P.wall, "#000000", 0.18), ceil = mix(P.wall, "#ffffff", 0.35), carpet = P.floor;
  const zs = []; for (let z = 0.6; z < Zf; z += 0.42) zs.push(z);
  const lamps = []; for (const z of [1.15, 2.05, 2.95, 3.85, 5.2, 6.55, 7.9]) if (z + 0.35 < Zf) for (const x of [-140, 140]) lamps.push([x, z]);
  const pillars = exit ? [[-190, 2.0]] : [[-175, 2.6], [175, 3.4], [-175, 5.6], [175, 7.2]];
  return (<g>
    <rect x="-200" y="-200" width="670" height="455" fill={ceil} />
    <rect x="-200" y="255" width="670" height="425" fill={carpet} />
    {/* потолочная сетка */}
    {zs.map((z, i) => { const [x1, y] = pr(-W, CY, z), [x2] = pr(W, CY, z); return <line key={"cz" + i} x1={x1} y1={y} x2={x2} y2={y} stroke={mix(ceil, "#000000", 0.18)} strokeWidth={1.4 / Math.sqrt(z)} />; })}
    {[...Array(11)].map((_, i) => { const X = -W + i * 66, a = pr(X, CY, 0.5), b = pr(X, CY, Zf); return <line key={"cx" + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={mix(ceil, "#000000", 0.18)} strokeWidth="1" />; })}
    {/* лампы */}
    {lamps.map(([x, z], i) => {
      const on = (Math.floor(t / 3) * 7919 + i * 131) % 37 < (i === 3 ? 6 : 1) ? 0.25 : 1;
      const q = [pr(x - 42, CY + 1, z), pr(x + 42, CY + 1, z), pr(x + 42, CY + 1, z + 0.35), pr(x - 42, CY + 1, z + 0.35)];
      const [gx, gy] = pr(x, FY, z + 0.2);
      return <g key={"l" + i}><polygon points={pts(q)} fill="#fffbe6" opacity={on} />
        <ellipse cx={gx} cy={gy} rx={90 / z} ry={22 / z} fill="#fff6c8" opacity={0.14 * on} /></g>;
    })}
    {/* боковые стены с полосами обоев */}
    {[-1, 1].map((d) => <g key={"w" + d}>
      <polygon points={pts([pr(d * W, CY, 0.5), pr(d * W, CY, Zf), pr(d * W, FY, Zf), pr(d * W, FY, 0.5)])} fill={wall2} />
      {zs.map((z, i) => { const a = pr(d * W, CY, z), b = pr(d * W, FY, z); return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={mix(wall2, "#000000", 0.12)} strokeWidth={2.2 / z} />; })}
      <polygon points={pts([pr(d * W, FY - 14, 0.5), pr(d * W, FY - 14, Zf), pr(d * W, FY, Zf), pr(d * W, FY, 0.5)])} fill={mix(wall2, "#000000", 0.3)} />
    </g>)}
    {/* дальняя стена */}
    <polygon points={pts([pr(-W, CY, Zf), pr(W, CY, Zf), pr(W, FY, Zf), pr(-W, FY, Zf)])} fill={wall} />
    {[...Array(15)].map((_, i) => { const X = -W + 22 + i * 44, a = pr(X, CY, Zf), b = pr(X, FY, Zf); return <line key={"fw" + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={wall2} strokeWidth={6 / Zf} />; })}
    {exit ? (() => {
      const [dx1, dy1] = pr(-38, FY - 205, Zf), [dx2, dy2] = pr(38, FY, Zf), [sx, sy] = pr(0, FY - 240, Zf);
      const glow = 0.75 + 0.25 * Math.sin(t / 6);
      return <g>
        <rect x={dx1 - 3} y={dy1 - 3} width={dx2 - dx1 + 6} height={dy2 - dy1 + 3} fill={mix(wall, "#000000", 0.45)} />
        <rect x={dx1} y={dy1} width={dx2 - dx1} height={dy2 - dy1} fill="#5a4a2a" />
        <rect x={dx1 + 2} y={dy1 + 2} width={dx2 - dx1 - 4} height={dy2 - dy1 - 2} fill="none" stroke="#3a2f1a" strokeWidth="1.2" />
        <circle cx={dx2 - 7} cy={(dy1 + dy2) / 2} r="2" fill="#d8c88a" />
        <rect x={dx1} y={dy2 - 2} width={dx2 - dx1} height="2" fill="#fff4c0" opacity=".9" />
        {sign ? <g><rect x={(dx1 + dx2) / 2 - 17} y={dy1 + 10} width="34" height="12" fill="#efe6c8" transform={`rotate(-4 ${(dx1 + dx2) / 2} ${dy1 + 16})`} />
          <text x={(dx1 + dx2) / 2} y={dy1 + 19.5} textAnchor="middle" fontSize={Math.min(8.5, 60 / sign.length)} fontWeight="900" fill="#1a1208" fontFamily="DejaVu Sans" transform={`rotate(-4 ${(dx1 + dx2) / 2} ${dy1 + 16})`}>{sign}</text></g> : <>
        <rect x={sx - 22} y={sy - 7} width="44" height="13" rx="2" fill="#0d3a1c" />
        <text x={sx} y={sy + 3} textAnchor="middle" fontSize="9" fontWeight="900" fill="#5dff8a" opacity={glow} fontFamily="DejaVu Sans">ВЫХОД</text>
        <ellipse cx={sx} cy={sy} rx="40" ry="18" fill="#5dff8a" opacity={0.12 * glow} /></>}
      </g>;
    })() : null}
    {/* колонны */}
    {pillars.sort((a, b) => b[1] - a[1]).map(([X, z], i) => {
      const [x1, y1] = pr(X - 24, CY, z), [x2, y2] = pr(X + 24, FY, z), [xs] = pr(X + (X < 0 ? 24 : -24), CY, z + 0.18);
      const side = X < 0 ? [[x2, y1], [xs, pr(0, CY, z + 0.18)[1]], [xs, pr(0, FY, z + 0.18)[1]], [x2, y2]] : [[x1, y1], [xs, pr(0, CY, z + 0.18)[1]], [xs, pr(0, FY, z + 0.18)[1]], [x1, y2]];
      return <g key={"p" + i}>
        <polygon points={pts(side)} fill={mix(wall, "#000000", 0.28)} />
        <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={wall} />
        {[0.25, 0.5, 0.75].map((k, j) => <line key={j} x1={x1 + (x2 - x1) * k} y1={y1} x2={x1 + (x2 - x1) * k} y2={y2} stroke={wall2} strokeWidth={2.4 / z} />)}
        <rect x={x1} y={y2 - 14 / z} width={x2 - x1} height={14 / z} fill={mix(wall, "#000000", 0.35)} />
      </g>;
    })}
    {/* дымка к горизонту и пятна на ковре */}
    <defs><radialGradient id="brh" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff3b0" stopOpacity=".55" /><stop offset="1" stopColor="#fff3b0" stopOpacity="0" /></radialGradient></defs>
    <ellipse cx="135" cy="255" rx="150" ry="70" fill="url(#brh)" />
    {[[60, 380, 40], [210, 420, 55], [150, 330, 26], [-20, 450, 60]].map(([x, y, r], i) => <ellipse key={"s" + i} cx={x} cy={y} rx={r} ry={r * 0.28} fill="#000" opacity=".1" />)}
    <rect x="-200" y="255" width="670" height="425" fill="#000" opacity=".08" />
  </g>);
}

// ---------- v19: «измерение сна» — северное сияние, парящие острова, светящиеся цветы ----------
function Dream({ t }) {
  const stars = [...Array(70)].map((_, i) => <circle key={i} cx={-200 + R(i) * 670} cy={-200 + R(i * 3) * 420} r={0.6 + R(i * 7) * 1.6} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(t / 15 + i))} />);
  const aur = (k, c, y0) => {
    let d = `M-200 ${y0}`;
    for (let x = -200; x <= 470; x += 30) d += ` L${x} ${y0 + Math.sin(x / 70 + t / 25 + k) * 26 + Math.sin(x / 33 - t / 17) * 8}`;
    return <path key={"au" + k} d={d} stroke={c} strokeWidth={34 - k * 6} fill="none" opacity={0.28 + 0.1 * Math.sin(t / 20 + k)} strokeLinecap="round" filter="url(#dblur)" />;
  };
  const island = (x, y, s, i) => {
    const bob = Math.sin(t / 30 + i) * 5;
    return <g key={"is" + i} transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <path d="M-46 0 Q-30 46 0 70 Q24 44 46 0 Z" fill="#4a2e5e" /><path d="M-46 0 Q-20 30 0 44 Q20 28 46 0 Z" fill="#6a3e7a" />
      <ellipse cx="0" cy="0" rx="48" ry="9" fill="#3dffb0" /><ellipse cx="0" cy="-2" rx="44" ry="6" fill="#8affd0" />
      <g transform="translate(-14 -2)"><rect x="-2" y="-26" width="4" height="26" fill="#3a2440" /><circle cy="-30" r="12" fill="#ff7ad9" /><circle cx="6" cy="-24" r="8" fill="#ffb0ec" /></g>
      <g transform="translate(18 -2)"><rect x="-1.5" y="-16" width="3" height="16" fill="#3a2440" /><circle cy="-19" r="8" fill="#7ad7ff" /></g>
      {[0, 1, 2].map((k) => <path key={k} d={`M${-20 + k * 18} 60 q4 14 0 30`} stroke="#8affd0" strokeWidth="1.5" fill="none" opacity=".5" />)}
    </g>;
  };
  return (<g>
    <defs>
      <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b0630" /><stop offset=".45" stopColor="#4b1a7a" /><stop offset=".75" stopColor="#d6407a" /><stop offset="1" stopColor="#ffb36b" /></linearGradient>
      <filter id="dblur"><feGaussianBlur stdDeviation="6" /></filter>
      <radialGradient id="dmoon"><stop offset="0" stopColor="#fff6e0" /><stop offset=".6" stopColor="#ffe0f4" stopOpacity=".5" /><stop offset="1" stopColor="#ffe0f4" stopOpacity="0" /></radialGradient>
    </defs>
    <rect x="-200" y="-200" width="670" height="880" fill="url(#dsky)" />
    {stars}
    {aur(0, "#3dffb0", 40)}{aur(1, "#7ad7ff", 80)}{aur(2, "#ff7ad9", 120)}
    <circle cx="210" cy="60" r="70" fill="url(#dmoon)" /><circle cx="210" cy="60" r="26" fill="#fff8ec" />
    {island(40, 150, 0.7, 1)}{island(230, 210, 0.55, 2)}{island(120, 90, 0.4, 3)}
    {/* облачная поляна с цветами */}
    <path d="M-200 360 Q-120 330 -40 352 Q40 322 120 350 Q200 324 280 352 Q380 330 470 356 L470 680 L-200 680 Z" fill="#f2c6ff" />
    <path d="M-200 380 Q-80 360 40 378 Q160 356 300 380 Q400 366 470 380 L470 680 L-200 680 Z" fill="#e0a8f6" />
    {[...Array(26)].map((_, i) => { const x = -180 + R(i * 5) * 640, y = 370 + R(i * 9) * 80, c = ["#ff7ad9", "#7ad7ff", "#ffe36b", "#8affd0"][i % 4];
      return <g key={i} opacity={0.75 + 0.25 * Math.sin(t / 9 + i)}><circle cx={x} cy={y} r="3.4" fill={c} /><circle cx={x} cy={y} r="9" fill={c} opacity=".25" /></g>; })}
    {[...Array(18)].map((_, i) => { const k = ((t * (0.4 + R(i) * 0.5) + R(i * 3) * 400) % 400); return <circle key={"f" + i} cx={-150 + R(i * 11) * 570 + Math.sin(t / 20 + i) * 10} cy={430 - k} r="1.8" fill="#fff6c0" opacity={0.8 * (1 - k / 400)} />; })}
  </g>);
}

// ---------- v19: жёлтый зал со спящими: пустые люди, у которых забрали сон ----------
function Sleepers({ P, t }) {
  const rows = [[2.2, [-120, 0, 120]], [3.6, [-150, -40, 70, 170]], [6, [-120, 20, 140]]];
  return (<g>
    <Backrooms P={P} t={t} />
    {rows.reverse().map(([z, xs], ri) => xs.map((X, i) => {
      const x = 135 + X / z, y = 255 + 160 / z, s = 1.6 / z, br = Math.sin(t / 25 + i + ri) * 0.6;
      return <g key={ri + "_" + i} transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="-2" rx="44" ry="7" fill="#000" opacity=".25" />
        <rect x="-36" y={-16 - br} width="58" height={14 + br} rx="7" fill={["#3a4a5a", "#5a3a3a", "#3a5a44", "#4a4a4a"][(i + ri) % 4]} />
        <circle cx="30" cy="-10" r="9" fill="#d9b08c" /><path d="M24 -18 Q32 -22 38 -14" stroke="#2a1d14" strokeWidth="4" fill="none" />
        <path d="M27 -11 Q29 -9 31 -11 M33 -11 Q35 -9 37 -11" stroke="#2a1d14" strokeWidth="1" fill="none" />
      </g>;
    }))}
  </g>);
}

const MAP = { dream: Dream, backrooms_sleepers: Sleepers, backrooms: Backrooms, backrooms_exit: (p) => <Backrooms {...p} exit />, hallway: Hallway, hallway_feet: (p) => <Hallway {...p} feet />, stairwell: Stairwell, car_snow: CarSnow, car_snow_lights: (p) => <CarSnow {...p} lights />, room: Room, noir_room: Room, hacker_room: Room, street: Street, noir_city: Street, interrogation: Interrogation, n_office: Office, office: Office, police_street: PoliceStreet };
export const NOIR_BGS = Object.keys(MAP);

export function NoirBackground({ name, t = 0, P }) {
  if (String(name).startsWith("backrooms_door:")) return <Backrooms P={P} t={t} exit sign={name.slice(15)} />;  // v22: дверь с надписью
  const C = MAP[name];
  return C ? <C P={P} t={t} /> : null;
}
