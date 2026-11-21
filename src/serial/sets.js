import {Stage,ease} from "../experiments/world.js";

const cast = {
  vera: {coat:"#ff813b",skin:"#d99b72",hair:"#402c35",size:1},
  father: {coat:"#246a82",skin:"#c78e70",hair:"#666173",size:1.08},
  child: {coat:"#cc3847",skin:"#e4a784",hair:"#51323b",size:.74},
};
const rooms = {
  office:["#558684","wood"],desk:["#418b86","wood"],glass:["#4a8094","glass"],
  platform:["#60899b","tile"],gate:["#498191","tile"],hall:["#638985","tile"],
  door:["#48717b","wood"],car:["#29748d","glass"]
};
function oval(c,x,y,rx,ry,color) {
  c.beginPath(); c.ellipse(x,y,rx,ry,0,0,2*Math.PI); c.fillStyle=color; c.fill();
}
function limb(c,x,y,k,l,u,v,color,width) {
  c.beginPath();c.moveTo(x,y);c.lineTo(k,l);c.lineTo(u,v);
  c.strokeStyle=color;c.lineWidth=width;c.lineJoin="round";c.lineCap="round";c.stroke();
}
function person(s,id,x,z,t,p,action) {
  const {coat,skin,hair,size}=cast[id];
  const walking=action==="walk", stride=walking?Math.sin(t*5):0;
  s.object(x,1,z,()=>{
    s.shadow(x,z,.35,.19);
    const [u,v,,scale]=s.project(x,0,z),c=s.c;
    c.save();c.translate(u,v);c.scale(scale*.017*size,scale*.017*size);
    const bob=walking?2*Math.cos(t*10):.7*Math.sin(t*2);
    for(const side of [-1,1]) {
      const step=side*stride*13;
      limb(c,side*7,-45,side*8+step*.5,-25,side*8+step,-4-Math.max(0,side*Math.cos(t*5))*4*walking,"#25364c",10);
    }
    c.translate(0,bob);
    limb(c,-6,-73,-15,-55,-12+stride*10,-42,coat,9);
    limb(c,0,-74,0,-61,0,-44,coat,28);
    const turn=Math.sin(p*Math.PI*1.6)*.72;
    oval(c,0,-92,16,21,skin);oval(c,-14*turn,-90,4,5,skin);
    oval(c,-2,-107,17,10,hair);
    if(id==="vera") oval(c,-13,-105,8,9,hair);
    if(id==="child") oval(c,12,-106,7,6,hair);
    for(const side of [-1,1]) oval(c,turn*7+side*6,-94,2.2,Math.max(.45,2.6*(1-Math.pow(Math.max(0,Math.cos(t*2.3)),80))),"#202633");
    oval(c,turn*10,-88,2.7,2,"#b47658");
    const lift=action==="signal"? .7+.3*Math.sin(t*3):action==="reach"||action==="inspect"?ease(p):.18;
    limb(c,9,-72,16-stride*5,-53-lift*8,17-stride*12+lift*12,-44-lift*36,coat,9);
    oval(c,17-stride*12+lift*12,-44-lift*36,5,5,skin);c.restore();
  });
}
function scenery(s,room,t,p) {
  const [wall,mat]=rooms[room];
  s.box(0,-.17,0,15,.17,10,"#c7a77c");s.box(0,0,-2.4,13,6,.2,wall);
  for(let i=-6;i<=6;i++) {
    s.line([i,0,-2],[i,0,4],"#927f69",1.2);
    if(mat==="wood")s.line([i*.8,0,-2.28],[i*.8+.05,5,-2.28],"#417471",2);
  }
  for(let i=-2;i<5;i++)s.line([-6,.009,i],[6,.009,i],"#96846e",1);
  if(["platform","car","glass"].includes(room)){
    const shift=room==="platform"? .9*p:0;
    for(let i=-2;i<3;i++){const x=i*1.7+shift;s.box(x,.6,-1.8,1.68,2.5,.22,"#eda743");
      s.box(x,1.56,-1.64,1.36,1.22,.08,"#416980");s.line([x-.51,1.65,-1.59],[x-.18,2.67,-1.59],"#88c3c8",4);}
  } else if(["office","desk"].includes(room)){
    s.box(.5,0,-1.2,2.5,.93,1,"#795543");s.box(.5,.93,-1.2,2.7,.14,1.1,"#c38b57");
    s.box(.5,1.08,-1.35,1.12,.65,.42,"#34505e");
  } else {
    for(const side of [-1,1])s.box(.55+side*(.46+.27*ease(p)),0,-2.02,.89,2.8,.2,"#c48d54");
    if(room==="gate")s.box(.8,0,-.5,.32,1,.92,"#526e7b");
  }
  s.box(0,3.65,-2.2,3.4,.09,.24,"#ffe1a4");
}
function item(s,kind,p,t) {
  const x=.58,y=1.36+.045*Math.sin(t*1.6)+(kind==="ticket"?.26*ease(p):0),z=.7;
  s.object(x,y,z,()=>{
    if(kind==="ticket"||kind==="book"||kind==="board"){
      const ticket=kind==="ticket", board=kind==="board", col=ticket?"#ffe2a0":board?"#263f51":"#713f45";
      s.box(x,y,z,board?1.8:1.05,.65,.09,col);
      if(ticket){
        const [u,v,,scale]=s.project(x,y+.35,z+.065),c=s.c;
        c.save();c.translate(u,v);c.scale(scale/100,scale/100);
        c.fillStyle="#d5c8af";c.fillRect(-44,-22,39,46);
        oval(c,-25,-5,12,14,cast.child.skin);oval(c,-26,-15,13,7,cast.child.hair);
        oval(c,-29,-6,1.4,1.6,"#292332");oval(c,-20,-6,1.4,1.6,"#292332");
        oval(c,-25,14,16,8,cast.child.coat);
        oval(c,19,-6,10,5,"#287694");limb(c,27,-6,35,-12,35,-1,"#287694",3);
        oval(c,14,-7,1,1,"#fff4dc");c.restore();
        s.label(x+.19,y+.12,z+.06,"23 • 11","#603d38",12);
      }
      else s.label(x,y+.24,z+.06,board?"ВЕРА  /  ВЕРА":"ЖУРНАЛ", "#ffdfa9",17);
    } else if(kind==="watch"||kind==="tape"){
      s.box(x,y,z,1.1,.58,.12,"#3c505e");
      s.label(x,y+.17,z+.08,kind==="watch"?"11 : 06":"◉   ◉","#ffe6b3",24);
    } else if(kind==="key"){
      s.cylinder(x,y,z,.13,.13,"#ffc343");s.box(x+.27,y,z,.5,.08,.09,"#edb34e");
    } else if(kind==="train"){
      s.box(x+p*.45,.6,-.55,2,1.65,.5,"#e7a139");s.box(x+p*.45,1.22,-.27,1.48,.82,.12,"#547f94");
    } else {
      s.box(x+ease(p)*.65,0,-.6,kind==="door"?1.4:.25,kind==="door"?2.7:1,.2,"#c38143");
    }
  });
}
export function draw(c,shot,frame,dur,fps) {
  const p=frame/Math.max(1,dur-1), t=frame/fps;
  const dist={detail:4.8,wide:7.1,portrait:5.35,medium:6.2}[shot.lens];
  const s=new Stage(c,{x:shot.lens==="detail"?.26:0,y:1.56,dist:dist-.32*ease(p),yaw:-.13+.16*ease(p),pitch:.11});
  c.setTransform(2,0,0,2,0,0);c.fillStyle="#72a7b5";c.fillRect(0,0,540,960);
  scenery(s,shot.room,t,p);item(s,shot.prop,p,t);
  person(s,shot.actor,-.95+(shot.action==="walk"?.68*ease(p):0),.65,t,p,shot.action);
  if(shot.room==="car" && shot.actor!=="child") person(s,"child",.6,-.65,t,p,"signal");
  if(shot.room==="glass" && shot.actor!=="father") person(s,"father",.7,-.75,t,p,"turn");
  s.flush();
}
