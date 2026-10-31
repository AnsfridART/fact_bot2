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
    case "black":
    default:
      return <rect x="-200" y="-200" width="670" height="880" fill="#060608" />;
  }
}
