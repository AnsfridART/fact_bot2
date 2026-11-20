import {Build, M} from '../src/three/engine.js';

const ink='#172e35', skin='#ef9973', pink='#e87370', mint='#318e87', white='#fff4de', red='#df4435';
const clamp = x => Math.max(0,Math.min(1,x));
function move(t,a,b) {
  const u=clamp((t-a)/(b-a));
  return u*u*u*(10-15*u+6*u*u);
}
const hold=(t,a,b,c,d)=>move(t,a,b)-move(t,c,d);
function group(b,x,y,z,angle,draw) {
  b.push(M.tr(x,y,z),M.rz(angle)); draw(); b.pop();
}
function oval(b,x,y,z,rx,ry,rz,color) {
  b.push(M.tr(x,y,z),M.s3(rx,Math.max(.003,ry),rz));
  b.add('sph:1:32:24',color); b.pop();
}
function rod(b,a,c,r,color) {b.seg(a,c,r,r,color,{seg:12});}
function arc(b,x,y,z,rx,ry,from,to,r,color,steps=24) {
  let prev;
  for(let i=0;i<=steps;i++) {
    const angle=from+(to-from)*i/steps;
    const p=[x+rx*Math.cos(angle),y+ry*Math.sin(angle),z];
    if(prev) rod(b,prev,p,r,color);
    prev=p;
  }
}
function specs(b,x,y,z,size=1,tilt=0) {
  group(b,x,y,z,tilt,()=>{
    b.push(M.s3(size,size,size));
    for(const sign of [-1,1]) arc(b,.153*sign,0,0,.147,.128,0,Math.PI*2,.016,ink);
    rod(b,[-.025,.018,0],[.025,.018,0],.014,ink); b.pop();
  });
}
function eyes(b,x,y,z,spacing,gaze,openness=1) {
  for(const side of [-1,1]) {
    const px=x+side*spacing;
    oval(b,px,y,z,.056,.071*openness+.008,.035,white);
    oval(b,px+gaze*.018,y,z+.031,.027,.047*openness+.004,.016,ink);
    if(openness>.35) oval(b,px+gaze*.018-.008,y+.019*openness,z+.045,.008,.009*openness,.004,white);
  }
}
function head(b,x,y,angle,awake,gaze,mouth,glasses=true,scale=1) {
  group(b,x,y,0,angle,()=>{
    b.push(M.s3(scale,scale,scale));
    oval(b,0,0,0,.385,.39,.31,skin);
    for(const side of [-1,1]) {
      oval(b,.365*side,-.025,.01,.073,.092,.065,skin);
      oval(b,.236*side,-.094,.216,.058,.026,.025,pink);
      oval(b,.15*side,.137,.258,.081,.022,.027,ink);
    }
    // Silver waves give Bob a recognizable silhouette even when his face is asleep.
    for(let i=0;i<5;i++) oval(b,-.25+i*.101,.285+.052*Math.sin(i*.85),.07,.13,.10,.18,'#c8c3af');
    eyes(b,0,.047,.295,.146,gaze,awake);
    oval(b,.024,-.044,.337,.096,.075,.09,'#f28a64');
    oval(b,.016,-.157,.273,.064,.012+.074*mouth,.021,'#803e38');
    if(glasses) specs(b,0,.043,.35);
    b.pop();
  });
}
function doctor(b,id,t) {
  const awake=id==='clock'?hold(t,1.65,2.10,9,9.57):1;
  const blink=hold(t,3.80,3.91,3.93,4.06)+hold(t,8.38,8.50,8.51,8.64);
  const sleeping=1-awake;
  const gaze=id==='mirror'?-hold(t,4.1,4.5,5.5,5.95)+.6:1;
  const nod=.035*Math.sin(3*t)*hold(t,2,2.6,4.1,4.6);
  const y=1.50-.43*sleeping+.018*Math.sin(t*2)+nod;
  const x=-.53+.10*sleeping;
  const angle=.62*sleeping-.07;
  const speaking=id==='clock'?hold(t,7.32,7.49,8.98,9.13):id==='mirror'?hold(t,3.0,3.45,4.3,4.55):0;
  oval(b,-.53,.91,-.055,.34,.46,.23,white);
  oval(b,-.53,1.06,.152,.12,.22,.052,mint);
  for(const s of [-1,1]) oval(b,-.53+s*.13,1.08,.16,.062,.20,.057,white);
  if(id!=='mirror') oval(b,-.71,.82,.18,.105,.066,.045,mint);
  rod(b,[-.54,.87,.23],[-.24,.75,.32],.091,white);
  oval(b,-.16,.755,.335,.14,.072,.10,skin);
  const speechWindows={clock:[[2.2,4.0],[5.63,6.9],[9.7,11.25]],magnet:[[1.87,4.1],[6.1,7.61],[8.87,10.3]],mirror:[[2.17,3.75],[5.03,5.95],[8.37,10.1]]};
  const speech=speechWindows[id].reduce((v,[a,b])=>v+hold(t,a,a+.13,b-.12,b),0);
  const jaw=Math.max(speaking,speech*(.18+.32*(.5+.5*Math.sin(16*t))));
  const wears=id!=='magnet';
  head(b,x,y,angle,Math.max(.015,awake*(1-.95*blink)),gaze,jaw,wears);
  if(!wears) {
    const fly=move(t,8.12,8.73);
    specs(b,x+.995*fly,y+.042+(1.17-y)*fly+.16*Math.sin(Math.PI*fly),.36+.065*fly,1-.26*fly,-.07+.07*fly);
  }
  return {nose:[x+.024*Math.cos(angle)+.044*Math.sin(angle),y+.024*Math.sin(angle)-.044*Math.cos(angle),.405]};
}
function clock(b,t,bob) {
  const px=.53, py=1.09+.012*Math.sin(t*2);
  const flinch=hold(t,7.32,7.57,8.11,8.49);
  group(b,px,py+.065*flinch,0,-.09*flinch,()=>{
    oval(b,0,0,0,.363,.352,.172,red);
    oval(b,0,0,.128,.312,.299,.072,white);
    for(const s of [-1,1]) {
      oval(b,s*.21,.323,0,.13,.092,.1,red);
      rod(b,[s*.18,-.25,0],[s*.21,-.36,.01],.041,ink);
    }
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6; oval(b,.259*Math.cos(a),.247*Math.sin(a),.175,.011,.011,.01,'#805d50');
    }
    eyes(b,0,.017,.20,.098,-1,1-.75*flinch);
    rod(b,[0,.12,.195],[-.053,.181,.19],.013,ink);
    rod(b,[0,.12,.196],[.065,.161,.19],.012,ink);
    const tap=hold(t,.83,1.75,1.82,2.4)+hold(t,8.30,8.97,9.03,9.67);
    const wrist=[-.158,.795,.37];
    const end=wrist.map((v,i)=>v+(bob.nose[i]-v)*tap);
    const local=[end[0]-px,end[1]-py,end[2]];
    rod(b,[-.285,-.02,.05],[-.41,.014,.16],.036,red);
    rod(b,[-.41,.014,.16],local,.032,red);
    oval(b,...local,.05,.043,.042,red);
    const wave=hold(t,4.38,4.89,5.15,5.70);
    rod(b,[.30,-.03,0],[.38,.02+.22*wave,.08],.034,red);
  });
}
function spoon(b,x,y,z,angle) {
  group(b,x,y,z,angle,()=>{
    rod(b,[0,-.11,0],[0,.09,0],.017,'#7c929a');
    oval(b,0,.14,.003,.053,.085,.02,'#afbfc6');
  });
}
function magnet(b,t) {
  group(b,.48,1.10,0,.035*Math.sin(t*2),()=>{
    arc(b,0,.085,0,.235,.25,Math.PI,2*Math.PI,.077,red);
    for(const s of [-1,1]) {
      rod(b,[s*.235,.084,0],[s*.235,.255,0],.076,red);
      rod(b,[s*.235,.253,0],[s*.235,.344,0],.077,'#a1b7ba');
    }
    eyes(b,0,-.122,.088,.068,-1);
    for(let i=0;i<3;i++) {
      const drop=move(t,4.04+i*.21,4.54+i*.21);
      spoon(b,(-.22+.205*i)*(1+.4*drop),.16-.47*drop,.13+.09*drop,(-.7+.66*i)*(1-drop)+1.45*drop);
    }
  });
}
function mirror(b,t) {
  const steals=move(t,6.76,7.77);
  group(b,.49,1.31,0,.04*Math.sin(t*1.7),()=>{
    rod(b,[0,-.35,0],[.025,-.62,0],.064,mint);
    oval(b,0,0,0,.39,.485,.08,mint);
    oval(b,0,0,.073,.352,.443,.035,'#aacfd5');
    // The reflection opens its mouth a full beat before the doctor gives the instruction.
    const early=hold(t,.64,1.27,3.82,4.37);
    b.push(M.tr(0,0,.139));
    if(steals>.001) oval(b,0,-.33+.09*steals,.01,.23*steals,.143*steals,.048,white);
    head(b,0,.047,.12*early,1,-1,early,true,.69);
    b.pop();
  });
  if(steals<1) {
    const x=-.71+1.13*steals,y=.82+.22*steals+.28*Math.sin(Math.PI*steals);
    oval(b,x,y,.37,.105,.061,.02,mint);
    oval(b,x-.04,y,.392,.018,.018,.008,white);
  } else {
    oval(b,.43,1.047,.37,.102,.057,.022,mint);
    oval(b,.39,1.047,.393,.018,.018,.009,white);
  }
}
export function clinicScene(id,t) {
  const b=new Build();
  b.box(0,-.25,-2,8,5,.1,'#ebcfac');
  b.box(0,.05,-.07,4,.61,1.72,'#7cb7a7');
  b.box(0,.66,-.07,4,.045,1.72,'#a5ceba');
  // Low contrast wall plaque stays behind the action.
  oval(b,-.72,2.25,-1.80,.26,.26,.045,'#e6b99b');
  rod(b,[-.82,2.25,-1.74],[-.62,2.25,-1.74],.034,white);
  rod(b,[-.72,2.15,-1.74],[-.72,2.35,-1.74],.034,white);
  const bob=doctor(b,id,t);
  if(id==='clock') clock(b,t,bob);
  else if(id==='magnet') magnet(b,t);
  else mirror(b,t);
  const zoom=1-.042*move(t,.30,2.00);
  return {items:b.items,cam:{eye:[0,1.65,5.3*zoom],at:[0,1.19,0],fov:.75},
    lights:[{p:[-2.1,3.9,3.2],c:[1.30,1.14,.98],r:7}],
    sky:[.72,.70,.68],gnd:[.45,.43,.42],fog:[.86,.75,.63],fogD:0,dirt:0,snap:false,
    post:{bloom:0,grain:0,ca:0,vig:0,exp:1.03,tint:[1,1,1],lift:[0,0,0]}};
}
