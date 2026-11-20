// Perspective stage. Scenery, carts, water and cast shadows use world coordinates.
import {puppet} from './actors.js';
const TAU=2*Math.PI,ink='#3b3846';
export const clamp=n=>Math.min(1,Math.max(0,n));
export function ease(n){n=clamp(n);return n*n*(3-2*n)}
export function ramp(t,a,b){return ease((t-a)/(b-a))}
const shade=(s,k)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(s.slice(i,i+2),16)*k))).toString(16).padStart(2,'0')).join('');
export class Stage {
 constructor(c,cam){this.c=c;this.cam=cam;this.objects=[]}
 project(x,y,z){
  const {x:cx,y:cy,dist,yaw,pitch}=this.cam, dx=x-cx,dy=y-cy;
  const h=dx*Math.sin(yaw)+z*Math.cos(yaw), depth=dist-h*Math.cos(pitch)-dy*Math.sin(pitch);
  const s=720/Math.max(.15,depth);
  return [270+(dx*Math.cos(yaw)-z*Math.sin(yaw))*s,480-(dy*Math.cos(pitch)-h*Math.sin(pitch))*s,depth,s]
 }
 poly(points,color,stroke=null,w=1){
  const p=points.map(v=>this.project(...v));if(p.some(v=>v[2]<.18))return;
  const c=this.c;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}
 }
 line(a,b,col,w=2){const p=this.project(...a),q=this.project(...b),c=this.c;if(Math.min(p[2],q[2])<.15)return;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
 box(x,y,z,w,h,d,col){
  const X=x+w/2,A=x-w/2,Z=z+d/2,B=z-d/2,H=y+h;
  const faces=[[[[A,y,Z],[X,y,Z],[X,H,Z],[A,H,Z]],col],[[[A,H,B],[X,H,B],[X,H,Z],[A,H,Z]],shade(col,1.09)],
  [[ [A,y,B],[A,y,Z],[A,H,Z],[A,H,B] ],shade(col,.79)],[[[X,y,Z],[X,y,B],[X,H,B],[X,H,Z]],shade(col,.86)]];
  faces.sort((a,b)=>this.depth(b[0])-this.depth(a[0]));for(const [p,color] of faces)this.poly(p,color,shade(col,.79),.65)
 }
 depth(p){return p.reduce((n,v)=>n+this.project(...v)[2],0)/p.length}
 object(x,y,z,fn){this.objects.push([this.project(x,y,z)[2],fn])}
 flush(){this.objects.sort((a,b)=>b[0]-a[0]);for(const [,draw] of this.objects)draw()}
 label(x,y,z,txt,color,size){const p=this.project(x,y,z),c=this.c;c.save();c.translate(p[0],p[1]);c.scale(p[3]/100,p[3]/100);c.fillStyle=color;c.font='900 '+size+'px Trebuchet MS, DejaVu Sans, sans-serif';c.textAlign='center';c.fillText(txt,0,0);c.restore()}
 shadow(x,z,rx,rz,alpha=.15){const pts=[];for(let i=0;i<28;i++){let a=i*TAU/28;pts.push([x+rx*Math.cos(a),.017,z+rz*Math.sin(a)])}this.poly(pts,'rgba(58,48,61,'+alpha+')')}
 cylinder(x,y,z,r,h,col,k=30){
  const ring=(Y)=>Array.from({length:k},(_,i)=>[x+r*Math.cos(i*TAU/k),Y,z+r*Math.sin(i*TAU/k)]);
  const top=ring(y+h),base=ring(y),faces=[];
  for(let i=0;i<k;i++){let j=(i+1)%k;const p=[base[i],base[j],top[j],top[i]];faces.push([this.depth(p),p,shade(col,.84+.14*Math.cos((i+.5)*TAU/k+1.7))])}
  faces.sort((a,b)=>b[0]-a[0]);for(const [,p,color] of faces)this.poly(p,color,color,1);this.poly(top,shade(col,1.05));
 }
 person(x,z,t,opts,h=2.28,y=0){this.object(x,y+1,z,()=>{this.shadow(x,z,.43,.21);let [u,v,,s]=this.project(x,y,z);
 const c=this.c;c.save();c.translate(u,v);c.scale(h*s/150,h*s/150);puppet(c,t,opts);c.restore()})}
 cake(x,z,t,jump,cherry){
  this.object(x,.7+jump,z,()=>{this.shadow(x,z,.76,.35,.17/(1+jump));const y=jump;
   for(const sign of [-1,1]){const p=this.project(x+sign*.48,y+.14,z+.31),c=this.c;c.beginPath();c.arc(p[0],p[1],p[3]*.14,0,TAU);c.fillStyle='#34384c';c.fill();c.beginPath();c.arc(p[0],p[1],p[3]*.06,0,TAU);c.fillStyle='#efc078';c.fill();const a=t*9;this.line([x+sign*.48,y+.14,z+.32],[x+sign*.48+.08*Math.cos(a),y+.14+.08*Math.sin(a),z+.32],'#fff1c8',1.6)}
   this.box(x,y+.25,z,1.4,.11,.84,'#397d81');
   this.cylinder(x,y+.38,z,.63,.11,'#d99a52');this.cylinder(x,y+.47,z,.55,.42,'#eda69c');this.cylinder(x,y+.82,z,.56,.12,'#fff1c8');
   this.cylinder(x,y+.94,z,.38,.36,'#efbda2');this.cylinder(x,y+1.23,z,.39,.10,'#fff0ce');this.cylinder(x,y+1.33,z,.235,.22,'#e6a19a');this.cylinder(x,y+1.50,z,.24,.09,'#fff5d4');
   for(let i=0;i<7;i++){let a=i*Math.PI/6;const [u,v,,s]=this.project(x+.53*Math.cos(a),y+.83,z+.54*Math.sin(a));this.c.beginPath();this.c.ellipse(u,v,.050*s,.075*s,0,0,TAU);this.c.fillStyle='#fff0c8';this.c.fill()}
   if(cherry){this.cylinder(x,y+1.59,z,.105,.15,'#c13c43');this.line([x,y+1.72,z],[x+.07,y+1.85,z],'#40685a',2)}
  })
 }
}
const walls=['#e7a052','#d87851','#599d91','#e3b887','#c96660'];
function house(s,x,z,i,shop=false){
 const w=4.4,h=4+((i%3+3)%3)*.52,front=z+.95,col=walls[(i%5+5)%5];
 s.object(x,2,z,()=>{s.box(x,0,z,w,h,1.9,col);s.box(x,h-.12,z,w+.20,.23,2.03,'#82625d');
 s.box(x+.98,h,z-.22,.36,.71,.49,'#b37c66');
 for(let floor=0;floor<2;floor++)for(let j=-1;j<=1;j++){
 let X=x+j*1.22,Y=1.94+floor*1.22;
 if(Y+.85>h)continue;s.box(X,Y,front+.04,.71,.89,.09,'#edcf9e');s.box(X,Y+.08,front+.105,.56,.73,.06,'#526f77');
 s.line([X,Y+.08,front+.148],[X,Y+.81,front+.148],'#e3bd8e',2);
 s.line([X-.28,Y+.47,front+.15],[X+.28,Y+.47,front+.15],'#e3bd8e',2);s.box(X,Y-.04,front+.09,.80,.09,.22,'#ba8872')}
 s.box(x,.12,front+.08,1.10,1.42,.08,'#47666c');
 for(const dir of [-1,1])s.box(x+dir*1.33,.39,front+.08,.94,.82,.10,'#92b9b4');
 s.box(x,1.55,front+.10,3.7,.36,.13,shop?'#305c62':'#b38264');
 if(shop)s.label(x,1.61,front+.19,'П Е К А Р Н Я','#ffe6a6',20);
 for(let a=0;a<9;a++){let l=x-1.84+a*.41;let color=a%2?'#faf0c9':shop?'#ca5a49':'#247e78';
 s.poly([[l,1.53,front+.20],[l+.41,1.53,front+.20],[l+.41,1.27,front+.79],[l,1.27,front+.79]],color);
 s.box(l+.205,1.18,front+.785,.406,.09,.04,color)}
 })
}
function stall(s,x,z,i){s.object(x,1,z,()=>{s.box(x,.1,z,1.55,.74,.72,'#a77a50');for(const a of [-.67,.67])s.box(x+a,.81,z,.065,1.12,.07,'#85674e');
 for(let j=0;j<7;j++){let x0=x-.87+j*.25;s.poly([[x0,1.92,z-.42],[x0+.25,1.92,z-.42],[x0+.25,1.72,z+.54],[x0,1.72,z+.54]],j%2?'#ffe7aa':i%2?'#cc624d':'#4d9390')}
 for(let j=0;j<8;j++)s.cylinder(x-.61+.17*j,.85,z,.096,.13,i%2?'#ec914d':'#b9534b')})}
function posts(s,start,end,z){for(let i=start;i<end;i+=1.5){s.object(i,.5,z,()=>{s.box(i,0,z,.11,.78,.12,'#52777a');s.box(i+.74,.60,z,1.49,.068,.09,'#749394')})}}
function flagLine(s,x,z){s.object(x,2.4,z,()=>{s.box(x-2,0,z,.085,3.5,.08,'#96745d');s.box(x+2,0,z,.085,3.5,.08,'#96745d');
 for(let i=0;i<12;i++){let X=x-2+i/3,Y=3.46-.32*Math.sin(i/12*Math.PI);s.line([X,Y,z],[X+.34,3.46-.32*Math.sin((i+1)/12*Math.PI),z],'#725f58',1.3);s.poly([[X,Y,z],[X+.25,Y-.02,z],[X+.14,Y-.27,z]],['#da6851','#f5cb79','#699e99'][i%3])}})}
export function environment(s,loc,center,t,bridgeLift=0){
 const c=s.c;const sky=c.createLinearGradient(0,-100,0,800);sky.addColorStop(0,'#328fc1');sky.addColorStop(.65,'#ffce84');sky.addColorStop(1,'#ffe2a6');c.fillStyle=sky;c.fillRect(-900,-900,2400,2800);
 for(let i=-4;i<7;i++){const X=(i*178+234-center*5)%1500,Y=170+Math.sin(i*3+1)*73;
 c.fillStyle='#fff0cd';c.beginPath();c.ellipse(X,Y,46,8,0,0,TAU);c.ellipse(X+12,Y-6,23,10,0,0,TAU);c.fill()}
 // A separate skyline, middle facades and near props produce visible parallax.
 const start=Math.floor(center/4.6);
 for(let i=start-5;i<=start+5;i++){s.box(i*4.6,0,-12,4.45,3.5+1.5*Math.sin(i*1.9+2),2,'#9fb7ad')}
 const bridge=loc==='bridge',party=loc==='party';
 for(let j=-4;j<4;j++)for(let i=start-4;i<start+5;i++){
 const x=i*4.6,z=j*2; s.poly([[x,0,z],[x+4.6,0,z],[x+4.6,0,z+2],[x,0,z+2]],bridge?'#258caa':j<-1?'#e9c692':(i+j)%2?'#dda967':'#ebc394');
 if(bridge){for(let k=0;k<3;k++)s.line([x+k*1.35,.01,z+.4+k*.28],[x+k*1.35+.65,.01,z+.38+k*.28],'#a7d2bd',2)}
 else s.line([x+.26,.01,z+.21],[x+.78,.01,z+.21],'#cba982',1)
 }
 if(loc==='bakery'){
 s.object(0,2,-3,()=>{s.box(0,0,-3,19,6,.20,'#257783');s.box(0,0,-2.85,18,1.30,.12,'#61a394');
 for(let i=-8;i<=8;i++)s.line([i,.06,-2.77],[i,1.23,-2.77],'#91aa98',1.6);
 s.box(-1.55,1.36,-2.74,2.0,2.07,.15,'#f0c18d');s.box(-1.55,1.47,-2.64,1.76,1.84,.10,'#afd2c6');
 s.box(-1.55,1.45,-2.54,.075,1.89,.10,'#f6d6a1');s.box(-1.55,2.38,-2.54,1.79,.075,.10,'#f6d6a1');
 s.box(1.10,2.0,-2.72,2.15,1.22,.12,'#af7b57');s.box(1.10,2.1,-2.60,1.96,1.02,.08,'#36595b');s.label(1.10,2.73,-2.52,'МЕНЮ','#f7db9e',20);
 for(let j=0;j<3;j++)s.line([.48,2.57-j*.13,-2.52],[1.66-j*.12,2.57-j*.13,-2.52],'#b3c3a4',1.7);
 for(let k=0;k<3;k++){const X=-3+k*2.7;s.line([X,5.65,-2.2],[X,3.92,-2.2],'#514d50',2);s.cylinder(X,3.81,-2.2,.32,.13,'#dca75f')}
 s.box(0,0,-1.92,12,.84,.62,'#ab7761');s.box(0,.84,-1.92,12,.11,.68,'#e5bf8c');
 for(let j=0;j<14;j++){const X=-4+j*.57;s.cylinder(X,.98,-1.96,.21,.12,'#dfaa62');s.line([X-.10,1.11,-1.95],[X+.04,1.11,-1.88],'#fff1b7',2)}
 });
 } else if(!bridge&&!party){for(let i=start-3;i<=start+3;i++)house(s,i*4.6,-3.1,i,loc==='bakery'&&i===0)}
 if(loc==='market'){for(let i=start-2;i<=start+2;i++)stall(s,i*4.6+1.3,-1.23,i);flagLine(s,center-center%6,-1.8)}
 if(bridge){
 for(const x of [-3.25,2.85])s.object(x,.4,-1.65,()=>{s.box(x,-.45,-1.65,.51,2.36,.58,'#60858b');s.box(x,1.9,-1.65,.67,.14,.72,'#e4c298');s.box(x,2.04,-1.65,.27,.39,.32,'#b95548');
 s.line([x,1.80,-1.65],[x-2.40,.18,-1.65],'#526d75',3);s.line([x,1.80,-1.65],[x+2.40,.18,-1.65],'#526d75',3)});
 for(let i=start-4;i<start+5;i++){const x=i*4.6;house(s,x,-9,i)}
 // Two bascule leaves; the front deck stays below the actors, with the opening at x=0.
 for(const dir of [-1,1]){const a=dir<0?-12:.76,b=dir<0?-.76:12;
 s.poly([[a,.035,-1.28],[b,.035,-1.28],[b,.035,1.28],[a,.035,1.28]],'#cb9b74');
 for(let x=a;x<b;x+=.36)s.line([x,.05,-1.26],[x,.05,1.25],'#b98a69',1.6);
 posts(s,Math.ceil(a),Math.floor(b)-1,-1.30)}
 for(const dir of [-1,1]){let k=dir*.77;const y=.06+bridgeLift*.83;
 s.poly([[dir*2.4,.06,-1.24],[dir*2.4,.06,1.24],[k,y,1.24],[k,y,-1.24]],'#e1aa79')}
 }
 if(party){for(let j=0;j<3;j++)flagLine(s,-3+j*3.2,-3.3);for(let i=start-4;i<=start+4;i++){house(s,i*4.6,-6.5,i)}
 for(const x of [-2.25,2.25])s.object(x,1.6,-1.5,()=>s.box(x,0,-1.5,.19,3.54,.22,'#e2c89b'));
 s.object(0,3.2,-1.5,()=>{s.box(0,3.42,-1.5,4.64,.23,.3,'#dbac84');s.label(0,3.0,-1.45,'С В А Д Ь Б А','#694c49',25)});
 flagLine(s,0,-1.32);
 }
}
