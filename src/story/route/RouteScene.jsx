import { Platform, Cabin, Gradients, boardingCamera, StreetPassenger } from "./boarding/BoardingStudy.jsx";
import platform from "./boarding/platform.webp";
import salon from "./boarding/salon.webp";
// Illustrations stay in source control because build_props recreates public/ for each film.
import React from "react";
import { Img } from "remotion";
import stop from "./art/stop.webp";
import gate from "./art/gate.webp";
import cabin from "./art/cabin.webp";
import bus from "./art/bus.webp";
import nina from "./art/nina.webp";
import hero from "./art/hero.webp";
import driver from "./art/driver.webp";

const ink = "#122f32", paper = "#ffefce", amber = "#ffc061", red = "#ad392e";
const cast = {nina, hero, driver};
const limit = (value) => Math.min(1, Math.max(0, value));
function ramp(t, start, end) {
  const u = limit((t - start) / (end - start));
  return u * u * (3 - 2 * u);
}

// An action can follow a word in the voice track even when a different TTS voice changes the shot length.
function cue(seg, word, fallback) {
  const token = seg.words?.find(w => w.w.toLowerCase().replace(/[^а-яё]/g, "") === word);
  return token ? token.s / seg.dur : fallback;
}
function Type({x=0, y=0, size=13, color=ink, align="start", bold=700, spacing=0, children}) {
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={bold} textAnchor={align} letterSpacing={spacing}>{children}</text>;
}
function Actor({who, x, feet, height, opacity=1, tilt=0}) {
  return <g opacity={opacity} transform={`rotate(${tilt} ${x} ${feet})`}><StreetPassenger who={who} x={x} feet={feet} height={height} t={tilt}/></g>;
}
function Coach({x=180, bottom=438, width=284, door=0}) {
  const h=width*.435;
  return <g transform={`translate(${x-width/2} ${bottom-h}) scale(${width/300})`}>
    <ellipse cx="150" cy="124" rx="143" ry="6" fill="#142c2b" opacity=".28"/>
    <image href={bus} width="300" height="130.5"/>
    <rect x="142" y="20" width="21" height="13" rx="2" fill={paper}/>
    <Type x={152} y={31} align="middle" size={11}>7</Type>
    <g opacity={door}>
      <rect x="206" y="23" width="30" height="86" rx="2" fill="#273433"/>
      <path d="M208 99h26m-26 5h26" stroke="#d6ad72" strokeWidth="2"/>
      <path d="M212 25v68" stroke="#e7bd7b" strokeWidth="2"/>
    </g>
  </g>;
}
function Notice({t, compact=false}) {
  return <g transform={compact?"translate(13 208) rotate(-4) scale(.49)":`translate(44 ${174-3*t}) rotate(-4 130 92)`}>
    <rect x="3" y="6" width="268" height="185" rx="2" fill="#142429" opacity=".48"/>
    <rect width="268" height="185" rx="2" fill={paper}/>
    <path d="M12 12h244v160H12z" stroke="#9b8871" fill="none" strokeDasharray="3 2"/>
    <Type x={25} y={38} size={10} spacing={1.4}>АВТОПАРК  /  ПРИКАЗ № 17</Type>
    <path d="M24 48h220" stroke={ink}/>
    <Type x={24} y={83} size={25} bold={900}>МАРШРУТ № 7</Type>
    <Type x={24} y={111} size={22}>С ПЯТНИЦЫ</Type>
    <g transform={`rotate(-5 135 141) scale(${1+.045*(1-ramp(t,0,.18))})`}>
      <rect x="22" y="118" width="222" height="37" rx="2" fill="none" stroke={red} strokeWidth="3"/>
      <Type x={133} y={145} size={24} color={red} align="middle" bold={900}>РЕЙС СНЯТ</Type>
    </g>
    <circle cx="134" cy="7" r="3" fill="#776247"/>
  </g>;
}
function StopStreet({view,t,seg,series}) {
  if (view==="notice") return <><Coach x={242} bottom={475} width={209}/><Notice t={t}/></>;
  if (view==="stop") return <>
    <Coach x={270} bottom={472} width={196}/>
    <path d="M63 466l20-147 38 147m-51-32h42m-37-23h31m-27-26h20m-17-25h11" fill="none" stroke="#855832" strokeWidth="4"/>
    <Notice compact/><Actor who="driver" x={90} feet={383} height={145} tilt={-2+1.8*Math.sin(t*9)}/>
    <Actor who="hero" x={223} feet={487} height={180}/>
  </>;
  if (view==="deal") {
    const promise = ramp(t,cue(seg,"поеду",.45),cue(seg,"поеду",.45)+.08);
    return <>
      <Actor who="nina" x={110} feet={481} height={265} tilt={-1.5*Math.sin(t*5)}/>
      <Actor who="hero" x={251} feet={477} height={236}/>
      <g opacity={promise} transform={`translate(73 ${153+(1-promise)*14}) rotate(-2)`}>
        <rect width="210" height="45" rx="2" fill={paper}/>
        <Type x={10} y={17} size={10} spacing={1}>ЗАВТРА  /  07:10</Type>
        <Type x={10} y={35} size={14}>Обещала Нина  ·  +1</Type>
      </g>
    </>;
  }
  const arriving = view==="arrival", first=view==="first";
  const step = first ? ramp(t,cue(seg,"поднялась",.5),cue(seg,"щёлкнул",.81)) : ramp(t,.08,.45);
  const open = arriving ? 0 : first ? ramp(t,.13,cue(seg,"открылась",.38)+.04) : 1;
  const busX=arriving ? -170+346*ramp(t,cue(seg,"из",.60)-.12,.96) : 176;
  return <>
    <Coach x={busX} width={292} bottom={479} door={open}/>
    {arriving && <Actor who="nina" x={274} feet={477} height={130}/>}
    {first && <Actor who="nina" x={280-35*step} feet={488-36*step} height={138} opacity={1-ramp(step,.60,1)}/>}
    {!arriving && <Actor who="hero" x={first?320:310-65*step} feet={first?488:489-38*step} height={first?140:144} opacity={first?1:1-ramp(step,.60,1)}/>}
    {!arriving && <g transform="translate(18 195)"><rect width="115" height="49" rx="3" fill={paper}/><Type x={9} y={15} size={9} spacing={1}>БИЛЕТОВ</Type><Type x={9} y={38} size={20}>{step>.86?seg.routeShot.aboardAfter:seg.routeShot.aboardBefore} из {series.goal}</Type></g>}
  </>;
}
function Factory({t,seg}) {
  const close = ramp(t,cue(seg,"створки",.71)-.04,cue(seg,"перед",.9));
  const walk = ramp(t,.15,.77);
  return <>
    <defs><clipPath id="gate-opening"><rect x="72" y="253" width="197" height="166"/></clipPath></defs>
    <g clipPath="url(#gate-opening)" fill="none" stroke="#263d3d" strokeWidth="3">
      {[-1,1].map(side=><g key={side} transform={`translate(${side*(1-close)*99} 0)`}>
        <rect x={side<0?72:170} y="259" width="99" height="159"/>
        {[1,2,3,4,5,6,7].map(i=><path key={i} d={`M${(side<0?72:170)+i*12} 259v159`}/>)}
        <path d={side<0?"M74 413l94-111":"M172 302l95 111"} strokeWidth="2"/>
      </g>)}
    </g>
    <Actor who="nina" x={57+94*walk} feet={488-50*walk} height={177-34*walk} tilt={4*Math.sin(walk*Math.PI)}/>
    <Type x={202} y={243} size={9} color="#ffefce" spacing={1}>ПРОХОДНАЯ</Type>
  </>;
}
function Ledger({t}) {
  return <g transform={`translate(27 192) rotate(${-3+t})`}>
    <rect x="3" y="6" width="306" height="187" rx="4" fill="#102126" opacity=".55"/>
    <rect width="306" height="187" fill={paper} rx="3"/><rect width="306" height="32" fill={ink}/>
    <Type x={16} y={21} size={11} color={paper} spacing={1.2}>ПУТЕВОЙ ЛИСТ   /   № 007</Type>
    <Type x={16} y={62} size={22} bold={900}>Десять за рейс</Type>
    <Type x={16} y={83} size={12}>Последняя проверка — пятница</Type>
    {Array.from({length:10},(_,i)=><g key={i} transform={`translate(${16+(i%5)*55} ${98+Math.floor(i/5)*35})`}>
      <rect width="47" height="27" rx="2" stroke="#b3a489" fill="none"/><Type x={23} y={18} align="middle" size={11} color="#776f5c">{String(i+1).padStart(2,"0")}</Type>
    </g>)}
  </g>;
}
function Timetable({view,t,seg,series}) {
  const change=ramp(t,cue(seg,"заклеил",.78)-.12,cue(seg,"заклеил",.78)+.09);
  return <g transform="translate(26 198)">
    <rect x="3" y="6" width="308" height="168" rx="6" fill="#142429" opacity=".45"/>
    <rect width="308" height="168" rx="6" fill={paper}/><rect x="6" y="6" width="296" height="156" rx="4" fill="none" stroke="#937e63"/>
    <Type x={19} y={30} size={12} spacing={1.2}>{view==="times"?"ЗАВОД  /  БЕРЕГОВОЙ":"БЕРЕГ  /  РАСПИСАНИЕ"}</Type>
    <path d="M18 40h272m-272 56h272" stroke="#a0967e"/>
    <Type x={19} y={78} size={19}>Начало смены</Type><Type x={288} y={79} size={25} align="end">{series.shift}</Type>
    <Type x={19} y={136} size={19}>Рейс № 7</Type><Type x={288} y={137} size={25} align="end" color={red}>{series.original}</Type>
    {view==="schedule" && <g opacity={change} transform={`translate(${(1-change)*24} 0) rotate(-3 246 125)`}>
      <rect x="192" y="104" width="102" height="39" fill="#e8c781"/><Type x={282} y={133} align="end" size={26}>{series.early}</Type>
    </g>}
  </g>;
}
const roads={direct:"M50 152 C83 148 100 135 130 134 S205 140 252 101",detour:"M50 152 C85 142 93 201 135 200 S202 190 201 158 S229 119 252 101"};
function minutes(time) {
  const [h,m]=time.split(":").map(Number);
  return h*60+m;
}
function clock(value) {
  return [Math.floor(value/60)%24,value%60].map(n=>String(n).padStart(2,"0")).join(":");
}
function MapBoard({view,t,series}) {
  const choice=view==="choice";
  return <g transform="translate(17 178) rotate(-1 163 120)">
    <rect x="3" y="5" width="326" height="257" rx="4" fill="#142429" opacity=".6"/>
    <rect width="326" height="257" rx="4" fill={paper}/>
    <Type x={17} y={26} size={10} spacing={1.6}>ДИСПЕТЧЕРСКАЯ   /   ЛИСТ 07</Type>
    <Type x={17} y={53} size={21}>{choice?"Среда. Два маршрута":view==="detour"?"Крюк через общежитие":"Напрямую к проходной"}</Type>
    <path d="M6 121 Q60 100 106 123 T190 117 T317 79" fill="none" stroke="#a3c5be" strokeWidth="19"/>
    <path d="M7 121 Q62 101 107 123 T191 118 T319 79" fill="none" stroke="#d5e5d9" strokeWidth="2"/>
    <path d="M115 142l11-34m-4 35 11-34" stroke="#687c70" strokeWidth="3"/>
    {Object.entries(roads).map(([id,d])=>{
      const active=choice||view===id;
      return <path key={id} d={d} pathLength="100" fill="none" stroke={active?(id==="direct"?"#137770":red):"#b5aa92"} strokeWidth={active?4:2} strokeLinecap="round" strokeDasharray={active?`${choice?100:100*ramp(t,0,.44)} 101`:"3 4"}/>;
    })}
    {[[50,152,"Берег"],[145,200,"Общежитие"],[252,101,"Проходная"]].map(([x,y,label])=><g key={label}><circle cx={x} cy={y} r="5" fill={paper} stroke={ink} strokeWidth="2.4"/><Type x={x} y={y-9} size={12} align="middle">{label}</Type></g>)}
    <Type x={17} y={239} size={13} color={red}>Объезд  {clock(minutes(series.early)+series.directMinutes+series.detourMinutes)}</Type><Type x={309} y={239} size={13} color="#11665d" align="end">Прямо  {clock(minutes(series.early)+series.directMinutes)}</Type>
  </g>;
}

function Caption({words=[], f}) {
  if(!words.length) return null;
  const active=words.findIndex(w=>w.e>f);
  const index=active<0?words.length-1:active;
  let start=0;
  while(start<words.length) {
    let end=start+1;
    while(end<words.length && end-start<5 && words.slice(start,end+1).map(w=>w.w).join(" ").length<=25 && !/[.!?]$/.test(words[end-1].w)) end++;
    if(index<end) return <text x="180" y="530" textAnchor="middle" fontSize="17.5" fontWeight="800" fill={paper}>
      {words.slice(start,end).map((w,i)=><tspan key={i} fill={start+i===index?amber:paper}>{i?" ":""}{w.w}</tspan>)}
    </text>;
    start=end;
  }
  return null;
}

export function RouteScene({series,seg,f,cover=false}) {
  const shot=seg.routeShot, view=shot.view, t=limit(f/Math.max(1,seg.dur-1));
  const maps=["detour","direct","choice"].includes(view);
  const background=view==="gate"||view==="times"?gate:view==="cabin"||view==="ledger"||maps?cabin:stop;
  const zoom=1+.035*t;
  if (["first","second","cabin"].includes(view)) {
    const second=view==="second", seated=view==="cabin";
    const time=seated?6.52+4.8*t:second?3.9+2.61*Math.min(1,t*1.8):6.51*Math.min(1,t*1.35);
    const [x,y,w]=boardingCamera(time);
    return <svg width="1080" height="1920" viewBox="0 0 360 640" style={{fontFamily:"DejaVu Sans, sans-serif"}}>
      <Gradients/><svg width="360" height="640" viewBox={`${x} ${y} ${w} ${w*16/9}`}>
        {seated?<Cabin t={time}/>:<Platform t={time} second={second}/>}
      </svg><rect y="436" width="360" height="204" fill="url(#rs-caption)"/>
      <Caption words={seg.words} f={f}/>
      <Type x={20} y={46} color={paper} size={12}>{seated?"ПРОХОДНАЯ · 07:26":`РЕЙС № 7 · ${time>6.2?shot.aboardAfter:shot.aboardBefore} ИЗ ${series.goal}`}</Type>
    </svg>;
  }
  return <><div style={{display:"none"}}>{[stop,gate,cabin,platform,salon,bus].map(src=><Img key={src} src={src}/>)}</div><svg viewBox="0 0 360 640" width="1080" height="1920" style={{display:"block",background:ink,fontFamily:"DejaVu Sans, sans-serif"}}>
    <Gradients/><defs>
      <linearGradient id="route-shade" x2="0" y2="1"><stop offset="0" stopColor="#081f23" stopOpacity=".8"/><stop offset=".29" stopColor="#142b28" stopOpacity=".02"/><stop offset=".66" stopColor="#092729" stopOpacity=".03"/><stop offset=".81" stopColor="#0b2628" stopOpacity=".88"/><stop offset="1" stopColor="#0a2426"/></linearGradient>
    </defs>
    <svg x="0" y="0" width="360" height="640" viewBox={`${(360-360/zoom)/2} ${(640-640/zoom)/2} ${360/zoom} ${640/zoom}`}>
      <image href={background} width="360" height="640" preserveAspectRatio="xMidYMid slice"/>
      {["notice","stop","deal","arrival","first","second"].includes(view) && <StopStreet series={series} view={view} t={t} seg={seg}/>}
      {view==="gate" && <Factory t={t} seg={seg}/>}
      {view==="ledger" && <Ledger t={t}/>}
      {["schedule","times"].includes(view) && <Timetable series={series} view={view} t={t} seg={seg}/>}
      {view==="cabin" && <><Actor who="nina" x={110} feet={665} height={403}/><Actor who="hero" x={240} feet={655} height={377}/></>}
      {maps && <MapBoard series={series} view={view} t={t}/>}
      {view==="direct" && <g opacity={ramp(t,cue(seg,"повешу",.37)-.06,cue(seg,"повешу",.37)+.09)}>
        <image href={gate} width="360" height="640" preserveAspectRatio="xMidYMid slice"/>
        <Actor who="hero" x={87} feet={475} height={190}/>
        <g transform="translate(151 234) rotate(2)"><rect width="163" height="102" fill={paper}/>
          <Type x={13} y={24} size={10} spacing={1}>ОБЪЯВЛЕНИЕ</Type>
          <path d="M12 32h138" stroke={ink}/><Type x={13} y={58} size={18}>С остановки</Type>
          <Type x={13} y={86} size={24} color={red}>{series.early}</Type>
        </g>
      </g>}
    </svg>
    <rect width="360" height="640" fill="url(#route-shade)"/>
    <g transform="translate(18 25)">
      <rect width="27" height="27" rx="5" fill={amber}/><Type x={13.5} y={21} size={21} align="middle" bold={900}>7</Type>
      <Type x={35} y={12} size={10} color={paper} spacing={1.2}>{series.name.toUpperCase()}</Type>
      <Type x={35} y={24} size={8} color={paper} spacing={.8}>ГЛАВА {series.chapter}  /  {series.chapterTitle.toUpperCase()}</Type>
      <Type x={323} y={18} size={9} color={amber} align="end" spacing={.8}>{shot.day}</Type>
    </g>
    <Type x={19} y={89} size={10} color={amber} spacing={1.4}>{shot.place}</Type>
    {view==="notice"?<><Type x={18} y={124} size={32} color={paper} bold={900}>Четыре утра.</Type><Type x={19} y={151} size={18} color={paper}>Потом рейс закроют.</Type></>:<Type x={18} y={118} size={22} color={paper} bold={800}>{shot.headline}</Type>}
    {view==="cabin" && <g transform="translate(182 149)"><rect width="158" height="44" rx="3" fill={ink}/><Type x={11} y={17} size={9} color={amber} spacing={1.2}>ПРИБЫТИЕ</Type><Type x={11} y={36} size={17} color={paper}>{clock(minutes(series.early)+series.directMinutes)}  ·  +{minutes(series.shift)-minutes(series.early)-series.directMinutes} мин</Type></g>}
    {!cover && <Caption words={seg.words} f={f}/>}
    <path d="M19 555h322" stroke="#e6d4aa" opacity=".44"/>
    <Type x={19} y={574} size={9} color={amber} spacing={1}>БЕРЕГ  —  ПРОХОДНАЯ</Type>
    <Type x={340} y={574} size={9} color={paper} align="end">{maps||view==="cabin"?`В РЕЙСЕ  ·  ${shot.aboardAfter} ИЗ ${series.goal}`:`УСЛОВИЕ ПАРКА  ·  ${series.goal} ЗА РЕЙС`}</Type>
  </svg></>;
}
