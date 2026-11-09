// 3D-фон сцены: один WebGL-рендерер на вкладку (холст вне React), кадр копируется в 2D-холст компонента.
import React, { useLayoutEffect, useRef } from "react";
import { Renderer } from "./engine.js";
import { buildShot } from "./shots.js";

const RW = 405, RH = 720; // v25: «PS1-стиль» — считаем в низком разрешении и растягиваем пикселями (и быстрее в CI)
let R = null;
function renderer() {
  if (!R) { const c = document.createElement("canvas"); c.width = RW; c.height = RH; R = new Renderer(c); }
  return R;
}

export function World3D({ world, f, dur, fps = 30, dim = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    try {
      const r = renderer();
      r.draw(buildShot(world.shot, f / fps, Math.max(1, dur / fps), world));
      const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(r.cv, 0, 0, cv.width, cv.height);
    } catch (e) { console.error("3D:", e); }
  }, [world, f, dur]);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", imageRendering: "pixelated" }} />
      {dim ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} /> : null}
    </div>
  );
}
