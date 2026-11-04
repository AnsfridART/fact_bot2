import React from "react";

// Фоны в координатах 270x480. Линия земли примерно на y=360.
function Sky({ top, bottom, id }) {
  return (<>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
    <rect x="-200" y="-200" width="670" height="880" fill={`url(#${id})`} />
  </>);
}

export function Background({ name, t = 0 }) {
  switch (name) {
    case "field_dusk":
      return (<g>
        <Sky top="#2b2440" bottom="#c9784a" id="g_fd" />
        <circle cx="190" cy="250" r="34" fill="#f2b56a" opacity=".85" />
        <path d="M-200 300 Q0 270 135 290 Q260 270 470 295 L470 680 L-200 680 Z" fill="#5a4a3a" />
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#9c7a3e" />
        {[...Array(40)].map((_, i) => <path key={i} d={`M${-200 + i * 17} 680 L${135 + (i - 20) * 4} 330`} stroke="#b8924a" strokeWidth="2" opacity=".5" />)}
        <path d="M-200 330 L470 330" stroke="#7d5f30" strokeWidth="3" />
      </g>);
    case "outback":
      return (<g>
        <Sky top="#d9c7a3" bottom="#e9b780" id="g_ob" />
        <path d="M-200 315 Q40 290 160 305 Q300 285 470 300 L470 680 L-200 680 Z" fill="#b4673f" />
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#c9784a" />
        {[[-20, 330], [60, 320], [230, 326], [300, 334]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="14" ry="7" fill="#6d6a3a" />)}
        {[...Array(18)].map((_, i) => <ellipse key={i} cx={-150 + i * 37} cy={380 + (i % 3) * 40} rx="6" ry="1.5" fill="#a85f38" />)}
      </g>);
    case "office":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#4a4038" />
        <rect x="-200" y="330" width="670" height="350" fill="#3a2f28" />
        <rect x="150" y="150" width="90" height="110" fill="#a9b8c0" opacity=".55" />
        <path d="M195 150 L195 260 M150 205 L240 205" stroke="#4a4038" strokeWidth="5" />
        <rect x="30" y="140" width="50" height="64" fill="#6b5236" /><rect x="35" y="145" width="40" height="54" fill="#8a7a5a" />
        <rect x="-200" y="320" width="670" height="10" fill="#2f2620" />
      </g>);
    case "night_field":
      return (<g>
        <Sky top="#0e1222" bottom="#2a3048" id="g_nf" />
        {[...Array(30)].map((_, i) => <circle key={i} cx={(i * 83) % 470 - 100} cy={(i * 47) % 260} r="0.9" fill="#fff" opacity={0.3 + 0.4 * Math.abs(Math.sin(t / 20 + i))} />)}
        <circle cx="60" cy="110" r="16" fill="#e8e4d0" opacity=".8" />
        <path d="M-200 335 L470 335 L470 680 L-200 680 Z" fill="#1d2230" />
      </g>);
    case "museum":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#5b4a3c" />
        <rect x="-200" y="330" width="670" height="350" fill="#7a5a3a" />
        {[...Array(12)].map((_, i) => <rect key={i} x={-200 + i * 60} y="330" width="58" height="350" fill={i % 2 ? "#6e5134" : "#7a5a3a"} />)}
        <rect x="-200" y="80" width="670" height="12" fill="#8a7050" />
        {[-120, 30, 180, 330].map((x, i) => <g key={i}><rect x={x} y="160" width="50" height="64" fill="#7a5a2a" /><rect x={x + 5} y="165" width="40" height="54" fill={["#3f5a3f", "#5a4a6a", "#6a5a3a", "#3a4a5a"][i]} /></g>)}
      </g>);
    case "room":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#3d3a44" />
        <rect x="-200" y="330" width="670" height="350" fill="#2e2a30" />
        <rect x="170" y="150" width="60" height="80" fill="#1f2a3a" /><path d="M200 150 L200 230 M170 190 L230 190" stroke="#3d3a44" strokeWidth="4" />
        <rect x="-200" y="200" width="670" height="2" fill="#4a4652" />
      </g>);
    case "campus":
      return (<g>
        <Sky top="#8a929a" bottom="#b9bcbc" id="g_cp" />
        <rect x="-120" y="200" width="140" height="130" fill="#7a4a3a" /><rect x="170" y="180" width="160" height="150" fill="#6e4436" />
        {[...Array(6)].map((_, i) => <rect key={i} x={-105 + (i % 3) * 40} y={215 + Math.floor(i / 3) * 50} width="20" height="30" fill="#c9c2a8" opacity=".6" />)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#5f6b4a" />
        <path d="M60 680 L120 330 L150 330 L210 680 Z" fill="#a8a294" />
        {[[40, 330], [240, 330]].map(([x, y], i) => <g key={i}><rect x={x - 4} y={y - 60} width="8" height="60" fill="#4a3a2a" /><circle cx={x} cy={y - 80} r="32" fill="#3e4a32" /></g>)}
      </g>);
    case "old_street":
      return (<g>
        <Sky top="#7a8aa0" bottom="#d8c8a8" id="g_os" />
        {[[-140, 150, "#8a6a4a"], [-60, 120, "#a07850"], [20, 160, "#7a5a3a"], [110, 130, "#9a7048"], [200, 150, "#86684a"], [290, 125, "#a07a52"]].map(([x, y, c], i) => (
          <g key={i}><rect x={x} y={y} width="80" height={340 - y} fill={c} /><path d={`M${x - 6} ${y} L${x + 40} ${y - 45} L${x + 86} ${y} Z`} fill="#5a3a2a" />
            {[0, 1].map((r) => <rect key={r} x={x + 14 + r * 32} y={y + 30} width="18" height="24" fill="#3a3040" />)}
            <path d={`M${x + 4} ${y + 80} L${x + 76} ${y + 80}`} stroke="#4a3020" strokeWidth="3" /></g>))}
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#9a9080" />
        {[...Array(24)].map((_, i) => <rect key={i} x={-200 + (i % 12) * 56 + (Math.floor(i / 12) % 2) * 28} y={360 + Math.floor(i / 12) * 40} width="50" height="34" rx="6" fill="#8a8070" />)}
      </g>);
    case "paris":
      return (<g>
        <Sky top="#2a2a50" bottom="#d8906a" id="g_pa" />
        <g fill="#2a2430">
          <path d="M120 330 L132 120 L138 120 L150 330 L142 330 Q135 260 128 330 Z" />
          <rect x="128" y="200" width="14" height="4" /><rect x="124" y="260" width="22" height="5" /><rect x="133" y="105" width="4" height="16" />
        </g>
        {[[-150, 270], [-60, 290], [200, 280], [300, 270]].map(([x, y], i) => <rect key={i} x={x} y={y} width="80" height={340 - y} fill="#3a3040" />)}
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#4a4048" />
      </g>);
    case "jungle":
      return (<g>
        <Sky top="#2e4a3a" bottom="#6a8a5a" id="g_jg" />
        {[...Array(14)].map((_, i) => <g key={i}><rect x={-180 + i * 48} y={160 + (i % 3) * 20} width="10" height="200" fill="#3a2a1a" />
          <ellipse cx={-175 + i * 48} cy={150 + (i % 3) * 20} rx="40" ry="26" fill={i % 2 ? "#2f5a32" : "#3a6a3a"} /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#3a4a2a" />
        {[...Array(20)].map((_, i) => <path key={i} d={`M${-190 + i * 34} 345 q8 -26 16 0`} fill="#4a7a3a" />)}
      </g>);
    case "sky":
      return (<g>
        <Sky top="#5aa0d8" bottom="#bde0f2" id="g_sk" />
        {[[-80, 120], [60, 200], [220, 90], [300, 260], [-150, 300]].map(([x, y], i) => (
          <g key={i} transform={`translate(${(x + t * 0.3 * ((i % 2) + 1)) % 500 - 100} ${y})`} fill="#fff" opacity=".85">
            <ellipse cx="0" cy="0" rx="34" ry="12" /><ellipse cx="18" cy="-8" rx="20" ry="12" /><ellipse cx="-16" cy="-6" rx="16" ry="10" /></g>))}
        <path d="M-200 470 L470 470 L470 680 L-200 680 Z" fill="#7a9a6a" />
        {[...Array(12)].map((_, i) => <rect key={i} x={-180 + i * 56} y="455" width="30" height="15" fill="#c9b8a0" />)}
      </g>);
    case "war":
      return (<g>
        <Sky top="#4a4a44" bottom="#8a8270" id="g_wr" />
        {[...Array(8)].map((_, i) => <circle key={i} cx={-150 + i * 80} cy={260 + (i % 3) * 15} r={30 + (i % 3) * 10} fill="#6a665a" opacity=".6" />)}
        {[[-100, 260], [80, 250], [240, 270]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="6" height="80" fill="#2a2420" /><path d={`M${x + 3} ${y} l-14 -20 M${x + 3} ${y + 20} l12 -16`} stroke="#2a2420" strokeWidth="3" /></g>)}
        <path d="M-200 335 Q0 320 135 338 Q300 320 470 335 L470 680 L-200 680 Z" fill="#5a4a36" />
        <path d="M-200 360 L470 360" stroke="#3a3024" strokeWidth="6" strokeDasharray="20 10" />
      </g>);
    case "beach_night":
      return (<g>
        <Sky top="#0c1430" bottom="#2a3a5a" id="g_bn" />
        <circle cx="200" cy="100" r="14" fill="#e8e4d0" opacity=".8" />
        <path d="M-200 300 L470 300 L470 360 L-200 360 Z" fill="#1a2a48" />
        {[...Array(6)].map((_, i) => <path key={i} d={`M${-200 + i * 120 + (t % 120)} ${330 + (i % 2) * 10} q20 -6 40 0`} stroke="#4a6a8a" strokeWidth="2" fill="none" />)}
        <path d="M-200 355 Q100 345 470 360 L470 680 L-200 680 Z" fill="#8a7a5a" />
      </g>);
    case "winter_city":
      return (<g>
        <Sky top="#1a1e2a" bottom="#4a5060" id="g_wc" />
        {[[-160, 160], [-60, 190], [40, 150], [150, 180], [250, 160]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="90" height={340 - y} fill="#3a3a44" />
          {[0, 1, 2].map((r) => <rect key={r} x={x + 12 + r * 26} y={y + 24} width="14" height="18" fill={(i + r) % 3 ? "#1a1a22" : "#6a5a30"} />)}</g>)}
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#c8ccd4" />
        {[...Array(40)].map((_, i) => <circle key={i} cx={(i * 71 + t * 0.4) % 470 - 100} cy={(i * 37 + t * 1.2) % 480} r="1.2" fill="#fff" opacity=".7" />)}
      </g>);
    case "harbor":
      return (<g>
        <Sky top="#8a9aa8" bottom="#c8c8bc" id="g_hb" />
        {[[-170, 200], [-90, 230], [220, 210], [300, 240]].map(([x, y], i) => <rect key={i} x={x} y={y} width="70" height={340 - y} fill={["#7a5a4a", "#8a6a50", "#6a5a50", "#7a6050"][i]} />)}
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#8a8478" />
        <path d="M-200 360 L470 360" stroke="#6a6458" strokeWidth="3" />
      </g>);
    case "town":
      return (<g>
        <Sky top="#6a6a70" bottom="#a8a29a" id="g_tw" />
        {[[-150, 250], [-50, 260], [170, 255], [260, 265]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="60" height={340 - y} fill="#7a6a5a" /><path d={`M${x - 6} ${y} L${x + 30} ${y - 28} L${x + 66} ${y} Z`} fill="#4a3a30" /></g>)}
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#6a6258" />
        <path d="M30 340 L60 380 L40 420 L80 470" stroke="#3a3028" strokeWidth="4" fill="none" />
      </g>);
    case "classroom":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#c8b890" />
        <rect x="-200" y="330" width="670" height="350" fill="#7a5a3a" />
        <rect x="40" y="150" width="140" height="90" fill="#2e4a3a" stroke="#6a4a2a" strokeWidth="6" />
        <path d="M60 175 L120 175 M60 195 L150 195 M60 215 L100 215" stroke="#e8e8d8" strokeWidth="2" opacity=".7" />
        <rect x="200" y="140" width="60" height="90" fill="#cfe0f0" opacity=".8" /><path d="M230 140 L230 230 M200 185 L260 185" stroke="#c8b890" strokeWidth="4" />
        <rect x="-200" y="320" width="670" height="10" fill="#5a4028" />
      </g>);
    case "london":
      return (<g>
        <Sky top="#8a8470" bottom="#b8a880" id="g_ld" />
        {[[-150, 170], [-70, 150], [10, 180], [90, 140], [170, 165], [250, 150]].map(([x, y], i) => <g key={i}>
          <rect x={x} y={y} width="72" height={300 - y} fill={["#6a5a50", "#7a6a5a", "#5e5048"][i % 3]} />
          {[0, 1].map((r) => <rect key={r} x={x + 12 + r * 30} y={y + 20} width="14" height="20" fill="#3a3430" />)}
          <rect x={x + 50} y={y - 18} width="8" height="18" fill="#4a3a30" /></g>)}
        <path d="M-200 300 L470 300 L470 340 L-200 340 Z" fill="#5a5038" />
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#4a4230" />
        {[...Array(8)].map((_, i) => <path key={i} d={`M${-180 + i * 80 + (t * 0.3) % 80} ${320 + (i % 2) * 8} q15 -4 30 0`} stroke="#6a6040" strokeWidth="2" fill="none" />)}
      </g>);
    case "forest":
      return (<g>
        <Sky top="#4a5a6a" bottom="#9aa8a0" id="g_fr" />
        {[...Array(12)].map((_, i) => { const x = -170 + i * 56, h = 150 + (i % 3) * 40; return (
          <g key={i}><rect x={x - 4} y={330 - 40} width="8" height="40" fill="#3a2a1a" />
            <path d={`M${x} ${330 - h} L${x - 30} ${330 - 30} L${x + 30} ${330 - 30} Z`} fill={i % 2 ? "#2e4a34" : "#36563a"} /></g>); })}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#4a5a3a" />
      </g>);
    case "space":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#04050c" />
        {[...Array(70)].map((_, i) => <circle key={i} cx={(i * 97) % 470 - 100} cy={(i * 61) % 560 - 40} r={i % 7 ? 0.7 : 1.4} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(t / 30 + i))} />)}
        <circle cx="135" cy="760" r="420" fill="#1e5a9a" />
        <path d="M-285 760 A420 420 0 0 1 555 760" fill="none" stroke="#7ac8ff" strokeWidth="8" opacity=".5" />
        {[[-40, 380, 90], [180, 420, 70], [60, 460, 120]].map(([x, y, r], i) => <ellipse key={i} cx={x + t * 0.05} cy={y} rx={r} ry={r * 0.35} fill="#3a8a4a" opacity=".7" />)}
        {[[0, 400], [140, 380], [250, 430]].map(([x, y], i) => <ellipse key={"c" + i} cx={(x + t * 0.15) % 470 - 100} cy={y} rx="60" ry="12" fill="#fff" opacity=".5" />)}
      </g>);
    case "station":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#c8ccd0" />
        <path d="M-200 120 L470 120 L470 340 L-200 340 Z" fill="#b0b6bc" />
        {[...Array(9)].map((_, i) => <g key={i}><rect x={-180 + i * 75} y="140" width="60" height="80" rx="4" fill="#9aa2aa" />
          <circle cx={-150 + i * 75} cy="160" r="4" fill={i % 3 ? "#3ac85a" : "#e8402a"} opacity={0.6 + 0.4 * Math.abs(Math.sin(t / 10 + i))} />
          <rect x={-170 + i * 75} y="180" width="40" height="6" fill="#6a727a" /><rect x={-170 + i * 75} y="194" width="30" height="6" fill="#6a727a" /></g>)}
        <circle cx="200" cy="260" r="34" fill="#0a0e1a" stroke="#8a929a" strokeWidth="8" /><circle cx="200" cy="300" r="30" fill="#1e5a9a" opacity=".6" />
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#9aa0a6" />
        <path d="M-200 120 L470 120" stroke="#8a929a" strokeWidth="4" />
      </g>);
    case "mission_control":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#1e2228" />
        <rect x="-60" y="90" width="390" height="150" fill="#0e1a24" stroke="#3a4450" strokeWidth="4" />
        <path d="M-40 200 Q40 120 135 170 T310 140" stroke="#3ac8ff" strokeWidth="2" fill="none" />
        <circle cx={135 + Math.sin(t / 20) * 60} cy={160 + Math.cos(t / 20) * 10} r="4" fill="#ffd23f" />
        {[...Array(6)].map((_, i) => <rect key={i} x={-40 + i * 60} y="110" width="40" height="4" fill="#3ac8ff" opacity=".4" />)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#2a2e34" />
        {[...Array(6)].map((_, i) => <g key={"d" + i}><rect x={-170 + i * 80} y="300" width="66" height="30" fill="#4a4e54" />
          <rect x={-160 + i * 80} y="282" width="46" height="20" fill="#0e1a24" /><rect x={-156 + i * 80} y="288" width={20 + (i * 7) % 18} height="3" fill="#3ac85a" /></g>)}
      </g>);
    case "noir_room":  // v15: комната ночью — неоновые жалюзи, постер, полки, диван
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#080d12" />
        <rect x="-200" y="-200" width="670" height="880" fill="#0b2a2a" opacity=".35" />
        <g transform="translate(170 120)">
          <rect x="-4" y="-4" width="98" height="150" fill="#0a0610" />
          {[...Array(11)].map((_, i) => <rect key={i} x="0" y={i * 13.5} width="90" height="8" fill="#ffb020" opacity={0.6 + 0.25 * Math.sin(t / 9 + i)} />)}
          <rect x="-30" y="-20" width="160" height="200" fill="#ffb020" opacity=".06" />
        </g>
        <g transform="translate(-40 120)"><rect width="56" height="74" rx="3" fill="#121c24" /><circle cx="28" cy="30" r="15" fill="#3dffa8" /><rect x="10" y="56" width="36" height="5" fill="#2a3a40" /></g>
        <g transform="translate(40 170)">{[0, 1].map((r) => <g key={r}><rect x="0" y={r * 40 + 30} width="90" height="4" fill="#1e2a32" />
          {[...Array(8)].map((_, i) => <rect key={i} x={4 + i * 10} y={r * 40 + 30 - 18 - (i % 3) * 4} width="7" height={18 + (i % 3) * 4} fill={["#1f3a3a", "#2a3240", "#3a2e24", "#24303a"][(i + r) % 4]} />)}</g>)}</g>
        <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill="#05080b" />
        <g transform="translate(-60 300)"><rect width="220" height="60" rx="14" fill="#16202a" /><rect x="-6" y="20" width="232" height="44" rx="12" fill="#1b2733" /><rect x="10" y="-14" width="200" height="34" rx="10" fill="#121a22" /></g>
        <ellipse cx="135" cy="372" rx="160" ry="14" fill="#ffb020" opacity=".05" />
      </g>);
    case "noir_city":  // v15: ночной город — неоновые вывески, мокрый асфальт
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#05080c" />
        {[[-150, 60, 90], [-60, 110, 80], [20, 40, 70], [90, 90, 85], [175, 30, 95], [270, 120, 80]].map(([x, y, w], i) => <g key={i}>
          <rect x={x} y={y} width={w} height={400} fill={i % 2 ? "#0b1218" : "#0e161e"} />
          {[...Array(12)].map((_, k) => <rect key={k} x={x + 8 + (k % 3) * (w / 3.4)} y={y + 14 + Math.floor(k / 3) * 30} width="10" height="14" fill={(k * 7 + i) % 5 ? "#16222c" : "#ffcf7a"} opacity=".8" />)}</g>)}
        <g transform="translate(30 150)"><rect width="70" height="22" rx="4" fill="none" stroke="#3dffa8" strokeWidth="3" opacity={0.7 + 0.3 * (Math.floor(t / 7) % 5 ? 1 : 0)} /><rect x="8" y="8" width="54" height="6" fill="#3dffa8" /></g>
        <g transform="translate(180 210)"><rect width="56" height="18" rx="4" fill="none" stroke="#ffb020" strokeWidth="3" /><rect x="8" y="6" width="40" height="6" fill="#ffb020" /></g>
        <path d="M-200 360 L470 360 L470 680 L-200 680 Z" fill="#070b0f" />
        {[...Array(6)].map((_, i) => <rect key={i} x={-150 + i * 80} y={380 + (i % 2) * 20} width="30" height="3" fill={i % 2 ? "#3dffa8" : "#ffb020"} opacity=".35" />)}
      </g>);
    case "hacker_room":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#0a0c12" />
        {[[40, 180], [120, 160], [200, 185]].map(([x, y], i) => <g key={i}>
          <rect x={x - 34} y={y} width="68" height="48" rx="3" fill="#10161e" stroke="#2a3440" strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((r) => <rect key={r} x={x - 28} y={y + 6 + r * 8} width={12 + ((r * 13 + i * 7 + Math.floor(t / 4)) % 40)} height="3" fill="#3aff7a" opacity=".75" />)}
          <circle cx={x} cy={y + 24} r="60" fill="#3aff7a" opacity=".05" /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#111418" />
        <rect x="-30" y="300" width="330" height="10" fill="#22262c" />
        {[...Array(5)].map((_, i) => <path key={"w" + i} d={`M${-160 + i * 30} 0 Q${-150 + i * 30} 200 ${-170 + i * 30} 480`} stroke="#1a1e24" strokeWidth="3" fill="none" />)}
      </g>);
    case "server_room":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#0c1018" />
        {[...Array(8)].map((_, i) => <g key={i}><rect x={-180 + i * 70} y="90" width="56" height="240" fill="#141a24" stroke="#2a3240" strokeWidth="2" />
          {[...Array(14)].map((_, j) => <circle key={j} cx={-170 + i * 70 + (j % 3) * 14} cy={105 + j * 15} r="1.8"
            fill={(i + j) % 5 ? "#3aa8ff" : "#3aff7a"} opacity={Math.abs(Math.sin(t / 5 + i * 3 + j))} />)}</g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#161c26" />
        {[...Array(10)].map((_, i) => <path key={"g" + i} d={`M${-200 + i * 70} 330 L${-260 + i * 90} 680`} stroke="#22293a" strokeWidth="2" />)}
      </g>);
    case "casino":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#2a0e14" />
        {[...Array(7)].map((_, i) => <g key={i}><rect x={-170 + i * 80} y="200" width="50" height="110" rx="6" fill="#6a1a24" stroke="#d8a830" strokeWidth="3" />
          <rect x={-162 + i * 80} y="220" width="34" height="22" fill="#f2e8c8" /><circle cx={-145 + i * 80} cy="208" r="4" fill={Math.floor(t / 8 + i) % 2 ? "#ffd23f" : "#ff5a3a"} /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#3a1218" />
        {[...Array(12)].map((_, i) => <circle key={"l" + i} cx={-170 + i * 55} cy="60" r="6" fill="#ffd23f" opacity={0.4 + 0.6 * Math.abs(Math.sin(t / 7 + i))} />)}
      </g>);
    case "prison":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#5a5850" />
        {[...Array(30)].map((_, i) => <rect key={i} x={-200 + (i % 10) * 70 + (Math.floor(i / 10) % 2) * 35} y={100 + Math.floor(i / 10) * 70} width="66" height="66" fill="none" stroke="#4a4842" strokeWidth="2" />)}
        <rect x="190" y="150" width="50" height="40" fill="#1a1e2a" /><path d="M200 150 L200 190 M215 150 L215 190 M230 150 L230 190" stroke="#3a3a3a" strokeWidth="3" />
        <path d="M-200 340 L470 340 L470 680 L-200 680 Z" fill="#46443e" />
        <rect x="-160" y="300" width="110" height="20" fill="#6a5a48" />
      </g>);
    case "cabin":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#c8c0b0" />
        {[...Array(6)].map((_, i) => <g key={i}><rect x={-160 + i * 80} y="150" width="34" height="44" rx="14" fill="#1a2238" />
          <circle cx={-143 + i * 80} cy="172" r="10" fill="#4a5a8a" opacity=".5" /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#5a4a5a" />
        {[...Array(6)].map((_, i) => <rect key={"s" + i} x={-170 + i * 80} y="270" width="50" height="70" rx="8" fill="#3a4a7a" />)}
      </g>);
    case "vault":
      return (<g>
        <rect x="-200" y="-200" width="670" height="880" fill="#3a3a3e" />
        {[...Array(48)].map((_, i) => <g key={i}><rect x={-190 + (i % 12) * 56} y={90 + Math.floor(i / 12) * 56} width="50" height="50" fill="#8a8a8e" stroke="#5a5a5e" strokeWidth="2" />
          <circle cx={-165 + (i % 12) * 56} cy={115 + Math.floor(i / 12) * 56} r="5" fill="#5a5a5e" /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#2a2a2e" />
      </g>);
    case "cemetery":
      return (<g>
        <Sky top="#1a1e2e" bottom="#4a4e5e" id="g_cm" />
        <circle cx="200" cy="110" r="18" fill="#e8e4d0" opacity=".85" />
        {[[-120, 300], [-50, 310], [30, 295], [190, 305], [260, 300]].map(([x, y], i) => <g key={i}>
          <path d={`M${x - 14} ${y + 30} L${x - 14} ${y} Q${x} ${y - 16} ${x + 14} ${y} L${x + 14} ${y + 30} Z`} fill="#6a6a72" />
          <rect x={x - 2} y={y - 4} width="4" height="16" fill="#4a4a52" /></g>)}
        <path d="M-200 330 L470 330 L470 680 L-200 680 Z" fill="#2a3428" />
      </g>);
    case "black":
    default:
      return <rect x="-200" y="-200" width="670" height="880" fill="#060608" />;
  }
}
