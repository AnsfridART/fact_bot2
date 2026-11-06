import React from "react";
import { shade } from "./util.js";

// Эму, вид сбоку (смотрит вправо). Начало координат — между ногами на земле. Высота ~125.
export function Emu({ t = 0, anim = "walk", phase = 0, color = "#5B4E44", angry = false }) {
  const speed = anim === "run" ? 0.8 : anim === "walk" ? 0.4 : 0;
  const s = Math.sin(t * speed + phase);
  const peck = anim === "eat" ? Math.max(0, Math.sin(t * 0.25 + phase)) : 0;
  const bob = speed ? Math.abs(s) * -3 : Math.sin(t * 0.1 + phase) * 0.8;
  const leg = (ang, dx) => (
    <g transform={`translate(${dx} -48) rotate(${ang})`}>
      <path d="M0 0 L2 26 L-1 48" stroke="#8A7D6B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-1 48 L8 50 M-1 48 L-6 50" stroke="#8A7D6B" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <ellipse cx="0" cy="2" rx="28" ry="5" fill="#000" opacity=".25" />
      {leg(s * 28, -3)}
      {leg(-s * 28, 4)}
      <g transform={`translate(0 ${bob})`}>
        <path d="M-34 -62 Q-38 -92 -4 -96 Q30 -96 32 -70 Q30 -46 0 -44 Q-28 -44 -34 -62 Z" fill={color} />
        {[...Array(7)].map((_, i) => (
          <path key={i} d={`M${-28 + i * 8} ${-56 + (i % 2) * 4} q4 6 8 0`} stroke={shade(color, 0.75)} strokeWidth="2" fill="none" />
        ))}
        <g transform={`rotate(${peck * 70} 22 -86)`}>
          <path d="M18 -88 Q30 -110 24 -130 Q22 -138 28 -142" stroke={shade(color, 1.15)} strokeWidth="9" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="-144" rx="9" ry="7" fill={shade(color, 1.1)} />
          <path d="M39 -145 L50 -142 L39 -140 Z" fill="#3a3530" />
          <circle cx="34" cy="-146" r="2.6" fill={angry ? "#ff5040" : "#f2e8d0"} />
          <circle cx="34.6" cy="-146" r="1.2" fill="#111" />
        </g>
      </g>
    </g>
  );
}

// Ворона, вид сбоку. anim: idle, fly, scream
export function Crow({ t = 0, anim = "idle", phase = 0, color = "#1f2128" }) {
  const flap = anim === "fly" ? Math.sin(t * 0.9 + phase) : 0;
  const scream = anim === "scream" ? Math.abs(Math.sin(t * 0.5 + phase)) : 0;
  return (
    <g>
      {anim !== "fly" && <ellipse cx="0" cy="2" rx="14" ry="3" fill="#000" opacity=".25" />}
      <g transform={`translate(0 ${anim === "fly" ? -40 + flap * 4 : 0})`}>
        {anim !== "fly" && <path d="M-4 -14 L-6 0 M4 -14 L6 0" stroke="#333" strokeWidth="2.5" />}
        <path d="M-20 -22 Q-10 -40 12 -36 Q22 -32 18 -18 Q8 -10 -10 -14 Z" fill={color} />
        <path d="M-20 -22 L-34 -14 L-18 -16 Z" fill="#17181d" />
        <g transform={`rotate(${anim === "fly" ? flap * -40 : -8} -2 -30)`}>
          <path d="M-2 -30 Q-18 -54 -30 -48 Q-20 -40 -6 -26 Z" fill={color === "#1f2128" ? "#2a2d36" : color} opacity=".85" />
        </g>
        <circle cx="16" cy="-38" r="9" fill={color} />
        <path d={`M23 -40 L33 -38 L23 ${-36 + scream * 3} Z`} fill="#3a3c44" />
        <circle cx="18" cy="-40" r="2" fill="#e8e0c8" /><circle cx="18.5" cy="-40" r="1" fill="#000" />
      </g>
    </g>
  );
}

// Рыжий кот, сидит (вид сбоку, смотрит вправо). anim: idle, proud
export function Cat({ t = 0, anim = "idle", phase = 0, color = "#d8893a" }) {
  const tail = Math.sin(t * 0.12 + phase) * 14;
  const blink = (t + phase * 20) % 90 < 4;
  return (
    <g>
      <ellipse cx="0" cy="2" rx="26" ry="5" fill="#000" opacity=".25" />
      <path d={`M-18 -6 Q-40 ${-20 + tail * 0.3} -34 ${-46 + tail}`} stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="-2" cy="-24" rx="22" ry="24" fill={color} />
      <ellipse cx="4" cy="-14" rx="10" ry="12" fill="#f2d2a8" />
      <g transform={`rotate(${anim === "proud" ? -8 : Math.sin(t * 0.05 + phase) * 4} 6 -48)`}>
        <circle cx="6" cy="-56" r="17" fill={color} />
        <path d="M-6 -66 L-4 -82 L6 -70 Z" fill={color} /><path d="M12 -70 L22 -82 L22 -64 Z" fill={color} />
        <path d="M-3 -70 L-3 -77 L3 -71 Z" fill="#f2a8a0" /><path d="M15 -69 L20 -77 L20 -66 Z" fill="#f2a8a0" />
        <ellipse cx="0" cy="-58" rx="3.2" ry={blink ? 0.4 : 4} fill="#2a2a10" /><ellipse cx="14" cy="-58" rx="3.2" ry={blink ? 0.4 : 4} fill="#2a2a10" />
        <path d="M5 -50 L9 -50 L7 -47 Z" fill="#c46464" />
        <path d="M-6 -50 L-16 -52 M-6 -48 L-16 -46 M20 -50 L30 -52 M20 -48 L30 -46" stroke="#fff" strokeWidth=".8" />
      </g>
      {[-10, 6].map((x, i) => <ellipse key={i} cx={x} cy="-2" rx="6" ry="4" fill={color} />)}
    </g>
  );
}

// Кролик (вид сбоку). anim: idle, hop
export function Rabbit({ t = 0, anim = "hop", phase = 0, color = "#a8988a" }) {
  const hop = anim === "hop" ? Math.max(0, Math.sin(t * 0.45 + phase)) * 12 : 0;
  return (
    <g>
      <ellipse cx="0" cy="2" rx={14 - hop * 0.4} ry="3" fill="#000" opacity=".22" />
      <g transform={`translate(0 ${-hop})`}>
        <ellipse cx="-2" cy="-12" rx="14" ry="11" fill={color} />
        <circle cx="-15" cy="-14" r="4" fill="#efe8e0" />
        <circle cx="10" cy="-20" r="8" fill={color} />
        <ellipse cx="8" cy="-36" rx="3" ry="10" fill={color} transform="rotate(-12 8 -36)" />
        <ellipse cx="13" cy="-35" rx="3" ry="10" fill={color} transform="rotate(10 13 -35)" />
        <circle cx="13" cy="-21" r="1.6" fill="#1a1410" /><circle cx="18" cy="-18" r="1.4" fill="#c47a7a" />
        <ellipse cx="4" cy="-2" rx="7" ry="3" fill={color} />
      </g>
    </g>
  );
}

// v19: снежный барс анфас (сидит). anim: sit, paw (тянет лапку), lie (лежит, глаза закрыты), eyes (только глаза в темноте)
// wrong — «не настоящий»: не моргает, без бликов в глазах; shadow — на полу тень с длинными человеческими руками
export function Leopard({ t = 0, anim = "sit", phase = 0, wrong = false, shadow = false, wrongAt = null }) {
  if (wrongAt != null && t >= wrongAt) wrong = true;  // v20: глаза «ломаются» посреди кадра
  const fur = "#e6e2d8", shade = "#c7c1b2", belly = "#f5f3ee", spot = "#33322f";
  const blink = !wrong && t > 24 && (t + phase * 20) % 110 < 4;  // v20: не моргать на первом кадре — он же превью в ленте
  const breathe = Math.sin(t / 18 + phase) * 1.2;
  const tail = Math.sin(t / 30 + phase) * 6;
  const eyes = (cy, closed) => [-12, 12].map((x, i) => (
    <g key={i}>
      {closed || blink ? <path d={`M${x - 9} ${cy} Q${x} ${cy + 5} ${x + 9} ${cy}`} stroke={spot} strokeWidth="2.4" fill="none" strokeLinecap="round" /> : <>
        <ellipse cx={x} cy={cy} rx="10" ry="11" fill="#d9d4c4" />
        <ellipse cx={x} cy={cy} rx="8.6" ry="9.6" fill="#171614" />
        {wrong ? <circle cx={x} cy={cy} r="1.6" fill="#ff2a2a" opacity={0.5 + 0.4 * Math.sin(t / 5)} />
          : <><circle cx={x + 3} cy={cy - 4} r="2.8" fill="#fff" /><circle cx={x - 3} cy={cy + 3} r="1.2" fill="#fff" opacity=".7" /></>}
      </>}
    </g>));
  const head = (y, closed) => (
    <g transform={`translate(0 ${y}) rotate(${Math.sin(t / 40 + phase) * 3})`}>
      <path d="M-28 -18 Q-34 -40 -20 -40 Q-12 -38 -12 -28 Z" fill={fur} /><path d="M28 -18 Q34 -40 20 -40 Q12 -38 12 -28 Z" fill={fur} />
      <path d="M-24 -24 Q-27 -35 -19 -35 Z" fill={spot} opacity=".7" /><path d="M24 -24 Q27 -35 19 -35 Z" fill={spot} opacity=".7" />
      <ellipse cx="0" cy="0" rx="32" ry="28" fill={fur} />
      {[[-8, -20], [0, -23], [8, -20], [-16, -14], [16, -14], [-4, -16], [4, -16], [-26, 2], [26, 2], [-24, 10], [24, 10]].map(([x, yy], i) => <circle key={i} cx={x} cy={yy} r={i < 7 ? 1.6 : 2.4} fill={spot} opacity=".75" />)}
      {eyes(-3, closed)}
      <ellipse cx="-6" cy="13" rx="8" ry="6" fill={belly} /><ellipse cx="6" cy="13" rx="8" ry="6" fill={belly} />
      <path d="M-4 8 L4 8 L0 13 Z" fill="#3a2a2a" /><path d="M0 13 L0 16 M0 16 Q-4 19 -7 17 M0 16 Q4 19 7 17" stroke="#3a2a2a" strokeWidth="1.2" fill="none" />
      {[-1, 1].map((d) => <path key={d} d={`M${d * 12} 12 L${d * 34} 9 M${d * 12} 15 L${d * 33} 16`} stroke="#fff" strokeWidth=".7" opacity=".8" />)}
    </g>);
  // тень на полу: из-под барса уходит назад человеческий силуэт с руками до колен
  const sh = shadow ? (
    <g transform="matrix(1 0 0.5 0.62 0 0)" fill="#000" opacity={0.78 + 0.1 * Math.sin(t / 9)}>
      <ellipse cx="0" cy="-232" rx="15" ry="18" />
      <path d="M-20 -212 Q0 -220 20 -212 L24 -120 L14 -10 L4 -10 L0 -110 L-4 -10 L-14 -10 L-24 -120 Z" />
      <path d="M-20 -206 Q-34 -150 -38 -40 L-44 -20 L-30 -30 L-28 -60 Q-26 -150 -14 -196 Z" />
      <path d="M20 -206 Q34 -150 38 -40 L44 -20 L30 -30 L28 -60 Q26 -150 14 -196 Z" />
    </g>) : null;
  if (anim === "eyes") return (
    <g opacity={0.85 + 0.15 * Math.sin(t / 7)}>
      {[-12, 12].map((x, i) => <g key={i}><ellipse cx={x} cy="-86" rx="9" ry="10" fill="#d8ff9a" opacity=".18" /><ellipse cx={x} cy="-86" rx="5" ry="6" fill="#e9ffc0" /><ellipse cx={x} cy="-86" rx="1.6" ry="5" fill="#1a1a10" /></g>)}
    </g>);
  if (anim === "lie") return (
    <g>
      {sh}
      <ellipse cx="0" cy="3" rx="54" ry="7" fill="#000" opacity=".28" />
      <path d={`M30 -8 Q70 -10 66 ${-26 + tail}`} stroke={fur} strokeWidth="13" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy={-20 + breathe * 0.5} rx="46" ry="21" fill={shade} />
      <ellipse cx="0" cy={-14 + breathe * 0.5} rx="38" ry="14" fill={fur} />
      {[[-30, -26], [-16, -32], [14, -32], [30, -26], [-24, -16], [24, -16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="none" stroke={spot} strokeWidth="2" opacity=".7" />)}
      {[-14, 14].map((x, i) => <ellipse key={i} cx={x} cy="-3" rx="11" ry="6" fill={fur} />)}
      {head(-36, true)}
    </g>);
  const lift = anim === "paw" ? 0.6 + 0.4 * Math.sin(t / 10 + phase) : 0;
  return (
    <g>
      {sh}
      <ellipse cx="0" cy="3" rx="40" ry="7" fill="#000" opacity=".28" />
      {/* хвост обвивает лапы */}
      <path d={`M24 -10 Q52 -4 44 8 Q20 18 -26 ${10 + tail * 0.2}`} stroke={fur} strokeWidth="14" fill="none" strokeLinecap="round" />
      {[-12, 6, 26].map((x, i) => <circle key={i} cx={x} cy={i === 2 ? 10 : 14} r="3.2" fill={spot} opacity=".75" />)}
      <ellipse cx="0" cy={-40 - breathe} rx="31" ry={42 + breathe} fill={shade} />
      <ellipse cx="0" cy={-34 - breathe} rx="19" ry={34 + breathe} fill={belly} />
      {[[-24, -62], [24, -62], [-27, -40], [27, -40], [-22, -18], [22, -18], [-14, -74], [14, -74]].map(([x, y], i) => <path key={i} d={`M${x - 3.5} ${y + 1} a3.5 3.5 0 1 1 6 2.4`} fill="none" stroke={spot} strokeWidth="1.8" strokeLinecap="round" opacity=".65" />)}
      {/* передние лапы */}
      <rect x="-20" y="-40" width="14" height="40" rx="7" fill={fur} />
      <ellipse cx="-13" cy="-2" rx="10" ry="6" fill={fur} />
      {anim === "paw" ? (
        <g transform={`translate(15 ${-30 - lift * 22}) scale(${1 + lift * 0.25})`}>
          <rect x="-7" y="0" width="14" height={30 + lift * 18} rx="7" fill={fur} />
          <ellipse cx="0" cy="-4" rx="14" ry="15" fill={fur} />
          <ellipse cx="0" cy="0" rx="7" ry="6" fill="#1c1b19" />
          {[[-8, -9], [-3, -13], [3, -13], [8, -9]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3" ry="3.4" fill="#1c1b19" />)}
        </g>) : <><rect x="6" y="-40" width="14" height="40" rx="7" fill={fur} /><ellipse cx="13" cy="-2" rx="10" ry="6" fill={fur} /></>}
      {head(-88 - breathe, false)}
    </g>);
}
