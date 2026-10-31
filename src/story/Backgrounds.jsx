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
    case "black":
    default:
      return <rect x="-200" y="-200" width="670" height="880" fill="#060608" />;
  }
}
