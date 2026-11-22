import React from "react";

export function Bus({ passengers = 0, open = false, openAt, sceneProgress }) {
  const doorOpen = openAt === undefined ? open : sceneProgress >= openAt;
  return <g stroke="#282831" strokeWidth="2" strokeLinejoin="round">
    <rect x="-63" y="-66" width="126" height="55" rx="7" fill="#dbac59"/>
    <path d="M-61 -23 H61" stroke="#803d39" strokeWidth="5"/>
    {[0,1,2].map(i => <g key={i}><rect x={-57+i*27} y="-58" width="23" height="23" rx="2" fill="#abbfc4"/>
      {i < passengers && <g fill="#51473e"><circle cx={-45+i*27} cy="-48" r="5"/><path d={`M${-52+i*27} -36 q7 -14 14 0`}/></g>}</g>)}
    <rect x="27" y="-58" width="27" height="44" fill={doorOpen ? "#3b3335" : "#a8bdc0"}/>
    {!doorOpen && <path d="M41 -57 V-14"/>}
    {[-40,40].map(x=><g key={x}><circle cx={x} cy="-11" r="10" fill="#31323a"/><circle cx={x} cy="-11" r="4" fill="#b7aa94"/></g>)}
    <rect x="-16" y="-79" width="32" height="17" rx="2" fill="#f4e6c9"/>
    <text x="0" y="-66" textAnchor="middle" fontSize="14" stroke="none" fill="#252329" fontWeight="bold">7</text>
  </g>;
}

export function StopBoard({ top, bottom }) {
  return <g><path d="M0 0 V-105" stroke="#706761" strokeWidth="5"/>
    <rect x="-44" y="-122" width="88" height="48" rx="4" fill="#f4e6c9" stroke="#494344" strokeWidth="3"/>
    <text textAnchor="middle" fontFamily="DejaVu Sans" fontWeight="bold" fill="#302c31">
      <tspan x="0" y="-104" fontSize={top?.length > 11 ? 8.5 : 10}>{top}</tspan>
      <tspan x="0" y="-84" fontSize={bottom?.length > 8 ? 11 : 14}>{bottom}</tspan>
    </text></g>;
}
