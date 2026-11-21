import React, {useLayoutEffect, useRef} from "react";
import {Stage, ramp} from "./world.js";

function shadowLab(stage, shot, p) {
  const nearScreen = shot === 5;
  const lightOn = shot !== 6 || p < .48;
  const travel = -.42 + .65 * ramp(p, .08, .78);
  const ratio = nearScreen ? 1.15 : 3;
  stage.box(0, 0, -2, 5.4, 3.8, .12, "#ecf2eb");
  for (let i = -8; i <= 8; i++) {
    stage.line([i / 4, .65, -1.92], [i / 4, i % 2 ? .76 : .84, -1.92], "#24668a", 2);
  }
  const z = 1 - 3 / ratio;
  const tip = [travel, 1.5, z];
  const projected = [travel * ratio, 1.5, -1.91];
  if (lightOn) {
    stage.line([0, 1.5, 1], projected, "#de9823", 3);
    stage.box(projected[0], .86, -1.9, .13 * ratio, .64, .03, "#404553");
  }
  stage.box(0, .73, z, 2, .08, .18, "#275b83");
  stage.box(travel, .81, z, .16, .69, .14, "#de403a");
  stage.line(tip, [travel+.15, 1.5,z], "#df3939", 5);
  stage.cylinder(0, 0, 1, .13, 1.4, "#384557");
  stage.cylinder(0, 1.40, 1, .15, .18, lightOn ? "#ffcc43" : "#51596a");
}

function liftLab(stage, shot, p) {
  const start = shot === 2 ? 0 : shot === 3 ? .26 : shot === 4 ? .72 : 0;
  const end = shot === 2 ? .27 : shot === 3 ? .72 : 1;
  const phase = start + (end-start)*p;
  const force = phase < .25 ? Math.sin(Math.PI*phase/.25) :
    phase > .72 ? -Math.sin(Math.PI*(phase-.72)/.28) : 0;
  stage.box(0, 0, -1.6, 5.8, 4, .15, "#275473");
  stage.box(.8, .7, -1.48, 2.35, 2.65, .12, "#253043");
  for (let floor=0; floor<6; floor++) {
    const y = 1.6 + floor - phase*3;
    if(y > .8 && y < 3.05) stage.label(.8,y,-1.34,String(floor+1),"#fff2c6",45);
  }
  stage.box(.66,.2,.16,1.55,.38,.94,"#287c86");
  stage.cylinder(.66,.59,.16,.32,.42,"#de583a");
  stage.cylinder(.66,1.01,.16,.16,.10,"#973e34");
  stage.label(.66,.27,.65,(9.8+1.8*force).toFixed(1).replace(".",",")+" Н","#ffffff",19);
  stage.label(-1.35,2.85,-1.4,"ХОЛЛ","#ffda84",23);
  stage.label(-1.35,2.53,-1.4,"9,8 Н","#ffffff",23);
}

export function Experiment({kind, shot, frame, duration, fps, mouth}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const c = ref.current.getContext("2d");
    c.setTransform(2,0,0,2,0,0);
    c.fillStyle = kind === "shadow" ? "#57a4ae" : "#427890";
    c.fillRect(0,0,540,960);
    const p = frame/Math.max(1,duration-1);
    const t = frame/fps;
    const stage = new Stage(c,{x:0,y:1.7,dist:shot % 3 === 2 ? 6.9 : 7.8,
      yaw:kind === "shadow" ? -.36-.16*ramp(p,0,1) : .12, pitch:.17});
    stage.box(0,-.16,0,8,.16,7,"#d0ad78");
    if(kind === "shadow") shadowLab(stage,shot,p);
    else liftLab(stage,shot,p);
    stage.person(-1.55,.95,t,{point:.65+.25*Math.sin(t*1.9),turn:.62+.25*Math.sin(t*1.5),talk:mouth,look:.8},2.05);
    stage.flush();
  },[kind,shot,frame,duration,fps,mouth]);
  return <canvas ref={ref} width={1080} height={1920} style={{position:"absolute",inset:0}} />;
}
