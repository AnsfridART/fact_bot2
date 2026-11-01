// Параметрический человечек в плоском 2D-стиле: большая голова, простое тело.
// Начало координат — между ступнями. Рост ~150.
import React from "react";
import { clamp, lerp, shade } from "./util.js";

const DEF = { dress: null, skin: "#E9B98F", hair: "#3B2A20", hairStyle: "short", shirt: "#7A5A3A", pants: "#3E3A36",
  shoes: "#2A2420", hat: null, hatColor: "#8A6A40", beard: false, beardColor: "#cfcfcf", mask: null,
  glasses: false, coat: false, tie: null };

function Hat({ type, color }) {
  if (type === "wide") return (<g>
    <ellipse cx="0" cy="-156" rx="38" ry="7" fill={shade(color, 0.85)} />
    <path d="M-20 -157 Q-20 -182 0 -182 Q20 -182 20 -157 Z" fill={color} />
    <rect x="-20" y="-162" width="40" height="5" fill={shade(color, 0.6)} />
  </g>);
  if (type === "army") return (<g>
    <path d="M-36 -152 Q-30 -160 -20 -158 L20 -158 Q30 -150 34 -146 Q20 -150 0 -151 Z" fill={shade(color, 0.8)} />
    <path d="M-21 -156 Q-21 -180 0 -180 Q21 -180 21 -156 Z" fill={color} />
    <rect x="-21" y="-161" width="42" height="5" fill={shade(color, 0.55)} />
  </g>);
  if (type === "cap") return (<g>
    <path d="M-24 -150 Q-24 -176 0 -176 Q24 -176 24 -150 Z" fill={color} />
    <path d="M-4 -152 L34 -150 Q30 -144 -4 -146 Z" fill={shade(color, 0.75)} />
  </g>);
  if (type === "beret") return <ellipse cx="4" cy="-160" rx="26" ry="10" fill={color} />;
  if (type === "hood") return <path d="M-31 -120 Q-34 -178 0 -180 Q34 -178 31 -120 Q24 -150 0 -150 Q-24 -150 -31 -120 Z" fill={color} />;
  return null;
}

function Hair({ style, color }) {
  if (style === "bald") return <g fill={color}><path d="M-25 -140 Q-27 -125 -22 -122 L-21 -140 Z" /><path d="M25 -140 Q27 -125 22 -122 L21 -140 Z" /></g>;
  if (style === "long") return <path d="M-27 -132 Q-30 -176 0 -170 Q30 -176 27 -132 L27 -100 Q22 -110 22 -138 Q0 -150 -22 -138 Q-22 -110 -27 -100 Z" fill={color} />;
  if (style === "curly") return <g fill={color}>{[-18, -6, 6, 18].map((x, i) => <circle key={i} cx={x} cy={-160 - (i % 2) * 3} r="10" />)}</g>;
  if (style === "none") return null;
  return <path d="M-25 -138 Q-26 -170 0 -168 Q26 -170 25 -138 Q20 -152 0 -152 Q-20 -152 -25 -138 Z" fill={color} />;
}

function Face({ expr, mouth, blink, look }) {
  const eyeR = expr === "shock" ? 6.5 : 5.2;
  const ry = blink ? 0.6 : eyeR;
  const px = look?.x || 0, py = look?.y || 0;
  const brow = { shock: [-6, 0], worried: [-2, 6], angry: [3, -6], sad: [0, 7], happy: [-3, 0] }[expr] || [0, 0];
  const mouthEl = () => {
    if (expr === "shock") return <ellipse cx="0" cy="-122" rx="5" ry="6.5" fill="#4A2020" />;
    if (expr === "happy") return <path d="M-7 -124 Q0 -116 7 -124" stroke="#4A2020" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    if (expr === "sad" || expr === "worried") return <path d="M-6 -119 Q0 -124 6 -119" stroke="#4A2020" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    if (mouth > 0.08) return <ellipse cx="0" cy="-121" rx={4 + mouth * 2} ry={1 + mouth * 4.5} fill="#4A2020" />;
    return <line x1="-5" y1="-121" x2="5" y2="-121" stroke="#4A2020" strokeWidth="2.2" strokeLinecap="round" />;
  };
  return (
    <g>
      <ellipse cx="-13" cy="-127" rx="5" ry="3" fill="#e8907e" opacity=".35" />
      <ellipse cx="13" cy="-127" rx="5" ry="3" fill="#e8907e" opacity=".28" />
      <ellipse cx="-9" cy="-138" rx={eyeR} ry={ry * 1.08} fill="#fff" />
      <ellipse cx="9" cy="-138" rx={eyeR} ry={ry * 1.08} fill="#fff" />
      {!blink && <>
        <circle cx={-9 + px} cy={-137.5 + py} r="2.8" fill="#1a1410" />
        <circle cx={9 + px} cy={-137.5 + py} r="2.8" fill="#1a1410" />
        <circle cx={-8 + px} cy={-139 + py} r="1" fill="#fff" />
        <circle cx={10 + px} cy={-139 + py} r="1" fill="#fff" />
      </>}
      <path d={`M-15 ${-147 + brow[0] * 0.5} L-4 ${-147 - brow[1] * 0.4 + brow[0] * 0.5}`} stroke="#2a1d14" strokeWidth="3.2" strokeLinecap="round" />
      <path d={`M15 ${-147 + brow[0] * 0.5} L4 ${-147 - brow[1] * 0.4 + brow[0] * 0.5}`} stroke="#2a1d14" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M1 -134 Q4.5 -127 0 -125" stroke="#b07a5a" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
      {mouthEl()}
    </g>
  );
}

// поза: углы рук/ног (градусы) и смещение корпуса
function pose(anim, t, phase) {
  const s = Math.sin(t * 0.35 + phase), s2 = Math.sin(t * 0.7 + phase);
  switch (anim) {
    case "walk": return { la: s * 22, ra: -s * 22, ll: -s * 24, rl: s * 24, bob: Math.abs(s) * -3, lean: 2 };
    case "run": { const r = Math.sin(t * 0.75 + phase); return { la: r * 50, ra: -r * 50, ll: -r * 40, rl: r * 40, bob: Math.abs(r) * -6, lean: 7 }; }
    case "shock": return { la: 150 + s2 * 6, ra: -150 - s2 * 6, ll: -6, rl: 6, bob: -Math.abs(Math.sin(t * 0.5)) * 5, lean: 0 };
    case "point": return { la: 8, ra: -100 + s * 3, ll: 0, rl: 0, bob: 0, lean: -1 };
    case "aim": return { la: -80, ra: -95, ll: -8, rl: 10, bob: 0, lean: 3 };
    case "carry": return { la: -40, ra: 40, ll: 0, rl: 0, bob: s * 1, lean: 0 };
    case "worried": return { la: -55, ra: 55, ll: 0, rl: 0, bob: s * 0.8, lean: 0 };
    case "wave": return { la: 8, ra: -150 + s2 * 25, ll: 0, rl: 0, bob: 0, lean: 0 };
    case "dance": { const d = Math.sin(t * 0.55 + phase); return { la: 120 + d * 40, ra: -120 + d * 40, ll: d * 25, rl: d * 25, bob: -Math.abs(d) * 8, lean: d * 10 }; }
    case "tired": return { la: 15, ra: -15, ll: 4, rl: -4, bob: 4 + s * 0.6, lean: 9 };
    case "salute": return { la: 6, ra: -160, ll: 0, rl: 0, bob: 0, lean: 0 };
    case "talk": return { la: 10 + s * 8, ra: -20 - Math.max(0, s2) * 30, ll: 0, rl: 0, bob: s * 1.2, lean: 0 };
    default: return { la: 6 + s * 2, ra: -6 - s * 2, ll: 0, rl: 0, bob: s * 0.8, lean: 0 };
  }
}

export function Person({ look = {}, anim = "idle", t = 0, mouth = 0, expr, phase = 0, held, light = -1, gaze = 0 }) {
  // light: -1 свет слева, 1 справа; gaze: -1/1 смотрит в сторону собеседника
  const L = { ...DEF, ...look };
  const p = pose(anim, t, phase);
  const blink = (t + phase * 37) % 110 < 4;
  const e = expr || (anim === "shock" ? "shock" : anim === "worried" ? "worried" : "neutral");
  const arm = (side, ang) => {
    const far = side === -light ? 0.8 : 1;  // рука в тени темнее
    return (
      <g transform={`translate(${side * 27} -104) rotate(${ang})`}>
        <rect x="-6" y="-2" width="12" height="50" rx="6" fill={shade(L.shirt, (L.coat ? 0.92 : 1) * far)} />
        <circle cx="0" cy="50" r="6.5" fill={shade(L.skin, far)} />
      </g>
    );
  };
  const leg = (side, ang) => (
    <g transform={`translate(${side * 10} -56) rotate(${ang})`}>
      <rect x="-7" y="0" width="14" height="52" rx="5" fill={L.pants} />
      <ellipse cx={side * 3} cy="54" rx="10" ry="5" fill={L.shoes} />
    </g>
  );
  return (
    <g>
      <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity=".28" />
      <g transform={`translate(0 ${p.bob}) rotate(${p.lean})`}>
        {L.dress ? (
          <g>
            <g transform={`translate(-9 -20) rotate(${p.ll * 0.4})`}><rect x="-5" y="0" width="10" height="18" fill={L.skin} /><ellipse cx="0" cy="20" rx="8" ry="4" fill={L.shoes} /></g>
            <g transform={`translate(9 -20) rotate(${p.rl * 0.4})`}><rect x="-5" y="0" width="10" height="18" fill={L.skin} /><ellipse cx="0" cy="20" rx="8" ry="4" fill={L.shoes} /></g>
            <path d={`M-24 -62 L24 -62 L${36 + p.rl * 0.3} -16 L${-36 + p.ll * 0.3} -16 Z`} fill={L.dress} />
          </g>
        ) : <>{leg(-1, p.ll)}{leg(1, p.rl)}</>}
        {arm(-1, p.la)}
        <rect x="-26" y="-112" width="52" height="60" rx="14" fill={L.shirt} />
        <path d={light < 0 ? "M2 -112 L12 -112 Q26 -112 26 -98 L26 -66 Q26 -52 12 -52 L2 -52 Z" : "M-2 -112 L-12 -112 Q-26 -112 -26 -98 L-26 -66 Q-26 -52 -12 -52 L-2 -52 Z"}
          fill="#000" opacity=".2" />
        <path d={light < 0 ? "M-25 -100 L-25 -60" : "M25 -100 L25 -60"} stroke="#ffd6a0" strokeWidth="2" opacity=".45" strokeLinecap="round" />
        {L.coat && <g><path d="M-10 -112 L-2 -90 L-6 -70" stroke={shade(L.shirt, 0.6)} strokeWidth="2" fill="none" />
          <path d="M10 -112 L2 -90 L6 -70" stroke={shade(L.shirt, 0.6)} strokeWidth="2" fill="none" /></g>}
        {!L.coat && !L.dress && <path d="M-8 -112 L0 -104 L8 -112" stroke={shade(L.shirt, 0.7)} strokeWidth="2" fill="none" />}
        {L.tie && <path d="M0 -110 L-4 -100 L0 -80 L4 -100 Z" fill={L.tie} />}
        {held === "rifle" && <g transform="translate(-4 -88) rotate(-12)"><rect x="-6" y="-4" width="60" height="6" rx="2" fill="#3a2d20" /><rect x="40" y="-6" width="26" height="4" fill="#222" /></g>}
        {held === "painting" && <g transform="translate(0 -92)"><rect x="-24" y="-18" width="48" height="58" rx="2" fill="#6b4a22" /><rect x="-19" y="-13" width="38" height="48" fill="#3f5a3f" /><ellipse cx="0" cy="4" rx="9" ry="12" fill="#c49a6c" /></g>}
        {arm(1, p.ra)}
        <rect x="-8" y="-120" width="16" height="12" fill={shade(L.skin, 0.9)} />
        <circle cx="0" cy="-140" r="26" fill={L.skin} />
        <path d={light < 0 ? "M3 -166 A26 26 0 0 1 3 -114 A21 26 0 0 0 3 -166 Z" : "M-3 -166 A26 26 0 0 0 -3 -114 A21 26 0 0 1 -3 -166 Z"}
          fill="#000" opacity=".13" />
        <path d={light < 0 ? "M-24 -148 A26 26 0 0 1 -14 -162" : "M24 -148 A26 26 0 0 0 14 -162"} stroke="#ffd6a0" strokeWidth="2.4" fill="none" opacity=".55" strokeLinecap="round" />
        <ellipse cx="-26" cy="-137" rx="4" ry="6" fill={shade(L.skin, 0.9)} />
        <ellipse cx="26" cy="-137" rx="4" ry="6" fill={shade(L.skin, 0.9)} />
        <Hair style={L.hat && L.hairStyle !== "long" ? "none" : L.hairStyle} color={L.hair} />
        {L.beard && <path d="M-22 -132 Q-22 -102 0 -100 Q22 -102 22 -132 Q12 -118 0 -118 Q-12 -118 -22 -132 Z" fill={L.beardColor} />}
        {L.mask === "cave" ? (
          <g><path d="M-24 -150 Q-26 -112 0 -110 Q26 -112 24 -150 Q24 -170 0 -168 Q-24 -170 -24 -150 Z" fill="#a98a6a" />
            <path d="M-26 -150 Q-20 -176 0 -174 Q20 -176 26 -150 Q14 -162 0 -160 Q-14 -162 -26 -150 Z" fill="#4a3424" />
            <ellipse cx="-9" cy="-140" rx="5" ry="3" fill="#1a1a1a" /><ellipse cx="9" cy="-140" rx="5" ry="3" fill="#1a1a1a" />
            <path d="M-16 -147 L-3 -144 M16 -147 L3 -144" stroke="#3a2a1a" strokeWidth="4" />
            <path d="M-8 -122 Q0 -116 8 -122" stroke="#3a2a1a" strokeWidth="3" fill="none" /></g>
        ) : L.mask === "plain" ? (
          <g><ellipse cx="0" cy="-140" rx="24" ry="26" fill="#d9d4cc" /><circle cx="-9" cy="-142" r="3" fill="#333" /><circle cx="9" cy="-142" r="3" fill="#333" /><line x1="-5" y1="-123" x2="5" y2="-123" stroke="#555" strokeWidth="2" /></g>
        ) : (
          <Face expr={e} mouth={mouth} blink={blink} look={anim === "point" ? { x: 2, y: -1 } : gaze ? { x: gaze * 1.8, y: 0 } : null} />
        )}
        {L.glasses && <g fill="none" stroke="#2a2a2a" strokeWidth="2"><circle cx="-9" cy="-138" r="8" /><circle cx="9" cy="-138" r="8" /><line x1="-1" y1="-138" x2="1" y2="-138" /></g>}
        <Hat type={L.hat} color={L.hatColor} />
      </g>
    </g>
  );
}
