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
export function Crow({ t = 0, anim = "idle", phase = 0 }) {
  const flap = anim === "fly" ? Math.sin(t * 0.9 + phase) : 0;
  const scream = anim === "scream" ? Math.abs(Math.sin(t * 0.5 + phase)) : 0;
  return (
    <g>
      {anim !== "fly" && <ellipse cx="0" cy="2" rx="14" ry="3" fill="#000" opacity=".25" />}
      <g transform={`translate(0 ${anim === "fly" ? -40 + flap * 4 : 0})`}>
        {anim !== "fly" && <path d="M-4 -14 L-6 0 M4 -14 L6 0" stroke="#333" strokeWidth="2.5" />}
        <path d="M-20 -22 Q-10 -40 12 -36 Q22 -32 18 -18 Q8 -10 -10 -14 Z" fill="#1f2128" />
        <path d="M-20 -22 L-34 -14 L-18 -16 Z" fill="#17181d" />
        <g transform={`rotate(${anim === "fly" ? flap * -40 : -8} -2 -30)`}>
          <path d="M-2 -30 Q-18 -54 -30 -48 Q-20 -40 -6 -26 Z" fill="#2a2d36" />
        </g>
        <circle cx="16" cy="-38" r="9" fill="#1f2128" />
        <path d={`M23 -40 L33 -38 L23 ${-36 + scream * 3} Z`} fill="#3a3c44" />
        <circle cx="18" cy="-40" r="2" fill="#e8e0c8" /><circle cx="18.5" cy="-40" r="1" fill="#000" />
      </g>
    </g>
  );
}
