import React,{useLayoutEffect,useRef} from "react";
import {Stage,ease} from "../experiments/world.js";

const ink="#282327", stone="#c6ac85", timber="#865037", gold="#e9af4c", moss="#8ba96c";
const lerp=(a,b,k)=>a+(b-a)*k;
const smooth=(n,a,b)=>ease((n-a)/(b-a));
function box(s,x,y,z,w,h,d,col){
  s.object(x,y+h/2,z,()=>s.box(x,y,z,w,h,d,col));
}
function roof(s,x,y,z,w,h,d,col){
  const a=[x-w/2,y,z+d/2], b=[x+w/2,y,z+d/2], c=[x,y+h,z+d/2],e=[x-w/2,y,z-d/2],f=[x+w/2,y,z-d/2],g=[x,y+h,z-d/2];
  for(const [points,color] of [[[e,f,g],col],[[a,e,g,c],"#844b41"],[[b,c,g,f],col],[[a,b,c],"#e9c195"]]){
    const mid=points.reduce((acc,p)=>acc.map((v,i)=>v+p[i]/points.length),[0,0,0]);
    s.object(...mid,()=>s.poly(points,color,ink,1.4));
  }
}
function house(s,x,z,col="#ba6751"){
  box(s,x,.02,z,1.35,1.12,1.1,"#f0ce99");roof(s,x,1.14,z,1.58,.76,1.34,col);
  box(s,x-.19,.02,z+.56,.34,.76,.06,timber);box(s,x+.35,.56,z+.57,.28,.28,.05,"#435a62");
}
function tower(s,x,z,h){
  box(s,x,0,z,1.48,h,1.5,stone);box(s,x,h-.14,z,1.69,.27,1.7,"#a88970");
  for(const dx of [-.61,0,.61])for(const dz of [-.62,.62])box(s,x+dx,h+.12,z+dz,.36,.39,.36,stone);
  box(s,x,h*.6,z+.76,.17,.51,.04,"#493a38");
}
function field(s,x,z){
  box(s,x,.02,z,2.8,.09,2.2,"#a77346");
  for(let i=0;i<5;i++)box(s,x-1+i*.49,.12,z,.24,.25,1.95,"#e0b74f");
}
export function city(s,buildings){
  s.poly([[-12,0,-10],[12,0,-10],[12,0,10],[-12,0,10]],moss,ink);
  s.poly([[-12,.01,1],[12,.01,2.1],[12,.01,3.7],[-12,.01,2.6]],"#65a6a3",ink);
  s.poly([[-.52,.015,-7],[.52,.015,-7],[.52,.015,8],[-.52,.015,8]],"#d8b78b",ink);
  box(s,0,.10,2.35,1.28,.18,2.9,timber);
  for(const side of [-1,1])box(s,side*.64,.29,2.35,.09,.39,2.9,"#704838");
  for(const x of [-5,-2.8,2.9,5.1])for(const z of [-2.8,-.65])house(s,x,z,x<0?"#aa5c4b":"#647e84");
  box(s,0,0,-6.1,8,1.3,.42,stone);
  for(const x of [-4,4])tower(s,x,-6.1,2.6);
  box(s,0,0,-6.55,2,2.4,1.4,stone);roof(s,0,2.4,-6.55,2.4,1.15,1.7,"#547084");
  box(s,3,.015,5.3,3.4,.03,2.8,"#b6b477");
  for(const {type,x,z} of buildings){
    if(type==="farm")field(s,x,z);
    if(type==="barracks"){house(s,x,z,"#536b81");tower(s,x+1.15,z+.4,1.6);}
  }
}
function hall(s){
  s.poly([[-8,0,-5],[8,0,-5],[8,0,7],[-8,0,7]],"#c6b197",ink);
  for(let i=-8;i<=8;i+=2)s.line([i,.01,-5],[i,.01,7],"#99836d",1.2);
  for(let i=-4;i<7;i+=2)s.line([-8,.01,i],[8,.01,i],"#99836d",1.2);
  box(s,0,0,-4.7,16,6,.4,stone);
  for(const x of [-6,-3,0,3,6]){
    box(s,x,0,-4.35,.49,5.8,.64,"#b1997e");
    box(s,x,0,-4.22,.83,.35,.8,"#a18569");
    const arch=[[x+.53,1.9,-4.45],[x+2.42,1.9,-4.45],[x+2.42,3.75,-4.45],[x+2.15,4.4,-4.45],[x+1.48,4.83,-4.45],[x+.80,4.4,-4.45],[x+.53,3.75,-4.45]];
    s.object(x+1.5,3.1,-4.43,()=>s.poly(arch,"#94bec0",ink,2.4));
    box(s,x+1.48,1.9,-4.39,.11,2.85,.08,stone);
  }
  for(let i=0;i<3;i++)box(s,-2.3,i*.16,-2.3-i*.34,2.6,.16,1.9-i*.3,"#ac9376");
  box(s,-2.3,.48,-2.7,1.24,.67,1,"#804a3a");box(s,-2.3,.55,-3.1,1.26,1.85,.2,"#ae594a");
  box(s,.7,0,-.55,2.3,.78,.85,timber);box(s,.7,.78,-.55,2.6,.12,1.10,"#b98453");
}
function actor(s,role,x,y,z,t,{walk=0,yaw=0,gesture=0,mood=0,speak=false}={}){
  s.object(x,y+.85,z,()=>{
    s.shadow(x,z,.37,.17); const [px,py,,scale]=s.project(x,y,z),c=s.c;
    c.save();c.translate(px,py);c.scale(scale/86,scale/86);c.lineCap="round";c.lineJoin="round";
    const line=(p,w,col=ink)=>{c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(a=>c.lineTo(...a));c.lineWidth=w;c.strokeStyle=col;c.stroke()};
    const shape=(p,col)=>{c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(a=>c.lineTo(...a));c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke()};
    const oval=(a,b,w,h,col,edge=true)=>{c.beginPath();c.ellipse(a,b,w,h,0,0,Math.PI*2);c.fillStyle=col;c.fill();if(edge){c.strokeStyle=ink;c.lineWidth=2;c.stroke()}};
    const swing=Math.sin(8*t)*walk,back=Math.cos(yaw)<-.18,side=Math.sin(yaw),regal=role==="king",clerk=role==="mira";
    for(const k of [-1,1]){const foot=10*k+15*k*swing,lift=Math.max(0,k*Math.cos(8*t))*walk*9;line([[k*8,-45],[k*7+k*swing*9,-22-lift],[foot,-5-lift]],4.5);oval(foot+side*3,-4-lift,7,3.3,"#60413b")}
    c.translate(0,-Math.abs(swing)*2-Math.sin(t*3)*.7);
    const cloth=regal?"#315d76":clerk?"#548679":"#91624a";
    shape([[-13,-92],[12,-93],[17,-80],[18,-43],[-16,-43],[-18,-79]],cloth);
    if(regal)shape([[-15,-89],[-23,-47],[-16,-42],[-7,-62],[-7,-88]],"#963f4b");
    if(!back){line([[-12,-56],[14,-55]],4,"#513c35");oval(2,-55,3,3,gold)}
    for(const k of [-1,1]){const hand=[k*(19+gesture*12)-k*swing*7,-52-gesture*(k===1?38:11)];line([[k*13,-83],[k*(22+gesture*4),-68],hand],4.2);oval(...hand,3.7,4.3,"#f4c195")}
    c.rotate(.045*Math.sin(t*3)*gesture);
    oval(0,-112,26,25,back?"#614436":"#ffe0b5");
    if(!back){for(const k of [-1,1]){const ex=side*11+k*(10-3*Math.abs(side));oval(ex,-114,4.5,5.6,"#fff5df");oval(ex+side,-114,2,2.8,ink,false);line([[ex-5,-122+k*mood*2],[ex+3,-124]],2)}
      oval(side*10+1,-101,4,1.4+(speak?2.3*Math.abs(Math.sin(13*t)):0),"#864f46")}
    if(regal)shape([[-24,-128],[-27,-146],[-15,-138],[-7,-150],[1,-139],[13,-151],[17,-137],[26,-144],[23,-128]],gold);
    else{shape([[-24,-123],[-23,-134],[-10,-143],[8,-141],[23,-132],[25,-123],[8,-129],[-8,-127]],clerk?"#863f38":"#405563");if(clerk)oval(-22,-130,8,8,"#7d4237")}
    c.restore();
  });
}
function draw(canvas,seg,f,state){
  const c=canvas.getContext("2d");c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,540,960);
  const p=f/seg.dur,t=f/30,shot=seg.kingdom,cityShot=shot.set==="city",k=ease(p);
  const cam=cityShot?{x:lerp(0,shot.plan?2.4:0,k),y:0,dist:lerp(shot.plan?19:24,shot.plan?16:21,k),yaw:-.27+.23*k,pitch:.82+.16*k}:
    {x:lerp(shot.focus??0,(shot.focus??0)+.38,k),y:1.13,dist:lerp(shot.close?4.0:6.1,shot.close?3.5:5.35,k),yaw:.18-.28*k,pitch:.10+.04*k};
  const s=new Stage(c,cam),poly=s.poly.bind(s);s.poly=(pts,col,edge,w)=>poly(pts,col,edge?ink:null,edge?Math.max(w||1,1.2):w);
  const sky=c.createLinearGradient(0,0,0,960);sky.addColorStop(0,"#82adbd");sky.addColorStop(.6,"#f3d8a4");sky.addColorStop(1,"#bdab85");c.fillStyle=sky;c.fillRect(0,0,540,960);
  if(cityShot){city(s,shot.plan&&p>.20?[...state,{type:shot.plan,x:3,z:5.3}]:state);actor(s,"king",-.2,0,3.8-k*1.6,t,{walk:1,yaw:2.9});}
  else {
    hall(s);
    const walk=shot.action==="descend",u=smooth(p,.04,.82);
    actor(s,"king",walk?lerp(-2.3,-.85,u):-.85,walk?.48*(1-u):0,walk?lerp(-2.3,.25,u):.25,t,{walk:walk&&u<1?.8:0,yaw:shot.action==="turn"?lerp(3.1,-1,k):.7,gesture:Math.abs(Math.sin(t*1.4))*.8,speak:shot.role==="king",mood:.7});
    actor(s,"mira",1.35,0,-.12,t,{yaw:-.75,gesture:shot.role==="mira"?.65+.28*Math.sin(t*2):.12,speak:shot.role==="mira"});
    if(shot.role==="warden")actor(s,"warden",.50,0,1.05,t,{yaw:-.8,gesture:.7,speak:true});
    for(let i=0;i<(shot.coins??6);i++)s.object(.05+i*.20,.99,-.43,()=>s.cylinder(.05+i*.20,.90,-.43,.11,.08,gold,8));
    if(shot.documents){
      for(const offset of [-.65,.65])box(s,.65+offset,.93,-.25,.52,.025,.35,"#fff0bc");
      s.object(.7,.96,-.22,()=>s.cylinder(.7,.92,-.22,.12,.17,"#843d3d",8));
    }
    if(shot.sack) {box(s,1.1,.90,-.63,.46,.48,.38,"#cab07d");box(s,1.1,1.38,-.63,.27,.1,.25,timber);}
  }
  s.flush();
}
export function Kingdom({seg,f,state=[],cover=false}){
  const ref=useRef(null);useLayoutEffect(()=>draw(ref.current,seg,f,state),[seg,f,state]);
  const words=seg.words||[],i=words.findIndex(w=>w.e>f),n=i<0?words.length-1:i,start=Math.floor(Math.max(n,0)/3)*3;
  return <div style={{position:"absolute",inset:0,fontFamily:"DejaVu Sans, sans-serif",color:"white"}}>
    <canvas ref={ref} width={1080} height={1920}/>
    <div style={{position:"absolute",top:112,left:58,fontWeight:900,fontSize:40,textShadow:"0 2px 6px #211"}}>{seg.kingdom.label}</div>
    <div style={{position:"absolute",bottom:380,left:60,right:60,textAlign:"center",fontSize:cover?87:62,fontWeight:900,lineHeight:1.1,textShadow:"0 4px 6px black",WebkitTextStroke:"1px #241c22"}}>{cover?"ПОСЛЕДНИЕ ШЕСТЬ МОНЕТ":words.slice(start,start+3).map(w=>w.w).join(" ")}</div>
  </div>;
}
