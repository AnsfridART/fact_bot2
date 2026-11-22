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
 box(x,y,z,w,h,d,col,paintFace){
  const X=x+w/2,A=x-w/2,Z=z+d/2,B=z-d/2,H=y+h;
  const faces=[[[[A,y,Z],[X,y,Z],[X,H,Z],[A,H,Z]],col],[[[A,H,B],[X,H,B],[X,H,Z],[A,H,Z]],shade(col,1.09)],
  [[ [A,y,B],[A,y,Z],[A,H,Z],[A,H,B] ],shade(col,.79)],[[[X,y,Z],[X,y,B],[X,H,B],[X,H,Z]],shade(col,.86)]];
  faces.sort((a,b)=>this.depth(b[0])-this.depth(a[0]));for(const [p,color] of faces){if(paintFace)paintFace(p,color);else this.poly(p,color,shade(col,.79),.65)}
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
}
