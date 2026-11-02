// Параметрический человечек в плоском 2D-стиле: большая голова, простое тело.
// Начало координат — между ступнями. Рост ~150.
import React from "react";
import { clamp, lerp, shade } from "./util.js";

const DEF = { build: "normal", mustache: false, dress: null, skin: "#E9B98F", hair: "#3B2A20", hairStyle: "short", shirt: "#7A5A3A", pants: "#3E3A36",
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
  if (type === "helmet") return (<g>
    <circle cx="0" cy="-140" r="36" fill="#cfe8ff" opacity=".28" stroke="#e8eef4" strokeWidth="5" />
    <path d="M-26 -170 A36 36 0 0 1 10 -176" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" />
  </g>);
  if (type === "hood") return <path d="M-31 -120 Q-34 -178 0 -180 Q34 -178 31 -120 Q24 -150 0 -150 Q-24 -150 -31 -120 Z" fill={color} />;
  return null;
}

function Hair({ style, color }) {
  if (style === "bald") return <g fill={color}><path d="M-25 -140 Q-27 -125 -22 -122 L-21 -140 Z" /><path d="M25 -140 Q27 -125 22 -122 L21 -140 Z" /></g>;
  if (style === "long") return <path d="M-27 -132 Q-30 -176 0 -170 Q30 -176 27 -132 L27 -100 Q22 -110 22 -138 Q0 -150 -22 -138 Q-22 -110 -27 -100 Z" fill={color} />;
  if (style === "curly") return <g fill={color}>{[-18, -6, 6, 18].map((x, i) => <circle key={i} cx={x} cy={-160 - (i % 2) * 3} r="10" />)}</g>;
  if (style === "bun") return <g fill={color}><path d="M-25 -138 Q-26 -170 0 -168 Q26 -170 25 -138 Q20 -152 0 -152 Q-20 -152 -25 -138 Z" /><circle cx="0" cy="-172" r="10" /></g>;
  if (style === "ponytail") return <g fill={color}><path d="M-25 -138 Q-26 -170 0 -168 Q26 -170 25 -138 Q20 -152 0 -152 Q-20 -152 -25 -138 Z" /><path d="M22 -150 Q40 -140 34 -110 Q28 -125 20 -138 Z" /></g>;
  if (style === "spiky") return <g fill={color}>{[-18, -9, 0, 9, 18].map((x, i) => <path key={i} d={`M${x - 7} -150 L${x} ${-176 - (i % 2) * 5} L${x + 7} -150 Z`} />)}<path d="M-25 -140 Q0 -158 25 -140 L25 -146 Q0 -162 -25 -146 Z" /></g>;
  if (style === "side") return <path d="M-25 -136 Q-28 -172 4 -170 Q28 -168 26 -140 Q14 -160 -6 -150 Q-16 -146 -25 -136 Z" fill={color} />;
  if (style === "none") return null;
  return <path d="M-25 -138 Q-26 -170 0 -168 Q26 -170 25 -138 Q20 -152 0 -152 Q-20 -152 -25 -138 Z" fill={color} />;
}

function Face({ expr, mouth, blink, look, t = 0 }) {
  const eyeR = expr === "shock" ? 6.5 : 5.2;
  const ry = blink ? 0.6 : eyeR;
  const px = look?.x || 0, py = look?.y || 0;
  const brow = { shock: [-6, 0], worried: [-2, 6], angry: [3, -6], sad: [0, 7], happy: [-3, 0] }[expr] || [0, 0];
  const mouthEl = () => {
    if (expr === "shock") return <ellipse cx="0" cy="-122" rx="5" ry="6.5" fill="#4A2020" />;
    if (expr === "happy") return <path d="M-7 -124 Q0 -116 7 -124" stroke="#4A2020" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    if (expr === "sad" || expr === "worried") return <path d="M-6 -119 Q0 -124 6 -119" stroke="#4A2020" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    if (mouth > 0.08) {
      // разные формы рта: широкий «э», круглый «о», узкий «и»
      const w = 3.5 + mouth * 3.2 * (0.55 + 0.45 * Math.sin(t * 0.9)), h = 1 + mouth * 4.8 * (0.6 + 0.4 * Math.cos(t * 0.7));
      return <g><ellipse cx="0" cy="-121" rx={w} ry={h} fill="#4A2020" />{h > 3 && <ellipse cx="0" cy={-121 + h * 0.45} rx={w * 0.55} ry={h * 0.35} fill="#c46464" />}</g>;
    }
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
    case "no": return { la: 8, ra: -8, ll: 0, rl: 0, bob: 0, lean: 0 };
    case "yes": return { la: 8, ra: -8, ll: 0, rl: 0, bob: Math.sin(t * 0.35) * 1, lean: 0 };
    case "talk": return { la: 10 + s * 8, ra: -20 - Math.max(0, s2) * 30, ll: 0, rl: 0, bob: s * 1.2, lean: 0 };
    default: return { la: 6 + s * 2, ra: -6 - s * 2, ll: 0, rl: 0, bob: s * 0.8, lean: 0 };
  }
}

// Эффекты эмоций над и вокруг головы (координаты головы персонажа)
function EmotionFX({ fx, t }) {
  const items = [];
  const k = (t % 40) / 40;
  if (fx.includes("sweat")) items.push(<g key="sw" opacity={1 - k * 0.6}>
    <path d={`M27 ${-160 + k * 22} q4 6 0 10 q-4 -4 0 -10 Z`} fill="#8fd0ff" stroke="#3a8acc" strokeWidth=".8" /></g>);
  if (fx.includes("tears")) items.push(<g key="te">{[-9, 9].map((x, i) => (
    <path key={i} d={`M${x} -132 q${i ? 2 : -2} ${10 + k * 16} 0 ${18 + k * 18}`} stroke="#8fd0ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />))}</g>);
  if (fx.includes("anger")) { const p = 1 + 0.15 * Math.sin(t * 0.6); items.push(<g key="an" transform={`translate(20 -162) scale(${p})`}>
    {[0, 90, 180, 270].map((r) => <path key={r} d="M2 2 Q6 2 6 7" stroke="#e8302a" strokeWidth="2.6" fill="none" transform={`rotate(${r})`} />)}</g>); }
  if (fx.includes("exclaim")) { const b = Math.max(0, Math.sin(t * 0.35)) * 4; items.push(<g key="ex" transform={`translate(0 ${-196 - b})`}>
    <rect x="-3.5" y="-16" width="7" height="14" rx="3" fill="#ffd23f" stroke="#1a1410" strokeWidth="1.5" /><circle cx="0" cy="3" r="3.5" fill="#ffd23f" stroke="#1a1410" strokeWidth="1.5" /></g>); }
  if (fx.includes("question")) { const r = Math.sin(t * 0.2) * 10; items.push(<g key="q" transform={`translate(22 -190) rotate(${r})`}>
    <text x="0" y="0" textAnchor="middle" fontSize="26" fontWeight="900" fill="#ffd23f" stroke="#1a1410" strokeWidth="1.5">?</text></g>); }
  if (fx.includes("stars")) items.push(<g key="st">{[0, 1, 2].map((i) => { const a = t * 0.15 + i * 2.1;
    return <text key={i} x={Math.cos(a) * 24} y={-170 + Math.sin(a) * 6} textAnchor="middle" fontSize="10" fill="#ffd23f">★</text>; })}</g>);
  return <g>{items}</g>;
}

export function Person({ look = {}, anim = "idle", t = 0, mouth = 0, expr, phase = 0, held, light = -1, gaze = 0, fx }) {
  // light: -1 свет слева, 1 справа; gaze: -1/1 смотрит в сторону собеседника
  const L = { ...DEF, ...look };
  const p = pose(anim, t, phase);
  // голова живёт своей жизнью: покачивается при речи, мотает «нет», кивает «да»
  const talking = mouth > 0.05 || anim === "talk";
  const headTilt = anim === "no" ? Math.sin(t * 0.55) * 11 : (talking ? Math.sin(t * 0.13 + phase) * 4 + mouth * 3 : Math.sin(t * 0.05 + phase) * 1.8);
  const headDy = anim === "yes" ? Math.abs(Math.sin(t * 0.35)) * 4 : 0;
  const blink = (t + phase * 37) % 110 < 4;
  const e = expr || (anim === "shock" ? "shock" : anim === "worried" ? "worried" : "neutral");
  const autoFx = fx || [
    ...(e === "shock" ? ["exclaim", "sweat"] : []), ...(e === "worried" ? ["sweat"] : []),
    ...(e === "sad" ? ["tears"] : []), ...(e === "angry" ? ["anger"] : []),
  ];
  const arm = (side, ang) => {
    const far = side === -light ? 0.8 : 1;  // рука в тени темнее
    return (
      <g transform={`translate(${side * 27} -104) rotate(${ang})`}>
        <rect x="-6" y="-2" width="12" height="50" rx="6" fill={shade(L.shirt, (L.coat ? 0.92 : 1) * far)} />
        <g transform="translate(0 50)" fill={shade(L.skin, far)}>
          <ellipse cx="0" cy="0" rx="6.5" ry="6" />
          <rect x="-5.5" y="2" width="3" height="7" rx="1.5" /><rect x="-1.5" y="3" width="3" height="8" rx="1.5" />
          <rect x="2.5" y="2" width="3" height="7" rx="1.5" /><ellipse cx={-6.5} cy="-1" rx="2.2" ry="3.5" transform="rotate(-30 -6.5 -1)" />
        </g>
      </g>
    );
  };
  const leg = (side, ang) => (
    <g transform={`translate(${side * 10} -56) rotate(${ang})`}>
      <rect x="-7" y="0" width="14" height="52" rx="5" fill={L.pants} />
      <ellipse cx={side * 3} cy="54" rx="10" ry="5" fill={L.shoes} />
    </g>
  );
  // телосложение: худой, полный, высокий, ребёнок
  const B = { normal: [1, 1], thin: [0.82, 1.04], fat: [1.32, 0.97], tall: [0.95, 1.14], kid: [0.9, 0.72] }[L.build] || [1, 1];
  return (
    <g>
      {L.hat !== "helmet" || !look.float ? <ellipse cx="0" cy="2" rx={34 * B[0]} ry="6" fill="#000" opacity=".28" /> : null}
      {anim === "run" && <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".55">
        {[0, 1, 2].map((i) => <line key={i} x1={-40 - i * 6} y1={-120 + i * 26} x2={-70 - i * 6 - ((t * 3 + i * 7) % 12)} y2={-120 + i * 26} />)}</g>}
      <g transform={`scale(${B[0]} ${B[1]}) translate(0 ${p.bob}) rotate(${p.lean})`}>
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
        <g transform={`translate(0 ${headDy}) rotate(${headTilt} 0 -118) translate(0 -118) scale(${1 / B[0] * (L.build === "kid" ? 1.12 : 1)} ${1 / B[1] * (L.build === "kid" ? 1.12 : 1)}) translate(0 118)`}>
        <circle cx="0" cy="-140" r="26" fill={L.skin} />
        <path d={light < 0 ? "M3 -166 A26 26 0 0 1 3 -114 A21 26 0 0 0 3 -166 Z" : "M-3 -166 A26 26 0 0 0 -3 -114 A21 26 0 0 1 -3 -166 Z"}
          fill="#000" opacity=".13" />
        <path d={light < 0 ? "M-24 -148 A26 26 0 0 1 -14 -162" : "M24 -148 A26 26 0 0 0 14 -162"} stroke="#ffd6a0" strokeWidth="2.4" fill="none" opacity=".55" strokeLinecap="round" />
        <ellipse cx="-26" cy="-137" rx="4" ry="6" fill={shade(L.skin, 0.9)} />
        <ellipse cx="26" cy="-137" rx="4" ry="6" fill={shade(L.skin, 0.9)} />
        <Hair style={L.hat && L.hairStyle !== "long" ? "none" : L.hairStyle} color={L.hair} />
        {L.mustache && <path d="M-12 -125 Q-6 -131 0 -127 Q6 -131 12 -125 Q6 -123 0 -125 Q-6 -123 -12 -125 Z" fill={L.beardColor || L.hair} />}
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
          <Face t={t} expr={e} mouth={mouth} blink={blink} look={anim === "point" ? { x: 2, y: -1 } : gaze ? { x: gaze * 1.8, y: 0 } : null} />
        )}
        {L.glasses && <g fill="none" stroke="#2a2a2a" strokeWidth="2"><circle cx="-9" cy="-138" r="8" /><circle cx="9" cy="-138" r="8" /><line x1="-1" y1="-138" x2="1" y2="-138" /></g>}
        <Hat type={L.hat} color={L.hatColor} />
        <EmotionFX fx={autoFx} t={t + phase * 10} />
        </g>
      </g>
    </g>
  );
}
