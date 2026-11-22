// Seamless hand-painted material tiles. The pattern axes follow the face in world space.
const size = 192;
const tiles = new Map();
export const palette = {
  stone: "#dac59f", oak: "#975d3c", meadow: "#a6b76d", slate: "#7489a0",
  clay: "#bc7058", plaster: "#efd6a7", flagstone: "#d4be9f", river: "#72adaa",
};
const period = {stone: 2.2, oak: 1.4, roof: 1.5, meadow: 3.4, plaster: 1.6,
  flagstone: 2.8, water: 2.4, cloth: .7, soil: .9, wheat: .65};
function tile(material, color) {
  const key = material + color;
  if (tiles.has(key)) return tiles.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  let seed = 4187;
  const rand = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
  function patch(points, fill) {
    g.beginPath(); points.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
    g.closePath(); g.fillStyle = fill; g.fill();
  }
  g.fillStyle = color; g.fillRect(0,0,size,size);
  if (["stone","flagstone","roof"].includes(material)) {
    const roof = material === "roof", step = roof ? 32 : 48, width = roof ? 48 : 64;
    for (let y=0; y<size; y+=step) {
      const offset = (y/step % 2) * width/2;
      for (let n=0; n<size/width; n++) {
        const x = n*width-offset, notch = 3+rand()*6, variation = rand();
        for (const shift of [0,size]) {
          g.save(); g.translate(x+shift,y);
          patch([[1,1],[width-1,1],[width-2,step-5],[width-notch,step-1],[4,step-2],[1,step-6]],
            variation<.5 ? 'rgba(255,239,197,'+(.07+variation*.25)+')' : 'rgba(65,45,48,'+(variation*.13)+')');
          patch([[1,step-6],[5,step-3],[width-notch,step-3],[width-2,step-7],[width-1,step-2],[width-notch,step],[3,step]],roof?'#553c435e':'#77635340');
          g.fillStyle='#fff1cb50'; g.fillRect(3,1,width-8,roof?1:2);
          g.restore();
        }
      }
    }
  }
  if (material === "oak" || material === "soil" || material === "cloth") {
    for(let y=0;y<size;y+=material==="cloth"?12:48){
      g.fillStyle=material==="cloth"?"#f9d8a519":"#49332d55";g.fillRect(0,y,size,2);
      g.fillStyle="#ffe8ba38";g.fillRect(0,y+2,size,1);
    }
  }
  const density = material === "plaster" ? 150 : 85;
  for(let i=0;i<density;i++){
    const x=rand()*size,y=rand()*size;
    const wide = ["oak","water","soil"].includes(material);
    const w=wide?8+rand()*37:2+rand()*(material==="meadow"?22:9);
    const h=material==="wheat"?10:wide?1.8:2+rand()*6;
    const hue=rand()>.48?"rgba(255,245,197,.14)":"rgba(65,55,58,.085)";
    patch([[x,y],[x+w*.6,y-h*.45],[x+w,y],[x+w*.35,y+h]],hue);
  }
  tiles.set(key,canvas);
  return canvas;
}

export function textured(s, points, color, material, stroke, weight=1) {
  s.poly(points,color);
  const [a,b,,d]=points;
  const length=(p,q)=>Math.hypot(...p.map((v,i)=>v-q[i]));
  const u=length(a,b), v=length(a,d), repeat=period[material];
  const ctx=s.c, pattern=ctx.createPattern(tile(material,color),"repeat");
  const point=(i,j)=>s.project(...a.map((n,k)=>n+(b[k]-n)*i+(d[k]-n)*j));
  const nx=Math.max(1,Math.ceil(u/2.5)), ny=Math.max(1,Math.ceil(v/2.5));
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){
    const p=point(i/nx,j/ny), q=point((i+1)/nx,j/ny), r=point((i+1)/nx,(j+1)/ny), t=point(i/nx,(j+1)/ny);
    if(Math.min(p[2],q[2],r[2],t[2])<.22)continue;
    if([p,q,r,t].every(h=>h[0]<0)||[p,q,r,t].every(h=>h[0]>540)||[p,q,r,t].every(h=>h[1]<0)||[p,q,r,t].every(h=>h[1]>960))continue;
    const du=u*size/repeat/nx,dv=v*size/repeat/ny;
    ctx.save();ctx.beginPath();ctx.moveTo(...p.slice(0,2));for(const h of [q,r,t])ctx.lineTo(h[0],h[1]);ctx.closePath();ctx.clip();
    ctx.transform((q[0]-p[0])/du,(q[1]-p[1])/du,(t[0]-p[0])/dv,(t[1]-p[1])/dv,p[0],p[1]);
    ctx.translate(-i*du,-j*dv);ctx.fillStyle=pattern;
    ctx.fillRect(i*du-du*.5,j*dv-dv*.5,du*2,dv*2);ctx.restore();
  }
  if(stroke)for(let i=0;i<4;i++)s.line(points[i],points[(i+1)%4],stroke,weight);
}
