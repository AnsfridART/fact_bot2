// Мини-движок 3D на чистом WebGL2: низкополигональные фигуры, точечные лампы, тень от главного света, туман.
// Без зависимостей — рисует кадр синхронно по номеру кадра (подходит для Remotion).

// ---------- матрицы (column-major, как в WebGL) ----------
export const M = {
  id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  },
  persp(fov, asp, n, f) {
    const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
  },
  look(e, c, up = [0, 1, 0]) {
    let z = norm(sub(e, c)); let cx = cross(up, z); if (Math.hypot(...cx) < 1e-4) cx = cross([0, 0, -1], z); let x = norm(cx); const y = cross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
  },
  tr: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  rx(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  ry(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  rz(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  sc: (k) => [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1],
  s3: (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
};
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp = (a, b, k) => a + (b - a) * k;
export const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const ease = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
export const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// ---------- геометрия (плоские нормали — «граненый» стиль) ----------
function pushTri(P, N, a, b, c) {
  const n = norm(cross(sub(b, a), sub(c, a)));
  P.push(...a, ...b, ...c); N.push(...n, ...n, ...n);
}
const GEO = {
  box(w, h, d) { // низ в y=0, центр по x/z
    const P = [], N = [], x = w / 2, z = d / 2;
    const v = [[-x, 0, -z], [x, 0, -z], [x, h, -z], [-x, h, -z], [-x, 0, z], [x, 0, z], [x, h, z], [-x, h, z]];
    const q = (a, b, c, e) => { pushTri(P, N, v[a], v[b], v[c]); pushTri(P, N, v[a], v[c], v[e]); };
    q(4, 5, 6, 7); q(1, 0, 3, 2); q(0, 4, 7, 3); q(5, 1, 2, 6); q(7, 6, 2, 3); q(0, 1, 5, 4);
    return { P, N };
  },
  cyl(r1, r2, h, seg = 8) { // ось вверх от y=0
    const P = [], N = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2, b = ((i + 1) / seg) * Math.PI * 2;
      const A0 = [Math.cos(a) * r1, 0, Math.sin(a) * r1], B0 = [Math.cos(b) * r1, 0, Math.sin(b) * r1];
      const A1 = [Math.cos(a) * r2, h, Math.sin(a) * r2], B1 = [Math.cos(b) * r2, h, Math.sin(b) * r2];
      pushTri(P, N, A0, A1, B1); pushTri(P, N, A0, B1, B0);
      pushTri(P, N, [0, h, 0], B1, A1); pushTri(P, N, [0, 0, 0], A0, B0);
    }
    return { P, N };
  },
  sph(r, seg = 8, ring = 6) { // центр в 0
    const P = [], N = [], pt = (i, j) => { const t = (j / ring) * Math.PI, p = (i / seg) * Math.PI * 2; return [Math.sin(t) * Math.cos(p) * r, Math.cos(t) * r, Math.sin(t) * Math.sin(p) * r]; };
    for (let j = 0; j < ring; j++) for (let i = 0; i < seg; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      if (j > 0) pushTri(P, N, a, b, c); if (j < ring - 1) pushTri(P, N, a, c, d);
    }
    return { P, N };
  },
  plane(w, d) { const P = [], N = [], x = w / 2, z = d / 2; pushTri(P, N, [-x, 0, z], [x, 0, z], [x, 0, -z]); pushTri(P, N, [-x, 0, z], [x, 0, -z], [-x, 0, -z]); return { P, N }; },
};

// ---------- шейдеры ----------
const VS = `#version 300 es
in vec3 aP; in vec3 aN;
uniform mat4 uM, uVP, uL; uniform vec2 uSnap;
out vec3 vW; out vec3 vN; out vec4 vS;
void main(){ vec4 w = uM*vec4(aP,1.); vW=w.xyz; vN=mat3(uM)*aN; vS=uL*w; vec4 p=uVP*w;
  if(uSnap.x>0.){ p.xy = floor(p.xy/p.w*uSnap+.5)/uSnap*p.w; }   // «дрожание» вершин как на PS1
  gl_Position=p; }`;
// материалы рисуются прямо в шейдере по мировым координатам: обои, плитка, дерево, бетон, краска подъезда…
const FS = `#version 300 es
precision highp float;
in vec3 vW; in vec3 vN; in vec4 vS;
uniform vec3 uC, uC2, uE, uSky, uGnd, uFog, uEye;
uniform float uFogD, uShadowOn, uMat, uDirt;
uniform vec4 uRoom; uniform vec2 uRoomY;
uniform vec3 uLP[4]; uniform vec3 uLC[4]; uniform float uLR[4]; uniform vec4 uLD[4];
uniform sampler2D uSM, uN;
out vec4 o;
float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
// шум из текстуры (быстро даже на программном GL в CI): G — fbm, B — мелкий шум
float fbm(vec3 p){ vec2 q=p.xz+p.y*vec2(.37,.71); return texture(uN,q*.11).g; }
float vn(vec3 p){ vec2 q=p.xz+p.y*vec2(.53,.29); return texture(uN,q*.21).b; }
float shadow(){
  vec3 p = vS.xyz/vS.w*.5+.5; if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.) return 1.;
  float s=0.; vec2 tx=1./vec2(textureSize(uSM,0));
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++){ float d=texture(uSM,p.xy+vec2(x,y)*tx*1.5).r; s+= p.z-0.003>d?0.:1.; }
  return s/9.;
}
vec3 material(vec3 n, vec3 P){
  vec3 an=abs(n); vec2 uv = an.y>max(an.x,an.z) ? P.xz : (an.x>an.z ? P.zy : P.xy);
  float m=uMat; vec3 c=uC;
  if(m<.5) return c;
  if(m<1.5){ // обои: вертикальные полосы + ромбики
    float st=step(.5,fract(uv.x*6.)); vec2 g=fract(uv*vec2(12.,8.))-.5; float dm=step(abs(g.x)+abs(g.y),.18);
    return mix(c, uC2, st*.35+dm*.55); }
  if(m<2.5){ // кафель
    vec2 g=fract(uv/.15); float gr=step(.06,g.x)*step(.06,g.y); vec2 id=floor(uv/.15);
    return mix(c*.45, c*(.9+.15*h3(vec3(id,1.))), gr); }
  if(m<3.5){ // дерево
    float w=fbm(vec3(uv.x*3.,uv.y*40.,0.)+P*2.); float ring=fract(w*6.);
    return c*(.75+.35*ring); }
  if(m<4.5){ // линолеум «паркет»
    vec2 g=uv/vec2(.6,.12); vec2 id=floor(g+vec2(floor(g.y)*.5,0.)); vec2 f=fract(g+vec2(floor(g.y)*.5,0.));
    float e=step(.02,f.x)*step(.05,f.y); return mix(c*.6, mix(c,uC2,h3(vec3(id,2.))*.6), e); }
  if(m<5.5){ // подъезд: снизу масляная краска, сверху побелка
    float y=P.y-uRoomY.x; float lo=step(y,1.45); float band=step(abs(y-1.45),.02);
    vec3 col = lo>.5 ? c*(.85+.2*fbm(P*3.)) : uC2*(.82+.25*fbm(P*1.7));
    float peel=step(.72,fbm(P*5.)); col=mix(col, uC2*.8, peel*lo*.7);
    return mix(col, c*.4, band); }
  if(m<6.5){ // ковёр с узором
    vec2 g=uv*5.; vec2 f=fract(g)-.5; float d=abs(f.x)+abs(f.y);
    float r=step(.5,fract(d*4.)); float b=step(.45,max(abs(f.x),abs(f.y)));
    return mix(c, uC2, r*.6+b*.4); }
  if(m<7.5){ return c*(.7+.45*fbm(P*4.)); } // бетон
  if(m<8.5){ // кирпич
    vec2 g=uv/vec2(.25,.075); g.x+=step(1.,mod(floor(g.y),2.))*.5; vec2 f=fract(g); vec2 id=floor(g);
    float e=step(.04,f.x)*step(.1,f.y); return mix(c*.5+.1, c*(.8+.35*h3(vec3(id,3.))), e); }
  if(m<9.5){ return c*(.85+.15*vn(vec3(uv.x*2.,uv.y*200.,0.))); } // металл
  if(m<10.5){ return c*(.6+.5*vn(P*30.))*(.8+.3*fbm(P*.7)); } // асфальт
  if(m<11.5){ // плитка пола подъезда: шахматка
    vec2 g=floor(uv/.2); float ch=mod(g.x+g.y,2.); return mix(c,uC2,ch)*(.85+.25*fbm(P*3.)); }
  if(m<12.5){ // панельный дом: швы плит
    vec2 g=fract(uv/vec2(3.,2.8)); float e=step(.012,g.x)*step(.012,g.y); return c*(.75+.3*fbm(P*1.3))*mix(.55,1.,e); }
  if(m<13.5){ // ткань: мелкое плетение и складки
    float w=vn(P*vec3(90.,90.,90.)); float fold=fbm(P*vec3(4.,9.,4.)); return c*(.78+.18*w+.25*fold); }
  if(m<14.5){ // волосы: пряди
    float st=vn(vec3(uv.x*60.,uv.y*6.,P.z*60.)); return c*(.7+.5*st); }
  return c;
}
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(uEye-vW);
  if(dot(n,v)<0.) n=-n;
  vec3 base = material(n, vW);
  // грязь и потёртости
  float dirt = fbm(vW*2.3+3.7);
  base *= mix(1., .62+.5*dirt, uDirt);
  base *= mix(1., .7, uDirt*(1.-smoothstep(0.,.35,vW.y-uRoomY.x)));
  // мягкое затенение в углах комнаты (ambient occlusion по коробке комнаты)
  float ao=1.;
  if(uRoom.y>uRoom.x){
    float dx=min(vW.x-uRoom.x, uRoom.y-vW.x), dz=min(vW.z-uRoom.z, uRoom.w-vW.z), dy=min(vW.y-uRoomY.x, uRoomY.y-vW.y);
    ao = smoothstep(-.05,.6,dx)*.5+.5; ao*= smoothstep(-.05,.6,dz)*.5+.5; ao*= smoothstep(-.05,.45,dy)*.45+.55;
  }
  vec3 col = base*mix(uGnd,uSky,n.y*.5+.5)*ao;
  float sh0 = uShadowOn>.5 ? shadow() : 1.;
  for(int i=0;i<4;i++){
    vec3 L=uLP[i]-vW; float d=length(L); L/=d;
    float a=clamp(1.-d/uLR[i],0.,1.); a*=a;
    float c=dot(-L,uLD[i].xyz); a*= uLD[i].w>0. ? smoothstep(uLD[i].w,uLD[i].w+.12,c) : 1.;
    float df=max(dot(n,L),0.)*.85+.15*max(dot(n,L)+.5,0.)/1.5;   // мягкий обхват светом
    float sp=pow(max(dot(n,normalize(L+v)),0.),24.)*(uMat>8.5&&uMat<9.5 ? .9 : .18);
    col += (base*df + sp)*uLC[i]*a*(i==0? sh0 : 1.)*mix(1.,ao,.5);
  }
  col += uE;
  float dist=length(uEye-vW);
  float f = 1.-exp(-uFogD*dist);
  col = mix(col,uFog,clamp(f,0.,1.));
  col = col/(1.+col*.3);
  o=vec4(pow(max(col,0.),vec3(1./2.2)),1.);
}`;
const SVS = `#version 300 es
in vec3 aP; uniform mat4 uM, uL; void main(){ gl_Position=uL*uM*vec4(aP,1.); }`;
const SFS = `#version 300 es
precision mediump float; out vec4 o; void main(){ o=vec4(1.); }`;

const QV = `#version 300 es
in vec3 aP; out vec2 uv; void main(){ uv=aP.xy*.5+.5; gl_Position=vec4(aP.xy,0.,1.); }`;
const QV2 = `#version 300 es
in vec3 aP; out vec2 uv0; void main(){ uv0=aP.xy*.5+.5; gl_Position=vec4(aP.xy,0.,1.); }`;
const BRIGHT = `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D T; out vec4 o;
void main(){ vec3 c=texture(T,uv).rgb; float l=max(c.r,max(c.g,c.b)); o=vec4(c*smoothstep(.72,1.,l),1.); }`;
const BLUR = `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D T; uniform vec2 D; out vec4 o;
void main(){ vec3 c=texture(T,uv).rgb*.227;
  c+=(texture(T,uv+D*1.38).rgb+texture(T,uv-D*1.38).rgb)*.316;
  c+=(texture(T,uv+D*3.23).rgb+texture(T,uv-D*3.23).rgb)*.07; o=vec4(c,1.); }`;
const COMP = `#version 300 es
precision highp float; in vec2 uv0; uniform sampler2D T, B; uniform float uTime, uBloom, uVig, uGrain, uCA, uFlash, uRays, uLevels, uFish, uExp; uniform vec3 uTint, uLift; uniform vec2 uSun; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float bayer(vec2 p){ ivec2 q=ivec2(mod(p,4.)); int i=q.x+q.y*4;
  int b[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(b[i])/16.-.47; }
void main(){
  vec2 uv=uv0;
  if(uFish>0.){ vec2 q=(uv-.5)*vec2(.5625,1.); float rr=dot(q,q); uv=.5+(uv-.5)*mix(1.,.62+4.5*rr,uFish); }
  vec2 d=uv-.5; float r=length(d*vec2(.75,1.));
  vec3 c; c.r=texture(T,uv-d*uCA).r; c.g=texture(T,uv).g; c.b=texture(T,uv+d*uCA).b;
  c+=texture(B,uv).rgb*uBloom;
  if(uRays>0.){ // лучи света от лампы/окна
    vec2 dl=(uSun-uv)/24.; vec2 q=uv; float w=1.; vec3 acc=vec3(0.);
    for(int i=0;i<24;i++){ q+=dl; acc+=texture(B,q).rgb*w; w*=.94; }
    c+=acc/24.*uRays; }
  c*=uExp;
  float lum=dot(c,vec3(.299,.587,.114));
  c=mix(vec3(lum),c,1.12); c*=uTint; c=c+uLift*(1.-c);
  c=(c-.5)*1.1+.5;
  c*=1.-smoothstep(.25,.95,r)*uVig;
  c+= (h(floor(gl_FragCoord.xy)+fract(uTime)*91.)-.5)*uGrain;
  c+= uFlash;
  if(uFish>0.){ vec2 q=(uv0-.5)*vec2(.5625,1.); c*=1.-smoothstep(.27,.3,length(q)); }
  if(uLevels>0.){ c = floor(c*uLevels + bayer(gl_FragCoord.xy) + .5)/uLevels; } // ограниченная палитра + дизеринг
  o=vec4(clamp(c,0.,1.),1.); }`;

function prog(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.bindAttribLocation(p, 0, "aP"); gl.bindAttribLocation(p, 1, "aN");
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
  return { p, u };
}

// бесшовная текстура шума 256×256: R — крупный, G — fbm, B — мелкий
function makeNoise(gl) {
  const N = 256, val = (g, seed) => { const a = new Float32Array(g * g); let x = seed * 9301 + 49297; for (let i = 0; i < a.length; i++) { x = (x * 9301 + 49297) % 233280; a[i] = x / 233280; } return a; };
  const smooth = (grid, g, u, v) => { // билинейный бесшовный value-noise
    const x = u * g, y = v * g, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), at = (i, j) => grid[((j % g + g) % g) * g + ((i % g + g) % g)];
    return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
  };
  const octs = [[8, val(8, 1)], [16, val(16, 2)], [32, val(32, 3)], [64, val(64, 4)], [128, val(128, 5)]];
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N, o = octs.map(([g, a]) => smooth(a, g, u, v));
    const k = (j * N + i) * 4;
    data[k] = o[0] * 255; data[k + 1] = (o[0] * 0.5 + o[1] * 0.28 + o[2] * 0.15 + o[3] * 0.07) * 255; data[k + 2] = (o[3] * 0.5 + o[4] * 0.5) * 255; data[k + 3] = 255;
  }
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return t;
}

// ---------- рендерер ----------
export class Renderer {
  constructor(canvas, opt = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
    this.samples = opt.samples ?? 0; this.ps1 = opt.ps1 ?? true;
    if (!gl) throw new Error("WebGL2 недоступен");
    this.gl = gl; this.cv = canvas; this.cache = {};
    this.main = prog(gl, VS, FS); this.sh = prog(gl, SVS, SFS);
    this.noise = makeNoise(gl);
    const S = 1024; this.S = S;
    this.smt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.smt);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, S, S, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    this.fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.smt, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // постобработка: сцена с MSAA → текстура → свечение → итог
    const W = canvas.width, H = canvas.height;
    this.msfb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.msfb);
    const cr = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, cr);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, W, H);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cr);
    const dr = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, dr);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, W, H);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dr);
    const tex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
    this.sceneT = tex(W, H); this.bA = tex(W >> 1, H >> 1); this.bB = tex(W >> 1, H >> 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.pBright = prog(gl, QV, BRIGHT); this.pBlur = prog(gl, QV, BLUR); this.pComp = prog(gl, QV2, COMP);
    this.quad = gl.createVertexArray(); gl.bindVertexArray(this.quad);
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  }
  pass(pr, dst, srcs, uni = {}) {
    const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.f : null);
    gl.viewport(0, 0, dst ? dst.w : this.cv.width, dst ? dst.h : this.cv.height); gl.disable(gl.DEPTH_TEST);
    gl.useProgram(pr.p);
    srcs.forEach(([name, t], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u[name], i); });
    for (const [k, v] of Object.entries(uni)) { if (!pr.u[k]) continue; if (Array.isArray(v)) (v.length === 2 ? gl.uniform2fv : gl.uniform3fv).call(gl, pr.u[k], v); else gl.uniform1f(pr.u[k], v); }
    gl.bindVertexArray(this.quad); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  geo(key) {
    if (this.cache[key]) return this.cache[key];
    const [t, ...a] = key.split(":"); const g = GEO[t](...a.map(Number)); const gl = this.gl;
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    for (const [i, arr] of [[0, g.P], [1, g.N]]) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
    return (this.cache[key] = { vao, n: g.P.length / 3 });
  }
  // scene: {items:[{geo,m,c,e,noShadow}], lights:[{p,c,r,dir?,cone?}], cam:{eye,at,fov,roll}, sky,gnd,fog,fogD, shadow:{at,fov}}
  draw(sc) {
    const gl = this.gl, W = this.cv.width, H = this.cv.height;
    const L0 = sc.lights[0];
    let LVP = M.id();
    if (L0 && sc.shadow) {
      const lv = M.look(L0.p, sc.shadow.at, Math.abs(norm(sub(L0.p, sc.shadow.at))[1]) > .98 ? [0, 0, 1] : [0, 1, 0]);
      LVP = M.mul(M.persp(sc.shadow.fov || 2.2, 1, 0.05, L0.r), lv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, this.S, this.S);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.useProgram(this.sh.p); gl.uniformMatrix4fv(this.sh.u.uL, false, LVP);
      for (const it of sc.items) {
        if (it.noShadow) continue; const g = this.geo(it.geo);
        gl.uniformMatrix4fv(this.sh.u.uM, false, it.m); gl.bindVertexArray(g.vao); gl.drawArrays(gl.TRIANGLES, 0, g.n);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msfb);
    gl.viewport(0, 0, W, H);
    const fg = sc.fog || [0, 0, 0]; gl.clearColor(fg[0], fg[1], fg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const { u, p } = this.main; gl.useProgram(p);
    const c = sc.cam; let view = M.look(c.eye, c.at); if (c.roll) view = M.mul(M.rz(c.roll), view);
    const VP = M.mul(M.persp(c.fov || 1.0, W / H, 0.03, 80), view);
    gl.uniformMatrix4fv(u.uVP, false, VP);
    gl.uniform2fv(u.uSnap, this.ps1 && sc.snap !== false ? [W / 2.5, H / 2.5] : [0, 0]);
    const R = sc.room || [0, 0, 0, 0, 0, 3]; gl.uniform4fv(u.uRoom, R.slice(0, 4)); gl.uniform2fv(u.uRoomY, R.slice(4, 6));
    gl.uniform1f(u.uDirt, sc.dirt ?? 0.6);
    // где на экране главный источник лучей
    let sun = [0.5, 1.2]; const rp = sc.rays ? sc.rays.p : null;
    if (rp) { const q = [0, 1, 2, 3].map((i) => VP[i] * rp[0] + VP[4 + i] * rp[1] + VP[8 + i] * rp[2] + VP[12 + i]); if (q[3] > 0.01) sun = [q[0] / q[3] * 0.5 + 0.5, q[1] / q[3] * 0.5 + 0.5]; }
    this._sun = sun;
    gl.uniformMatrix4fv(u.uL, false, LVP);
    gl.uniform3fv(u.uEye, c.eye); gl.uniform3fv(u.uSky, sc.sky || [.05, .06, .09]); gl.uniform3fv(u.uGnd, sc.gnd || [.02, .02, .02]);
    gl.uniform3fv(u.uFog, fg); gl.uniform1f(u.uFogD, sc.fogD ?? .08); gl.uniform1f(u.uShadowOn, sc.shadow ? 1 : 0);
    const ls = sc.lights.slice(0, 4), pad = (f) => { const a = []; for (let i = 0; i < 4; i++) a.push(...(ls[i] ? f(ls[i]) : f(null))); return a; };
    if (u.uLN) gl.uniform1i(u.uLN, ls.length);
    gl.uniform3fv(u["uLP[0]"], pad((l) => l ? l.p : [0, 0, 0]));
    gl.uniform3fv(u["uLC[0]"], pad((l) => l ? l.c : [0, 0, 0]));
    gl.uniform1fv(u["uLR[0]"], pad((l) => [l ? l.r : 0.001]));
    gl.uniform4fv(u["uLD[0]"], pad((l) => l && l.dir ? [...norm(l.dir), Math.cos(l.cone)] : [0, -1, 0, 0]));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.smt); gl.uniform1i(u.uSM, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.noise); gl.uniform1i(u.uN, 1); gl.activeTexture(gl.TEXTURE0);
    // спереди назад — меньше лишней закраски (программный GL в CI считает каждый пиксель)
    const e = c.eye, dist = (it) => (it.m[12] - e[0]) ** 2 + (it.m[13] - e[1]) ** 2 + (it.m[14] - e[2]) ** 2;
    const order = sc.items.map((it) => [dist(it), it]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    if (sc.cull) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); } else gl.disable(gl.CULL_FACE);
    for (const it of order) {
      const g = this.geo(it.geo);
      gl.uniformMatrix4fv(u.uM, false, it.m); gl.uniform3fv(u.uC, it.c); gl.uniform3fv(u.uE, it.e || [0, 0, 0]);
      gl.uniform1f(u.uMat, it.mat || 0); gl.uniform3fv(u.uC2, it.c2 || it.c);
      gl.bindVertexArray(g.vao); gl.drawArrays(gl.TRIANGLES, 0, g.n);
    }
    // MSAA → текстура
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msfb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.sceneT.f);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    const P = sc.post || {};
    this.pass(this.pBright, this.bA, [["T", this.sceneT.t]]);
    for (let i = 0; i < 3; i++) {
      this.pass(this.pBlur, this.bB, [["T", this.bA.t]], { D: [(1 + i) / this.bA.w, 0] });
      this.pass(this.pBlur, this.bA, [["T", this.bB.t]], { D: [0, (1 + i) / this.bA.h] });
    }
    this.pass(this.pComp, null, [["T", this.sceneT.t], ["B", this.bA.t]], {
      uTime: P.time || 0, uBloom: P.bloom ?? 1.4, uVig: P.vig ?? 0.75, uGrain: P.grain ?? 0.06, uCA: P.ca ?? 0.004,
      uFlash: P.flash || 0, uTint: P.tint || [1.0, 0.97, 1.05], uLift: P.lift || [0.012, 0.016, 0.03],
      uRays: sc.rays ? sc.rays.k ?? 0.8 : 0, uFish: P.fish || 0, uExp: P.exp ?? 1.3, uSun: this._sun, uLevels: this.ps1 ? (P.levels ?? 24) : 0 });
  }
}

// ---------- построитель сцены ----------
export const MAT = { fabric: 13, hair: 14, plain: 0, wallpaper: 1, tile: 2, wood: 3, parquet: 4, stairwell: 5, carpet: 6, concrete: 7, brick: 8, metal: 9, asphalt: 10, checker: 11, panel: 12 };
export class Build {
  constructor() { this.items = []; this.stack = [M.id()]; }
  get m() { return this.stack[this.stack.length - 1]; }
  push(...ms) { let m = this.m; for (const x of ms) m = M.mul(m, x); this.stack.push(m); return this; }
  pop() { this.stack.pop(); return this; }
  add(geo, col, o = {}) { const cv = (x) => (typeof x === "string" ? hex(x) : x); this.items.push({ geo, m: this.m, c: cv(col), c2: o.c2 ? cv(o.c2) : null, mat: MAT[o.mat] ?? o.mat ?? 0, e: o.e ? cv(o.e) : null, noShadow: o.ns }); return this; }
  // коробка: x,y,z — центр низа
  box(x, y, z, w, h, d, col, o = {}) { this.push(M.tr(x, y, z), M.ry(o.ry || 0), M.rx(o.rx || 0), M.rz(o.rz || 0)); this.add(`box:${w}:${h}:${d}`, col, o); return this.pop(); }
  cyl(x, y, z, r1, r2, h, col, o = {}) { this.push(M.tr(x, y, z), M.rx(o.rx || 0), M.rz(o.rz || 0), M.s3(1, 1, o.sz || 1)); this.add(`cyl:${r1}:${r2}:${h}:${o.seg || 8}`, col, o); return this.pop(); }
  // цилиндр между двумя точками (в текущей системе координат)
  seg(a, c, r1, r2, col, o = {}) {
    const d = sub(c, a), len = Math.hypot(...d) || 1e-4, y = d.map((v) => v / len);
    let x = cross(y, [0, 0, 1]); if (Math.hypot(...x) < 0.1) x = cross(y, [1, 0, 0]); x = norm(x); const z = cross(x, y);
    this.push([x[0], x[1], x[2], 0, y[0] * len, y[1] * len, y[2] * len, 0, z[0], z[1], z[2], 0, a[0], a[1], a[2], 1]);
    this.add(`cyl:${r1}:${r2}:1:${o.seg || 7}`, col, o); return this.pop();
  }
  sph(x, y, z, r, col, o = {}) { this.push(M.tr(x, y, z), M.s3(o.sx || 1, o.sy || 1, o.sz || 1)); this.add(`sph:${r}:${o.seg || 8}:${o.ring || 6}`, col, o); return this.pop(); }
}

// двухзвенная инверсная кинематика: плечо S, цель T, длины l1/l2, pole — куда смотрит локоть
export function ik(S, T, l1, l2, pole) {
  let d = sub(T, S), dl = Math.hypot(...d); const mx = (l1 + l2) * 0.995;
  if (dl > mx) { d = d.map((v) => (v / dl) * mx); dl = mx; }
  const dir = d.map((v) => v / dl), a = (l1 * l1 - l2 * l2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const pd = dot(pole, dir); const p = norm([pole[0] - dir[0] * pd, pole[1] - dir[1] * pd, pole[2] - dir[2] * pd]);
  const E = [S[0] + dir[0] * a + p[0] * h, S[1] + dir[1] * a + p[1] * h, S[2] + dir[2] * a + p[2] * h];
  return { E, H: [S[0] + d[0], S[1] + d[1], S[2] + d[2]] };
}
