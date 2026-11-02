// Вся анимация кадра. Чистый React без зависимостей от Remotion,
// поэтому кадр можно отрендерить и в Remotion, и в обычном браузере для превью.
import React from "react";
import { Stage } from "./story/Stage.jsx";
import { Insert } from "./story/Inserts.jsx";
import { MapScene } from "./story/Map.jsx";

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
export function Professor({ p }) {
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

// ======================= ИСТОРИЯ =======================
const RED = "#FF4B3E";

// *слово* в тексте = красное ключевое слово
function parseWords(text) {
  return text.split(/\s+/).filter(Boolean).map((w) => ({ w: w.replace(/\*/g, ""), key: /\*/.test(w) }));
}

function chunkWords(words) {
  const chunks = [];
  let c = [];
  words.forEach((w, i) => {
    const len = c.map((x) => x.w).join(" ").length + w.w.length + 1;
    if (c.length && (c.length >= 2 || len > 13)) {
      const lastLen = c[c.length - 1].w.replace(/[^А-Яа-яЁёA-Za-z0-9]/g, "").length;
      const tail = c.length > 1 && lastLen <= 2 ? [c.pop()] : [];
      chunks.push(c);
      c = tail;
    }
    c.push({ ...w, i });
  });
  if (c.length) chunks.push(c);
  return chunks;
}

const outline = (px) => ({ WebkitTextStroke: `${px}px #000`, paintOrder: "stroke fill" });

function Captions({ seg, f, font, top = 1180 }) {
  const words = seg.words || [];
  if (!words.length) return null;
  let cur = words.findIndex((w) => f >= w.s && f < w.e);
  if (cur < 0) cur = f < words[0].s ? 0 : words.length - 1;
  const chunk = chunkWords(words).find((ch) => ch.some((w) => w.i === cur));
  if (!chunk) return null;
  const pop = backOut(prog(f, chunk[0].s, 5));
  const text = chunk.map((w) => w.w).join(" ");
  const size = Math.min(104, 880 / Math.max(5, text.length * 0.72));
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top, textAlign: "center", fontFamily: font,
      fontWeight: 900, fontSize: size, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: 1,
      transform: `scale(${0.7 + 0.3 * pop})`, opacity: clamp(pop * 2), ...outline(size * 0.16),
    }}>
      {chunk.map((w, k) => (
        <span key={k} style={{ color: w.key ? RED : w.i === cur ? GOLD : "#fff" }}>{(k ? " " : "") + w.w}</span>
      ))}
    </div>
  );
}

function Tags({ seg, f, font }) {
  const items = [];
  if (seg.tag) items.push({ text: seg.tag, bg: "rgba(10,10,14,.82)", fg: "#fff", delay: 0, border: "rgba(255,255,255,.25)" });
  if (seg.alert) items.push({ text: seg.alert, bg: RED, fg: "#fff", delay: 6, border: "rgba(255,255,255,.6)" });
  return (
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {items.map((t, i) => {
        const p = backOut(prog(f, 3 + t.delay, 6));
        return (
          <div key={i} style={{
            background: t.bg, color: t.fg, fontFamily: font, fontWeight: 800, fontSize: 40, letterSpacing: 2,
            padding: "10px 26px", borderRadius: 12, border: `2px solid ${t.border}`, textTransform: "uppercase",
            transform: `scale(${clamp(p, 0, 1.3)}) rotate(${i ? -2 : 0}deg)`, opacity: clamp(p * 2),
          }}>{t.text}</div>
        );
      })}
    </div>
  );
}

function camera(seg, f) {
  // длинная сцена делится на два «плана»: на середине резкая смена на крупный план
  if (seg.dur > 75 && f >= Math.floor(seg.dur / 2)) {
    const h = Math.floor(seg.dur / 2), f2 = f - h, t2 = f2 / Math.max(1, seg.dur - h);
    const side = seg.start % 2 ? 1 : -1;
    const kick2 = 0.08 * (1 - easeOut(prog(f2, 0, 6)));
    return { s: lerp(1.55, 1.68, t2) + kick2, x: side * 7, y: -5 + t2 * 2, r: side * 0.6 };
  }
  const t = f / Math.max(1, seg.dur);
  const kick = 0.07 * (1 - easeOut(prog(f, 0, 6))); // резкий «наезд» в начале каждой сцены
  const drift = Math.sin((seg.start + f) / 40) * 0.4;
  switch (seg.cam) {
    case "out": return { s: lerp(1.28, 1.08, t) + kick, x: 0, y: 0, r: drift };
    case "left": return { s: 1.2 + kick, x: lerp(4, -4, t), y: 0, r: drift };
    case "right": return { s: 1.2 + kick, x: lerp(-4, 4, t), y: 0, r: drift };
    case "up": return { s: 1.2 + kick, x: 0, y: lerp(4, -4, t), r: drift };
    case "shake": return { s: 1.18 + kick, x: Math.sin(f * 1.7) * 0.8, y: Math.cos(f * 2.1) * 0.8, r: Math.sin(f) * 0.6 };
    default: return { s: lerp(1.06, 1.24, t) + kick, x: 0, y: 0, r: drift };
  }
}

function HookTitle({ seg, f, font }) {
  if (!seg.title) return null;
  const lines = seg.title.split("|");
  return (
    <div style={{ position: "absolute", top: 300, left: 40, right: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((line, i) => {
        const p = 1 + 0.12 * Math.sin(Math.min(1, f / 8) * Math.PI) * (i % 2 ? -1 : 1);
        const shake = Math.sin(f * 1.8) * 6 * clamp(1 - (f - i * 4 - 6) / 10);
        return (
          <div key={i} style={{
            fontFamily: font, fontWeight: 900, fontSize: Math.min(126, 960 / Math.max(4, line.replace(/\*/g, "").length * 0.8)), lineHeight: 1.02, textAlign: "center", textTransform: "uppercase",
            transform: `scale(${clamp(p, 0, 1.4)}) translateX(${shake}px)`, opacity: clamp(p * 2), ...outline(18),
          }}>
            {parseWords(line).map((w, k) => (
              <span key={k} style={{ color: w.key ? RED : "#fff" }}>{(k ? " " : "") + w.w}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function fmtNum(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

function Counter({ seg, f, font }) {
  const c = seg.count;
  if (!c) return null;
  const start = Math.floor(seg.dur * (c.at ?? 0.12)), len = 34;
  if (f < start) return null;
  const k = easeOut(prog(f, start, len));
  const done = f >= start + len;
  const pop = done ? backOut(prog(f, start + len, 8)) : 1;
  const shake = done ? Math.sin(f * 2.3) * 7 * clamp(1 - (f - start - len) / 10) : 0;
  return (
    <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontFamily: font, fontWeight: 900,
      transform: `translateX(${shake}px) scale(${done ? 0.9 + 0.1 * pop + 0.12 * (1 - clamp((f - start - len) / 8)) : 0.9})`, ...outline(16) }}>
      <div style={{ fontSize: 180, lineHeight: 1, color: done ? RED : "#fff" }}>{fmtNum((c.from || 0) + ((c.to - (c.from || 0)) * k))}</div>
      {c.label ? <div style={{ fontSize: 74, color: GOLD, marginTop: 6 }}>{c.label}</div> : null}
    </div>
  );
}

function StoryScene({ seg, f, src, ImgComp, font }) {
  if (seg.map) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
        <MapScene seg={seg} f={f} font={font} />
        <Tags seg={seg} f={f} font={font} />
        <Counter seg={seg} f={f} font={font} />
        <Captions seg={seg} f={f} font={font} top={1400} />
      </div>
    );
  }
  if (seg.actors || seg.bg) {
    const env = seg.env || [];
    const mouth = clamp(env[Math.min(f, env.length - 1)] || 0);
    // переход в сцену: вспышка, «смаз» вбок, наезд с размытием или затемнение
    const kinds = ["whip", "zoom", "flash", "dip"];
    const tr = seg.kind === "hook" ? "none" : kinds[Math.floor(seg.start / 13) % kinds.length];
    const k = 1 - easeOut(prog(f, 0, 7));
    const dir = Math.floor(seg.start / 7) % 2 ? 1 : -1;
    const insAt = seg.insert ? Math.floor(seg.dur * (seg.insert.at ?? 0.55)) : 1e9;
    const wrap = tr === "whip" ? { transform: `translateX(${dir * 55 * k}%)`, filter: `blur(${18 * k}px)` }
      : tr === "zoom" ? { transform: `scale(${1 + 0.35 * k})`, filter: `blur(${14 * k}px)` } : {};
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
        <div style={{ position: "absolute", inset: 0, ...wrap }}>
          <Stage seg={seg} f={f} mouth={mouth} font={font} transition={tr === "dip" ? "dip" : tr === "flash" ? "flash" : "none"} />
        </div>
        {seg.insert && f >= insAt ? (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.12 * (1 - easeOut(prog(f, insAt, 6)))})` }}>
            <Insert name={seg.insert.name} tone={seg.insert.tone} f={f - insAt} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.35 * (1 - easeOut(prog(f, insAt, 4))) }} />
          </div>
        ) : null}
        <Counter seg={seg} f={f} font={font} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 700, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.45))" }} />
        {seg.kind === "hook" ? <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 900, background: "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,0))" }} /> : null}
        <Tags seg={seg} f={f} font={font} />
        <HookTitle seg={seg} f={f} font={font} />
        <Captions seg={seg} f={f} font={font} top={1400} />
      </div>
    );
  }
  const c = camera(seg, f);
  const cut = seg.dur > 75 ? Math.floor(seg.dur / 2) : -99;
  const flash = Math.max(1 - easeOut(prog(f, 0, 4)), 0.6 * (1 - easeOut(prog(f, cut, 3))) * (f >= cut ? 1 : 0));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0b0b0f" }}>
      {seg.image ? (
        <ImgComp src={src(seg.image)} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${c.s}) translate(${c.x}%, ${c.y}%) rotate(${c.r}deg)`,
        }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,.7) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 900, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.55))" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: flash * 0.6 }} />
      <Tags seg={seg} f={f} font={font} />
      <Captions seg={seg} f={f} font={font} />
    </div>
  );
}

function Punch({ seg, f, font }) {
  const lines = (seg.big || "").split("|");
  return (
    <div style={{ position: "absolute", inset: 0, background: "#050507", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
      {lines.map((line, i) => {
        const p = backOut(prog(f, 4 + i * 8, 7));
        const shake = Math.sin(f * 1.9) * 8 * clamp(1 - (f - 4 - i * 8 - 7) / 12);
        return (
          <div key={i} style={{
            fontFamily: font, fontWeight: 900, fontSize: 118, lineHeight: 1.05, textAlign: "center", padding: "0 50px",
            textTransform: "uppercase", transform: `scale(${clamp(p, 0, 1.4)}) translateX(${shake}px)`, opacity: clamp(p * 2),
          }}>
            {parseWords(line).map((w, k) => (
              <span key={k} style={{ color: w.key ? RED : "#fff" }}>{(k ? " " : "") + w.w}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function HostScene({ seg, f, frame, font }) {
  const pose = professorPose(seg, f, frame);
  const zoomOut = seg.kind === "intro" ? easeIn(prog(f, seg.dur - 7, 7)) : 0;
  const title = seg.title ? seg.title.split("|") : [];
  return (
    <div style={{ position: "absolute", inset: 0, background: NAVY, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + zoomOut * 2.2})`, transformOrigin: "50% 74%", opacity: 1 - zoomOut }}>
        <svg width="1080" height="1920" viewBox="0 0 270 480" style={{ position: "absolute", inset: 0 }}>
          <rect width="270" height="480" fill={NAVY} />
          <circle cx="135" cy="420" r="120" fill="#1D1A52" />
          <Stars frame={frame} />
          <Professor p={{ ...pose, y: pose.y + 40 }} />
        </svg>
        <div style={{ position: "absolute", top: 230, left: 50, right: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {title.map((line, i) => {
            const p = backOut(prog(f, 6 + i * 6, 7));
            return (
              <div key={i} style={{
                fontFamily: font, fontWeight: 900, fontSize: 92, lineHeight: 1.05, textAlign: "center", textTransform: "uppercase",
                transform: `scale(${clamp(p, 0, 1.3)}) rotate(${i % 2 ? 1.5 : -1.5}deg)`, opacity: clamp(p * 2), ...outline(14),
              }}>
                {parseWords(line).map((w, k) => (
                  <span key={k} style={{ color: w.key ? GOLD : "#fff" }}>{(k ? " " : "") + w.w}</span>
                ))}
              </div>
            );
          })}
        </div>
        <Captions seg={seg} f={f} font={font} top={760} />
      </div>
    </div>
  );
}

const easeIn = (t) => t * t * t;

function currentSeg(segments, frame) {
  for (const s of segments) if (frame >= s.start && frame < s.start + s.dur) return [s, frame - s.start];
  const last = segments[segments.length - 1];
  return [last, last.dur - 1];
}

export function Scene({ frame, data, src, ImgComp, font = "Montserrat, DejaVu Sans, Arial" }) {
  const segs = data.segments || [];
  if (!segs.length) return <div style={{ width: 1080, height: 1920, background: "#000" }} />;
  const [seg, f] = currentSeg(segs, frame);
  let body;
  if (seg.kind === "loop" && segs[0] && segs[0].kind === "hook") {
    // финальная фраза звучит на кадре начала ролика: при повторе всё сходится в одно предложение
    body = <StoryScene seg={{ ...segs[0], start: seg.start, dur: seg.dur, words: seg.words, env: seg.env }} f={Math.min(f, 6)} src={src} ImgComp={ImgComp} font={font} />;
  } else if (seg.kind === "intro" || seg.kind === "outro") body = <HostScene seg={seg} f={f} frame={frame} font={font} />;
  else if (seg.kind === "punch") body = <Punch seg={seg} f={f} font={font} />;
  else body = <StoryScene seg={seg} f={f} src={src} ImgComp={ImgComp} font={font} />;  // scene и hook
  const total = data.totalFrames || 0;
  const loopLen = 14;
  const first = segs[0];
  const hasLoopSeg = segs.some((x) => x.kind === "loop");
  const loop = !hasLoopSeg && total && frame >= total - loopLen && first && first.kind === "hook" ? easeOut(prog(frame, total - loopLen, loopLen)) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920, overflow: "hidden", background: "#000" }}>
      {body}
      {loop > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: loop }}>
          <StoryScene seg={first} f={0} src={src} ImgComp={ImgComp} font={font} />
        </div>
      ) : null}
    </div>
  );
}

// Обложка ролика: кадр из начала истории, плашка «ИСТОРИЯ #N», крупный заголовок.
export function Cover({ data, font = "Montserrat, DejaVu Sans, Arial" }) {
  const seg = (data.segments || [])[0];
  if (!seg) return <div style={{ width: 1080, height: 1920, background: "#000" }} />;
  const lines = (seg.title || "").split("|").filter(Boolean);
  const shot = { ...seg, kind: "scene", focus: undefined, alert: undefined, tag: undefined, cam: "in", camY: (seg.camY ?? 305) - 50 };
  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920, overflow: "hidden", background: "#000" }}>
      <Stage seg={shot} f={30} mouth={0} transition="none" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.62) 34%, rgba(0,0,0,0) 62%)" }} />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ background: GOLD, color: NAVY, fontFamily: font, fontWeight: 900, fontSize: 46, padding: "10px 30px", borderRadius: 14, letterSpacing: 2 }}>
          ИСТОРИЯ #{data.coverNumber || 1}
        </span>
      </div>
      <div style={{ position: "absolute", top: 440, left: 50, right: 50, textAlign: "center", fontFamily: font, fontWeight: 900,
        textTransform: "uppercase", lineHeight: 1.02, ...outline(18) }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: Math.min(124, 960 / Math.max(4, line.replace(/\*/g, "").length * 0.72)) }}>
            {parseWords(line).map((w, k) => <span key={k} style={{ color: w.key ? RED : "#fff" }}>{(k ? " " : "") + w.w}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
