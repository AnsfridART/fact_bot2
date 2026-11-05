// v15: стиль «кибер-нуар» — тёмная палитра, неон, интерфейсы (телефон, кошелёк, чат, карта, документ…),
// шкала сверху (время / баланс / риск), субтитры одной строкой и экран выбора в финале.
// Всё рисуется в пикселях кадра 1080x1920.
import React from "react";
import { clamp, lerp, prog, easeOut, easeInOut, backOut } from "./util.js";

// палитра канала: почти чёрный, кислотно-мятный неон, янтарь (деньги/свет), красный (опасность)
export const N = {
  bg: "#06090d", panel: "#0d131a", panel2: "#141d27", line: "#1f2d3a",
  acc: "#3dffa8", pink: "#3dffa8", red: "#ff3b4f", cyan: "#4fd8ff", yellow: "#ffb020", green: "#3dffa8",
  text: "#eef6f2", dim: "#7f9590",
};

const glow = (c, r = 18) => `0 0 ${r}px ${c}, 0 0 ${r * 2.5}px ${c}55`;
const pop = (f, at = 0, len = 7) => backOut(prog(f, at, len));

// ---------- числа: «5 BTC», «$81 млн», «12 400 000 ₽» плавно перетекают ----------
const NUM = /^(.*?)(-?\d[\d\s .,]*\d|-?\d)(.*)$/;
function parseNum(v) {
  if (v === undefined || v === null) return null;
  const m = String(v).match(NUM);
  if (!m) return null;
  const raw = m[2].replace(/[\s ]/g, "");
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { pre: m[1], n: parseFloat(raw.replace(",", ".")), dec, post: m[3], spaced: /[\s ]/.test(m[2]) || Math.abs(parseFloat(raw)) >= 10000 };
}
export function fmt(n, dec = 0, spaced = true) {
  const s = Math.abs(n).toFixed(dec);
  const [i, d] = s.split(".");
  const ii = spaced ? i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : i;
  return (n < 0 ? "-" : "") + ii + (d ? "." + d : "");
}
function tweenValue(a, b, k) {
  if (a === b || k >= 1 || a === undefined) return b ?? "";  // v15.1: без лишнего пересчёта («02:47» не превращается в «2:47»)
  const pa = parseNum(a), pb = parseNum(b);
  if (!pb) return b ?? "";
  if (!pa || pa.pre !== pb.pre || pa.post !== pb.post) return b;
  return pb.pre + fmt(lerp(pa.n, pb.n, k), pb.dec, pb.spaced) + pb.post;
}

// ---------- Шкала сверху ----------
export function NoirHUD({ labels, prev, cur, f, font }) {
  if (!cur) return null;
  const k = easeOut(prog(f, 4, 22));
  const L = labels || ["КОГДА", "НА КОНУ", "ШАНС ВЫКРУТИТЬСЯ"];
  const val = (h) => (h?.chance ?? (h?.risk !== undefined ? 100 - h.risk : 100));
  const chance = lerp(val(prev || cur), val(cur), k);
  const drop = prev && val(prev) !== val(cur) ? 1 - easeOut(prog(f, 4, 16)) : 0;
  const c = chance > 60 ? N.acc : chance > 30 ? N.yellow : N.red;
  const pulse = chance <= 30 ? 0.5 + 0.5 * Math.sin(f / 3) : 1;
  const cell = (label, value, color, grow) => (
    <div style={{ flex: grow, minWidth: 0 }}>
      <div style={{ fontSize: 19, letterSpacing: 3, color: N.dim, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: String(value).length > 11 ? 30 : 36, fontWeight: 900, color, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 170, left: 40, right: 40, fontFamily: font }}>
      <div style={{ display: "flex", gap: 22, alignItems: "flex-end", padding: "0 6px 12px", borderBottom: `2px solid ${N.line}` }}>
        {cell(L[0], tweenValue(prev?.time, cur.time, k) || "—", N.text, 1)}
        {cell(L[1], tweenValue(prev?.balance, cur.balance, k) || "—", N.yellow, 1.2)}
        <div style={{ textAlign: "right", flex: 0.9 }}>
          <div style={{ fontSize: 19, letterSpacing: 3, color: N.dim, fontWeight: 700, whiteSpace: "nowrap" }}>{L[2]}</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: c, opacity: pulse, transform: `scale(${1 + 0.3 * drop})`, transformOrigin: "right", textShadow: glow(c, 8) }}>{Math.round(chance)}%</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
        {[...Array(20)].map((_, i) => <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < Math.round(chance / 5) ? c : "#1a2530", boxShadow: i < Math.round(chance / 5) ? glow(c, 5) : "none" }} />)}
      </div>
    </div>
  );
}

// ---------- Фон для экранов-интерфейсов ----------
export function UiBackdrop({ f, tone = "pink" }) {
  const c = tone === "cyan" ? N.cyan : tone === "red" ? N.red : tone === "amber" ? N.yellow : N.acc;
  return (
    <div style={{ position: "absolute", inset: 0, background: N.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -200, backgroundImage: `linear-gradient(${N.line}55 2px, transparent 2px), linear-gradient(90deg, ${N.line}55 2px, transparent 2px)`,
        backgroundSize: "90px 90px", transform: `translateY(${(f * 0.8) % 90}px) perspective(900px) rotateX(18deg)`, opacity: 0.5 }} />
      <div style={{ position: "absolute", left: "50%", top: "45%", width: 1100, height: 1100, marginLeft: -550, marginTop: -550, borderRadius: "50%",
        background: `radial-gradient(circle, ${c}33 0%, ${c}10 35%, transparent 65%)`, transform: `scale(${1 + Math.sin(f / 20) * 0.04})` }} />
    </div>
  );
}

// ---------- Телефон-рамка ----------
function Phone({ children, f, at = 0, w = 620, h = 860, top = 380 }) {
  const p = pop(f, at, 9);
  return (
    <div style={{ position: "absolute", left: (1080 - w) / 2, top, width: w, height: h, borderRadius: 64, background: "#05030a",
      border: `6px solid #2b2238`, boxShadow: `0 0 0 3px #0e0a16, 0 30px 80px rgba(0,0,0,.7), 0 0 60px ${N.acc}22`,
      transform: `translateY(${(1 - clamp(p)) * 220}px) scale(${0.9 + 0.1 * p})`, opacity: clamp(p * 1.6), overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 18, left: "50%", width: 150, height: 34, marginLeft: -75, borderRadius: 20, background: "#000" }} />
      <div style={{ position: "absolute", inset: "70px 34px 40px" }}>{children}</div>
    </div>
  );
}

// ---------- Карточки интерфейсов ----------
function Notify({ ui, f, font, top = 330, instant }) {
  const p = instant ? 1 + 0.06 * Math.sin(Math.min(1, f / 10) * Math.PI) : pop(f, 0, 8);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: top - 160 * (1 - clamp(p)), opacity: clamp(p * 2), fontFamily: font,
      background: "rgba(250,248,255,.96)", borderRadius: 34, padding: "26px 30px", display: "flex", gap: 24, alignItems: "center",
      boxShadow: "0 20px 60px rgba(0,0,0,.55)", transform: `scale(${0.92 + 0.08 * p})` }}>
      <div style={{ width: 92, height: 92, borderRadius: 24, background: ui.color || "#f7931a", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 56, fontWeight: 900, flexShrink: 0 }}>{ui.icon || "₿"}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 26, color: "#6a6475", fontWeight: 700 }}>{ui.app || "Уведомление"} · сейчас</div>
        <div style={{ fontSize: 34, color: "#17121f", fontWeight: 800 }}>{ui.title}</div>
        <div style={{ fontSize: 44, color: "#17121f", fontWeight: 900 }}>{ui.text}</div>
      </div>
    </div>
  );
}

function Wallet({ ui, f, font }) {
  const h = ui.from_label ? 860 : 700;
  const k = easeOut(prog(f, 8, Math.max(20, ui.len || 40)));
  const from = ui.from ?? 0, to = ui.to ?? 0, dec = ui.dec ?? (Math.abs(to) < 100 ? 8 : 0);
  const n = lerp(from, to, k);
  const done = k >= 1;
  return (
    <Phone f={f} h={h} top={380 + (860 - h) / 2}>
      <div style={{ fontFamily: font, color: N.text, textAlign: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 800, textAlign: "left", marginBottom: 40 }}>{ui.title || "Кошелёк"}</div>
        <div style={{ width: 150, height: 150, borderRadius: "50%", margin: "0 auto 40px", background: ui.color || "#f7931a", color: "#fff",
          fontSize: 92, fontWeight: 900, lineHeight: "150px", boxShadow: glow(ui.color || "#f7931a", 22) }}>{ui.icon || "₿"}</div>
        <div style={{ fontSize: Math.min(92, 540 / (fmt(to, dec, Math.abs(to) >= 10000).length * 0.72)), fontWeight: 900, letterSpacing: -2, color: done ? N.text : "#fff", whiteSpace: "nowrap",
          transform: `scale(${done ? 1 + 0.08 * (1 - easeOut(prog(f, 8 + (ui.len || 40), 8))) : 1})` }}>{fmt(n, dec, Math.abs(to) >= 10000)}</div>
        <div style={{ fontSize: 34, color: N.dim, fontWeight: 700, marginTop: 6 }}>{ui.unit || "BTC"}</div>
        {ui.sub ? <div style={{ fontSize: 40, color: N.green, fontWeight: 800, marginTop: 24, opacity: clamp(k * 1.5) }}>{ui.sub}</div> : null}
        {ui.from_label ? <div style={{ marginTop: 44, background: N.panel2, borderRadius: 22, padding: "22px 26px", textAlign: "left", fontSize: 28, color: N.dim }}>
          {ui.from_label}<div style={{ color: N.text, fontWeight: 800, fontSize: 32, marginTop: 6 }}>{ui.from_value}</div></div> : null}
      </div>
    </Phone>
  );
}

function Chat({ ui, f, font, dur }) {
  const msgs = ui.msgs || [];
  const step = Math.max(10, Math.floor((dur * 0.75) / Math.max(1, msgs.length)));
  return (
    <Phone f={f}>
      <div style={{ fontFamily: font, color: N.text }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 22, borderBottom: `2px solid ${N.line}`, marginBottom: 28 }}>
          <div style={{ width: 74, height: 74, borderRadius: "50%", background: N.panel2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, color: N.dim }}>{(ui.name || "?")[0]}</div>
          <div><div style={{ fontSize: 34, fontWeight: 800 }}>{ui.name || "Неизвестный"}</div><div style={{ fontSize: 24, color: N.green }}>{ui.status || "в сети"}</div>
            {ui.clue ? <div style={{ fontSize: 19, color: N.dim, marginTop: 4, fontFamily: "DejaVu Sans Mono, monospace" }}>{ui.clue}</div> : null}</div>
        </div>
        {msgs.map((m, i) => {
          const at = 6 + i * step;
          if (f < at) return null;
          const p = pop(f, at, 6);
          const me = !!m.me;
          return (
            <div key={i} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 18 }}>
              <div style={{ maxWidth: "82%", padding: "18px 24px", borderRadius: 26, fontSize: 34, fontWeight: 700, lineHeight: 1.2,
                background: me ? "#1f6b4c" : m.alert ? "#3a0f1c" : N.panel2, color: "#fff", border: m.alert ? `2px solid ${N.red}` : "none",
                transform: `scale(${clamp(p, 0, 1.2)})`, transformOrigin: me ? "right bottom" : "left bottom" }}>{m.text}</div>
            </div>
          );
        })}
      </div>
    </Phone>
  );
}

function Card({ ui, f, font }) {
  const p = pop(f, 0, 9);
  const stampAt = 14;
  const s = backOut(prog(f, stampAt, 6));
  const shake = f >= stampAt ? Math.sin(f * 2.4) * 10 * clamp(1 - (f - stampAt) / 10) : 0;
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 640, height: 520, fontFamily: font, transform: `translateX(${shake}px) rotate(${-4 + 4 * clamp(p)}deg) scale(${clamp(p, 0, 1.15)})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: `linear-gradient(135deg, ${ui.color || "#7a1430"}, #1a0a14)`, boxShadow: `0 30px 80px rgba(0,0,0,.6), 0 0 50px ${N.red}44`, padding: 46, boxSizing: "border-box", color: "#fff" }}>
        <div style={{ fontSize: 34, fontWeight: 800, opacity: 0.85 }}>{ui.bank || "БАНК"}</div>
        <div style={{ width: 110, height: 80, borderRadius: 14, background: "linear-gradient(135deg,#e9c46a,#b88a2a)", marginTop: 50 }} />
        <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: 6, marginTop: 50 }}>{ui.number || "2202 •••• •••• 4417"}</div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 14 }}>{ui.holder || "ВЛАДЕЛЕЦ КАРТЫ"}</div>
      </div>
      {f >= stampAt ? <div style={{ position: "absolute", left: "50%", top: "62%", transform: `translate(-50%,-50%) rotate(-8deg) scale(${clamp(s, 0, 1.4) * 1})`,
        background: N.red, color: "#fff", fontSize: 58, fontWeight: 900, padding: "14px 34px", borderRadius: 14, border: "5px solid #fff", whiteSpace: "nowrap", boxShadow: glow(N.red, 20) }}>{ui.status || "ЗАБЛОКИРОВАНА"}</div> : null}
    </div>
  );
}

function Doc({ ui, f, font }) {
  const p = pop(f, 0, 9);
  const stampAt = ui.stamp ? 16 : 1e9;
  const s = backOut(prog(f, stampAt, 6));
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 470, fontFamily: font, transform: `translateY(${(1 - clamp(p)) * 200}px) rotate(${1.5 - 1.5 * clamp(p)}deg)`, opacity: clamp(p * 2) }}>
      <div style={{ background: "#f3efe6", borderRadius: 14, padding: "50px 54px 70px", boxShadow: "0 30px 80px rgba(0,0,0,.6)", color: "#1a1620", position: "relative" }}>
        <div style={{ fontSize: 24, letterSpacing: 4, color: "#7a7268", fontWeight: 800, textAlign: "center" }}>{ui.head || "ДОКУМЕНТ"}</div>
        {ui.clue ? <div style={{ fontSize: 22, color: "#8a8278", textAlign: "center", marginTop: 8, fontFamily: "DejaVu Sans Mono, monospace" }}>{ui.clue}</div> : null}
        {ui.photo ? <div style={{ width: 170, height: 210, background: "#cfc8bc", borderRadius: 8, margin: "34px 0 0", float: "left", marginRight: 34 }} /> : null}
        <div style={{ fontSize: 56, fontWeight: 900, marginTop: 34, textAlign: ui.photo ? "left" : "center" }}>{ui.title}</div>
        <div style={{ fontSize: 32, lineHeight: 1.35, marginTop: 24, color: "#3a3440", textAlign: ui.photo ? "left" : "center" }}>{ui.text}</div>
        <div style={{ clear: "both" }} />
        {(ui.lines || [0, 1, 2]).map((_, i) => <div key={i} style={{ height: 14, background: "#ddd6ca", borderRadius: 7, marginTop: 22, width: `${90 - i * 18}%` }} />)}
        {f >= stampAt ? <div style={{ position: "absolute", right: 40, bottom: 40, transform: `rotate(-10deg) scale(${clamp(s, 0, 1.5)})`, border: `6px solid ${N.red}`,
          color: N.red, fontSize: 46, fontWeight: 900, padding: "8px 26px", borderRadius: 12, background: "rgba(255,255,255,.4)" }}>{ui.stamp}</div> : null}
      </div>
    </div>
  );
}

function Table({ ui, f, font, dur }) {
  const rows = ui.rows || [];
  const step = Math.max(3, Math.floor((dur * 0.5) / Math.max(1, rows.length)));
  const hiAt = 6 + rows.length * step + 4;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 440, fontFamily: font }}>
      <div style={{ fontSize: 26, letterSpacing: 4, color: N.dim, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>{ui.head || "ПЕРЕВОДЫ"}</div>
      <div style={{ background: N.panel, border: `2px solid ${N.line}`, borderRadius: 24, padding: 18 }}>
        {rows.map((r, i) => {
          if (f < 6 + i * step) return null;
          const hi = ui.hi === i && f >= hiAt;
          const p = easeOut(prog(f, 6 + i * step, 5));
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "16px 20px", borderRadius: 14, fontSize: 32, fontWeight: 700,
              fontFamily: "DejaVu Sans Mono, monospace", color: hi ? "#fff" : N.text, background: hi ? `${N.red}dd` : i % 2 ? "transparent" : "#ffffff08",
              boxShadow: hi ? glow(N.red, 14) : "none", opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>
              {r.map((c, j) => <span key={j} style={{ color: !hi && j === r.length - 1 ? N.yellow : undefined, whiteSpace: "nowrap" }}>{c}</span>)}
            </div>
          );
        })}
      </div>
      {ui.clue ? <div style={{ fontSize: 20, color: N.dim, marginTop: 12, textAlign: "right", fontFamily: "DejaVu Sans Mono, monospace" }}>{ui.clue}</div> : null}
    </div>
  );
}

function Timer({ ui, f, font }) {
  const parts = (ui.from || "00:10:00").split(":").map(Number);
  const total = parts.reduce((a, b) => a * 60 + b, 0) - Math.floor(f / 30) * (ui.speed || 1);
  const t = Math.max(0, total);
  const hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
  const str = (parts.length === 3 ? [hh, mm, ss] : [mm, ss]).map((x) => String(x).padStart(2, "0")).join(":");
  const tick = 1 - easeOut(prog(f % 30, 0, 8));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: font }}>
      <div style={{ fontSize: 34, letterSpacing: 6, color: N.dim, fontWeight: 800 }}>{ui.label || "ОСТАЛОСЬ"}</div>
      <div style={{ fontSize: 190, fontWeight: 900, color: N.red, textShadow: glow(N.red, 26), fontFamily: "DejaVu Sans Mono, monospace",
        transform: `scale(${1 + 0.04 * tick})`, marginTop: 20 }}>{str}</div>
    </div>
  );
}

function Alert({ ui, f, font }) {
  const p = pop(f, 0, 7);
  const k = easeOut(prog(f, 2, 26));
  const pb = parseNum(ui.big);
  const big = pb ? pb.pre + fmt(lerp(0, pb.n, k), pb.dec, true) + pb.post : ui.big;
  const blink = Math.floor(f / 8) % 2;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 560, textAlign: "center", fontFamily: font }}>
      <div style={{ display: "inline-block", background: N.red, color: "#fff", fontSize: 38, fontWeight: 900, padding: "14px 30px", borderRadius: 12,
        opacity: 0.75 + 0.25 * blink, transform: `scale(${clamp(p, 0, 1.3)})`, boxShadow: glow(N.red, 16) }}>{ui.title || "СРОЧНО"}</div>
      <div style={{ fontSize: Math.min(150, 1800 / Math.max(6, String(ui.big || "").length)), fontWeight: 900, color: N.red, marginTop: 60, textShadow: glow(N.red, 30), whiteSpace: "nowrap" }}>{big}</div>
      {ui.sub ? <div style={{ fontSize: 36, color: N.text, fontWeight: 700, marginTop: 24, opacity: clamp(k * 2) }}>{ui.sub}</div> : null}
    </div>
  );
}

function Chain({ ui, f, font }) {
  const n = ui.nodes || 6;
  const pts = [...Array(n)].map((_, i) => [i % 2 ? 760 : 320, 520 + i * (620 / (n - 1))]);
  const k = easeInOut(prog(f, 4, 34)) * (n - 1);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: font }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {pts.slice(1).map((p, i) => {
          const a = pts[i], t = clamp(k - i);
          return t > 0 ? <line key={i} x1={a[0]} y1={a[1]} x2={lerp(a[0], p[0], t)} y2={lerp(a[1], p[1], t)} stroke={N.red} strokeWidth="8" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${N.red})` }} /> : null;
        })}
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i <= k + 0.01 ? 22 : 14} fill={i <= k + 0.01 ? N.red : "#3a2d4a"} />)}
      </svg>
      {ui.title ? <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center", fontSize: 30, letterSpacing: 4, color: N.dim, fontWeight: 800 }}>{ui.title}</div> : null}
      {ui.label ? <div style={{ position: "absolute", left: pts[n - 1][0] + 40, top: pts[n - 1][1] - 26, fontSize: 40, fontWeight: 900, color: N.text, opacity: clamp(k - (n - 2)) }}>{ui.label}</div> : null}
      {ui.stamp && k >= n - 1.01 ? <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center" }}>
        <span style={{ background: N.red, color: "#fff", fontSize: 60, fontWeight: 900, padding: "10px 30px", borderRadius: 12, display: "inline-block",
          transform: `rotate(-6deg) scale(${clamp(backOut(prog(f, 40, 6)), 0, 1.4)})` }}>{ui.stamp}</span></div> : null}
    </div>
  );
}

function Call({ ui, f, font }) {
  const ring = (f % 24) / 24;
  return (
    <Phone f={f}>
      <div style={{ fontFamily: font, color: N.text, textAlign: "center", paddingTop: 30 }}>
        <div style={{ fontSize: 30, color: N.dim }}>{ui.sub || "Входящий видеозвонок"}</div>
        <div style={{ position: "relative", width: 230, height: 230, margin: "60px auto 30px" }}>
          <div style={{ position: "absolute", inset: -40 * ring, borderRadius: "50%", border: `4px solid ${N.green}`, opacity: 1 - ring }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: N.panel2, fontSize: 110, fontWeight: 900, lineHeight: "230px", color: N.dim }}>{(ui.name || "?")[0]}</div>
        </div>
        <div style={{ fontSize: 52, fontWeight: 900 }}>{ui.name || "Неизвестный"}</div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 110 }}>
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: N.red }} />
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: N.green, transform: `scale(${1 + 0.08 * Math.sin(f / 3)})`, boxShadow: glow(N.green, 18) }} />
        </div>
      </div>
    </Phone>
  );
}

function Form({ ui, f, font, dur }) {
  const items = ui.items || [];
  const step = Math.max(4, Math.floor((dur * 0.45) / Math.max(1, items.length)));
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: 480, fontFamily: font, background: "#f3efe6", borderRadius: 26, padding: "46px 50px",
      boxShadow: "0 30px 80px rgba(0,0,0,.6)", transform: `scale(${clamp(pop(f, 0, 8), 0, 1.1)})` }}>
      <div style={{ fontSize: 24, letterSpacing: 4, color: "#7a7268", fontWeight: 800 }}>{ui.head || "ПРОВЕРКА"}</div>
      <div style={{ fontSize: 54, fontWeight: 900, color: "#1a1620", margin: "18px 0 30px" }}>{ui.title}</div>
      {items.map((it, i) => {
        const on = f >= 8 + i * step;
        const checked = ui.ok ? on && f >= 8 + i * step + 4 : ui.check === i && f >= 8 + items.length * step + 6;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "16px 0", fontSize: 38, fontWeight: 700, color: "#2a2430", opacity: on ? 1 : 0.15 }}>
            <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: "4px solid #8a8278", background: checked ? (ui.ok ? "#1fae6a" : N.red) : "transparent", color: "#fff", fontSize: 34, lineHeight: "40px", textAlign: "center" }}>{checked ? (ui.ok ? "✓" : "✕") : ""}</div>{it}
          </div>
        );
      })}
    </div>
  );
}

// v15: разбор подсказки из части 1 — лупа наезжает на спрятанную деталь
function Reveal({ ui, f, font }) {
  const p = pop(f, 0, 8);
  const z = easeInOut(prog(f, 8, 16));
  const ring = 1 + 0.06 * Math.sin(f / 4);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: font }}>
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center", fontSize: 30, letterSpacing: 5, color: N.acc, fontWeight: 900, opacity: clamp(p * 2) }}>{ui.label || "ПОДСКАЗКА ИЗ ЧАСТИ 1"}</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 520, height: 300, borderRadius: 18, background: ui.paper ? "#f3efe6" : N.panel, border: `2px solid ${N.line}`,
        overflow: "hidden", transform: `scale(${clamp(p, 0, 1.1)})` }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 40, top: 40 + i * 64, height: 16, width: `${80 - i * 12}%`, borderRadius: 8, background: ui.paper ? "#ddd6ca" : "#1f2d3a" }} />)}
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", transform: `scale(${1 + 0.45 * z})`,
          fontFamily: "DejaVu Sans Mono, monospace", fontSize: 30, fontWeight: 800, color: ui.paper ? "#1a1620" : N.text, whiteSpace: "nowrap" }}>{ui.clue}</div>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 668, width: 820 * ring, height: 150 * ring, marginLeft: -410 * ring, marginTop: -75 * ring, borderRadius: 80,
        border: `8px solid ${N.acc}`, boxShadow: glow(N.acc, 18), opacity: z }} />
      {ui.note ? <div style={{ position: "absolute", top: 880, left: 80, right: 80, textAlign: "center", fontSize: 44, fontWeight: 900, color: N.text, lineHeight: 1.15,
        opacity: clamp(prog(f, 22, 8)) }}>{ui.note}</div> : null}
    </div>
  );
}

// v15: «реальное дело» — газетная заметка со штампом
function Case({ ui, f, font }) {
  const p = pop(f, 0, 9);
  const st = backOut(prog(f, 16, 7));
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 470, fontFamily: font, transform: `translateY(${(1 - clamp(p)) * 200}px) rotate(${-1 + clamp(p)}deg)`, opacity: clamp(p * 2) }}>
      <div style={{ background: "#ece6d8", borderRadius: 8, padding: "44px 50px 60px", boxShadow: "0 30px 80px rgba(0,0,0,.6)", color: "#1a1620", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 800, letterSpacing: 3, color: "#6a6258", borderBottom: "3px solid #1a1620", paddingBottom: 14 }}>
          <span>{ui.source || "НОВОСТИ"}</span><span>{ui.place}</span></div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.08, marginTop: 30, fontFamily: "Georgia, DejaVu Serif, serif" }}>{ui.headline}</div>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 12, background: "#d4ccbb", borderRadius: 6, marginTop: 20, width: `${95 - i * 15}%` }} />)}
        {f >= 16 ? <div style={{ position: "absolute", right: 30, bottom: -40, transform: `rotate(-9deg) scale(${clamp(st, 0, 1.5)})`, background: N.acc, color: N.bg,
          fontSize: 48, fontWeight: 900, padding: "12px 30px", borderRadius: 12, border: `5px solid ${N.bg}`, boxShadow: glow(N.acc, 16), whiteSpace: "nowrap" }}>{ui.stamp || "РЕАЛЬНОЕ ДЕЛО"}</div> : null}
      </div>
    </div>
  );
}

const UI = { reveal: Reveal, case: Case, notify: Notify, wallet: Wallet, chat: Chat, card: Card, doc: Doc, table: Table, timer: Timer, alert: Alert, chain: Chain, call: Call, form: Form };
export function UiCard({ ui, f, font, dur, instant }) {
  const C = UI[ui.type];
  if (!C) return null;
  return <C ui={ui} f={f} font={font} dur={dur} instant={instant} />;
}

// ---------- Эффекты стиля поверх кадра ----------
export function NoirFX({ f, flash = 0 }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,30,40,.35), rgba(0,8,12,.08) 40%, rgba(0,6,10,.6))", mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 6px)", opacity: 0.5 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,.75) 100%)" }} />
      {flash > 0 ? <div style={{ position: "absolute", inset: 0, background: N.acc, opacity: 0.25 * flash, mixBlendMode: "screen" }} /> : null}
    </>
  );
}

// ---------- Субтитры одной строкой: сказанное — белым, будущее — серым ----------
function chunks(words, max = 24) {
  const out = []; let c = [];
  words.forEach((w, i) => {
    const len = c.map((x) => x.w).join(" ").length + w.w.length + 1;
    if (c.length && (len > max || /[.!?…]$/.test(c[c.length - 1].w))) { out.push(c); c = []; }
    c.push({ ...w, i });
  });
  if (c.length) out.push(c);
  return out;
}
export function NoirCaptions({ seg, f, font, top = 1290, instant = false }) {
  const words = seg.words || [];
  if (!words.length) return null;
  let cur = words.findIndex((w) => f >= w.s && f < w.e);
  if (cur < 0) cur = f < words[0].s ? 0 : words.length - 1;
  const chunk = chunks(words, 20).find((ch) => ch.some((w) => w.i === cur));
  if (!chunk) return null;
  const p = instant && chunk[0].i === 0 ? 1 : easeOut(prog(f, chunk[0].s - 2, 4));
  const text = chunk.map((w) => w.w).join(" ");
  const size = Math.min(80, 1450 / Math.max(10, text.length));
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, textAlign: "center", fontFamily: font, fontWeight: 900, fontSize: size, lineHeight: 1.3,
      opacity: p, transform: `scale(${0.94 + 0.06 * p})`, textTransform: "uppercase" }}>
      {chunk.map((w, k) => {
        const on = w.i === cur;
        const wp = on ? backOut(prog(f, w.s, 4)) : 1;
        return (
          <span key={k} style={{ display: "inline-block", margin: "0 6px", padding: "0 10px", borderRadius: 10,
            background: on ? (w.key ? N.red : N.acc) : "transparent", color: on ? "#06090d" : w.key ? N.yellow : "#fff",
            transform: `scale(${on ? 0.9 + 0.1 * wp : 1}) rotate(${on ? -2 : 0}deg)`,
            WebkitTextStroke: on ? "0" : "10px #000", paintOrder: "stroke fill" }}>{w.w}</span>
        );
      })}
    </div>
  );
}

// ---------- Экран выбора ----------
export function ChoiceScreen({ seg, f, font }) {
  const opts = seg.options || [];
  const step = Math.max(8, Math.floor((seg.dur * 0.5) / Math.max(1, opts.length)));
  const end = 6 + opts.length * step;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <UiBackdrop f={f} />
      <div style={{ position: "absolute", top: 350, left: 60, right: 60, textAlign: "center", fontFamily: font, fontSize: 66, fontWeight: 900, color: N.text,
        lineHeight: 1.05, opacity: clamp(pop(f, 0, 7) * 2) }}>{seg.question || "ТВОЙ ХОД"}</div>
      {opts.map((o, i) => {
        const at = 6 + i * step;
        const p = pop(f, at, 7);
        const sel = f >= end + 10 && Math.floor((f - end - 10) / 8) % opts.length === i;  // «перебор» вариантов — как будто выбор ещё не сделан
        return f >= at ? (
          <div key={i} style={{ position: "absolute", left: 100, right: 100, top: 540 + i * 165, height: 130, borderRadius: 18, display: "flex", alignItems: "center",
            background: sel ? N.acc : N.panel, border: `3px solid ${sel ? N.acc : N.line}`, fontFamily: font, transform: `translateX(${(1 - clamp(p)) * (i % 2 ? 300 : -300)}px)`,
            boxShadow: sel ? glow(N.acc, 14) : "0 10px 30px rgba(0,0,0,.5)" }}>
            <div style={{ width: 96, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 58, fontWeight: 900,
              color: sel ? "#06090d" : N.acc, borderRight: `3px solid ${sel ? "#06090d33" : N.line}` }}>{"ABCD"[i]}</div>
            <div style={{ flex: 1, padding: "0 26px", fontSize: o.length > 16 ? 40 : 48, fontWeight: 900, color: sel ? "#06090d" : N.text }}>{o}</div>
          </div>
        ) : null;
      })}
      <div style={{ position: "absolute", top: 560 + opts.length * 165, left: 0, right: 0, textAlign: "center", fontFamily: font, fontSize: 36, fontWeight: 800,
        letterSpacing: 2, color: N.yellow, opacity: clamp(prog(f, end, 8)) }}>{seg.hint || (seg.next ? "ЧТО БУДЕТ ДАЛЬШЕ — В СЛЕДУЮЩЕМ РОЛИКЕ" : "ПИШИ БУКВУ В КОММЕНТАРИЯХ")}</div>
      {seg.clue ? <div style={{ position: "absolute", top: 680 + opts.length * 165, left: 40, right: 40, textAlign: "center", fontFamily: font, fontSize: 34, fontWeight: 900, whiteSpace: "nowrap",
        color: N.bg, opacity: clamp(prog(f, end + 6, 8)) }}><span style={{ background: N.acc, padding: "8px 22px", borderRadius: 10, boxShadow: glow(N.acc, 12) }}>ПОДСКАЗКА СПРЯТАНА В КАДРЕ. НАШЁЛ?</span></div> : null}
    </div>
  );
}
