// Inked cutout puppets. Coordinates are relative to the planted foot.
const I='#26263c', ivory='#fff2c8', skin='#f6aa77', blush='#dd715f';
function path(c,d,color,stroke=I,width=2.6){
  const p=new Path2D(d); if(color){c.fillStyle=color;c.fill(p)} if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}
}
function ellipse(c,x,y,rx,ry,color,stroke=null,w=2){
  c.beginPath();c.ellipse(x,y,rx,Math.max(.1,ry),0,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}
}
function limb(c,x,y,kx,ky,ex,ey,color,width){
  const p=new Path2D();p.moveTo(x,y);p.quadraticCurveTo(kx,ky,ex,ey);
  for(const [col,w] of [[I,width+4],[color,width]]){c.strokeStyle=col;c.lineWidth=w;c.stroke(p)}
}
export function puppet(c,t,{baker=false,run=0,panic=0,talk=0,face=1,point=0,look=1,lean=0,blink=0,reach=0,guest=0,turn=.55}={}){
  c.save();c.scale(face,1);c.lineJoin='round';c.lineCap='round';
  const step=t*(baker?9.2:10.5), wave=Math.sin(step)*run, bob=run*4*Math.abs(Math.cos(step))+1.2*Math.sin(t*2.5);
  const cloth=baker?'#276c70':'#274963',coat=guest?['','#e6a43f','#ae7c99','#78a896','#e3a487'][guest]:baker?'#e68561':'#fff1c8';
  for(const s of [-1,1]){
    const heel=wave*18*s, lift=Math.max(0,Math.cos(step)*s)*13*run;
    limb(c,s*9,-45,heel*.3+s*9,-20-lift,heel+s*11,-5-lift,cloth,10);
    c.save();c.translate(heel+s*11,-5-lift);c.rotate(wave*s*.18);
    path(c,'M-7 -3 Q1 -6 7 -2 L14 0 Q18 4 13 5 L-7 5 Z','#442e3c');c.restore();
  }
  c.translate(0,-bob);c.rotate(lean+.12*run);
  limb(c,-12,-79,-22+wave*14,-61,-14+wave*21,-50+wave*6,coat,10);
  ellipse(c,-14+wave*21,-49+wave*6,5,6,skin,I);
  path(c,'M-14 -89 Q-4 -96 12 -87 L21 -53 L25 -37 Q5 -31 -22 -37 L-16 -60 Z',coat);
  path(c,'M-15 -75 Q-16 -51 -21 -38 L-7 -37 L-3 -72 Z',baker?'#bd6255':'#c4c7ac',null);
  if(baker){path(c,'M-10 -76 L9 -77 L15 -43 L-13 -42 Z','#f8db99');path(c,'M-7 -56 Q1 -52 8 -57 L6 -49 Q0 -46 -6 -50Z','#e99d73',I,1.4)}
  else{path(c,'M-11 -87 L9 -86 L4 -71 L-4 -74Z','#dc583e');path(c,'M-5 -79 L2 -78 Q-8 -65 -18 -61 L-15 -69 L-27 -69 Q-14 -72 -5 -79Z','#f15d3f');path(c,'M4 -66 L15 -66 L14 -58 Q8 -54 4 -60Z',null,I,1.4)}
  c.save();c.translate(0,-86);c.rotate(lean*.25-.04+panic*.08);
  const yaw=Math.sin(turn*1.42), depth=Math.abs(yaw);
  ellipse(c,0,-24,26,30,skin,I);
  const ear=-23*yaw;
  ellipse(c,ear,-17,5,7,skin,I,1.8);
  path(c,'M-26 -28 Q-31 -46 -21 -52 L-26 -52 L-14 -61 L-14 -56 Q1 -66 13 -58 Q27 -57 27 -42 Q13 -48 7 -40 Q-1 -45 -11 -37 L-19 -29 Z',baker?'#633649':'#e9e1bf');
  if(guest){path(c,'M-26 -42 Q-17 -63 -4 -59 Q9 -78 20 -50 L31 -45 Q17 -39 -26 -42Z',guest%2?'#a56c73':'#418087');}else if(baker){path(c,'M-21 -46 Q-34 -49 -29 -61 Q-26 -69 -17 -66 Q-12 -79 0 -74 Q8 -78 15 -69 Q28 -70 29 -59 Q29 -52 21 -49 L20 -42 Z',ivory)}

  const open=Math.max(.08,1-.95*blink);
  const middle=15*yaw, spacing=11*(1-.68*depth);
  for(const side of [-1,1]){
    const far=side*yaw>0, visibility=far?1-depth**4:1;
    if(visibility<.11)continue;
    const x=middle+side*spacing,r=7.8*visibility;
    ellipse(c,x,-26,r,8*open,ivory,I,1.25);
    ellipse(c,x+look*1.7*visibility,-26,2.65*visibility,4*open,I);
    if(!baker&&!guest){c.beginPath();c.ellipse(x,-26,r+1.7,9.6,0,0,Math.PI*2);c.strokeStyle='#203c48';c.lineWidth=2;c.stroke()}
    path(c,'M'+(x-r)+' -37 q'+r+' '+(-4-panic*3)+' '+(2*r)+' -1',null,I,2);
  }
  const nose=middle+12*yaw;
  path(c,'M'+middle+' -24 Q'+nose+' -17 '+(nose+2)+' -16 Q'+(nose+1)+' -12 '+(middle-2)+' -15',skin,I,1.9);
  ellipse(c,middle-8,-12,3.8,1.8,blush);
  ellipse(c,middle,-6.7,4,1.2+talk*3+panic*1.4,'#69363d');
  c.restore();
  const handX=17+point*18+reach*12-wave*22, handY=-58-point*25-reach*33+wave*8;
  limb(c,13,-78,16+point*8-wave*12,-59,handX,handY,coat,10);ellipse(c,handX,handY,5.8,6,skin,I);
  if(point>.4) limb(c,handX+2,handY,handX+5,handY-1,handX+8,handY-4,skin,3);
  if(baker&&!guest){c.save();c.translate(handX,handY);c.rotate(.32+.30*wave);path(c,'M-1 1 L-1 -18 Q-7 -22 -5 -33 L3 -34 Q8 -24 2 -19 L2 1Z','#a98054',I,1.6);c.restore()}
  c.restore();
}
