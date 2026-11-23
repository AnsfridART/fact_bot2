import React,{useLayoutEffect,useRef} from "react";
import {Stage,ease} from "../experiments/world.js";

import {palette, textured} from "./materials.js";

const ink="#282327", stone=palette.stone, timber=palette.oak, gold="#e9af4c", moss=palette.meadow;
const lerp=(a,b,k)=>a+(b-a)*k;
const smooth=(n,a,b)=>ease((n-a)/(b-a));
function box(s,x,y,z,w,h,d,col,material="stone"){
  s.object(x,y+h/2,z,()=>s.box(x,y,z,w,h,d,col,
    (points,shade)=>textured(s,points,shade,material,ink,.85)));
}
function roof(s,x,y,z,w,h,d,col){
  const a=[x-w/2,y,z+d/2], b=[x+w/2,y,z+d/2], c=[x,y+h,z+d/2],e=[x-w/2,y,z-d/2],f=[x+w/2,y,z-d/2],g=[x,y+h,z-d/2];
  for(const [points,color] of [[[e,f,g],col],[[g,c,a,e],col],[[c,g,f,b],col],[[a,b,c],"#e9c195"]]){
    const mid=points.reduce((acc,p)=>acc.map((v,i)=>v+p[i]/points.length),[0,0,0]);
    s.object(...mid,()=>points.length===4?textured(s,points,color,"roof",ink,1.2):s.poly(points,color,ink,1.2));
  }
}
function house(s,x,z,col="#ba6751"){
  box(s,x,.02,z,1.35,1.12,1.1,palette.plaster,"plaster");roof(s,x,1.14,z,1.58,.76,1.34,col);
  for(const dx of [-.59,.59])box(s,x+dx,.02,z+.56,.075,1.12,.07,timber,"oak");
  box(s,x,1.05,z+.56,1.35,.10,.08,timber,"oak");
  box(s,x+.42,1.4,z-.29,.22,.58,.25,stone);
  box(s,x-.19,.02,z+.56,.34,.76,.06,timber,"oak");box(s,x+.35,.56,z+.57,.28,.28,.05,"#435a62");
}
function tower(s,x,z,h){
  box(s,x,0,z,1.48,h,1.5,stone);box(s,x,h-.14,z,1.69,.27,1.7,"#a88970");
  for(const dx of [-.61,0,.61])for(const dz of [-.62,.62])box(s,x+dx,h+.12,z+dz,.36,.39,.36,stone);
  box(s,x,h*.6,z+.76,.17,.51,.04,"#493a38");
}
function field(s,x,z){
  box(s,x,.02,z,2.8,.09,2.2,"#a77346","soil");
  for(const side of [-1,1]){
    box(s,x+side*1.40,.23,z,.07,.08,2.2,timber,"oak");
    for(const dz of [-1,0,1])box(s,x+side*1.40,0,z+dz,.1,.38,.1,timber,"oak");
  }
  for(let i=0;i<5;i++)box(s,x-1+i*.49,.12,z,.24,.25,1.95,"#e0b74f","wheat");
}
function tree(s,x,z,h){
  s.shadow(x+.28,z+.15,.48*h,.23*h,.15);
  box(s,x,0,z,.18*h,h*.60,.17*h,timber,"oak");
  const at=(angle,r,y)=>[x+Math.cos(angle)*r*h,y*h,z+Math.sin(angle)*r*h];
  const peak=[x-.08*h,h*1.12,z], low=[x,h*.37,z];
  const hues=["#91a456","#b0bb68","#a1b15e","#909f56","#75894e","#7c914e","#abba66"];
  for(let i=0;i<7;i++){
    const a=at(i*.898,.35,.73+.06*Math.sin(i*8)),b=at((i+1)*.898,.35,.73+.06*Math.sin((i+1)%7*8));
    for(const [tip,col] of [[peak,hues[i]],[low,hues[(i+4)%7]]]){
      s.object((tip[0]+a[0]+b[0])/3,(tip[1]+a[1]+b[1])/3,(tip[2]+a[2]+b[2])/3,()=>s.poly([a,b,tip],col));
    }
  }
}
function hills(s){
  s.poly([[-40,-.04,-32],[40,-.04,-32],[40,-.04,16],[-40,-.04,16]],"#a5b584");
  for(let i=0;i<13;i++){
    const x=-22+i*3.7,z=-15-(i%3)*1.3,h=3.4+2.1*Math.abs(Math.sin(i*13));
    const peak=[x-.7,h,z],ridge=[x+.4,1.1,z+2.5];
    s.poly([[x-3.9,0,z+1],peak,ridge],"#b3b9a5");
    s.poly([peak,[x+3.7,0,z+1],ridge],"#91a299");
    s.poly([[x-3.9,0,z+1],ridge,[x+3.7,0,z+1]],"#a2ae90");
  }
}
function cart(s,k){
  const travel=k<.5?ease(2*k):1-ease(2*k-1), z=4.3-2.2*travel;
  const x=.17;
  for(const dx of [-.38,.38])for(const dz of [-.35,.35]){
    box(s,x+dx,.30,z+dz,.10,.32,.32,"#604134","oak");
  }
  box(s,x,.53,z,.88,.27,1.1,timber,"oak");
  for(const dz of [-.22,.22])box(s,x,.80,z+dz,.57,.24,.31,"#d9ba81","cloth");
}
export function city(s,buildings,brokenBridge=false){
  hills(s);
  textured(s,[[-12,0,-10],[12,0,-10],[12,0,10],[-12,0,10]],moss,"meadow");
  textured(s,[[-12,.01,1],[12,.01,2.1],[12,.01,3.7],[-12,.01,2.6]],palette.river,"water",ink);
  for(const [a,b] of [[-7,1.1],[3.65,8]])textured(s,[[-.52,.015,a],[.52,.015,a],[.52,.015,b],[-.52,.015,b]],palette.flagstone,"flagstone",ink);
  textured(s,[[-6,.015,-1.98],[6,.015,-1.98],[6,.015,-1.48],[-6,.015,-1.48]],palette.flagstone,"flagstone");
  for(const x of [-5,-2.8,2.9,5.1])for(const z of [-2.8,-.65])s.shadow(x+.55,z+.3,1.35,.7,.18);
  const spans=brokenBridge?[[1.24,.68],[3.45,.70]]:[[2.35,2.9]];
  for(const [z,length] of spans){
    box(s,0,.10,z,1.28,.18,length,timber,"oak");
    for(const side of [-1,1])box(s,side*.64,.29,z,.09,.39,length,"#704838","oak");
  }
  for(const x of [-5,-2.8,2.9,5.1])for(const z of [-2.8,-.65])house(s,x,z,x<0?"#aa5c4b":"#647e84");
  box(s,0,0,-6.1,8,1.3,.42,stone);
  box(s,0,0,-5.84,.83,.94,.11,timber,"oak");
  for(const x of [-4,4])tower(s,x,-6.1,2.6);
  box(s,0,0,-6.55,2,2.4,1.4,stone);roof(s,0,2.4,-6.55,2.4,1.15,1.7,"#547084");
  for(const [x,z,h] of [[-2,4.9,2.1],[-4,4.2,2.8],[5.9,4.6,2.3],[-1.35,-3.9,1.7],[1.5,-4,1.6],[-6.5,-1,2.4],[6.7,-2,2.3],[-4.8,6.6,3],[6.2,7.4,2.7]])tree(s,x,z,h);
  box(s,3,.015,5.3,3.4,.03,2.8,"#b6b477","meadow");
  for(const {type,x,z} of buildings){
    if(type==="farm")field(s,x,z);
    if(type==="barracks"){house(s,x,z,"#536b81");tower(s,x+1.15,z+.4,1.6);}
  }
}
function hall(s,north=false){
  const heraldry=north?"#435d79":"#a54f4d";
  textured(s,[[-8,0,-5],[8,0,-5],[8,0,7],[-8,0,7]],palette.flagstone,"flagstone");
  textured(s,[[-2.94,.01,-3],[-1.66,.01,-3],[-1.66,.01,4],[-2.94,.01,4]],"#a45850","cloth","#ad864c",2);
  for(const x of [-4,-1,2])s.poly([[x-1,.016,-3],[x+.28,.016,-3],[x+2.7,.016,2.5],[x+1.12,.016,2.5]],"rgba(255,226,156,.21)");
  box(s,0,5.71,-4.5,16,.43,.67,timber,"oak");
  box(s,0,0,-4.7,16,6,.4,stone);
  for(const x of [-6,-3,0,3,6]){
    box(s,x,0,-4.35,.49,5.8,.64,"#b1997e");
    box(s,x,0,-4.22,.83,.35,.8,"#a18569");
    const arch=[[x+.53,1.9,-4.45],[x+2.42,1.9,-4.45],[x+2.42,3.75,-4.45],[x+2.15,4.4,-4.45],[x+1.48,4.83,-4.45],[x+.80,4.4,-4.45],[x+.53,3.75,-4.45]];
    s.object(x+1.5,3.1,-4.43,()=>{
      s.poly(arch,"#abd1c6",ink,2.4);
      for(const level of [2.48,3.16,3.82])s.line([x+.57,level,-4.43],[x+2.37,level,-4.43],"#698d87",1.2);
    });
    box(s,x+1.48,1.9,-4.39,.11,2.85,.08,stone);
  }
  for(const x of [-3,0,3]){
    const front=-3.98;
    s.object(x,3.1,front,()=>{
      const banner=[[x-.31,4.18,front],[x+.31,4.18,front],[x+.31,2.63,front],[x-.31,2.63,front]];
      textured(s,banner,heraldry,"cloth",ink);
      s.poly([banner[3],banner[2],[x,2.40,front]],heraldry,ink);
      s.poly([[x,3.72,front],[x+.16,3.43,front],[x,3.14,front],[x-.16,3.43,front]],north?"#d4dae1":gold);
    });
  }
  for(let i=0;i<3;i++)box(s,-2.3,i*.16,-2.3-i*.34,2.6,.16,1.9-i*.3,"#ac9376");
  box(s,-2.3,.48,-2.7,1.24,.67,1,"#804a3a","oak");box(s,-2.3,.55,-3.1,1.26,1.85,.2,"#ae594a","cloth");
  box(s,.7,0,-.55,2.3,.78,.85,timber,"oak");box(s,.7,.78,-.55,2.6,.12,1.10,"#b98453","oak");
}
function actor(s,role,x,y,z,t,{walk=0,yaw=0,gesture=0,mood=0,speak=false}={}){
  s.object(x,y+.85,z,()=>{
    s.shadow(x,z,.37,.17); const [px,py,,scale]=s.project(x,y,z),c=s.c;
    c.save();c.translate(px,py);c.scale(scale/86,scale/86);c.lineCap="round";c.lineJoin="round";
    const line=(p,w,col=ink)=>{c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(a=>c.lineTo(...a));c.lineWidth=w;c.strokeStyle=col;c.stroke()};
    const shape=(p,col)=>{c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(a=>c.lineTo(...a));c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke()};
    const oval=(a,b,w,h,col,edge=true)=>{c.beginPath();c.ellipse(a,b,w,h,0,0,Math.PI*2);c.fillStyle=col;c.fill();if(edge){c.strokeStyle=ink;c.lineWidth=2;c.stroke()}};
    const swing=Math.sin(8*t)*walk,back=Math.cos(yaw)<-.18,side=Math.sin(yaw),northern=role==="rival",regal=role==="king"||northern,clerk=role==="mira";
    for(const k of [-1,1]){const foot=10*k+15*k*swing,lift=Math.max(0,k*Math.cos(8*t))*walk*9;line([[k*8,-45],[k*7+k*swing*9,-22-lift],[foot,-5-lift]],4.5);oval(foot+side*3,-4-lift,7,3.3,"#60413b")}
    c.translate(0,-Math.abs(swing)*2-Math.sin(t*3)*.7);
    const cloth=northern?"#3b465a":regal?"#315d76":clerk?"#548679":"#91624a";
    shape([[-13,-92],[12,-93],[17,-80],[18,-43],[-16,-43],[-18,-79]],cloth);
    if(regal)shape([[-15,-89],[-23,-47],[-16,-42],[-7,-62],[-7,-88]],northern?"#8fabb5":"#963f4b");
    if(!back){line([[-12,-56],[14,-55]],4,"#513c35");oval(2,-55,3,3,gold)}
    for(const k of [-1,1]){const hand=[k*(19+gesture*12)-k*swing*7,-52-gesture*(k===1?38:11)];line([[k*13,-83],[k*(22+gesture*4),-68],hand],4.2);oval(...hand,3.7,4.3,"#f4c195")}
    c.rotate(.045*Math.sin(t*3)*gesture);
    oval(0,-112,26,25,back?"#614436":"#ffe0b5");
    if(!back){for(const k of [-1,1]){const ex=side*11+k*(10-3*Math.abs(side));oval(ex,-114,4.5,5.6,"#fff5df");oval(ex+side,-114,2,2.8,ink,false);line([[ex-5,-122+k*mood*2],[ex+3,-124]],2)}
      oval(side*10+1,-101,4,1.4+(speak?2.3*Math.abs(Math.sin(13*t)):0),"#864f46")}
    if(northern&&!back)shape([[-23,-109],[-13,-103],[-3,-99],[8,-101],[23,-109],[19,-91],[4,-81],[-12,-91]],"#96979e");
    if(regal)shape([[-24,-128],[-27,-146],[-15,-138],[-7,-150],[1,-139],[13,-151],[17,-137],[26,-144],[23,-128]],northern?"#d5dae3":gold);
    else{shape([[-24,-123],[-23,-134],[-10,-143],[8,-141],[23,-132],[25,-123],[8,-129],[-8,-127]],clerk?"#863f38":"#405563");if(clerk)oval(-22,-130,8,8,"#7d4237")}
    c.restore();
  });
}
function flourSack(s,x,z){
  const y=.905, rings=[[0,.22],[.07,.32],[.31,.30],[.45,.14],[.53,.17]];
  const face=(i,r,h)=>[x+r*Math.cos(i*Math.PI/4),y+h,z+r*.76*Math.sin(i*Math.PI/4)];
  const tones=["#d8b47b","#ddc28d","#ead19b","#d4b27e","#c8a779","#b59871","#bfa176","#cba878"];
  s.object(x,y+.24,z,()=>{
    const sides=[];
    for(let j=1;j<rings.length;j++)for(let i=0;i<8;i++){
      const [h,r]=rings[j-1],[hh,rr]=rings[j];
      sides.push([ [face(i,r,h),face(i+1,r,h),face(i+1,rr,hh),face(i,rr,hh)],tones[i]]);
    }
    sides.sort(([a],[b])=>s.depth(b)-s.depth(a));
    for(const [points,col] of sides)s.poly(points,col);
    s.poly(Array.from({length:8},(_,i)=>face(i,.17,.53)),"#f1dfbd",ink,.7);
    s.cylinder(x,y+.435,z,.15,.032,timber,8);
  });
}
function draw(canvas,seg,f,state){
  const c=canvas.getContext("2d");c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,540,960);
  const p=f/seg.dur,t=f/30,shot=seg.kingdom,cityShot=shot.set==="city",k=ease(p);
  const cam=cityShot?{x:lerp(0,shot.plan||shot.parcel?3:0,k),y:shot.plan||shot.parcel?-2.7*k:0,dist:lerp(shot.plan?19:24,shot.plan?16:21,k),yaw:-.27+.23*k,pitch:.82+.16*k}:
    {x:lerp(shot.focus??0,(shot.focus??0)+.38,k),y:1.13,dist:lerp(shot.close?4.0:6.1,shot.close?3.5:5.35,k),yaw:.18-.28*k,pitch:.10+.04*k};
  if(shot.action==="descend"){
    const reveal=smooth(p,.08,.64);
    cam.x=lerp(.58,cam.x,reveal);cam.y=lerp(1.31,cam.y,reveal);cam.dist=lerp(2.65,cam.dist,reveal);
  }
  const s=new Stage(c,cam),poly=s.poly.bind(s);s.poly=(pts,col,edge,w)=>poly(pts,col,edge?ink:null,edge?Math.max(w||1,1.2):w);
  const sky=c.createLinearGradient(0,0,0,960);sky.addColorStop(0,"#82adbd");sky.addColorStop(.6,"#f3d8a4");sky.addColorStop(1,"#bdab85");c.fillStyle=sky;c.fillRect(0,0,540,960);
  if(cityShot){city(s,shot.plan&&p>.20?[...state,{type:shot.plan,x:3,z:5.3}]:state,shot.brokenBridge);if(shot.cart)cart(s,k);actor(s,"king",shot.cart?-.5:-.2,0,shot.brokenBridge?3.92:3.8-k*1.6,t,{walk:shot.brokenBridge?0:1,yaw:2.9});}
  else if(shot.set==="north"){
    hall(s,true);
    actor(s,"rival",-.18,0,.25,t,{yaw:-.46,gesture:.45+.24*Math.sin(t*1.8),speak:true,mood:1});
  } else {
    hall(s);
    const walk=shot.action==="descend",u=smooth(p,.04,.82);
    actor(s,"king",walk?lerp(-2.3,-.85,u):-.85,walk?.48*(1-u):0,walk?lerp(-2.3,.25,u):.25,t,{walk:walk&&u<1?.8:0,yaw:shot.action==="turn"?lerp(3.1,-1,k):.7,gesture:Math.abs(Math.sin(t*1.4))*.8,speak:shot.role==="king",mood:.7});
    actor(s,"mira",1.35,0,-.12,t,{yaw:-.75,gesture:shot.role==="mira"?.65+.28*Math.sin(t*2):.12,speak:shot.role==="mira"});
    if(shot.role==="warden")actor(s,"warden",.50,0,1.05,t,{yaw:-.8,gesture:.7,speak:true});
    for(let i=0;i<(shot.coins??6);i++)s.object(.05+i*.20,.99,-.43,()=>s.cylinder(.05+i*.20,.90,-.43,.11,.08,gold,8));
    if(shot.documents){
      for(const offset of [-.65,.65])box(s,.65+offset,.93,-.25,.52,.025,.35,"#fff0bc","plaster");
      s.object(.7,.96,-.22,()=>s.cylinder(.7,.92,-.22,.12,.17,"#843d3d",8));
    }
    if(shot.apron){
      const cloth=[[.31,.913,-.92],[1.20,.913,-.92],[1.20,.913,-.12],[.31,.913,-.12]];
      s.object(.75,.92,-.52,()=>textured(s,cloth,"#b9b1a1","cloth",ink));
    }
    if(shot.bread)for(const x of [-.26,.12]){
      s.object(x,.99,-.4,()=>{
        s.cylinder(x,.9,-.4,.175,.10,"#b9743c",10);
        s.cylinder(x,1,-.4,.145,.045,"#daa361",10);
        for(const dx of [-.04,.04])s.line([x+dx-.02,1.05,-.46],[x+dx+.02,1.05,-.34],"#865332",2);
      });
    }
    if(shot.sack)flourSack(s,-.13,-.35);
  }
  s.flush();
  const light=c.createLinearGradient(0,0,540,650);
  light.addColorStop(0,"rgba(255,222,155,.17)");light.addColorStop(.63,"rgba(255,238,202,0)");light.addColorStop(1,"rgba(74,55,65,.065)");
  c.fillStyle=light;c.fillRect(0,0,540,960);
}
export function Kingdom({seg,f,state=[],cover=false,coverTitle="ПОСЛЕДНИЕ ШЕСТЬ МОНЕТ"}){
  const ref=useRef(null);useLayoutEffect(()=>draw(ref.current,seg,f,state),[seg,f,state]);
  const words=seg.words||[],i=words.findIndex(w=>w.e>f),n=i<0?words.length-1:i,start=Math.floor(Math.max(n,0)/3)*3;
  const voting=seg.kingdom.vote&&!cover;
  return <div style={{position:"absolute",inset:0,fontFamily:"DejaVu Sans, sans-serif",color:"white"}}>
    <canvas ref={ref} width={1080} height={1920}/>
    <div style={{position:"absolute",top:112,left:58,fontWeight:900,fontSize:40,textShadow:"0 2px 6px #211"}}>{seg.kingdom.label}</div>
    <div style={{position:"absolute",right:65,top:98,padding:"9px 22px",borderRadius:14,background:"#352e25",border:"3px solid #bc965d",color:"#ffe5a1",fontWeight:800,fontSize:38,fontVariantNumeric:"tabular-nums"}}>Казна · {seg.kingdom.coins??6}</div>
    {seg.kingdom.winterWeeks!=null&&<div style={{position:"absolute",right:65,top:174,padding:"6px 18px",borderRadius:10,background:"#344454",color:"#edf4f8",fontWeight:700,fontSize:33}}>До зимы · {seg.kingdom.winterWeeks} нед.</div>}
    {voting&&<div style={{position:"absolute",left:58,right:100,top:242,display:"flex",gap:16}}>
      {(seg.kingdom.options??[[ "ФЕРМА","Хлеб сегодня","#48583b"],["КАЗАРМА","Вернуть мост","#4a5366"]]).map(([name,detail,background],index)=><div key={name} style={{flex:1,padding:"22px 18px",background,color:"#fff1ce",border:"3px solid #d9b77f",borderRadius:8,opacity:smooth(f,index*7,index*7+9),transform:"translateY("+((1-smooth(f,index*7,index*7+9))*20)+"px)"}}><strong style={{fontSize:42}}>{name}</strong><div style={{fontSize:32,marginTop:5}}>{detail}</div></div>)}
    </div>}
    <div style={{position:"absolute",bottom:voting?270:360,left:60,right:60,textAlign:"center",fontSize:cover?87:62,fontWeight:900,lineHeight:1.1,textShadow:"0 4px 6px black",WebkitTextStroke:"1px #241c22"}}>{cover?coverTitle:words.slice(start,start+3).map(w=>w.w).join(" ")}</div>
  </div>;
}
