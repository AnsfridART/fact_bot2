// Вся анимация кадра. Чистый React без зависимостей от Remotion,
// поэтому кадр можно отрендерить и в Remotion, и в обычном браузере для превью.
import React from "react";

const S = 4; // сцена рисуется в координатах 270x480, а выводится в 1080x1920
const GOLD = "#F2B84B";
const NAVY = "#14123A";

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (f, start, len) => clamp((f - start) / len);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const backOut = (t) => {
  const c1 = 2.2, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function currentSegment(segments, frame) {
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (frame >= s.start && frame < s.start + s.dur) return { seg: s, i, f: frame - s.start };
  }
  const last = segments[segments.length - 1];
  return { seg: last, i: segments.length - 1, f: last ? last.dur - 1 : 0 };
}

function Stars({ frame }) {
  const stars = [];
  for (let i = 0; i < 40; i++) {
    const x = (i * 97.3) % 270;
    const y = (i * 53.7 + (i % 7) * 31) % 480;
    const o = 0.15 + 0.45 * Math.abs(Math.sin(frame / 25 + i * 1.7));
    stars.push(<circle key={i} cx={x} cy={(y + frame * 0.05 * ((i % 3) + 1)) % 480} r={i % 5 === 0 ? 1.3 : 0.8} fill="#fff" opacity={o} />);
  }
  return <g>{stars}</g>;
}

// ---------- Профессор ----------
function Professor({ p }) {
  const eyeRy = 3.5 * p.eyeScale * (p.blink ? 0.12 : 1);
  const mouthRy = p.mouthO ? 9 : 1 + 7 * p.mouth;
  const mouthRx = p.mouthO ? 9 : 8 + 2 * p.mouth;
  return (
    <g transform={`translate(${p.x} ${p.y}) translate(135 355) scale(${p.scale}) translate(-135 -355)`}>
      <g transform={`rotate(${p.tilt} 135 440) translate(0 ${p.bob})`}>
        {/* тело в халате */}
        <path d="M66 490 Q70 425 135 417 Q200 425 204 490 Z" fill="#F4F4F2" />
        <path d="M66 490 Q70 425 135 417 L135 490 Z" fill="#E6E6E2" />
        <path d="M117 420 L135 452 L153 420 Z" fill="#3B4A8C" />
        <path d="M126 428 L135 437 L144 428 L135 433 Z" fill="#C0392B" />
        <rect x="150" y="452" width="22" height="16" rx="3" fill="#E1E1DC" />
        <line x1="156" y1="452" x2="156" y2="444" stroke="#3B4A8C" strokeWidth="2.5" />
        {/* рука с указкой */}
        <g transform={`rotate(${p.arm} 190 440)`}>
          <path d="M188 442 Q214 424 222 397" stroke="#F4F4F2" strokeWidth="15" strokeLinecap="round" fill="none" />
          <line x1="223" y1="392" x2="250" y2="300" stroke="#8B5A2B" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="250" cy="300" r="2.6" fill="#C0392B" />
          <circle cx="223" cy="393" r="7.5" fill="#F2C9A0" />
        </g>
        {/* голова */}
        <ellipse cx="135" cy="355" rx="36" ry="42" fill="#F2C9A0" />
        <ellipse cx="99" cy="358" rx="6" ry="9" fill="#E8B48A" />
        <ellipse cx="171" cy="358" rx="6" ry="9" fill="#E8B48A" />
        <ellipse cx="135" cy="318" rx="22" ry="5" fill="#F7D6B2" opacity=".6" />
        <path d="M99 348 Q93 316 113 309 Q103 330 108 348 Z" fill="#D9D9D9" />
        <path d="M171 348 Q177 316 157 309 Q167 330 162 348 Z" fill="#D9D9D9" />
        {/* борода и рот */}
        <path d="M99 368 Q98 424 135 432 Q172 424 171 368 Q160 388 135 388 Q110 388 99 368 Z" fill="#EDEDED" />
        <ellipse cx="135" cy="393" rx={mouthRx} ry={mouthRy} fill="#5A2A2A" />
        {p.mouth > 0.5 && !p.mouthO ? <ellipse cx="135" cy={393 + mouthRy * 0.45} rx={mouthRx * 0.55} ry={mouthRy * 0.35} fill="#C96464" /> : null}
        <path d="M112 383 Q124 374 135 380 Q146 374 158 383 Q146 387 135 385 Q124 387 112 383 Z" fill="#DCDCDC" />
        <path d="M131 360 Q135 372 139 360" stroke="#D8A07A" strokeWidth="2" fill="none" />
        {/* брови */}
        <g transform={`translate(0 ${-p.browUp})`}>
          <path d={`M111 ${334 - p.browTiltL} Q120 328 128 333`} stroke="#BDBDBD" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d={`M142 333 Q150 328 159 ${334 - p.browTiltR}`} stroke="#BDBDBD" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
        {/* глаза */}
        {p.laugh ? (
          <g stroke="#2B2B2B" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M115 352 Q121 345 127 352" /><path d="M143 352 Q149 345 155 352" />
          </g>
        ) : (
          <g>
            <ellipse cx="121" cy="350" rx={7.5 * p.eyeScale} ry={eyeRy * 2.1} fill="#fff" />
            <ellipse cx="149" cy="350" rx={7.5 * p.eyeScale} ry={eyeRy * 2.1} fill="#fff" />
            <ellipse cx={121 + p.px} cy={350 + p.py} rx={3.5 * p.eyeScale} ry={eyeRy} fill="#2B2B2B" />
            <ellipse cx={149 + p.px} cy={350 + p.py} rx={3.5 * p.eyeScale} ry={eyeRy} fill="#2B2B2B" />
          </g>
        )}
        <circle cx="121" cy="350" r="11" fill="none" stroke="#3A3A3A" strokeWidth="2.5" />
        <circle cx="149" cy="350" r="11" fill="none" stroke="#3A3A3A" strokeWidth="2.5" />
        <line x1="132" y1="350" x2="138" y2="350" stroke="#3A3A3A" strokeWidth="2.5" />
        <line x1="110" y1="348" x2="102" y2="345" stroke="#3A3A3A" strokeWidth="2" />
        <line x1="160" y1="348" x2="168" y2="345" stroke="#3A3A3A" strokeWidth="2" />
      </g>
    </g>
  );
}

function professorPose(seg, f, frame) {
  const env = seg.env || [];
  const mouth = clamp(env[Math.min(f, env.length - 1)] || 0);
  const d = seg.dur;
  const emo = seg.emotion || "talk";
  const p = {
    x: 0, y: 0, scale: 1, tilt: Math.sin(frame / 9) * 2 + mouth * 2, bob: Math.sin(frame / 7) * 1.5 - mouth * 2,
    arm: 48 + Math.sin(frame / 6) * 6 * mouth, mouth, mouthO: false,
    browUp: mouth * 2, browTiltL: 0, browTiltR: 0, eyeScale: 1,
    px: Math.sin(frame / 40) * 1.5, py: Math.cos(frame / 55) * 0.8,
    blink: frame % 95 < 4, laugh: false,
  };
  if (emo === "enter") {
    const t = backOut(prog(f, 0, 14));
    p.x = lerp(170, 0, t);
    p.bob += f < 14 ? Math.abs(Math.sin(f / 2)) * -6 : 0;
    p.tilt += f < 14 ? -6 : 0;
    const shock = prog(f, 14, 6);
    p.browUp += 6 * shock; p.eyeScale = 1 + 0.4 * shock;
  }
  if (emo === "point" || emo === "shock" || emo === "think") {
    const up = backOut(prog(f, 2, 8)) * (1 - easeOut(prog(f, d * 0.45, 10)));
    p.arm = lerp(p.arm, -38, up);
    p.px = lerp(p.px, -2.5, up); p.py = lerp(p.py, -2.5, up);
  }
  if (emo === "think") {
    p.browTiltR = 5; p.px = 3; p.py = -3;
  }
  if (emo === "laugh") {
    p.laugh = true; p.bob += Math.sin(frame / 2.2) * 2.5; p.tilt += Math.sin(frame / 3) * 3;
  }
  if (emo === "shock" || seg.big) {
    const at = Math.floor(d * (seg.bigAt || 0.5));
    const z = backOut(prog(f, at - 3, 8)) * (1 - easeOut(prog(f, d - 10, 10)));
    p.scale = 1 + 0.42 * z; p.y = -14 * z;
    p.browUp += 7 * z; p.eyeScale = lerp(p.eyeScale, 1.45, z);
    if (z > 0.5 && f < at + 12) p.mouthO = true;
    p.tilt += Math.sin(f * 1.3) * 4 * clamp(1 - Math.abs(f - at - 4) / 8);
  }
  if (emo === "wave") {
    p.arm = -25 + Math.sin(frame / 3) * 22;
    p.mouth = Math.max(p.mouth, 0);
  }
  return p;
}

// ---------- Субтитры (по 3 слова, текущее слово подсвечено) ----------
function Subtitles({ seg, f, font }) {
  const words = seg.words || [];
  if (!words.length) return null;
  let cur = words.findIndex((w) => f >= w.s && f < w.e);
  if (cur < 0) cur = f < words[0].s ? 0 : words.length - 1;
  // делим на куски: до 3 слов и не длиннее ~16 символов
  const chunks = [];
  let c = [];
  words.forEach((w, i) => {
    const len = c.map((x) => x.w).join(" ").length + w.w.length + 1;
    if (c.length && (c.length >= 3 || len > 16)) {
      // короткие предлоги («в», «на», «до») не оставляем в конце строки
      const tail = c.length > 1 && c[c.length - 1].w.replace(/[^А-Яа-яЁёA-Za-z]/g, "").length <= 2 ? [c.pop()] : [];
      chunks.push(c);
      c = tail;
    }
    c.push({ ...w, i });
  });
  if (c.length) chunks.push(c);
  const chunk = chunks.find((ch) => ch.some((w) => w.i === cur)) || chunks[0];
  const start = chunk[0].i;
  const chunkStart = chunk[0].s;
  const pop = backOut(prog(f, chunkStart, 6));
  const text = chunk.map((w) => w.w).join(" ");
  const size = Math.min(20, 240 / Math.max(6, text.length * 0.74));
  return (
    <g transform={`translate(135 ${268}) scale(${0.6 + 0.4 * pop}) translate(-135 -268)`} opacity={clamp(pop * 1.5)}>
      <text x="135" y="268" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize={size}
        stroke={NAVY} strokeWidth={size * 0.28} strokeLinejoin="round" paintOrder="stroke" style={{ textTransform: "uppercase" }}>
        {chunk.map((w, i) => (
          <tspan key={i} fill={start + i === cur ? GOLD : "#fff"}>{(i ? " " : "") + w.w}</tspan>
        ))}
      </text>
    </g>
  );
}

function Badge({ seg, f, font }) {
  if (!seg.big) return null;
  const at = Math.floor(seg.dur * (seg.bigAt || 0.5));
  const t = backOut(prog(f, at, 7)) * (1 - easeOut(prog(f, seg.dur - 8, 8)));
  if (t <= 0.01) return null;
  const shake = Math.sin(f * 1.6) * 6 * clamp(1 - (f - at - 7) / 10);
  const w = Math.max(80, seg.big.length * 11 + 28);
  return (
    <g transform={`translate(${248 - w / 2} 206) rotate(${-6 + shake}) scale(${t})`}>
      <rect x={-w / 2} y="-22" width={w} height="44" rx="10" fill="#E8453C" stroke="#fff" strokeWidth="2.5" />
      <text x="0" y="9" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="21" fill="#fff">{seg.big}</text>
    </g>
  );
}

function Header({ seg, frame, total, font }) {
  const label = seg.kind === "fact" ? `ФАКТ ${seg.index}/${seg.total}` : seg.kind === "hook" ? "ЗНАЛ ЛИ ТЫ?" : "А ТЕПЕРЬ ТЫ";
  return (
    <g>
      <rect x="16" y="16" width="238" height="6" rx="3" fill="#2E2A6B" />
      <rect x="16" y="16" width={Math.max(6, 238 * (frame / Math.max(1, total)))} height="6" rx="3" fill={GOLD} />
      <rect x="16" y="32" width={label.length * 7.4 + 22} height="22" rx="11" fill={GOLD} />
      <text x={16 + (label.length * 7.4 + 22) / 2} y="47" textAnchor="middle" fontFamily={font} fontWeight="800" fontSize="11" fill={NAVY}>{label}</text>
    </g>
  );
}

// ---------- Карточка с картинкой (HTML-слой, чтобы Remotion дождался загрузки) ----------
function Card({ seg, f, src, ImgComp, font }) {
  if (!seg.image) return null;
  const inT = backOut(prog(f, 0, 12));
  const outT = easeOut(prog(f, seg.dur - 8, 8));
  const zoom = 1 + 0.15 * (f / seg.dur);
  const panX = Math.sin(seg.start) * 3 * (f / seg.dur);
  const x = 16 * S, y = 66 * S, w = 238 * S, h = 170 * S;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 14 * S, overflow: "hidden",
      border: `${2 * S}px solid ${GOLD}`, boxSizing: "border-box", background: "#0B0A24",
      transform: `translateX(${-outT * 1300}px) rotate(${lerp(-8, 0, inT) - outT * 10}deg) scale(${Math.max(0, inT)})`,
    }}>
      <ImgComp src={src(seg.image)} style={{
        width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${zoom}) translateX(${panX}%)`,
      }} />
      {seg.credit ? (
        <div style={{ position: "absolute", right: 10 * S, bottom: 6 * S, fontFamily: font, fontSize: 9 * S, color: "rgba(255,255,255,.75)", textShadow: "0 0 8px #000" }}>{seg.credit}</div>
      ) : null}
    </div>
  );
}

function Hook({ seg, f, font }) {
  if (seg.kind !== "hook") return null;
  const t = backOut(prog(f, 12, 8));
  if (t <= 0) return null;
  return (
    <g transform={`translate(200 318) rotate(${12 + Math.sin(f / 3) * 6}) scale(${t})`}>
      <text x="0" y="0" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="44" fill={GOLD} stroke={NAVY} strokeWidth="5" paintOrder="stroke">?!</text>
    </g>
  );
}

export function Scene({ frame, data, src, ImgComp, font = "Montserrat, DejaVu Sans, Arial" }) {
  const segs = data.segments || [];
  if (!segs.length) return <div style={{ width: 1080, height: 1920, background: NAVY }} />;
  const { seg, f } = currentSegment(segs, frame);
  const pose = professorPose(seg, f, frame);
  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920, background: NAVY, overflow: "hidden" }}>
      <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
        <rect width="270" height="480" fill={NAVY} />
        <circle cx="135" cy="420" r="120" fill="#1D1A52" />
        <Stars frame={frame} />
        <Header seg={seg} frame={frame} total={data.totalFrames} font={font} />
      </svg>
      <Card seg={seg} f={f} src={src} ImgComp={ImgComp} font={font} />
      <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
        <Professor p={pose} />
        <Hook seg={seg} f={f} font={font} />
        <Badge seg={seg} f={f} font={font} />
        <Subtitles seg={seg} f={f} font={font} />
      </svg>
    </div>
  );
}
