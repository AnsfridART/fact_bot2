import React from "react";
import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import platform from "./platform.webp";
import salon from "./salon.webp";

const outline = "#241c22";
const mix = (a,b,t) => a+(b-a)*t;
const unit = n => Math.max(0,Math.min(1,n));
function ease(t,a,b) {
  const u=unit((t-a)/(b-a));
  return u*u*(3-2*u);
}
function blend(a,b,k) { return [mix(a[0],b[0],k),mix(a[1],b[1],k)]; }

// Each key is a shoe resting on a physical surface. Only the swinging shoe lifts.
function foot(t, initial, steps) {
  let p=initial;
  for (const [start,end,x,y,lift] of steps) {
    if (t<start) break;
    const k=ease(t,start,end);
    p=[mix(p[0],x,k),mix(p[1],y,k)-lift*Math.sin(k*Math.PI)];
    if (t<end) break;
  }
  return p;
}
function joint(a,b,l1,l2,side) {
  const dx=b[0]-a[0],dy=b[1]-a[1],distance=Math.max(.01,Math.hypot(dx,dy));
  const d=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.01,distance));
  const length=(l1*l1-l2*l2+d*d)/(2*d);
  const height=Math.sqrt(Math.max(0,l1*l1-length*length));
  return [a[0]+(dx*length-side*dy*height)/distance,a[1]+(dy*length+side*dx*height)/distance];
}
function Limb({start,end,lengths,bend,weight,shade}) {
  const j=joint(start,end,...lengths,bend);
  const path=`M${start} L${j} L${end}`;
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} stroke={outline} strokeWidth={weight+1.6}/>
    <path d={path} stroke={shade} strokeWidth={weight}/>
  </g>;
}
function Shoe({p,far=false}) {
  return <g transform={`translate(${p})`} stroke={outline} strokeWidth="1.5" strokeLinejoin="round">
    <path d="M-6 -11 Q-3 -15 2 -11 L5 -6 Q14 -5 15 -1 Q14 1 8 1 H-7 Z" fill={far?"#553334":"#9a5241"}/>
    <path d="M-6 0 H14" fill="none"/><path d="M-2 -10 l4 2" stroke="#e1a077" strokeWidth="1.3"/>
  </g>;
}
function Hand({p,grip=false}) {
  return <g transform={`translate(${p})`} fill="#ffdfb9" stroke={outline} strokeWidth="1.5">
    {grip?<><path d="M-4 3q-4-1-2-6l3-3q3-2 4 1 3-2 5 1 2 3-1 6l-4 3z"/><path d="M0 -4l3 3m0-4 2 2" fill="none" strokeWidth="1"/></>
      :<path d="M-5 3q-3-3 0-6l3-2q1-4 3-3 2 1 0 4 7-3 7 0-2 3-6 6-2 3-7 1z"/>}
  </g>;
}

function Face({nina,t,gaze=0,smile=0,tilt=0}) {
  const phase = nina ? 0 : 1.33;
  const blink = Math.pow(Math.max(0,Math.cos((t+phase)*1.94)),120);
  const brow = 2.6*smile;
  const surprised = nina ? ease(t,.98,1.25)*(1-ease(t,1.62,2.08)) : 0;
  return <g transform={`rotate(${tilt} 0 4)`} stroke={outline} strokeLinejoin="round" strokeLinecap="round">
    {nina && <><ellipse cx="-32" cy="-15" rx="12" ry="13" fill="#613736" strokeWidth="2.2"/>
      <path d="M-39 -19q4-7 9-7" fill="none" stroke="#a65b45" strokeWidth="2"/></>}
    <path d="M-32 -7 Q-35 -33 -9 -38 Q20 -44 32 -21 Q40 -6 35 13 Q30 32 9 35 Q-15 38 -27 22 Q-35 12 -32 -7Z" fill="url(#rs-face)" strokeWidth="2.5"/>
    <path d="M-32 -9 Q-39 -8 -36 1 Q-33 8 -26 7" fill="#efb994" strokeWidth="1.6"/>
    {nina ? <>
      <path d="M-31 -4 Q-35 -34 -10 -40 Q13 -45 27 -30 L31 -23 Q17 -27 7 -18 Q-8 -8 -22 -12 L-26 1Z" fill="#62372f" strokeWidth="1.8"/>
      <path d="M-33 -19 Q-31 -45 -7 -45 Q16 -47 27 -35 L29 -29 Q4 -38 -15 -23 L-29 -9Z" fill="url(#rs-scarf)" strokeWidth="1.8"/>
      <path d="M-30 -20q-11-6-14 0l13 7-11 7q-2 2 1 4l15-10" fill="#ca653a" strokeWidth="1.4"/>
      <path d="M-25 -29q10-12 24-12" fill="none" stroke="#ffcc88" strokeWidth="2"/>
    </> : <>
      <path d="M-32 -4 Q-41 -20 -29 -32 L-33 -36 -18 -37 Q-6 -46 11 -39 L20 -42 18 -36 Q34 -35 36 -19 Q27 -24 19 -18 L22 -26 Q14 -19 2 -18 L6 -25 Q-10 -14 -24 -17 L-27 2Z" fill="#483532" strokeWidth="2"/>
      <path d="M-22 -31q11-7 22-6m0 3 10-2" fill="none" stroke="#8a5c4c" strokeWidth="1.8"/>
    </>}
    {[[1,0,8],[23,-2,6.5]].map(([x,y,r],i)=><g key={i}>
      <path d={`M${x-r} ${y-12-brow}q${r-1} ${-3-brow} ${r*1.7} ${-1+brow}`} fill="none" strokeWidth={nina?2.4:3}/>
      <g transform={`translate(${x} ${y}) scale(1 ${1-.94*blink})`}>
        <ellipse rx={r} ry={(nina?8:7.5)+surprised*1.6} fill="#fff9e9" strokeWidth="1.6"/>
        <ellipse cx={1.5+gaze*1.8} cy="1" rx="2.9" ry="3.6" fill={outline} stroke="none"/>
        <circle cx={2.2+gaze*1.8} cy="-.4" r=".88" fill="white" stroke="none"/>
      </g></g>)}
    <path d="M15 5q0 4 4 5l-3 1" fill="none" strokeWidth="1.2" stroke="#ab715c"/>
    {surprised>.4 ? <ellipse cx="14" cy="20" rx="3.6" ry={2+2*surprised} fill="#874d4b" strokeWidth="1.6"/>
      : smile>.54 ? <path d="M2 17q9 4 20-2-3 12-12 9-5-1-8-7z" fill="#fff2d6" strokeWidth="1.7"/>
      : <path d={`M3 19 Q12 ${20+4*smile} 21 ${18-3*smile}`} fill="none" strokeWidth="2"/>}
    {nina && <><ellipse cx="-7" cy="12" rx="6" ry="2.6" fill="#d68a73" opacity=".48" stroke="none"/>
      <circle cx="-29" cy="6" r="2.4" fill="#e0a946" strokeWidth="1"/></>}
  </g>;
}

function Character({nina=false,t,hip,feet,leftHand,rightHand,grip=false,lean=0,gaze=0,smile=0,tilt=0,seated=false}) {
  const [x,y]=hip;
  const breathing=1.1*Math.sin(t*2.8+(nina?1:0));
  const upperX=x+lean, upperY=y+breathing;
  const lSh=[upperX-11,upperY-48], rSh=[upperX+13,upperY-47];
  return <g>
    {feet.map((p,i)=><g key={i}><Limb start={[x+(i?7:-7),y-1]} end={[p[0],p[1]-9]} lengths={seated?[33,43]:[38,39]} bend={-1} weight={i?5.8:5.3} shade={i?"#453a40":"#292f34"}/>
      <Shoe p={p} far={!i}/></g>)}
    <Limb start={lSh} end={leftHand} lengths={[29,34]} bend={1} weight={4.7} shade="#423336"/>
    <Hand p={leftHand}/>
    <g transform={`translate(${upperX} ${upperY}) rotate(${lean*.55})`} stroke={outline} strokeLinejoin="round">
      <path d="M-11 -53 Q0 -58 13 -51 L19 -42 L15 -28 L18 1 Q2 6 -17 2 L-15 -35 L-20 -39Z" fill={nina?"url(#rs-coat)":"url(#rs-jacket)"} strokeWidth="2.2"/>
      {nina?<><path d="M-11 -52l10 10 12-10 -8-4z" fill="#eca05d" strokeWidth="1.3"/><path d="M-2 -44v42m8-21h8l-1 8H5" fill="none" stroke="#205557" strokeWidth="1.4"/><path d="M-14 -2q13 3 28-1" fill="none" stroke="#88b5a5"/></>
        :<><path d="M-9 -53l8 11 10-12" fill="#e8d8aa" strokeWidth="1.2"/><path d="M12 -48L-14 -7" stroke="#483a31" strokeWidth="5"/><rect x="-21" y="-17" width="18" height="15" rx="3" fill="#755440" strokeWidth="1.2"/></>}
      <path d="M-5 -56v5q5 6 10-1v-7" fill="#efbe98" strokeWidth="1.4"/>
      <g transform="translate(-2 -86)"><Face nina={nina} t={t} gaze={gaze} smile={smile} tilt={tilt}/></g>
    </g>
    <Limb start={rSh} end={rightHand} lengths={[32,34]} bend={1} weight={5.2} shade="#544044"/>
    <Hand p={rightHand} grip={grip}/>
  </g>;
}

function Doors({amount}) {
  // A pair of folding leaves hinged to the jambs. The stairwell is visible through the gap.
  return <g>{[-1,1].map(side=>[0,1].map(index=>{
    const edge=side<0?222:323;
    const width=mix(25.5,2.3,amount);
    const ax=edge-side*width*index,bx=edge-side*width*(index+1);
    const top=x=>133-(x-222)*.22, base=x=>433+(x-222)*.13;
    const min=Math.min(ax,bx),max=Math.max(ax,bx),margin=Math.min(2.5,width*.14);
    const points=(l,r,upper,lower)=>`${l},${upper(l)} ${r},${upper(r)} ${r},${lower(r)} ${l},${lower(l)}`;
    return <g key={side*3+index}>
      <polygon points={points(min,max,top,base)} fill={index?"#597477":"#8a9c95"} stroke="#293d40" strokeWidth="1.4"/>
      <polygon points={points(min+margin,max-margin,x=>top(x)+12,x=>mix(top(x),base(x),.69))} fill={index?"#4b625f":"#5e7b77"} stroke="#394d4c" strokeWidth="1"/>
      <polygon points={points(min+margin,max-margin,x=>top(x)+24,x=>top(x)+38)} fill="#d4d8b3" opacity=".32"/>
      <path d={`M${min+margin} ${base(min)-12}L${max-margin} ${base(max)-12}`} stroke="#bed1c1" strokeWidth="1.3"/>
    </g>;
  }))}</g>;
}
function Gradients(){
  return <defs>
    <linearGradient id="rs-face" x2=".8" y2="1"><stop stopColor="#fff2cb"/><stop offset=".68" stopColor="#ffdfb8"/><stop offset="1" stopColor="#e9b396"/></linearGradient>
    <linearGradient id="rs-scarf" x2=".8" y2="1"><stop stopColor="#ffc27a"/><stop offset="1" stopColor="#cf6337"/></linearGradient>
    <linearGradient id="rs-coat" x2="1" y2="1"><stop stopColor="#539c88"/><stop offset="1" stopColor="#27605a"/></linearGradient>
    <linearGradient id="rs-jacket" x2="1" y2="1"><stop stopColor="#d08252"/><stop offset="1" stopColor="#a04f38"/></linearGradient>
    <linearGradient id="rs-sun"><stop stopColor="#ffcb75" stopOpacity="0"/><stop offset=".55" stopColor="#ffce7c" stopOpacity=".35"/><stop offset="1" stopColor="#ffe1a1" stopOpacity="0"/></linearGradient>
    <linearGradient id="rs-caption" x2="0" y2="1"><stop stopColor="#292839" stopOpacity="0"/><stop offset="1" stopColor="#1d2030" stopOpacity=".42"/></linearGradient>
    <clipPath id="rs-glass"><path d="M88 130L297 91V291L88 301Z"/></clipPath>
  </defs>;
}

function Platform({t}) {
  const left=foot(t,[154,477],[[4.88,5.57,245,400,22],[5.97,6.52,270,371,13]]);
  const right=foot(t,[177,476],[[4.34,4.98,226,434,26],[5.52,6.14,263,368,19]]);
  const hip=[(left[0]+right[0])/2,(left[1]+right[1])/2-83+3*Math.sin(Math.PI*ease(t,4.3,6.45))];
  const reach=ease(t,3.0,4.34)*(1-ease(t,5.75,6.42));
  const ninaHand=blend([hip[0]+24,hip[1]+3],[239,331],reach);
  const lookBack=ease(t,2.28,2.66)*(1-ease(t,3.08,3.6));
  const stepBack = ease(t,3.84,4.66);
  const hx=91-19*stepBack,hy=475;
  const invite=ease(t,3.70,4.35)*(1-ease(t,5.2,6.25));
  const feet=[[hx-9,hy],[hx+11,hy]];
  const open=ease(t,1.07,1.86);
  return <>
    <image href={platform} width="360" height="640" preserveAspectRatio="none"/>
    <g transform="translate(47 250) skewY(-3)">
      <rect width="38" height="32" rx="3" fill="#30494b" stroke="#dcc38e" strokeWidth="1.2"/>
      <text x="19" y="15" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff0c7">№ 7</text>
      <text x="19" y="26" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff0c7">07:10</text>
    </g>
    <Doors amount={open}/>
    <path d="M239 366v-44q0-5 5-6" stroke="#553f23" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M238.5 363v-40q0-4 4-6" stroke="#dfa955" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <ellipse cx={hx-4} cy={hy+1} rx="22" ry="4.1" fill="#32292a" opacity=".27"/>
    <Character t={t} hip={[hx,hy-83]} feet={feet} gaze={1} smile={invite} tilt={-3*invite}
      leftHand={[hx-19,hy-74]} rightHand={[hx+24+37*invite,hy-78-40*invite]}/>
    <ellipse cx={(left[0]+right[0])/2-3} cy={Math.max(left[1],right[1])+1} rx="20" ry="3.4" fill="#31292a" opacity=".22"/>
    <Character nina t={t} hip={hip} feet={[left,right]} leftHand={[hip[0]-14,hip[1]+8-4*reach]} rightHand={ninaHand}
      grip={reach>.68} lean={4*rampStep(t)} gaze={1-2*lookBack} tilt={-4*lookBack+3*rampStep(t)} smile={.23+.77*lookBack}/>
  </>;
}
function rampStep(t){return ease(t,4.10,4.65)*(1-ease(t,5.95,6.45));}

function Cabin({t}) {
  const bounce=.8*Math.sin(t*5.8)+.3*Math.sin(t*11);
  return <>
    <image href={salon} width="360" height="640" preserveAspectRatio="none"/>
    <g clipPath="url(#rs-glass)">
      <image href={salon} x={-(t-6.48)*2.3} width="360" height="640" preserveAspectRatio="none"/>
    </g>
    {[[108,427,true],[224,436,false]].map(([x,y,nina])=><Character key={x} nina={nina} t={t} seated
      hip={[x,y+bounce]} feet={[[x+7,y+69],[x+27,y+73]]}
      leftHand={[x+5,y-1+bounce]} rightHand={[x+27,y-2+bounce]} tilt={nina?2:-1}
      lean={nina?2:-1} gaze={nina?1:-1} smile={.35+.56*ease(t,nina?8.15:9.2,nina?8.65:9.7)}/>)}
    <path d={`M${-150+(t-6.48)*69} 0h42l187 567h-64z`} fill="url(#rs-sun)" opacity=".46"/>
  </>;
}

const lines = [
  [.05,.91,"В семь десять"], [.95,1.97,"дверь открылась."], [2.24,2.94,"Нина уже"], [2.94,3.93,"стояла первой."],
  [4.14,5.0,"Я пропустил"], [5.0,5.77,"её вперёд."], [6.13,7.36,"Когда мы тронулись,"],
  [7.4,8.77,"в окне сидела Нина,"],[8.95,9.78,"а рядом я."],[10.07,11.23,"Двое из десяти."]
];
function camera(t){
  if(t<2.17) return [2+t*.6,17,350-t*1.2];
  if(t<4.42) return [49+(t-2.17)*1.8,158,252];
  if(t<6.52) {
    const follow=ease(t,4.55,6.45);
    return [120+60*follow,267-57*follow,158];
  }
  if(t<10) return [15+(t-6.52)*1.2,88,318];
  return [30+(t-10)*2,128,299];
}
export const studyFrames=342;
export function BoardingStudy() {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
  const [x,y,w]=camera(t);
  const caption=lines.find(([a,b])=>a<=t&&t<b)?.[2];
  return <div style={{position:"absolute",inset:0,background:"#2b2c32",fontFamily:"DejaVu Sans, sans-serif"}}>
    <div style={{display:"none"}}><Img src={platform}/><Img src={salon}/></div>
    <svg width="100%" height="100%" viewBox="0 0 360 640">
      <Gradients/>
      <svg width="360" height="640" viewBox={`${x} ${y} ${w} ${w*16/9}`}>
        {t<6.52?<Platform t={t}/>:<Cabin t={t}/>}
      </svg>
      <rect y="436" width="360" height="204" fill="url(#rs-caption)"/>
      {caption && <text x="180" y="527" textAnchor="middle" stroke="#211e24" strokeWidth="3.6" strokeLinejoin="round"
        style={{paintOrder:"stroke fill"}} fontWeight="900" fontSize={caption.length>17?18:21} fill="#fffaf0">
        {caption.toLocaleUpperCase("ru")}
      </text>}
    </svg>
  </div>;
}
