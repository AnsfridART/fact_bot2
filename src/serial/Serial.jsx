import React,{useRef,useLayoutEffect} from "react";
import {draw} from "./sets.js";
export function Serial({seg,f,fps}) {
  const ref=useRef(null);
  useLayoutEffect(()=>{draw(ref.current.getContext("2d"),seg.boarding,f,seg.dur,fps)},[seg,f,fps]);
  return <><canvas width={1080} height={1920} ref={ref}/>
    {seg.boarding.options && <div style={{position:"absolute",top:370,left:80,right:80,display:"grid",gap:14,font:"bold 54px DejaVu Sans",color:"white"}}>
    {seg.boarding.options.map((x,i)=><div key={x} style={{padding:"15px 32px",borderRadius:16,background:i?"#245368":"#923e30"}}>{i+1} · {x}</div>)}</div>}</>;
}
