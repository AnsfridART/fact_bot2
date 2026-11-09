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
uniform mat4 uM, uVP, uL;
out vec3 vW; out vec3 vN; out vec4 vS;
void main(){ vec4 w = uM*vec4(aP,1.); vW=w.xyz; vN=mat3(uM)*aN; vS=uL*w; gl_Position=uVP*w; }`;
const FS = `#version 300 es
precision highp float;
in vec3 vW; in vec3 vN; in vec4 vS;
uniform vec3 uC, uE, uSky, uGnd, uFog, uEye;
uniform float uFogD, uShadowOn;
uniform vec3 uLP[4]; uniform vec3 uLC[4]; uniform float uLR[4]; uniform vec4 uLD[4]; uniform int uLN;
uniform sampler2D uSM;
out vec4 o;
float shadow(){
  vec3 p = vS.xyz/vS.w*.5+.5; if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.) return 1.;
  float s=0.; vec2 tx=1./vec2(textureSize(uSM,0));
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++){ float d=texture(uSM,p.xy+vec2(x,y)*tx*1.5).r; s+= p.z-0.0025>d?0.:1.; }
  return s/9.;
}
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(uEye-vW);
  if(dot(n,v)<0.) n=-n;
  vec3 col = uC*mix(uGnd,uSky,n.y*.5+.5);
  float sh0 = uShadowOn>.5 ? shadow() : 1.;
  vec3 acc = vec3(0.);
  for(int i=0;i<4;i++){
    vec3 L=uLP[i]-vW; float d=length(L); L/=d;
    float a=clamp(1.-d/uLR[i],0.,1.); a*=a;
    float c=dot(-L,uLD[i].xyz); a*= uLD[i].w>0. ? smoothstep(uLD[i].w,uLD[i].w+.12,c) : 1.;
    float df=max(dot(n,L),0.);
    acc += (uC*df + pow(max(dot(n,normalize(L+v)),0.),16.)*.2)*uLC[i]*a*(i==0? sh0 : 1.);
  }
  col += acc;
  col += uE;
  float f = 1.-exp(-uFogD*length(uEye-vW));
  col = mix(col,uFog,clamp(f,0.,1.));
  col = col/(1.+col*.35);
  o=vec4(pow(col,vec3(1./2.2)),1.);
}`;
const SVS = `#version 300 es
in vec3 aP; uniform mat4 uM, uL; void main(){ gl_Position=uL*uM*vec4(aP,1.); }`;
const SFS = `#version 300 es
precision mediump float; out vec4 o; void main(){ o=vec4(1.); }`;

const QV = `#version 300 es
in vec3 aP; out vec2 uv; void main(){ uv=aP.xy*.5+.5; gl_Position=vec4(aP.xy,0.,1.); }`;
const BRIGHT = `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D T; out vec4 o;
void main(){ vec3 c=texture(T,uv).rgb; float l=max(c.r,max(c.g,c.b)); o=vec4(c*smoothstep(.72,1.,l),1.); }`;
const BLUR = `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D T; uniform vec2 D; out vec4 o;
void main(){ vec3 c=texture(T,uv).rgb*.227;
  c+=(texture(T,uv+D*1.38).rgb+texture(T,uv-D*1.38).rgb)*.316;
  c+=(texture(T,uv+D*3.23).rgb+texture(T,uv-D*3.23).rgb)*.07; o=vec4(c,1.); }`;
const COMP = `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D T, B; uniform float uTime, uBloom, uVig, uGrain, uCA, uFlash; uniform vec3 uTint, uLift; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 d=uv-.5; float r=length(d*vec2(.75,1.));
  vec3 c; c.r=texture(T,uv-d*uCA).r; c.g=texture(T,uv).g; c.b=texture(T,uv+d*uCA).b;
  c+=texture(B,uv).rgb*uBloom;
  float lum=dot(c,vec3(.299,.587,.114));
  c=mix(vec3(lum),c,1.15); c*=uTint; c=c+uLift*(1.-c);
  c=(c-.5)*1.12+.5;
  c*=1.-smoothstep(.25,.95,r)*uVig;
  c+= (h(uv*1000.+fract(uTime)*91.)-.5)*uGrain;
  c+= uFlash;
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

// ---------- рендерер ----------
export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL2 недоступен");
    this.gl = gl; this.cv = canvas; this.cache = {};
    this.main = prog(gl, VS, FS); this.sh = prog(gl, SVS, SFS);
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
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, Math.min(2, gl.getParameter(gl.MAX_SAMPLES)), gl.RGBA8, W, H);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cr);
    const dr = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, dr);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, Math.min(2, gl.getParameter(gl.MAX_SAMPLES)), gl.DEPTH_COMPONENT24, W, H);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dr);
    const tex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
    this.sceneT = tex(W, H); this.bA = tex(W >> 2, H >> 2); this.bB = tex(W >> 2, H >> 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.pBright = prog(gl, QV, BRIGHT); this.pBlur = prog(gl, QV, BLUR); this.pComp = prog(gl, QV, COMP);
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
    gl.uniformMatrix4fv(u.uVP, false, M.mul(M.persp(c.fov || 1.0, W / H, 0.03, 80), view));
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
    // спереди назад — меньше лишней закраски (программный GL в CI считает каждый пиксель)
    const e = c.eye, dist = (it) => (it.m[12] - e[0]) ** 2 + (it.m[13] - e[1]) ** 2 + (it.m[14] - e[2]) ** 2;
    const order = sc.items.map((it) => [dist(it), it]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    if (sc.cull) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); } else gl.disable(gl.CULL_FACE);
    for (const it of order) {
      const g = this.geo(it.geo);
      gl.uniformMatrix4fv(u.uM, false, it.m); gl.uniform3fv(u.uC, it.c); gl.uniform3fv(u.uE, it.e || [0, 0, 0]);
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
      uFlash: P.flash || 0, uTint: P.tint || [1.0, 0.97, 1.05], uLift: P.lift || [0.012, 0.016, 0.03] });
  }
}

// ---------- построитель сцены ----------
export class Build {
  constructor() { this.items = []; this.stack = [M.id()]; }
  get m() { return this.stack[this.stack.length - 1]; }
  push(...ms) { let m = this.m; for (const x of ms) m = M.mul(m, x); this.stack.push(m); return this; }
  pop() { this.stack.pop(); return this; }
  add(geo, col, o = {}) { this.items.push({ geo, m: this.m, c: typeof col === "string" ? hex(col) : col, e: o.e ? (typeof o.e === "string" ? hex(o.e) : o.e) : null, noShadow: o.ns }); return this; }
  // коробка: x,y,z — центр низа
  box(x, y, z, w, h, d, col, o = {}) { this.push(M.tr(x, y, z), M.ry(o.ry || 0)); this.add(`box:${w}:${h}:${d}`, col, o); return this.pop(); }
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
