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
export function puppet(c,t,{baker=false,run=0,panic=0,talk=0,face=1,point=0,look=1,lean=0,blink=0,reach=0,guest=0}={}){
  c.save();c.scale(face,1);c.lineJoin='round';c.lineCap='round';
  const step=t*10.5, wave=Math.sin(step)*run, bob=run*4*Math.abs(Math.cos(step))+1.2*Math.sin(t*2.5);
  const cloth=baker?'#276c70':'#274963',coat=guest?['','#e6a43f','#ae7c99','#78a896','#e3a487'][guest]:baker?'#e68561':'#fff1c8';
  for(const s of [-1,1]){
    const heel=wave*18*s, lift=Math.max(0,Math.cos(step)*s)*13*run;
    limb(c,s*9,-45,heel*.3+s*9,-20-lift,heel+s*11,-5-lift,cloth,10);
    c.save();c.translate(heel+s*11,-5-lift);c.rotate(wave*s*.18);
    path(c,'M-7 -3 Q1 -6 7 -2 L14 0 Q18 4 13 5 L-7 5 Z','#442e3c');c.restore();
  }
  c.translate(0,-bob);c.rotate(lean+.12*run);
  limb(c,-12,-79,-27-wave*13,-61,-24-wave*18,-50+wave*6,coat,10);
  ellipse(c,-24-wave*18,-49+wave*6,5,6,skin,I);
  path(c,'M-14 -89 Q-4 -96 12 -87 L21 -53 L25 -37 Q5 -31 -22 -37 L-16 -60 Z',coat);
  path(c,'M-15 -75 Q-16 -51 -21 -38 L-7 -37 L-3 -72 Z',baker?'#bd6255':'#c4c7ac',null);
  if(baker){path(c,'M-10 -76 L9 -77 L15 -43 L-13 -42 Z','#f8db99');path(c,'M-7 -56 Q1 -52 8 -57 L6 -49 Q0 -46 -6 -50Z','#e99d73',I,1.4)}
  else{path(c,'M-11 -87 L9 -86 L4 -71 L-4 -74Z','#dc583e');path(c,'M-5 -79 L2 -78 Q-8 -65 -18 -61 L-15 -69 L-27 -69 Q-14 -72 -5 -79Z','#f15d3f');path(c,'M4 -66 L15 -66 L14 -58 Q8 -54 4 -60Z',null,I,1.4)}
  c.save();c.translate(0,-86);c.rotate(lean*.25-.04+panic*.08);
  path(c,'M-23 -30 Q-25 -47 -9 -52 Q14 -59 25 -43 Q31 -34 26 -20 L32 -16 Q33 -11 25 -12 Q23 5 3 5 Q-14 5 -19 -8 Q-31 -11 -27 -21 Z',skin);
  path(c,'M-23 -20 Q-29 -36 -19 -47 L-26 -46 L-15 -56 L-17 -61 Q-5 -57 1 -64 Q9 -56 18 -58 Q29 -54 28 -43 Q11 -47 7 -38 Q1 -43 -8 -39 L-11 -24 L-17 -27 L-17 -15Z',baker?'#713d42':'#e9e1bf');
  if(guest){path(c,'M-26 -42 Q-17 -63 -4 -59 Q9 -78 20 -50 L31 -45 Q17 -39 -26 -42Z',guest%2?'#a56c73':'#418087');}else if(baker){path(c,'M-21 -46 Q-34 -49 -29 -61 Q-26 -69 -17 -66 Q-12 -79 0 -74 Q8 -78 15 -69 Q28 -70 29 -59 Q29 -52 21 -49 L20 -42 Z',ivory)}
  ellipse(c,-17,-16,7,8,skin,I);ellipse(c,17,-12,5,2.1,blush);
  const open=1-.92*blink;
  for(const [x,r] of [[1,8],[17,7.5]]){
    ellipse(c,x,-25,r,Math.max(1.4,9*open+panic),ivory,I,1.45);
    ellipse(c,x+look*2.8,-24.7,2.65,Math.max(1.1,4*open),I);
  }
  if(!baker&&!guest){for(const x of [0,18]){c.beginPath();c.ellipse(x,-25,10.8,10,0,0,Math.PI*2);c.strokeStyle='#2e4950';c.lineWidth=2.6;c.stroke()}path(c,'M-17 -26 L-11 -26 M10 -26 L11 -26',null,I,2)}
  path(c,'M-7 -37 Q0 '+(-39-panic*4)+' 6 -36 M13 -36 Q20 '+(-41-panic*4)+' 24 -35',null,I,2.4);
  if(talk>.15||panic>.55){ellipse(c,12,-7,4.5,2+talk*3+panic*2,'#633744',I,1.3)}
  else path(c,'M6 -6 Q12 -3 18 -8',null,I,1.8);
  c.restore();
  const handX=17+point*18+reach*12-wave*12, handY=-58-point*25-reach*33+wave*8;
  limb(c,13,-78,16+point*8,-59,handX,handY,coat,10);ellipse(c,handX,handY,5.8,6,skin,I);
  if(point>.4) limb(c,handX+2,handY,handX+5,handY-1,handX+8,handY-4,skin,3);
  if(baker&&!guest){c.save();c.translate(handX,handY);c.rotate(.32+.30*wave);path(c,'M-1 1 L-1 -18 Q-7 -22 -5 -33 L3 -34 Q8 -24 2 -19 L2 1Z','#a98054',I,1.6);c.restore()}
  c.restore();
}
