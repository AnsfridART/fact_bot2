import {Stage,environment,ramp,ease,clamp} from './world.js';
const TAU=Math.PI*2;
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill()}
function cartStatus(t){
 if(t<7)return 10+5*ramp(t,1.3,2.4);
 return 5*(ramp(t,18.25,19.30)+ramp(t,29.44,30.5)+ramp(t,41.51,42.5)-ramp(t,48.36,48.95)-ramp(t,51.40,52)-ramp(t,54.87,55.65)+ramp(t,71.09,71.73));
}
function settings(t){
 const p=(a,b)=>ramp(t,a,b), lin=(a,b)=>clamp((t-a)/(b-a));
 let loc='bakery',cart=.53,bob=-.76,baker=1.96,cam=0,y=1.43,dist=5.35,yaw=-.13,pitch=.11,run=0,air=0,cartZ=.1,personZ=.16;
 if(t<3){loc='market';cart=.2+lin(0,3)*2.8;bob=cart-1.12;baker=cart-3;cam=cart-.26;dist=4.65+.65*p(.1,2.8);run=1;y=1.20;yaw=-.25}
 else if(t<7){loc='market';cart=.4;bob=-.8;cam=-.42+.95*p(3,7);dist=8.5;pitch=.57;y=1.05;yaw=-.52+.38*p(3,7)}
 else if(t<10.5){cam=-.8+.9*p(7,10.5);dist=7.0-.85*p(7,10.5);yaw=-.32;y=1.55}
 else if(t<13.55){cam=-.18;dist=3.65;y=1.89;bob=-.48;cart=.32;baker=2.3;yaw=-.10}
 else if(t<19.1){bob=-.55;baker=.54;cart=.95;cartZ=-.85;cam=t<16.63?.29:-.56;dist=t<16.63?4.32:3.45;y=1.73;yaw=t<16.63?.30:-.27}
 else if(t<26.8){loc='market';cart=-2+lin(19.1,26.8)*10;bob=cart-1.27;baker=cart-2.72;cam=cart-(t<23?.30:1.35);run=ramp(t,19.1,19.9);dist=t<23?6.3:7.15;y=1.16;yaw=t<23?-.32:.16;pitch=.15}
 else if(t<30.05){loc='market';bob=.43;baker=-.6;cart=2.18;cam=-.03;y=1.68;dist=4.1;run=.62;yaw=.04}
 else if(t<34.05){loc='market';cart=2+(t-30)*2.2;bob=cart-1.18;baker=cart-2.60;cam=cart-.9;dist=7.8;y=1.25;run=1;yaw=-.25}
 else if(t<38){loc='bridge';cart=-5.6+.40*(t-34);bob=cart-1;baker=cart-2.5;cam=-1.2;dist=9;pitch=.38;y=.55;run=.7;yaw=-.34}
 else if(t<46){loc='bridge';cart=-4.05+.12*(t-38);bob=cart-1.07;baker=cart-2;cam=t<41.85?bob:cart+.42;dist=t<41.85?4.25:6.8;y=t<41.85?1.66:.83;pitch=t<41.85?.12:.32;run=.80;yaw=-.18}
 else if(t<55.75){loc='bridge';cart=-3.1+.12*(t-46);bob=cart-1.27;baker=cart-2.38;cam=bob+.14;dist=t<49?4.5:t<52?4.02:3.76;y=1.62;run=.70;yaw=-.12}
 else if(t<60){loc='bridge';const u=lin(55.75,60);cart=-1.96+u*3.95;air=1.62*Math.sin(Math.PI*clamp((u-.17)/.83));bob=-3+.75*u;baker=-4+.9*u;cam=-1+.36*(t-55.75);dist=6.6+.65*p(55.75,59.8);y=1.25;pitch=.24;yaw=-.28}
 else if(t<64.2){loc='party';cart=-2.1+2.6*ease(lin(60,63.2));air=.53*(1-p(60,60.8));bob=-3.8+2.5*p(60.6,63.9);baker=-4+1.9*p(61.2,64);cam=-.52+.62*p(60,63.2);y=1.22;dist=7.4;run=1-p(62,64);yaw=-.22}
 else{loc='party';cart=.46;bob=-.66;baker=.78;cartZ=-.77;cam=t<69.55?.13:-.56;dist=t<69.55?5.3:3.73;y=1.66;yaw=t<69.55?.09:-.16}
 return {loc,cart,bob,baker,cam,y,dist,yaw,pitch,air,run,cartZ,personZ}
}
function bicycle(s,x,t){s.object(x,.65,-.63,()=>{
 for(const k of [-.44,.44]){const [a,b,,u]=s.project(x+k,.39,-.63);s.c.beginPath();s.c.arc(a,b,u*.33,0,TAU);s.c.strokeStyle='#364050';s.c.lineWidth=5;s.c.stroke();
 for(let i=0;i<4;i++){let v=t*7+i*Math.PI/4;s.line([x+k-.31*Math.cos(v),.39-.31*Math.sin(v),-.63],[x+k+.31*Math.cos(v),.39+.31*Math.sin(v),-.63],'#7b8581',1.3)}}
 for(const [a,b] of [[[-.44,.39],[0,.75]],[[0,.75],[.24,.41]],[[.24,.41],[-.44,.39]],[[.24,.41],[.36,.92]],[[.36,.92],[.44,.39]],[[0,.75],[-.10,.98]]])s.line([x+a[0],a[1],-.63],[x+b[0],b[1],-.63],'#db6950',4)
 })}
function gauge(c,degrees){
 c.save();c.translate(38,115);c.fillStyle='#233c48';c.beginPath();c.roundRect(0,0,147,63,13);c.fill();
 c.fillStyle='#fff1ce';c.font='bold 15px sans-serif';c.fillText('НАКЛОН',14,22);
 c.font='900 30px sans-serif';c.fillText(Math.round(degrees)+'°',13,52);c.strokeStyle='#82a49b';c.lineWidth=2;c.beginPath();c.moveTo(80,40);c.lineTo(132,40);c.stroke();
 c.translate(106,40);c.rotate(degrees*Math.PI/180);c.strokeStyle='#ffc06e';c.lineWidth=5;c.beginPath();c.moveTo(-25,0);c.lineTo(25,0);c.stroke();c.restore()
}
function captions(c,t,lines){
 const cue=lines.find(([a,b])=>t>=a&&t<=b);if(!cue)return;
 const [a,b,line]=cue;const words=line.split(' ');let chunks=[],chunk=[];
 c.font='bold 29px DejaVu Sans, sans-serif';
 for(const w of words){if(c.measureText([...chunk,w].join(' ')).width>410&&chunk.length){chunks.push(chunk.join(' '));chunk=[]}chunk.push(w)}chunks.push(chunk.join(' '));
 let pairs=[];while(chunks.length)pairs.push(chunks.splice(0,2));const pair=pairs[Math.min(pairs.length-1,Math.floor((t-a)/(b-a)*pairs.length))];
 const width=Math.max(...pair.map(l=>c.measureText(l).width))+36,H=pair.length*37+18;
 c.save();c.translate(261,783);c.fillStyle='rgba(32,41,54,.93)';c.beginPath();c.roundRect(-width/2,-H/2,width,H,14);c.fill();c.fillStyle='#fff6db';c.textAlign='center';c.textBaseline='middle';pair.forEach((l,i)=>c.fillText(l,0,(i-(pair.length-1)/2)*37));c.restore()
}
export function draw(c,t,story){
 const q=settings(t),deg=cartStatus(t),tilt=deg*Math.PI/180;
 c.save();c.scale(c.canvas.width/540,c.canvas.height/960);c.lineJoin='round';c.lineCap='round';
 c.save();c.translate(270,480);c.rotate(tilt);c.translate(-270,-480);
 const s=new Stage(c,{x:q.cam,y:q.y,dist:q.dist,yaw:q.yaw,pitch:q.pitch});
 environment(s,q.loc,q.cam,t,ramp(t,34,38));
 if(t>=30&&t<34.1)bicycle(s,4.5+.16*(t-30),t);
 if(q.loc==='party'){for(let i=0;i<4;i++)s.person(-1.7+i*1.05,-1.1,t+i,{guest:i+1,baker:i%2===0,face:i<2?1:-1,point:.6,lean:.04*Math.sin(t*3+i),look:1},1.85,.06*Math.abs(Math.sin(t*3+i)))}
 const speak=story.lines.find(([a,b])=>t>a&&t<b);
 const bl=(shift)=>Math.max(0,1-Math.abs((t+shift)%3.9-2.5)/.12);
 let reach=t>10.5&&t<13.55?Math.sin(Math.PI*clamp((t-10.5)/3.05)):0;
 s.person(q.bob,q.personZ,t,{run:q.run,panic:t<3||t>34&&t<55.75?.95:.05,talk:speak?.55+.42*Math.sin(18*t):0,point:t<3?.9:.72*(ramp(t,37.9,38.4)-ramp(t,41.3,41.8)),reach,lean:-tilt*.65,blink:bl(0),look:t>67?-.8:1});
 s.person(q.baker,-.16,t+.23,{baker:true,run:q.run,face:q.baker<q.bob?1:-1,look:1,point:.7*(ramp(t,13.5,14)-ramp(t,18.6,19)),lean:-tilt*.54,blink:bl(1.3),talk:t>67&&t<69.5?.62:0});
 s.cake(q.cart,q.cartZ,t,q.air+(t<3?.45*(1-ramp(t,0,1.15)):0),t>=7&&t<11.3);
 if(t>=11.3&&t<12.45){const u=ramp(t,11.3,12.45);s.object(0,2,.39,()=>{const [x,y,,sc]=s.project(q.cart+(q.bob+.12-q.cart)*u,1.75-.33*u+.34*Math.sin(Math.PI*u),.36);circle(c,x,y,sc*.085,'#bd3347')})}
 if((t<3||t>=19.3&&t<34||t>55.75&&t<59.7)&&q.loc!=='bakery'){
   for(let i=0;i<5;i++){
     const life=(t*1.5+i*.2)%1;
     const [px,py,,sc]=s.project(q.cart-.47-life*.94,.15+life*.27,q.cartZ+.2);
     c.save();c.globalAlpha=(1-life)*.55;circle(c,px,py,sc*(.042+.10*life),'#fff2d1');c.restore();
   }
 }
 s.flush();
 if(t<1.4){c.save();c.globalAlpha=.66*(1-ramp(t,.50,1.4));for(let i=0;i<4;i++){c.strokeStyle='#fff4ce';c.lineWidth=2+i%2;c.beginPath();c.moveTo(-15,280+i*77);c.lineTo(55-i*7,292+i*77);c.stroke()}c.restore()}
 if(q.loc==='party'&&t<64.35){for(let i=0;i<35;i++){const x=(i*79+Math.sin(t*2+i)*13)%560,y=((t-60)*(42+i%7*9)+i*43)%920;c.save();c.translate(x,y);c.rotate(t+i);c.fillStyle=['#e56e55','#4b8e91','#f8ca73'][i%3];c.fillRect(-2,-5,4,10);c.restore()}}
 c.restore();gauge(c,deg);captions(c,t,story.lines);c.restore()
}
